// Buscador de transacciones dentro de una categoria

import { Search } from "lucide-react";

export default function TransactionSearch({ value, onChange }) {
  return (
    <div className="pres-detail-search">
      <Search size={18} className="pres-detail-search__icon" />
      <input
        id="pres-detail-search-input"
        type="text"
        placeholder="Buscar transacciones en esta categoría..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pres-detail-search__input"
      />
    </div>
  );
}
