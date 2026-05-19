import { Search } from "lucide-react";

function TransactionSearch({ searchTerm, setSearchTerm }) {
  return (
    <div className="banorte-search">
      <Search size={18} />
      <input
        type="text"
        placeholder="Buscar por comercio o monto"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}

export default TransactionSearch;