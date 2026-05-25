import { useEffect, useState } from "react";
import { fetchInversiones } from "../services/inversionesService";
import InversionCard from "./InversionCard";
import FondoCard from "./FondoCard";
import "./css/inversiones.css";

const INITIAL_ADVISOR_FORM = {
  montoDisponible: "",
  objetivo: "Conocer opciones seguras",
  horizonte: "3 a 6 meses",
  riesgo: "Bajo",
  liquidez: "Media",
  duda: "",
};

function buildAdvisorPrompt(uuid, form, resumen) {
  const lines = [
    "Eres Aura, asesora financiera de Banorte.",
    "Este mensaje viene de un formulario de orientación para nuevas inversiones.",
    "No crees inversiones ni pidas datos sensibles; solo orienta y resuelve dudas.",
    `UUID del usuario: ${uuid || "no disponible"}`,
    `Monto disponible: ${form.montoDisponible || "No especificado"}`,
    `Objetivo: ${form.objetivo}`,
    `Horizonte: ${form.horizonte}`,
    `Tolerancia al riesgo: ${form.riesgo}`,
    `Necesidad de liquidez: ${form.liquidez}`,
    `Duda principal: ${form.duda || "El usuario quiere una guía general para empezar."}`,
  ];

  if (resumen.plazo.length || resumen.fondos.length) {
    lines.push(
      `Contexto actual: ${resumen.plazo.length} inversiones a plazo y ${resumen.fondos.length} fondos activos.`
    );
  }

  lines.push(
    "Responde con recomendaciones claras sobre tipos de inversión, riesgos, horizonte sugerido y preguntas de seguimiento si falta contexto."
  );

  return lines.join("\n");
}

