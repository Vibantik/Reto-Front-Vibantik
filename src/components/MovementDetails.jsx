import { useState } from "react";

const CATEGORIES = [
	"Alimentación", "Compras", "Comida", "Transporte", "Entretenimiento",
	"Ingreso", "Nómina", "Servicios", "Sin categoría",
];

const API_URL = import.meta.env.VITE_API_URL;

function MovementDetails({ transaction }) {
	const [category, setCategory] = useState(transaction.category || "Sin categoría");
	const [saving, setSaving] = useState(false);

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

	const handleSaveCategory = async () => {
		setSaving(true);
		try {
			await fetch(`${API_URL}/api/transactions/${transaction.id}/category`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ category }),
			});
		} catch (err) {
			console.error(err);
		} finally {
			setSaving(false);
		}
	};

	const details = [
		{ label: "Tipo de movimiento", value: movementTypeLabel },
		{ label: "Fecha y hora", value: `${movementDate} • ${movementTime}` },
		{ label: "Comercio / concepto", value: transaction.description || "No disponible" },
		{ label: "Canal", value: transaction.channel || "Compra con tarjeta digital" },
		{ label: "Referencia", value: transaction.reference || `REF-${String(transaction.id).padStart(6, "0")}` },
		{ label: "Cuenta", value: transaction.account || "•••• 4821" },
		{ label: "Estatus", value: status },
	];

	return (
		<section className="movement-details" data-cy="transaction-detail" aria-label={`Detalle de ${transaction.description}`}>
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
				<div className="movement-details__row">
					<dt>Categoría</dt>
					<dd>
						<select
							data-cy="category-select"
							name="category"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
						>
							{CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>{cat}</option>
							))}
						</select>
						<button
							data-cy="save-category"
							type="button"
							onClick={handleSaveCategory}
							disabled={saving}
							style={{ marginLeft: 8 }}
						>
							{saving ? "Guardando..." : "Guardar"}
						</button>
					</dd>
				</div>
			</dl>
		</section>
	);
}

export default MovementDetails;
