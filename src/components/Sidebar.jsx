import { useState, useEffect } from 'react';
import { Save, LogOut } from 'lucide-react';
import { fetchUserSettings, saveUserSettings } from '../services/configService';
import './css/Sidebar.css';
import '../App.css';

const MOCK_CONFIG_DATA = [
    { id: 1, label: 'Categorización Automática', defaultState: true },
    { id: 2, label: 'Módulo Presupuestos', defaultState: true },
    { id: 3, label: 'Módulo Ahorros', defaultState: true },
    { id: 4, label: 'Mostrar Ahorros Terminados', defaultState: true },
    { id: 5, label: 'Reportes Inteligentes', defaultState: true },
    { id: 6, label: 'Asesor IA', defaultState: true },
    { id: 7, label: 'Alertas de Asesor IA', defaultState: true },
];

const settingsData = MOCK_CONFIG_DATA;

export default function Sidebar({ isOpen, uuid, onSignOut }) {
    const userUuid = uuid;

    const [toggles, setToggles] = useState(() => {
        const initialState = {};
        settingsData.forEach((item) => {
            initialState[item.id] = item.defaultState;
        });
        return initialState;
    });

    useEffect(() => {
        if (!userUuid) return;
        const loadSettings = async () => {
            const settingsFromServer = await fetchUserSettings(userUuid);

            if (settingsFromServer) {
                setToggles(settingsFromServer);
            }
        };

        loadSettings();
    }, [userUuid]);

    const handleToggle = (key) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        const success = await saveUserSettings(userUuid, toggles);

        if (!success) {
            alert('Hubo un error al guardar.');
        }
    };

    return (
        <>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Configuración</h3>
                </div>

                <ul className="sidebar-list">
                    {settingsData.map((item) => (
                        <li
                            key={item.id}
                            className="sidebar-item"
                            onClick={() => handleToggle(item.id)}
                        >
                            <span className="sidebar-label">{item.label}</span>
                            <div className={`toggle-switch ${toggles[item.id] ? 'active' : ''}`}>
                                <div className="toggle-slider"></div>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="sidebar-actions" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <button
                        className="btn-save btn-action"
                        onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}
                    >
                        <Save size={16} /> Guardar
                    </button>
                    <button
                        className="btn-signout btn-action"
                        onClick={onSignOut}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', background: '#7B868C' }}
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </div>
        </>
    );
}
