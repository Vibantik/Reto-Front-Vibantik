import { useMemo, useState } from "react";
import { createMeta } from "../../../services/metasService";
import { getUserUuid } from "../../../utils/userUuid";
import "./budgetWizardWidget.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getTodayIso = () => {
  const date = new Date();
  return date.toISOString().slice(0, 10);
};

const addMonthsIso = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

const toNumber = (value) => {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const getDaysBetween = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 1;
  }

  const diff = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(days, 1);
};

const buildDefaultGoalName = (goalNameHint) => {
  if (goalNameHint) {
    return `Meta para ${goalNameHint}`;
  }

  return "Nueva meta de ahorro";
};

export default function GoalWizardWidget({ data = {}, onComplete }) {
  const uuid = getUserUuid();

  const [submittedGoal, setSubmittedGoal] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState({
    nombreMeta: buildDefaultGoalName(data?.goalNameHint),
    monto: data?.targetAmount || "",
    fechaInicio: getTodayIso(),
    fechaFin: addMonthsIso(6),
  });

  const plazoDias = useMemo(
    () => getDaysBetween(formState.fechaInicio, formState.fechaFin),
    [formState.fechaInicio, formState.fechaFin]
  );

  const monthlySaving = useMemo(() => {
    const amount = toNumber(formState.monto);
    const months = Math.max(plazoDias / 30, 1);

    if (!amount) return 0;

    return amount / months;
  }, [formState.monto, plazoDias]);

  const weeklySaving = useMemo(() => {
    const amount = toNumber(formState.monto);
    const weeks = Math.max(plazoDias / 7, 1);

    if (!amount) return 0;

    return amount / weeks;
  }, [formState.monto, plazoDias]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitError("");

    const nombreMeta = formState.nombreMeta.trim();
    const monto = toNumber(formState.monto);

    if (!uuid) {
      setSubmitError("No encontré el usuario actual. Inicia sesión de nuevo.");
      return;
    }

    if (!nombreMeta) {
      setSubmitError("El nombre de la meta es obligatorio.");
      return;
    }

    if (monto <= 0) {
      setSubmitError("El monto de la meta debe ser mayor a 0.");
      return;
    }

    if (!formState.fechaInicio) {
      setSubmitError("La fecha de inicio es obligatoria.");
      return;
    }

    if (!formState.fechaFin) {
      setSubmitError("La fecha final es obligatoria.");
      return;
    }

    if (new Date(formState.fechaFin) <= new Date(formState.fechaInicio)) {
      setSubmitError("La fecha final debe ser posterior a la fecha de inicio.");
      return;
    }

    try {
      setSaving(true);

      const created = await createMeta({
        uuid,
        nombreMeta,
        monto,
        fechaInicio: formState.fechaInicio,
        fechaFin: formState.fechaFin,
        plazoDias,
      });

      setSubmittedGoal(created);

      onComplete?.({
        role: "assistant",
        type: "text",
        content:
          "Meta guardada correctamente. Ya puedes revisarla en la pestaña Metas.",
      });
    } catch (error) {
      console.error("Error creating goal from wizard:", error);

      setSubmitError(
        error?.message || "No se pudo guardar la meta. Intenta de nuevo."
      );
    } finally {
      setSaving(false);
    }
  };

  if (submittedGoal) {
    return (
      <section className="budget-wizard-widget budget-wizard-confirmed">
        <header className="budget-wizard-header">
          <strong>Meta confirmada</strong>
          <span>{submittedGoal.nombreMeta || formState.nombreMeta}</span>
        </header>

        <div className="budget-wizard-total">
          <span>Total guardado</span>
          <strong>{formatCurrency(submittedGoal.monto || formState.monto)}</strong>
        </div>
      </section>
    );
  }

  return (
    <section className="budget-wizard-widget">
      <header className="budget-wizard-header">
        <strong>Asistente de metas</strong>
        <span>
          Define tu objetivo, monto y fecha límite antes de guardar.
        </span>
      </header>

      {data?.goalNameHint ? (
        <p className="budget-wizard-callout">
          Meta detectada: {data.goalNameHint}.
        </p>
      ) : null}

      {data?.targetAmount ? (
        <p className="budget-wizard-callout">
          Monto detectado: {formatCurrency(data.targetAmount)}.
        </p>
      ) : null}

      <label className="budget-wizard-field">
        <span>Nombre</span>
        <input
          type="text"
          name="nombreMeta"
          value={formState.nombreMeta}
          onChange={handleChange}
          placeholder="Ej. Viaje a Oslo"
        />
      </label>

      <label className="budget-wizard-field">
        <span>Monto objetivo</span>
        <input
          type="number"
          name="monto"
          value={formState.monto}
          onChange={handleChange}
          placeholder="Ej. 15000"
          min="0"
        />
      </label>

      <div className="budget-wizard-grid">
        <label className="budget-wizard-field">
          <span>Inicio</span>
          <input
            type="date"
            name="fechaInicio"
            value={formState.fechaInicio}
            onChange={handleChange}
          />
        </label>

        <label className="budget-wizard-field">
          <span>Fin</span>
          <input
            type="date"
            name="fechaFin"
            value={formState.fechaFin}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="budget-wizard-total">
        <span>Plazo</span>
        <strong>{plazoDias} días</strong>
      </div>

      <div className="budget-wizard-total">
        <span>Ahorro mensual</span>
        <strong>{formatCurrency(monthlySaving)}</strong>
      </div>

      <div className="budget-wizard-total">
        <span>Ahorro semanal</span>
        <strong>{formatCurrency(weeklySaving)}</strong>
      </div>

      {submitError ? (
        <p className="budget-wizard-error">{submitError}</p>
      ) : null}

      <div className="budget-wizard-actions">
        <button
          type="button"
          className="budget-wizard-submit"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar meta"}
        </button>

        {submitError ? (
          <button
            type="button"
            className="budget-wizard-retry"
            onClick={handleSubmit}
            disabled={saving}
          >
            Reintentar guardado
          </button>
        ) : null}
      </div>
    </section>
  );
}