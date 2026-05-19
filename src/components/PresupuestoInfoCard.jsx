import { useState, useEffect } from "react";
import { fetchPresupuestos } from "../services/presupuestosService";
import { fetchTransactions } from "../services/transactionsService";
import { getUserUuid } from "../utils/userUuid";
import { pickActivePresupuesto, buildBudgetOverview } from "../utils/budgetInsights";

export default function PresupuestoInfoCard({ onViewDetails }) {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const uuid = getUserUuid();
        const presupuestos = await fetchPresupuestos(uuid);
        const activo = pickActivePresupuesto(presupuestos, new Date());
        
        if (!activo) {
          setResumen(null);
          return;
        }

        const ahora = new Date();
        const mes = String(ahora.getMonth() + 1).padStart(2, "0");
        const ini = `${ahora.getFullYear()}-${mes}-01`;
        const hoy = ahora.toISOString().slice(0, 10);
        
        const txRes = await fetchTransactions({ page: 1, limit: 400, startDate: ini, endDate: hoy });
        const txs = txRes.data ?? [];
        const egresos = txs.filter((t) => t.type !== "ingreso");
        const totalEjecutado = egresos.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        setResumen({
          nombre: activo.nombre,
          monto_limite: activo.monto_limite,
          totalEjecutado,
          balance: activo.monto_limite - totalEjecutado
        });
      } catch (err) {
        setResumen(null);
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, []);

  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  if (loading) {
    return (
      <div className="card info-card">
        <p className="info-text-lg">Cargando presupuesto...</p>
      </div>
    );
  }

  return (
    <div className="card info-card">
      {resumen ? (
        <>
          <p className="info-text-lg">
            Tienes un presupuesto activo: <strong>{resumen.nombre}</strong>.
            Llevas gastado <strong>{fmt(resumen.totalEjecutado)}</strong> de <strong>{fmt(resumen.monto_limite)}</strong>.
            <br/>
            Te quedan disponibles <span style={{ color: resumen.balance < 0 ? "#EC0029" : "#6CC04A" }}><strong>{fmt(resumen.balance)}</strong></span>.
          </p>
          <button className="btn-action" onClick={onViewDetails}>Ver mi presupuesto &gt;&gt;</button>
        </>
      ) : (
        <>
          <p className="info-text-lg">
            No tienes ningún presupuesto activo en este momento.
          </p>
          <button className="btn-action" onClick={onViewDetails}>Crear presupuesto &gt;&gt;</button>
        </>
      )}
    </div>
  );
}
