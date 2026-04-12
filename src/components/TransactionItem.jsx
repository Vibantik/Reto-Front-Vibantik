import { ArrowUpRight, ChevronRight } from "lucide-react";
import transactionIcon from "../assets/transaccion.png";

function TransactionItem({ transaction }) {
  const isIncome = transaction.type === "ingreso";

  return (
    <article className="transaction-card">
      <div className="transaction-card__left">
        <div className="transaction-card__avatar">
          <img
            src={transactionIcon}
            alt="Icono de transacción"
            className="transaction-card__avatar-image"
          />
        </div>

        <div className="transaction-card__info">
          <h4>{transaction.description}</h4>
          <p>{transaction.category}</p>
          <span>{transaction.date}</span>
        </div>
      </div>

      <div className="transaction-card__right">
        <div className="transaction-card__amountRow">
          <ArrowUpRight size={18} className="amount-arrow" />
          <strong className={isIncome ? "amount income" : "amount expense"}>
            {isIncome ? "+" : "-"}${transaction.amount.toLocaleString("es-MX")}
          </strong>
        </div>

        <span className={`status-chip ${isIncome ? "income" : "expense"}`}>
          {isIncome ? "Ingreso" : "Egreso"}
        </span>

        <ChevronRight size={24} className="transaction-chevron" />
      </div>
    </article>
  );
}

export default TransactionItem;