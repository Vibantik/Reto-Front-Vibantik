function TransactionFilters({
  selectedType,
  setSelectedType,
  selectedCategory,
  setSelectedCategory,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) {
  return (
    <div className="filters-grid">
      <div className="filter-group">
        <label>Tipo</label>
        <select
          data-cy="transaction-type-filter"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="all">Todos los movimientos</option>
          <option value="ingreso">Ingresos</option>
          <option value="egreso">Egresos</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Categoría</label>
        <select
          data-cy="transaction-category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          <option value="Ingreso">Ingreso</option>
          <option value="Comida">Comida</option>
          <option value="Transporte">Transporte</option>
          <option value="Entretenimiento">Entretenimiento</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Desde</label>
        <input
          data-cy="transaction-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Hasta</label>
        <input
          data-cy="transaction-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
    </div>
  );
}

export default TransactionFilters;