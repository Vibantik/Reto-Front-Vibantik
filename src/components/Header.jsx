import banorteLogo from "../assets/banorte-logo.png";

export default function Header() {
  return (
    <header className="header">
      <div className="header-bar">
        <div className="header-logo">
          <img src={banorteLogo} alt="Banorte" className="header-logo-img" />
        </div>
        <nav className="header-nav">
          <span className="nav-active">Inicio</span>
          <span>Cuentas</span>
          <span>Inversiones</span>
          <span>Transferencias</span>
        </nav>
        <div className="header-user">
          <div className="header-avatar">R</div>
        </div>
      </div>
    </header>
  );
}
