import { Search } from "lucide-react";

function TransactionSearch({ searchTerm, onSearchChange }) {
  return (
    <div className="banorte-search">
      <Search size={18} />
      <input
        data-cy="transaction-search-input"
        type="text"
        placeholder="Buscar por comercio o monto"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}

export default TransactionSearch;