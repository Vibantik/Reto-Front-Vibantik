import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import Header from "./components/Header";
import ExpensesChart from "./components/ExpensesChart";
import StocksPanel from "./components/StocksPanel";
import Chatbot from "./components/Chatbot";
import TransactionsPanel from "./components/TransactionsPanel";
import InversionesPanel from "./components/InversionesPanel";
import PresupuestosPanel from "./components/Presupuestos/PresupuestosPanel";
import PresupuestoInfoCard from "./components/PresupuestoInfoCard";
import MetasPanel from "./components/MetasPanel";
import Sidebar from "./components/Sidebar";
import SugerenciasCard from "./components/SugerenciasCard";
import { fetchInversiones } from "./services/inversionesService";
import ReportesPanel from "./components/ReportesPanel";

import "./App.css";
 
function InversionInfoCard() {
  const [resumen, setResumen] = useState(null);
 
  useEffect(() => {
    fetchInversiones()
      .then((data) => {
        const hoy = new Date();
        const activas = data.filter((i) => new Date(i.fecha_fin) > hoy);
        const total = activas.reduce((s, i) => s + parseFloat(i.valor || 0), 0);
        const en30dias = new Date();
        en30dias.setDate(en30dias.getDate() + 30);
        const porVencer = activas.filter((i) => new Date(i.fecha_fin) <= en30dias).length;
        setResumen({ total, numActivas: activas.length, porVencer });
      })
      .catch(() => setResumen(null));
  }, []);
 
  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
 
  return (
    <div className="card info-card">
      {resumen ? (
        <>
          <p className="info-text-lg">
            Tienes <strong>{resumen.numActivas} inversiones activas</strong> con un valor total de{" "}
            <strong>{fmt(resumen.total)}</strong>.
            {resumen.porVencer > 0 && (
              <> <span style={{ color: "#EC0029" }}>{resumen.porVencer} vencen en los próximos 30 días.</span></>
            )}
          </p>
          <button className="btn-action">Ver mis inversiones &gt;&gt;</button>
        </>
      ) : (
        <>
          <p className="info-text-lg">
            Has recibido <strong>$5,008.32</strong> de tus inversiones en los últimos 15 días
          </p>
          <button className="btn-action">Reinvertir &gt;&gt;</button>
        </>
      )}
    </div>
  );
}
 
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
              <SugerenciasCard />
            </div>
            <div className="dashboard-row">
              <StocksPanel />
              <InversionInfoCard />
            </div>
            <div className="dashboard-row">
              <PresupuestoInfoCard onViewDetails={() => setActiveTab("Presupuestos")} />
            </div>
          </main>
        );
      case "Movimientos":
        return (
          <main className="dashboard">
            <div className="dashboard-row transactions-row">
              <TransactionsPanel showChart={true} />
            </div>
          </main>
        );
      case "Inversiones":
        return (
          <main className="dashboard">
            <div className="dashboard-row transactions-row">
              <InversionesPanel />
            </div>
          </main>
        );
      case "Presupuestos":
        return (
          <main className="dashboard">
            <div className="dashboard-row transactions-row">
              <PresupuestosPanel />
            </div>
          </main>
        );
      case "Metas":
        return (
          <main className="dashboard">
            <div className="dashboard-row transactions-row">
              <MetasPanel />
            </div>
          </main>
        );
        case "Reportes":
  return (
    <main className="dashboard">
      <div className="dashboard-row transactions-row">
        <ReportesPanel />
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
 
  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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