import { useEffect, useMemo, useState } from "react";
import transactionsData from "../data/transactions";
import TransactionSearch from "./TransactionSearch";
import TransactionFilters from "./TransactionFilters";
import TransactionList from "./TransactionList";
import Pagination from "./Pagination";
import CashflowChart from "./CashflowChart";
import "./css/transactions.css";

const ITEMS_PER_PAGE = 15;

function TransactionsPanel({ showChart = true }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactionsData.filter((transaction) => {
      if (selectedType !== "all" && transaction.type !== selectedType) {
        return false;
      }

      if (
        selectedCategory !== "all" &&
        transaction.category !== selectedCategory
      ) {
        return false;
      }

      if (searchTerm) {
        const searchText = searchTerm.toLowerCase();
        const descriptionMatch = transaction.description
          .toLowerCase()
          .includes(searchText);
        const amountMatch = transaction.amount
          .toString()
          .includes(searchText);
        if (!descriptionMatch && !amountMatch) {
          return false;
        }
      }

      if (startDate) {
        const transactionDate = new Date(transaction.date);
        const start = new Date(startDate);
        if (transactionDate < start) {
          return false;
        }
      }

      if (endDate) {
        const transactionDate = new Date(transaction.date);
        const end = new Date(endDate);
        if (transactionDate > end) {
          return false;
        }
      }

      return true;
    });
  }, [searchTerm, selectedType, selectedCategory, startDate, endDate]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const monthlyTransactions = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return transactionsData.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, []);

  const pagination = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

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

      {showChart && <CashflowChart transactions={monthlyTransactions} />}

      <TransactionList transactions={currentTransactions} />

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}

export default TransactionsPanel;