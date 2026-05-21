import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import Header from "./components/Header";
import ExpensesChart from "./components/ExpensesChart";
import StocksPanel from "./components/StocksPanel";
import Chatbot from "./components/Chatbot";
import TransactionsPanel from "./components/TransactionsPanel";
import InversionesPanel from "./components/InversionesPanel";
import PresupuestosPanel from "./components/Presupuestos/PresupuestosPanel";
import MetasPanel from "./components/MetasPanel";
import Sidebar from "./components/Sidebar";
import SugerenciasCard from "./components/SugerenciasCard";
import { fetchInversiones } from "./services/inversionesService";
import ReportesPanel from "./components/ReportesPanel";
import UserPicker from "./components/UserPicker";
import { getSession, setSession, clearSession, getActiveUser } from "./utils/session";

import "./App.css";

function InversionInfoCard({ uuid }) {
  const [resumen, setResumen] = useState(null);
 
  useEffect(() => {
    if (!uuid) return;
    fetchInversiones(uuid)
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
  }, [uuid]);
 
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
  const [uuid, setUuid]         = useState(() => getSession());
  const [activeUser, setActiveUser] = useState(() => getActiveUser());

  const [chatOpen, setChatOpen]     = useState(false);
  const [activeTab, setActiveTab]   = useState("Inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectUser = (selectedUuid, userObj) => {
    setSession(selectedUuid, userObj);
    setUuid(selectedUuid);
    setActiveUser(userObj);
  };

  const handleSignOut = () => {
    clearSession();
    setUuid(null);
    setActiveUser(null);
    setChatOpen(false);
    setSidebarOpen(false);
    setActiveTab("Inicio");
  };

  if (!uuid) {
    return <UserPicker onSelect={handleSelectUser} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "Inicio":
        return (
          <main className="dashboard">
            <div className="dashboard-row">
              <ExpensesChart uuid={uuid} />
              <SugerenciasCard uuid={uuid} />
            </div>
            <div className="dashboard-row">
              <StocksPanel uuid={uuid} />
              <InversionInfoCard uuid={uuid} />
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
              <InversionesPanel uuid={uuid} />
            </div>
          </main>
        );
      case "Presupuestos":
        return (
          <main className="dashboard">
            <div className="dashboard-row transactions-row">
              <PresupuestosPanel uuid={uuid} />
            </div>
          </main>
        );
      case "Metas":
        return (
          <main className="dashboard">
            <div className="dashboard-row transactions-row">
              <MetasPanel uuid={uuid} />
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
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeUser={activeUser}
      />
      <Sidebar isOpen={sidebarOpen} uuid={uuid} onSignOut={handleSignOut} />
      {renderContent()}
      {!chatOpen && (
        <button className="fab" onClick={() => setChatOpen(true)}>
          <MessageCircle size={28} />
        </button>
      )}
      <Chatbot open={chatOpen} onClose={() => setChatOpen(false)} uuid={uuid} />
    </div>
  );
}