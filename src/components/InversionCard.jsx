function InversionCard({ inversion }) {
  const { nombre, valor, fecha_inicio, fecha_fin, tipo } = inversion;

  const inicio        = new Date(fecha_inicio);
  const fin           = new Date(fecha_fin);
  const hoy           = new Date();
  const total         = fin - inicio;
  const transcurrido  = Math.min(hoy - inicio, total);
  const progreso      = Math.max(0, Math.min(100, (transcurrido / total) * 100));
  const diasRestantes = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));
  const valorNum      = parseFloat(valor); // ✅ fix NaN

  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const fmtFecha = (d) =>
    new Date(d).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const vencida = hoy > fin;

  return (
    <div className="inversion-card">
      <div className="inversion-card-header">
        <p className="inversion-nombre">{nombre}</p>
        <span className={`inversion-estatus ${vencida ? "estatus-vencida" : "estatus-activa"}`}>
          {vencida ? "VENCIDA" : "ACTIVA"}
        </span>
      </div>

      <p className="inversion-tipo">{tipo}</p>
      <p className="inversion-monto">{fmt(valorNum)}</p>

      <div className="inversion-detalles">
        <span><strong>{fmtFecha(fecha_inicio)}</strong><br/>Inicio</span>
        <span><strong>{fmtFecha(fecha_fin)}</strong><br/>Vencimiento</span>
        <span><strong>{diasRestantes} días</strong><br/>Restantes</span>
      </div>

      <div className="inversion-progreso-bar">
        <div
          className="inversion-progreso-fill"
          style={{ width: `${progreso.toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}

export default InversionCard;