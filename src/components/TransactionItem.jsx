import { ArrowUpRight, ChevronRight } from "lucide-react";
import transactionIcon from "../assets/transaccion.png";
import MovementDetails from "./MovementDetails";

function TransactionItem({ transaction, isExpanded, onToggle }) {
  const isIncome = transaction.type === "ingreso";

  return (
    <article
      data-cy="transaction-card"
      className={`transaction-card ${isExpanded ? "expanded" : ""}`}
    >
      <div className="transaction-card__summary">
        <div className="transaction-card__left">
          <div className="transaction-card__avatar">
            <img
              src={transactionIcon}
              alt="Icono de transacción"
              className="transaction-card__avatar-image"
            />
          </div>

          <div className="transaction-card__info">
            <h4 data-cy="transaction-description">{transaction.description}</h4>
            <p data-cy="transaction-category">{transaction.category}</p>
            <span data-cy="transaction-date">
              {new Date(transaction.date.slice(0, 10) + "T12:00:00").toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="transaction-card__right">
          <div className="transaction-card__amountRow">
            <ArrowUpRight size={18} className="amount-arrow" />
            <strong data-cy="transaction-amount" className={isIncome ? "amount income" : "amount expense"}>
              {isIncome ? "+" : "-"}${transaction.amount.toLocaleString("es-MX")}
            </strong>
          </div>

          <span data-cy="transaction-status" className={`status-chip ${isIncome ? "income" : "expense"}`}>
            {isIncome ? "Ingreso" : "Egreso"}
          </span>

          <button
            data-cy="transaction-toggle"
            type="button"
            className={`transaction-chevron-btn ${isExpanded ? "open" : ""}`}
            onClick={onToggle}
            aria-label={
              isExpanded
                ? "Ocultar detalle del movimiento"
                : "Ver detalle del movimiento"
            }
            aria-expanded={isExpanded}
          >
            <ChevronRight size={24} className="transaction-chevron" />
          </button>
        </div>
      </div>

      {isExpanded && <MovementDetails transaction={transaction} />}
    </article>
  );
}

export default TransactionItem;