function MovementDetails({ transaction }) {
	const isIncome = transaction.type === "ingreso";
	const movementTypeLabel = isIncome ? "Ingreso" : "Egreso";
	const amountPrefix = isIncome ? "+" : "-";
	const status = transaction.status || "Aplicado";

const movementDate = transaction.date
  ? new Date(transaction.date.slice(0, 10) + "T12:00:00")
      .toLocaleDateString("es-MX", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(".", "")
  : "No disponible";

	const movementTime = transaction.time || "12:00";

	const details = [
		{ label: "Tipo de movimiento", value: movementTypeLabel },
		{ label: "Fecha y hora", value: `${movementDate} • ${movementTime}` },
		{ label: "Comercio / concepto", value: transaction.description || "No disponible" },
		{ label: "Categoría", value: transaction.category || "Sin categoría" },
		{ label: "Canal", value: transaction.channel || "Compra con tarjeta digital" },
		{ label: "Referencia", value: transaction.reference || `REF-${String(transaction.id).padStart(6, "0")}` },
		{ label: "Cuenta", value: transaction.account || "•••• 4821" },
		{ label: "Estatus", value: status },
	];

	return (
		<section className="movement-details" data-cy="movement-details" aria-label={`Detalle de ${transaction.description}`}>
			<header className="movement-details__header">
				<p>Detalle del movimiento</p>
				<strong data-cy="movement-amount" className={isIncome ? "movement-details__amount income" : "movement-details__amount expense"}>
					{amountPrefix}${transaction.amount.toLocaleString("es-MX", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}
				</strong>
			</header>

			<dl className="movement-details__grid">
				{details.map((item) => (
					<div key={item.label} className="movement-details__row">
						<dt>{item.label}</dt>
						<dd data-cy={`movement-${item.label.replace(/\s+/g, "-").toLowerCase()}`}>{item.value}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

export default MovementDetails;
