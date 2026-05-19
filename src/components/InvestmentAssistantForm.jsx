import React, { useState } from "react";
import "./css/inversiones.css";

export default function InvestmentAssistantForm({ onClose, onSubmit }) {
  const [riesgo, setRiesgo] = useState("medio");
  const [objetivo, setObjetivo] = useState("crecimiento");
  const [horizonte, setHorizonte] = useState(180);
  const [monto, setMonto] = useState("");
  const [pregunta, setPregunta] = useState("");

  const handleSubmit = () => {
    const montoNumero = Number(monto);
    const montoTexto = montoNumero > 0
      ? `${montoNumero.toLocaleString("es-MX")} MXN`
      : "No definido";

    const message = `Perfil de inversión:\n- Riesgo: ${riesgo}\n- Objetivo: ${objetivo}\n- Horizonte (días): ${horizonte}\n- Monto disponible: ${montoTexto}\nPregunta: ${pregunta || "¿Qué estrategia me recomiendas con este perfil?"}`;
    onSubmit(message);
  };

  return (
    <div className="create-inv-overlay" onClick={onClose}>
      <div className="create-inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-inv-header">
          <h3 style={{ margin: 0 }}>Asistente de inversiones — Perfil</h3>
        </div>

        <div className="create-inv-form">
          <div>
            <label>Riesgo</label>
            <select value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <div>
            <label>Objetivo</label>
            <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
              <option value="crecimiento">Crecimiento</option>
              <option value="preservacion">Preservación de capital</option>
              <option value="ingresos">Generar ingresos</option>
            </select>
          </div>
          <div>
            <label>Horizonte (días)</label>
            <input type="number" value={horizonte} onChange={(e) => setHorizonte(Number(e.target.value))} />
          </div>
          <div>
            <label>Monto disponible (MXN)</label>
            <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1/3" }}>
            <label>Pregunta o contexto</label>
            <textarea value={pregunta} onChange={(e) => setPregunta(e.target.value)} rows={4} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>

          <div className="create-inv-actions">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Consultar a Aura</button>
          </div>
        </div>
      </div>
    </div>
  );
}
