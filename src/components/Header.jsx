import banorteLogo from "../assets/banorte-logo.png";

export default function Header({ activeTab, onTabChange, toggleSidebar }) {
  const tabs = ["Inicio", "Cuentas", "Inversiones", "Metas", "Transferencias", "Movimientos"];

  return (
    <header className="header">
      <div className="header-bar">
        <div className="header-logo">
          <img src={banorteLogo} alt="Banorte" className="header-logo-img" />
        </div>
        <nav className="header-nav">
          {tabs.map((tab) => (
            <span
              key={tab}
              className={activeTab === tab ? "nav-active" : ""}
              onClick={() => onTabChange(tab)}
              style={{ cursor: "pointer" }}
            >
              {tab}
            </span>
          ))}
        </nav>
        <div className="header-user">
          <div className="header-avatar" onClick={toggleSidebar} style={{ cursor: 'pointer' }} title="Configuración">R</div>
        </div>
      </div>
    </header>
  );
}
