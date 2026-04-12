import TransactionItem from "./TransactionItem";

function TransactionList({ transactions }) {
  if (transactions.length === 0) {
    return <p className="empty-state">No se encontraron transacciones.</p>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}

export default TransactionList;