import { useState, useEffect } from "react";
import { executeAgentAction } from "../../services/agentService";

const PARAM_LABELS = {
  nombreMeta: "Meta",
  monto_meta: "Monto",
  fecha_fin: "Fecha límite",
  fecha_inicio: "Fecha inicio",
  plazo_dias: "Plazo (días)",
  nombre: "Nombre",
  monto: "Monto",
  monto_limite: "Limite",
  descripcion: "Descripción",
  categoria: "Categoría",
  tipo: "Tipo",
  tasa: "Tasa",
  plazo: "Plazo",
  id_presupuesto: "Presupuesto",
};

function formatParamValue(key, value) {
  if (value === null || value === undefined) return "—";
  if (
    (key.toLowerCase().includes("monto") || key === "tasa") &&
    !isNaN(value)
  ) {
    return Number(value).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }
  if (
    (key.toLowerCase().includes("fecha") || key.toLowerCase().includes("date")) &&
    typeof value === "string"
  ) {
    const d = new Date(value + "T00:00:00");
    if (!isNaN(d)) return d.toLocaleDateString("es-MX", { dateStyle: "medium" });
  }
  return String(value);
}

const TOKEN_TTL_SECONDS = 5 * 60; // 5 minutos

export default function ActionProposalCard({ proposal, uuid, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [editedParams, setEditedParams] = useState(proposal.params || {});
  const [secondsLeft, setSecondsLeft] = useState(TOKEN_TTL_SECONDS);
  const expired = secondsLeft <= 0;

  // Countdown
  useEffect(() => {
    if (expired) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expired]);

  const handleConfirm = async () => {
    if (expired || loading) return;
    setLoading(true);
    try {
      const result = await executeAgentAction(
        proposal.confirmation_token,
        uuid,
        true,
        editedParams
      );
      onConfirm(result);
    } catch {
      onConfirm({
        type: "action_result",
        success: false,
        message: "Error al ejecutar la acción. Intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) return;
    // Notificar al backend (opcional) y cerrar
    try {
      await executeAgentAction(proposal.confirmation_token, uuid, false);
    } catch {
      // silencioso — el token simplemente expirará
    }
    onCancel();
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="agent-proposal-card bubble-enter">
      <div className="agent-proposal-header">
        <span className="agent-proposal-label">Propuesta de acción</span>
        {!expired && (
          <span className={`agent-proposal-timer ${secondsLeft <= 60 ? "urgent" : ""}`}>
            {mins}:{secs}
          </span>
        )}
      </div>

      <p className="agent-proposal-message">{proposal.message}</p>

      {Object.keys(editedParams).length > 0 && (
        <ul className="agent-proposal-params">
          {Object.entries(editedParams)
            .filter(([key]) => key !== "uuid_de_usuario" && key !== "uuidDeUsuario")
            .map(([key, value]) => (
            <li key={key}>
              <span className="param-key">{PARAM_LABELS[key] || key}</span>
              {["id_meta", "id_presupuesto", "id_inversion"].includes(key) ? (
                <span className="param-value">{formatParamValue(key, value)}</span>
              ) : (
                <input
                  type={(key.toLowerCase().includes("fecha") || key.toLowerCase().includes("date")) ? "date" : (key.toLowerCase().includes("monto") || key.toLowerCase().includes("valor") || key === "plazo_dias") ? "number" : "text"}
                  className="param-input"
                  value={value !== null && value !== undefined ? value : ""}
                  onChange={(e) => setEditedParams(prev => ({ ...prev, [key]: e.target.value }))}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {expired ? (
        <p className="agent-proposal-expired">
          La sesión de confirmación expiró. Por favor intenta de nuevo.
        </p>
      ) : (
        <div className="agent-proposal-actions">
          <button
            className="agent-btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="agent-btn-confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="agent-spinner" />
            ) : (
              "Confirmar"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
