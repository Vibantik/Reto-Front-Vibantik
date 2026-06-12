import banorteLogo from "../assets/banorte-logo.png";

const getInitials = (user) => {
  if (!user) return "?";
  return `${user.nombre?.[0] ?? ""}${user.apellido?.[0] ?? ""}`.toUpperCase();
};

export default function Header({ activeTab, onTabChange, toggleSidebar, activeUser }) {
  const tabs = ["Inicio", "Presupuestos", "Inversiones", "Metas", "Reportes", "Movimientos", "Transferencias"];

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
          <button
            className="header-avatar"
            onClick={toggleSidebar}
            aria-label="perfil"
            data-testid="avatar"
            title={activeUser ? `${activeUser.nombre} ${activeUser.apellido} - Configuración` : "Configuración"}
          >
            {getInitials(activeUser)}
          </button>
        </div>
      </div>
    </header>
  );
}
