import { useState } from "react";
import TransactionItem from "./TransactionItem";

function TransactionList({ transactions }) {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (id) => {
    setExpandedId((prevId) => (prevId === id ? null : id));
  };

  if (transactions.length === 0) {
    return (
      <p data-cy="transaction-empty" className="empty-state">
        No se encontraron transacciones.
      </p>
    );
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          isExpanded={expandedId === transaction.id}
          onToggle={() => handleToggle(transaction.id)}
        />
      ))}
    </div>
  );
}

export default TransactionList;