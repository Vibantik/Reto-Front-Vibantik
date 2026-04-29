// Agrupa transacciones por fecha y renderiza filas.

import { formatDate } from "../utils/presupuestos.utils.js";
import TransactionRow from "./TransactionRow.jsx";

export default function TransactionGroup({ date, transactions, categoryIcon, expandedId, onToggle }) {
  return (
    <div className="pres-txn-group">
      <p className="pres-txn-group__date">{formatDate(date)}</p>
      <div className="pres-txn-card-wrap">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            categoryIcon={categoryIcon}
            isExpanded={expandedId === t.id}
            onToggle={() => onToggle(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