export default function InversionesPanel({ uuid, onRequestAdvice }) {
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [advisorForm, setAdvisorForm] = useState(INITIAL_ADVISOR_FORM);

  useEffect(() => {
    if (!uuid) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInversiones(uuid);
        setInversiones(data);
      } catch (err) {
        setError("No se pudieron cargar las inversiones.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid]);

  const esFondo = (inv) => inv.tipo?.toLowerCase() == "fondo de inversión";

  const plazo = inversiones.filter((i) => !esFondo(i));
  const fondos = inversiones.filter((i) => esFondo(i));

  const totalPlazo = plazo.reduce((s, i) => s + parseFloat(i.valor || 0), 0);
  const totalFondos = fondos.reduce((s, f) => s + parseFloat(f.valor || 0), 0);
  const advisorSummary = { plazo, fondos };

  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const handleAdvisorChange = (event) => {
    const { name, value } = event.target;
    setAdvisorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdvisorSubmit = (event) => {
    event.preventDefault();

    const prompt = buildAdvisorPrompt(uuid, advisorForm, advisorSummary);
    onRequestAdvice?.({ prompt, model: "gemma" });
    setAdvisorOpen(false);
    setAdvisorForm(INITIAL_ADVISOR_FORM);
  };

  const handleAdvisorClose = () => {
    setAdvisorOpen(false);
  };

  return (
    <section className="inversiones-screen">

      {loading && <p>Cargando inversiones...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Inversiones a Plazo */}
      {!loading && !error && (
        <>
          <div className="inversiones-header">
            <div>
              <p className="inversiones-kicker">Banorte</p>
              <h2>Inversiones a Plazo</h2>
            </div>
            {plazo.length > 0 && (
              <div className="inversiones-total">
                <p className="label">Total invertido</p>
                <p className="monto">{fmt(totalPlazo)}</p>
              </div>
            )}
          </div>

          <div className="inversiones-grid">
            {plazo.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No tienes inversiones a plazo activas.</p>
            ) : (
              plazo.map((inv) => (
                <InversionCard key={inv["id_inversión"]} inversion={inv} />
              ))
            )}
          </div>
        </>
      )}

      {/* Fondos de Inversión */}
      {!loading && !error && (
        <>
          <div className="inversiones-header" style={{ marginTop: "2rem" }}>
            <div>
              <p className="inversiones-kicker">Banorte</p>
              <h2>Fondos de Inversión</h2>
            </div>
            {fondos.length > 0 && (
              <div className="inversiones-total">
                <p className="label">Total en fondos</p>
                <p className="monto">{fmt(totalFondos)}</p>
              </div>
            )}
          </div>

          <div className="inversiones-grid">
            {fondos.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No tienes fondos de inversión activos.</p>
            ) : (
              fondos.map((f) => (
                <FondoCard key={f["id_inversión"]} fondo={f} isExpandable={fondos.length > 1} />
              ))
            )}
          </div>
        </>
      )}

      {/* botón al final del panel */}
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <button
          type="button"
          className="inversiones-advisor-btn"
          data-cy="invest-ia-btn"
          onClick={() => setAdvisorOpen(true)}
        >
          Abrir asesor IA
        </button>
      </div>

      {/* Modal overlay para el formulario */}
      {advisorOpen && (
        <div className="inversiones-modal-backdrop" onClick={handleAdvisorClose}>
          <div className="inversiones-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <form data-cy="invest-ia-form" onSubmit={handleAdvisorSubmit}>
              <div className="inversiones-advisor-intro">
                <strong>Asesor de nuevas inversiones</strong>
                <p>
                  Completa lo que sabes y Aura te ayudará a evaluar opciones, riesgos y el tipo de
                  inversión que mejor se ajuste a tu objetivo. Esto no crea inversiones.
                </p>
              </div>

              <div className="inversiones-advisor-grid">
                <label className="inversiones-advisor-field">
                  <span>Monto disponible</span>
                  <input
                    type="text"
                    name="montoDisponible"
                    value={advisorForm.montoDisponible}
                    onChange={handleAdvisorChange}
                    placeholder="Ej. $25,000"
                    data-cy="ia-amount"
                  />
                </label>

                <label className="inversiones-advisor-field">
                  <span>Objetivo</span>
                  <select name="objetivo" value={advisorForm.objetivo} onChange={handleAdvisorChange} data-cy="ia-objective">
                    <option>Conocer opciones seguras</option>
                    <option>Hacer crecer mi dinero</option>
                    <option>Proteger mi capital</option>
                    <option>Generar ingresos periódicos</option>
                    <option>Ahorrar para una meta futura</option>
                  </select>
                </label>

                <label className="inversiones-advisor-field">
                  <span>Horizonte</span>
                  <select name="horizonte" value={advisorForm.horizonte} onChange={handleAdvisorChange} data-cy="ia-horizon">
                    <option>1 a 3 meses</option>
                    <option>3 a 6 meses</option>
                    <option>6 a 12 meses</option>
                    <option>Más de 1 año</option>
                  </select>
                </label>

                <label className="inversiones-advisor-field">
                  <span>Riesgo</span>
                  <select name="riesgo" value={advisorForm.riesgo} onChange={handleAdvisorChange} data-cy="ia-risk">
                    <option>Bajo</option>
                    <option>Medio</option>
                    <option>Alto</option>
                  </select>
                </label>

                <label className="inversiones-advisor-field">
                  <span>Liquidez</span>
                  <select name="liquidez" value={advisorForm.liquidez} onChange={handleAdvisorChange} data-cy="ia-liquidity">
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                  </select>
                </label>

                <label className="inversiones-advisor-field inversiones-advisor-field--full">
                  <span>Duda principal</span>
                  <textarea
                    name="duda"
                    value={advisorForm.duda}
                    onChange={handleAdvisorChange}
                    placeholder="Ej. ¿Me conviene un fondo o una inversión a plazo?"
                    rows="3"
                    data-cy="ia-question"
                  />
                </label>
              </div>

              <div className="inversiones-advisor-actions">
                <p>
                  Aura recibirá estos datos como contexto y te responderá con orientación, no con una
                  creación de inversión.
                </p>
                <div>
                  <button type="button" className="inversiones-advisor-submit" onClick={handleAdvisorClose} style={{ marginRight: 8 }}>
                    Cancelar
                  </button>
                  <button type="submit" className="inversiones-advisor-submit" data-cy="ia-submit-btn">
                    Enviar al chatbot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
