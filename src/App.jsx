import { useState } from "react";
import { MessageCircle } from "lucide-react";
import Header from "./components/Header";
import ExpensesChart from "./components/ExpensesChart";
import StocksPanel from "./components/StocksPanel";
import Chatbot from "./components/Chatbot";
import TransactionsPanel from "./components/TransactionsPanel";
import "./App.css";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "Inicio":
        return (
          <main className="dashboard">
            <div className="dashboard-row">
              <ExpensesChart />
              <div className="card info-card">
                <h2 className="greeting">¡Hola Ricardo!</h2>
                <p className="info-text">
                  Tus gastos recurrentes han aumentado <strong>$214.67</strong>
                </p>
                <button className="btn-action">Revisar sugerencias &gt;&gt;</button>
              </div>
            </div>

            <div className="dashboard-row">
              <StocksPanel />
              <div className="card info-card">
                <p className="info-text-lg">
                  Has recibido <strong>$5,008.32</strong> de tus inversiones en los
                  últimos 15 días
                </p>
                <button className="btn-action">Reinvertir &gt;&gt;</button>
              </div>
            </div>
          </main>
        );
      case "Movimientos":
        return (
          <main className="dashboard">
            <div className="dashboard-row transactions-row">
              <TransactionsPanel />
            </div>
          </main>
        );
      default:
        return (
          <main className="dashboard">
            <div className="card info-card">
              <h2>Próximamente</h2>
              <p>Esta sección estará disponible próximamente.</p>
            </div>
          </main>
        );
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} />

      {renderContent()}

      {!chatOpen && (
        <button className="fab" onClick={() => setChatOpen(true)}>
          <MessageCircle size={28} />
        </button>
      )}

      <Chatbot open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}