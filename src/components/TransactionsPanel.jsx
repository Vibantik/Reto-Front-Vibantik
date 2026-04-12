import { useEffect, useState } from "react";
import TransactionSearch from "./TransactionSearch";
import TransactionFilters from "./TransactionFilters";
import TransactionList from "./TransactionList";
import Pagination from "./Pagination";
import "./css/transactions.css";

function TransactionsPanel() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, startDate, endDate]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: 15,
        });

        if (selectedType !== "all") params.append("type", selectedType);
        if (selectedCategory !== "all") params.append("category", selectedCategory);
        if (searchTerm) params.append("search", searchTerm);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const response = await fetch(
          `http://localhost:3000/api/transactions?${params.toString()}`
        );

        const result = await response.json();

        setTransactions(result.data || []);
        setPagination(result.pagination || {});
      } catch (error) {
        console.error("Error al obtener transacciones:", error);
      }
    };

    fetchTransactions();
  }, [currentPage, searchTerm, selectedType, selectedCategory, startDate, endDate]);

  return (
    <section className="transactions-screen">
      <div className="transactions-header">
        <div>
          <p className="transactions-kicker">Banorte</p>
          <h2>Movimientos</h2>
        </div>
        <span className="transactions-counter">
          {pagination.totalItems || 0} resultados
        </span>
      </div>

      <div className="transactions-toolbar">
        <TransactionSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <TransactionFilters
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      </div>

      <TransactionList transactions={transactions} />

      <Pagination
        currentPage={pagination.page || 1}
        totalPages={pagination.totalPages || 1}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}

export default TransactionsPanel;