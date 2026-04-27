// categorías, con persistencia vía API.

import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Check } from "lucide-react";

import IconPickerModal    from "./IconPickerModal.jsx";
import CategoryConfigItem from "./CategoryConfigItem.jsx";
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
  updatePresupuesto,
} from "../../../services/presupuestosService";


function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function resolveCategoryId(payload) {
  return (
    payload?.id_categ ??
    payload?.id ??
    payload?.data?.id_categ ??
    payload?.data?.id ??
    null
  );
}

function buildLocalCategories(categorias, categoriasConMonto) {
  const montoById = new Map(
    (categoriasConMonto || []).map((c, idx) => [Number(c.id_categ), {
      monto_asignado: safeNumber(c.monto_asignado),
      order: safeNumber(c.order) || idx + 1,
    }])
  );

  const base = (categorias || []).map((c, idx) => {
    const id = Number(c.id_categ);
    const budgetInfo = montoById.get(id);
    return {
      uid: `db-${id}`,
      id_categ: id,
      nombre_categ: c.nombre_categ || "",
      icon: c.icon || "zap",
      color: c.color || "#7B868C",
      monto_asignado: budgetInfo?.monto_asignado ?? 0,
      order: budgetInfo?.order ?? idx + 1,
    };
  });

  const ids = new Set(base.map((c) => c.id_categ));
  const onlyInBudget = (categoriasConMonto || [])
    .filter((c) => !ids.has(Number(c.id_categ)))
    .map((c, idx) => ({
      uid: `budget-${c.id_categ}`,
      id_categ: Number(c.id_categ),
      nombre_categ: c.nombre_categ || "",
      icon: c.icon || "zap",
      color: c.color || "#7B868C",
      monto_asignado: safeNumber(c.monto_asignado),
      order: safeNumber(c.order) || base.length + idx + 1,
    }));

  return [...base, ...onlyInBudget].sort((a, b) => a.order - b.order);
}


export default function CategoryConfigView({
  categorias = [],
  categoriasConMonto = [],
  presupuestoId,
  highlightId,
  onSave,
  onBack,
}) {
  // Local draft — se persiste al guardar
  const [localCats, setLocalCats] = useState(() =>
    buildLocalCategories(categorias, categoriasConMonto)
  );
  const [iconPickerFor, setIconPickerFor] = useState(null); // category uid | null
  const [deletedIds, setDeletedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setLocalCats(buildLocalCategories(categorias, categoriasConMonto));
    setDeletedIds([]);
    setIconPickerFor(null);
    setSaveError("");
  }, [categorias, categoriasConMonto, presupuestoId]);

  const update = (uid, field, value) =>
    setLocalCats((prev) => prev.map((c) => (c.uid === uid ? { ...c, [field]: value } : c)));

  const deleteCat = (uid) => {
    setLocalCats((prev) => {
      const target = prev.find((c) => c.uid === uid);
      if (target?.id_categ) {
        setDeletedIds((curr) => (curr.includes(target.id_categ) ? curr : [...curr, target.id_categ]));
      }
      return prev.filter((c) => c.uid !== uid);
    });
  };

  const addCat = () => {
    const newCat = {
      uid: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      id_categ: null,
      nombre_categ: "Nueva categoría",
      icon: "zap",
      monto_asignado: 0,
      color: "#7B868C",
      order: localCats.length + 1,
    };
    setLocalCats((prev) => [...prev, newCat]);
  };

  const move = (fromIdx, toIdx) => {
    const arr = [...localCats];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    setLocalCats(arr.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaveError("");
    setSaving(true);

    try {
      const resolvedCats = [];

      for (const cat of localCats) {
        const payload = {
          nombre_categ: (cat.nombre_categ || "").trim() || "Sin nombre",
          icon: cat.icon || "zap",
          color: cat.color || "#7B868C",
        };

        if (!cat.id_categ) {
          const created = await createCategoria(payload);
          const createdId = resolveCategoryId(created);
          if (!createdId) {
            throw new Error("No se recibió id_categ al crear categoría.");
          }

          resolvedCats.push({
            ...cat,
            ...payload,
            id_categ: Number(createdId),
          });
        } else {
          await updateCategoria(cat.id_categ, payload);
          resolvedCats.push({
            ...cat,
            ...payload,
          });
        }
      }

      if (presupuestoId) {
        const categoriasPayload = resolvedCats.map((cat, idx) => ({
          id_categ: cat.id_categ,
          monto_asignado: safeNumber(cat.monto_asignado),
          order: idx + 1,
        }));

        await updatePresupuesto(presupuestoId, {
          categorias: categoriasPayload,
        });
      }

      for (const id of deletedIds) {
        await deleteCategoria(id);
      }

      if (typeof onSave === "function") onSave();
      if (typeof onBack === "function") onBack();
    } catch (error) {
      console.error("Error saving categories:", error);
      setSaveError(error?.message || "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const pickerCat = localCats.find((c) => c.uid === iconPickerFor);

  return (
    <>
      <div className="pres-config-panel">
        <div className="pres-config-header">
          <button
            className="pres-detail-header__back"
            id="pres-config-back-btn"
            onClick={onBack}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="pres-config-header__title">Gestionar Categorías</h2>
        </div>

        {/* Lista de categorias*/}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {localCats.map((cat, idx) => (
            <CategoryConfigItem
              key={cat.uid}
              cat={cat}
              index={idx}
              total={localCats.length}
              isHighlighted={cat.id_categ === highlightId || cat.nombre_categ === highlightId}
              onUpdate={update}
              onDelete={deleteCat}
              onMove={move}
              onIconClick={setIconPickerFor}
            />
          ))}
        </div>

        {/* Boton nueva categoria  */}
        <button
          className="pres-config-add-btn"
          id="pres-config-add-cat-btn"
          onClick={addCat}
        >
          <Plus size={20} /> Añadir Nueva Categoría
        </button>

        {saveError && (
          <div className="pres-empty" style={{ color: "var(--banorte-red)", marginTop: 12 }}>
            {saveError}
          </div>
        )}
      </div>

      {/*  Icon picker modal */}
      {iconPickerFor && pickerCat && (
        <IconPickerModal
          currentIcon={pickerCat.icon}
          currentColor={pickerCat.color}
          onSelectIcon={(key) => {
            update(iconPickerFor, "icon", key);
            setIconPickerFor(null);
          }}
          onSelectColor={(color) => {
            update(iconPickerFor, "color", color);
          }}
          onClose={() => setIconPickerFor(null)}
        />
      )}

      {/* Save footer  */}
      <div className="pres-config-footer">
        <button
          className="pres-config-save-btn"
          id="pres-config-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <Check size={20} /> {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </>
  );
}
