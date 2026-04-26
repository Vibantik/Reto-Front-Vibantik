// draft local de categories y el icon-picker state.

import { useState } from "react";
import { ChevronLeft, Plus, Check } from "lucide-react";

import IconPickerModal    from "./IconPickerModal.jsx";
import CategoryConfigItem from "./CategoryConfigItem.jsx";


export default function CategoryConfigView({ categories, highlightId, onSave, onBack }) {
  // Local draft —solo cuando Guardar Cambios
  const [localCats, setLocalCats] = useState(() => categories.map((c) => ({ ...c })));
  const [iconPickerFor, setIconPickerFor] = useState(null); // category id | null

  const update = (id, field, value) =>
    setLocalCats((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const deleteCat = (id) =>
    setLocalCats((prev) => prev.filter((c) => c.id !== id));

  const addCat = () => {
    const newCat = {
      id: `cat-${Date.now()}`,
      nombre: "Nueva Categoría",
      icon: "zap",
      monto_limite: 0,
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

  const handleSave = () => {
    onSave(localCats);
    onBack();
  };

  const pickerCat = localCats.find((c) => c.id === iconPickerFor);

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
              key={cat.id}
              cat={cat}
              index={idx}
              total={localCats.length}
              isHighlighted={cat.id === highlightId}
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
      </div>

      {/*  Icon picker modal */}
      {iconPickerFor && pickerCat && (
        <IconPickerModal
          currentIcon={pickerCat.icon}
          onSelect={(key) => {
            update(iconPickerFor, "icon", key);
            setIconPickerFor(null);
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
        >
          <Check size={20} /> Guardar Cambios
        </button>
      </div>
    </>
  );
}
