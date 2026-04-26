// deja seleccionar icon para categorias

import { ICON_MAP, AVAILABLE_ICONS } from "../presupuestos.data.js";


export default function IconPickerModal({ currentIcon, onSelect, onClose }) {
  return (
    <div className="pres-icon-picker-overlay" onClick={onClose}>
      <div
        className="pres-icon-picker-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="pres-icon-picker-modal__title">Seleccionar icono</p>

        <div className="pres-icon-picker-grid">
          {AVAILABLE_ICONS.map((key) => {
            const Ic = ICON_MAP[key];
            return (
              <button
                key={key}
                className={`pres-icon-picker-option${currentIcon === key ? " selected" : ""}`}
                title={key}
                onClick={() => onSelect(key)}
              >
                <Ic size={20} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
