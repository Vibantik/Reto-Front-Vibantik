// src/components/TransactionsPanel.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchTransactions } from "../services/transactionsService";
import { useAgentRefresh } from "../utils/agentRefreshContext";
import TransactionSearch from "./TransactionSearch";
import TransactionFilters from "./TransactionFilters";
import TransactionList from "./TransactionList";
import Pagination from "./Pagination";
import CashflowChart from "./CashflowChart";
import "./css/transactions.css";

const SSE_URL = import.meta.env.VITE_API_URL + "/api/transactions/stream";

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const toIso = (date) => date.toISOString().slice(0, 10);

  return {
    startDate: toIso(firstDay),
    endDate: toIso(lastDay),
  };
};

function TransactionsPanel({ showChart = true }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [chartTransactions, setChartTransactions] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  const { refreshTick } = useAgentRefresh();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, startDate, endDate]);

  const loadTransactionsPage = useCallback(async () => {
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

      setTransactions(result.data || []);
      setPagination(result.pagination);
    } catch (err) {
      setError("No se pudieron cargar las transacciones.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    selectedType,
    selectedCategory,
    startDate,
    endDate,
  ]);

  const loadChartTransactions = useCallback(async () => {
    if (!showChart) return;

    setChartLoading(true);

    try {
      const monthRange = getCurrentMonthRange();

      const result = await fetchTransactions({
        page: 1,
        limit: 1000,
        type: selectedType,
        category: selectedCategory,
        search: searchTerm,
        startDate: startDate || monthRange.startDate,
        endDate: endDate || monthRange.endDate,
      });

      setChartTransactions(result.data || []);
    } catch (err) {
      console.error("No se pudieron cargar las transacciones de la gráfica:", err);
      setChartTransactions([]);
    } finally {
      setChartLoading(false);
    }
  }, [
    showChart,
    searchTerm,
    selectedType,
    selectedCategory,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    loadTransactionsPage();
  }, [loadTransactionsPage, refreshTick.Movimientos]);

  useEffect(() => {
    loadChartTransactions();
  }, [loadChartTransactions, refreshTick.Movimientos]);

  useEffect(() => {
    const eventSource = new EventSource(SSE_URL);

    eventSource.addEventListener("new-transaction", (event) => {
      try {
        const newTransaction = JSON.parse(event.data);

        setTransactions((prev) => {
          if (currentPage !== 1) return prev;

          return [newTransaction, ...prev].slice(0, 15);
        });

        setPagination((prev) => ({
          ...prev,
          totalItems: prev.totalItems + 1,
          totalPages: Math.max(
            1,
            Math.ceil((prev.totalItems + 1) / prev.limit)
          ),
        }));

        const monthRange = getCurrentMonthRange();
        const txDate = newTransaction?.date?.slice(0, 10);

        const matchesCurrentMonth =
          txDate &&
          txDate >= monthRange.startDate &&
          txDate <= monthRange.endDate;

        if (matchesCurrentMonth) {
          setChartTransactions((prev) => [newTransaction, ...prev]);
        }
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
  }, [currentPage]);

  const chartLabel = useMemo(() => {
    if (startDate || endDate) {
      return "rango seleccionado";
    }

    return "mes actual";
  }, [startDate, endDate]);

  return (
    <section className="transactions-screen">
      <header className="transactions-header">
        <div>
          <p className="transactions-kicker">Banorte</p>
          <h2>Movimientos</h2>
        </div>

        <span className="transactions-counter">
          {pagination.totalItems} resultados
        </span>
      </header>

      <div className="transactions-toolbar">
        <TransactionSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <TransactionFilters
          selectedType={selectedType}
          selectedCategory={selectedCategory}
          startDate={startDate}
          endDate={endDate}
          onTypeChange={setSelectedType}
          onCategoryChange={setSelectedCategory}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {showChart && (
        <>
          {chartLoading ? (
            <div className="empty-state">
              Cargando gráfica del {chartLabel}...
            </div>
          ) : (
            <CashflowChart transactions={chartTransactions} />
          )}
        </>
      )}

      {loading && (
        <div className="empty-state">
          Cargando transacciones...
        </div>
      )}

      {error && (
        <div className="empty-state">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <TransactionList transactions={transactions} />

          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </section>
  );
}

export default TransactionsPanel;