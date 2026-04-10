import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import Pagination from "./Pagination";
import TransactionSearch from "./TransactionSearch";
import TransactionFilters from "./TransactionFilters";
import TransactionList from "./TransactionList";
import transactionsData from "../data/transactions";
import "./css/transactions.css";


function TransactionsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 15;

  const filteredTransactions = useMemo(() => {
    return transactionsData.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm);

      const matchesType =
        selectedType === "all" || tx.type === selectedType;

      const matchesCategory =
        selectedCategory === "all" || tx.category === selectedCategory;

      const matchesStartDate =
        !startDate || new Date(tx.date) >= new Date(startDate);

      const matchesEndDate =
        !endDate || new Date(tx.date) <= new Date(endDate);

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [searchTerm, selectedType, selectedCategory, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, startDate, endDate]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  return (
    <section className="transactions-screen">
      <div className="transactions-header">
        <div>
          <p className="transactions-kicker">Banorte</p>
          <h2>Movimientos</h2>
        </div>
        <span className="transactions-counter">
          {filteredTransactions.length} resultados
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

      <TransactionList transactions={paginatedTransactions} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}

export default TransactionsPanel;