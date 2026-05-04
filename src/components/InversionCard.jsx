function InversionCard({ inversion }) {
  const { nombre, valor, fecha_inicio, fecha_fin, tipo } = inversion;

  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const hoy = new Date();
  const total = fin - inicio;
  const transcurrido = Math.min(hoy - inicio, total);
  const progreso = Math.max(0, Math.min(100, (transcurrido / total) * 100));
  const diasRestantes = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));
  const valorNum = parseFloat(valor);

  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const fmtFecha = (d) =>
    new Date(d).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const vencida = hoy > fin;

  return (
    <div className="inversion-card" data-cy="inversion-card">
      <div className="inversion-card-header">
        <p className="inversion-nombre" data-cy="inversion-nombre">{nombre}</p>
        <span
          className={`inversion-estatus ${vencida ? "estatus-vencida" : "estatus-activa"}`}
          data-cy="inversion-estatus"
        >
          {vencida ? "VENCIDA" : "ACTIVA"}
        </span>
      </div>

      <p className="inversion-tipo" data-cy="inversion-tipo">{tipo}</p>
      <p className="inversion-monto" data-cy="inversion-monto">{fmt(valorNum)}</p>

      <div className="inversion-detalles">
        <span data-cy="inversion-fecha-inicio"><strong>{fmtFecha(fecha_inicio)}</strong><br />Inicio</span>
        <span data-cy="inversion-fecha-fin"><strong>{fmtFecha(fecha_fin)}</strong><br />Vencimiento</span>
        <span data-cy="inversion-dias-restantes"><strong>{diasRestantes} días</strong><br />Restantes</span>
      </div>

      <div className="inversion-progreso-bar" data-cy="inversion-progreso-bar">
        <div
          className="inversion-progreso-fill"
          data-cy="inversion-progreso-fill"
          style={{ width: `${progreso.toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}

export default InversionCard;