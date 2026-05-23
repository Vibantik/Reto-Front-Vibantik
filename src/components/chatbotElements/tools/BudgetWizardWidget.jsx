import { useEffect, useMemo, useState } from "react";
import {
  createPresupuesto,
  fetchCategorias,
  fetchLastPresupuesto,
} from "../../../services/presupuestosService";
import { getUserUuid } from "../../../utils/userUuid";
import "./budgetWizardWidget.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const buildDefaultName = () =>
  `Presupuesto ${new Date().toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  })}`;

const getTodayIso = () => new Date().toISOString().slice(0, 10);

const toNumber = (value) => {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizeCategories = ({ categorias, previousBudget, savingsGoalPercent, categoryHint }) => {
  const previousCategories = new Map(
    (previousBudget?.categorias || []).map((item) => [item.id_categ, Number(item.monto_asignado || 0)])
  );

  return categorias.map((category) => {
    const previousAmount = previousCategories.get(category.id_categ) || 0;
    const shouldPrioritizeCut =
      categoryHint &&
      String(category.nombre_categ || "").toLowerCase().includes(categoryHint);

    const reductionFactor = shouldPrioritizeCut
      ? Math.max(0, 1 - (savingsGoalPercent + 5) / 100)
      : Math.max(0, 1 - savingsGoalPercent / 100);

    const suggestedAmount = previousAmount
      ? Math.round(previousAmount * reductionFactor)
      : 0;

    return {
      id_categ: category.id_categ,
      nombre_categ: category.nombre_categ,
      icon: category.icon,
      color: category.color,
      previousAmount,
      proposedAmount: suggestedAmount,
    };
  });
};

export default function BudgetWizardWidget({ data, onComplete }) {
  const uuid = getUserUuid();
  const savingsGoalPercent = Number(data?.savingsGoalPercent || 10);
  const categoryHint = data?.categoryHint ? String(data.categoryHint).toLowerCase() : null;

  const [loading, setLoading] = useState(true);
  const [contextError, setContextError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submittedBudget, setSubmittedBudget] = useState(null);
  const [formState, setFormState] = useState({
    nombre: buildDefaultName(),
    inicio: getTodayIso(),
    fin: "",
    categorias: [],
  });

  useEffect(() => {
    let cancelled = false;

    const loadWizardContext = async () => {
      try {
        setLoading(true);
        setContextError("");

        const [categorias, previousBudget] = await Promise.all([
          fetchCategorias(),
          fetchLastPresupuesto(uuid).catch((error) => {
            console.error("Error loading last presupuesto:", error);
            return null;
          }),
        ]);

        if (cancelled) return;

        setFormState((prev) => ({
          ...prev,
          categorias: normalizeCategories({
            categorias,
            previousBudget,
            savingsGoalPercent,
            categoryHint,
          }),
        }));
      } catch (error) {
        console.error("Error loading budget wizard context:", error);
        if (!cancelled) {
          setContextError(
            "No pude cargar el historial del presupuesto. Puedes capturar los montos manualmente."
          );
          setFormState((prev) => ({
            ...prev,
            categorias: [],
          }));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWizardContext();

    return () => {
      cancelled = true;
    };
  }, [uuid, savingsGoalPercent, categoryHint]);

  const totalAmount = useMemo(
    () =>
      formState.categorias.reduce(
        (sum, category) => sum + toNumber(category.proposedAmount),
        0
      ),
    [formState.categorias]
  );

  const suggestionLabel = useMemo(() => {
    if (data?.intent === "reduce_expenses") {
      return `Ajuste sugerido: recortar ${savingsGoalPercent}% del gasto mensual.`;
    }

    if (data?.intent === "increase_savings") {
      return `Ajuste sugerido: reservar ${savingsGoalPercent}% adicional para ahorro.`;
    }

    return "Ajuste sugerido: usa tu historial reciente como punto de partida.";
  }, [data?.intent, savingsGoalPercent]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryAmountChange = (id_categ, value) => {
    setFormState((prev) => ({
      ...prev,
      categorias: prev.categorias.map((category) =>
        category.id_categ === id_categ
          ? { ...category, proposedAmount: value }
          : category
      ),
    }));
  };

  const handleAddManualCategory = () => {
    setFormState((prev) => ({
      ...prev,
      categorias: [
        ...prev.categorias,
        {
          id_categ: `manual-${prev.categorias.length + 1}`,
          nombre_categ: `Categoria ${prev.categorias.length + 1}`,
          previousAmount: 0,
          proposedAmount: 0,
          manualOnly: true,
        },
      ],
    }));
  };

  const handleManualCategoryNameChange = (id_categ, value) => {
    setFormState((prev) => ({
      ...prev,
      categorias: prev.categorias.map((category) =>
        category.id_categ === id_categ
          ? { ...category, nombre_categ: value }
          : category
      ),
    }));
  };

  const handleSubmit = async () => {
    setSubmitError("");

    const nombre = formState.nombre.trim();
    if (!nombre) {
      setSubmitError("El nombre del presupuesto es obligatorio.");
      return;
    }

    if (!formState.inicio) {
      setSubmitError("La fecha de inicio es obligatoria.");
      return;
    }

    const validCategories = formState.categorias
      .filter((category) => !category.manualOnly)
      .map((category) => ({
        id_categ: category.id_categ,
        monto_asignado: toNumber(category.proposedAmount),
      }))
      .filter((category) => category.monto_asignado > 0);

    if (totalAmount <= 0) {
      setSubmitError("Ingresa al menos un monto mayor a 0 antes de guardar.");
      return;
    }

    try {
      const created = await createPresupuesto({
        uuid_de_usuario: uuid,
        nombre,
        inicio: formState.inicio,
        fin: formState.fin || undefined,
        monto_limite: totalAmount,
        categorias: validCategories,
      });

      setSubmittedBudget(created);

      if (onComplete) {
        onComplete({
          role: "assistant",
          type: "text",
          content: "Presupuesto guardado correctamente. Ya puedes revisarlo en la pestaña Presupuestos.",
        });
      }
    } catch (error) {
      console.error("Error creating budget from wizard:", error);
      setSubmitError(error?.message || "No se pudo guardar el presupuesto. Intenta de nuevo.");
    }
  };

  if (submittedBudget) {
    return (
      <div className="budget-wizard-widget budget-wizard-confirmed">
        <strong>Presupuesto confirmado</strong>
        <p>{submittedBudget.nombre || formState.nombre}</p>
        <p>Total guardado: {formatCurrency(submittedBudget.monto_limite || totalAmount)}</p>
      </div>
    );
  }

  return (
    <div className="budget-wizard-widget">
      <div className="budget-wizard-header">
        <strong>Asistente de presupuesto</strong>
        <span>{suggestionLabel}</span>
      </div>

      {categoryHint && (
        <div className="budget-wizard-callout">
          Enfoque detectado: {categoryHint}.
        </div>
      )}

      {contextError && <div className="budget-wizard-error">{contextError}</div>}

      <label className="budget-wizard-field">
        <span>Nombre</span>
        <input
          type="text"
          name="nombre"
          value={formState.nombre}
          onChange={handleChange}
        />
      </label>

      <div>
        <label className="budget-wizard-field">
          <span>Inicio</span>
          <input
            type="date"
            name="inicio"
            value={formState.inicio}
            onChange={handleChange}
          />
        </label>
      </div>

      <div>
        <label className="budget-wizard-field">
          <span>Fin</span>
          <input
            type="date"
            name="fin"
            value={formState.fin}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="budget-wizard-total">
        <span>Total propuesto</span>
        <strong>{formatCurrency(totalAmount)}</strong>
      </div>

      <div className="budget-wizard-categories">
        <div className="budget-wizard-categories-head">
          <span>Categorias</span>
          <button type="button" onClick={handleAddManualCategory}>
            Agregar fila
          </button>
        </div>

        {loading ? (
          <div className="budget-wizard-empty">Cargando sugerencias...</div>
        ) : formState.categorias.length === 0 ? (
          <div className="budget-wizard-empty">
            No encontre categorias previas. Puedes agregar montos manualmente.
          </div>
        ) : (
          formState.categorias.map((category) => (
            <div key={category.id_categ} className="budget-wizard-category-row">
              {category.manualOnly ? (
                <input
                  type="text"
                  value={category.nombre_categ}
                  onChange={(event) =>
                    handleManualCategoryNameChange(category.id_categ, event.target.value)
                  }
                  className="budget-wizard-category-name-input"
                />
              ) : (
                <div className="budget-wizard-category-meta">
                  <span>{category.nombre_categ}</span>
                  <small>Anterior: {formatCurrency(category.previousAmount)}</small>
                </div>
              )}

              <input
                type="number"
                min="0"
                step="0.01"
                value={category.proposedAmount}
                onChange={(event) =>
                  handleCategoryAmountChange(category.id_categ, event.target.value)
                }
              />
            </div>
          ))
        )}
      </div>

      {submitError && <div className="budget-wizard-error">{submitError}</div>}

      <div className="budget-wizard-actions">
        <button
          type="button"
          className="budget-wizard-submit"
          onClick={handleSubmit}
        >
          Guardar presupuesto
        </button>

        {submitError ? (
          <button
            type="button"
            className="budget-wizard-retry"
            onClick={handleSubmit}
          >
            Reintentar guardado
          </button>
        ) : null}
      </div>
    </div>
  );
}
