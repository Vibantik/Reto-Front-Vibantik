// src/components/InversionesPanel.jsx
import { useEffect, useState } from "react";
import { fetchInversiones } from "../services/inversionesService";
import InversionCard from "./InversionCard";
import FondoCard from "./FondoCard";
import "./css/inversiones.css";

function InversionesPanel() {
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInversiones();
        setInversiones(data);
      } catch (err) {
        setError("No se pudieron cargar las inversiones.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    </section>
  );
}

export default InversionesPanel;