// src/components/InversionesPanel.jsx
import { useEffect, useState } from "react";
import { fetchInversiones } from "../services/inversionesService";
import InversionCard from "./InversionCard";
import "./css/inversiones.css";

function InversionesPanel() {
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

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

  const totalInvertido = inversiones.reduce(
  (sum, i) => sum + parseFloat(i.valor || 0), 0
);

  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  return (
    <section className="inversiones-screen">
      <div className="inversiones-header">
        <div>
          <p className="inversiones-kicker">Banorte</p>
          <h2>Inversiones a Plazo</h2>
        </div>
        {!loading && !error && (
          <div className="inversiones-total">
  <p className="label">Total invertido</p>
  <p className="monto">{fmt(totalInvertido)}</p>
</div>
        )}
      </div>

      {loading && <p>Cargando inversiones...</p>}
      {error   && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div className="inversiones-grid">
          {inversiones.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No tienes inversiones a plazo activas.</p>
          ) : (
            inversiones.map((inv) => (
              <InversionCard key={inv.id} inversion={inv} />
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default InversionesPanel;