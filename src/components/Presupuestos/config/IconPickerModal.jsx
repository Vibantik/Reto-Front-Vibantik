// deja seleccionar icon para categorias

import { ICON_MAP, AVAILABLE_ICONS } from "../presupuestos.data.js";


export default function IconPickerModal({ currentIcon, currentColor = "#7B868C", onSelectIcon, onSelectColor, onClose }) {
  return (
    <div className="pres-icon-picker-overlay" onClick={onClose}>
      <div
        className="pres-icon-picker-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="pres-icon-picker-modal__title">Personalizar Icono y Color</p>

        <div className="pres-color-picker-container" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="cat-color-picker" style={{ fontSize: '14px', fontWeight: '500' }}>Color:</label>
          <input 
            type="color" 
            id="cat-color-picker" 
            value={currentColor} 
            onChange={(e) => onSelectColor(e.target.value)}
            style={{ 
              width: '40px', 
              height: '40px', 
              padding: '0', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              backgroundColor: 'transparent'
            }} 
          />
        </div>

        <p className="pres-icon-picker-modal__title" style={{ fontSize: '14px', marginTop: '0' }}>Icono:</p>
        <div className="pres-icon-picker-grid">
          {AVAILABLE_ICONS.map((key) => {
            const Ic = ICON_MAP[key];
            return (
              <button
                key={key}
                className={`pres-icon-picker-option${currentIcon === key ? " selected" : ""}`}
                title={key}
                onClick={() => onSelectIcon(key)}
                style={{ color: currentIcon === key ? currentColor : 'inherit' }}
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
