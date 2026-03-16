import { useState } from "react";
import { MessageCircle } from "lucide-react";
import Header from "./components/Header";
import ExpensesChart from "./components/ExpensesChart";
import StocksPanel from "./components/StocksPanel";
import Chatbot from "./components/Chatbot";
import "./App.css";

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="app">
      <Header />

      <main className="dashboard">
        {/* Row 1: Expenses + Greeting Card */}
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

        {/* Row 2: Stocks + Investment Info */}
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

      {!chatOpen && (
        <button className="fab" onClick={() => setChatOpen(true)}>
          <MessageCircle size={28} />
        </button>
      )}

      <Chatbot open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
