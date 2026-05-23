// src/components/InversionesPanel.jsx
import { useEffect, useState } from "react";
import { fetchInversiones } from "../services/inversionesService";
import InversionCard from "./InversionCard";
import FondoCard from "./FondoCard";
<<<<<<< HEAD
=======
import Chatbot from "./Chatbot";
import InvestmentAssistantForm from "./InvestmentAssistantForm";
import { TrendingUp, Clock, PiggyBank, X, Calculator, RefreshCw } from "lucide-react";
>>>>>>> 78da039 (inversiones IA)
import "./css/inversiones.css";

function InversionesPanel({ uuid }) {
  const [inversiones, setInversiones] = useState([]);
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

=======
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [invSimular, setInvSimular]   = useState(null);
  const [openChatbot, setOpenChatbot] = useState(false);
  const [openAssistantForm, setOpenAssistantForm] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState(null);
 
>>>>>>> 78da039 (inversiones IA)
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

  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

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
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setOpenAssistantForm(true)} style={{ padding: "8px 12px", borderRadius: 10, background: "var(--banorte-red)", color: "#fff", border: "none", cursor: "pointer" }}>Asesor IA</button>
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
<<<<<<< HEAD
=======
 
      {invSimular && <SimuladorModal inversion={invSimular} onClose={() => setInvSimular(null)} />}
      {openAssistantForm && (
        <InvestmentAssistantForm
          onClose={() => setOpenAssistantForm(false)}
          onSubmit={(message) => {
            setInitialChatMessage(message);
            setOpenAssistantForm(false);
            setOpenChatbot(true);
          }}
        />
      )}

      {openChatbot && (
        <Chatbot
          open={openChatbot}
          onClose={() => { setOpenChatbot(false); setInitialChatMessage(null); }}
          systemPrompt={"Eres Aura, asistente de inversiones de Banorte. Da recomendaciones informativas y proporcionales al contexto del usuario. Reglas de estilo: 1) No te presentes ni uses texto de marketing. 2) Responde corto: maximo 120 palabras o 4 vietas. 3) Da 2-3 opciones concretas con instrumento y plazo sugerido. 4) Si falta informacion clave, haz solo 1 pregunta final de seguimiento. 5) No ejecutes acciones, solo sugiere y explica."}
          suggestions={[
            { text: "¿Qué recomienda para mi perfil de inversión?", highlight: "perfil" },
            { text: "¿A qué plazo debería invertir si quiero crecimiento?", highlight: "plazo" },
            { text: "¿Qué diferencia hay entre fondos y CETES?", highlight: "fondos vs cetes" },
          ]}
          initialUserMessage={initialChatMessage}
        />
      )}
>>>>>>> 78da039 (inversiones IA)
    </section>
  );
}

export default InversionesPanel;