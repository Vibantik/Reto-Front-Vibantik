// src/components/TransactionsPanel.jsx
import { useEffect, useState, useMemo } from "react";
import { fetchTransactions } from "../services/transactionsService";
import TransactionSearch from "./TransactionSearch";
import TransactionFilters from "./TransactionFilters";
import TransactionList from "./TransactionList";
import Pagination from "./Pagination";
import CashflowChart from "./CashflowChart";
import "./css/transactions.css";

const SSE_URL = import.meta.env.VITE_API_URL + "/api/transactions/stream";

function TransactionsPanel({ showChart = true }) {
  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedType, setSelectedType]       = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate]             = useState("");
  const [endDate, setEndDate]                 = useState("");
  const [currentPage, setCurrentPage]         = useState(1);

  const [transactions, setTransactions]   = useState([]);
  const [pagination, setPagination]       = useState({
    page: 1, limit: 15, totalItems: 0, totalPages: 1,
    hasNextPage: false, hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, startDate, endDate]);

  // Fetch al backend cada vez que cambia página o filtros
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTransactions({
          page: currentPage,
          limit: 15,
          type: selectedType,
          category: selectedCategory,
          search: searchTerm,
          startDate,
          endDate,
        });
        setTransactions(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError("No se pudieron cargar las transacciones.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage, searchTerm, selectedType, selectedCategory, startDate, endDate]);

  useEffect(() => {
    const eventSource = new EventSource(SSE_URL);

    eventSource.addEventListener("new-transaction", (event) => {
      try {
        const newTransaction = JSON.parse(event.data);

        
        setTransactions((prev) => [newTransaction, ...prev]);

        setPagination((prev) => ({
          ...prev,
          totalItems: prev.totalItems + 1,
        }));
      } catch (err) {
        console.error(err);
      }
    });

    eventSource.onerror = (err) => {
      console.error(err);
    };

    return () => {
      eventSource.close();
    };
  }, [currentPage, searchTerm, selectedType, selectedCategory, startDate, endDate]);

  // Para el chart sólo usamos las transacciones del mes ya cargadas  
  const monthlyTransactions = useMemo(() => {
  const now = new Date();
  return transactions.filter((t) => {
    // Tomar solo YYYY-MM-DD ignorando timezone
    const dateStr = t.date.slice(0, 10);
    const [year, month] = dateStr.split("-").map(Number);
    return year === now.getFullYear() && month === now.getMonth() + 1;
  });
}, [transactions]);

  return (
    <section className="transactions-screen">
      <div className="transactions-header">
        <div>
          <p className="transactions-kicker">Banorte</p>
          <h2>Movimientos</h2>
        </div>
        <span className="transactions-counter">
          {pagination.totalItems} resultados
        </span>
      </div>

      <div className="transactions-toolbar">
        <TransactionSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <TransactionFilters
          selectedType={selectedType}       setSelectedType={setSelectedType}
          selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          startDate={startDate}             setStartDate={setStartDate}
          endDate={endDate}                 setEndDate={setEndDate}
        />
      </div>

      {showChart && <CashflowChart transactions={monthlyTransactions} />}

      {loading && <p style={{ padding: "1rem" }}>Cargando transacciones...</p>}
      {error   && <p style={{ padding: "1rem", color: "red" }}>{error}</p>}
      {!loading && !error && <TransactionList transactions={transactions} />}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}

export default TransactionsPanel;