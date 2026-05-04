import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { fetchUserSettings, saveUserSettings } from '../services/configService';
import { getUserUuid } from '../utils/userUuid';
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

export default function Sidebar({ isOpen }) {
    const userUuid = getUserUuid();

    const [toggles, setToggles] = useState(() => {
        const initialState = {};
        settingsData.forEach((item) => {
            initialState[item.id] = item.defaultState;
        });
        return initialState;
    });

    useEffect(() => {
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
                <button
                    className="btn-save btn-action"
                    onClick={handleSave}
                    style={{ marginLeft: '20px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <Save /> Guardar
                </button>
            </div>
        </>
    );
}
