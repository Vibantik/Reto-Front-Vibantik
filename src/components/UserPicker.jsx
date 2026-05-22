import { useState, useEffect } from "react";
import banorteLogo from "../assets/banorte-logo.png";
import "./css/UserPicker.css";

const API_URL = import.meta.env.VITE_API_URL;

// username initials
const getInitials = (nombre = "", apellido = "") =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

const shortUuid = (uuid = "") =>
  uuid.length > 12 ? `${uuid.slice(0, 8)}…${uuid.slice(-4)}` : uuid;

export default function UserPicker({ onSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="picker-root">
      <div className="picker-card">
        <img src={banorteLogo} alt="Banorte" className="picker-logo" />

        <p className="picker-eyebrow">Uso Interno</p>
        <h1 className="picker-title">Selecciona un usuario</h1>
        <p className="picker-subtitle">
          Elige la cuenta con la que deseas explorar el dashboard.
        </p>

        {loading && (
          <div className="picker-status">
            <div className="picker-spinner" />
            Cargando usuarios…
          </div>
        )}

        {error && (
          <div>
            <p className="picker-error-msg">{error}</p>
            <button className="picker-retry-btn" onClick={fetchUsers}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <ul className="picker-list" role="listbox" aria-label="Usuarios disponibles">
            {users.map((user) => (
              <li key={user.uuid_de_usuario}>
                <button
                  id={`user-btn-${user.uuid_de_usuario}`}
                  className="picker-user-btn"
                  role="option"
                  aria-selected="false"
                  onClick={() => onSelect(user.uuid_de_usuario, user)}
                >
                  <div className="picker-avatar" aria-hidden="true">
                    {getInitials(user.nombre, user.apellido)}
                  </div>
                  <div className="picker-user-info">
                    <p className="picker-user-name">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="picker-user-uuid" title={user.uuid_de_usuario}>
                      {shortUuid(user.uuid_de_usuario)}
                    </p>
                  </div>
                  <span className="picker-arrow" aria-hidden="true">→</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="picker-footer">Vibantik · Prototipo interno Banorte</p>
      </div>
    </div>
  );
}
