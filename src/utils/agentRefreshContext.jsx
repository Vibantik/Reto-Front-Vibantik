import { createContext, useContext, useCallback, useState } from "react";

/**
 * Mapeo de tool → módulo a refrescar.
 * El módulo coincide con los valores de activeTab en App.jsx.
 */
const TOOL_TO_MODULE = {
  crear_meta: "Metas",
  actualizar_meta: "Metas",
  eliminar_meta: "Metas",
  agregar_ahorro: "Metas",
  crear_presupuesto: "Presupuestos",
  actualizar_presupuesto: "Presupuestos",
  eliminar_presupuesto: "Presupuestos",
  crear_inversion: "Inversiones",
};

const AgentRefreshContext = createContext(null);

/**
 * Provee una función `triggerRefresh(tool)` y un objeto `refreshTick`
 * que los módulos pueden observar para saber cuándo refrescarse.
 */
export function AgentRefreshProvider({ children }) {
  // Cada módulo tiene un contador. Cuando sube, ese módulo debe refrescarse.
  const [refreshTick, setRefreshTick] = useState({
    Metas: 0,
    Presupuestos: 0,
    Inversiones: 0,
    Movimientos: 0,
  });

  const triggerRefresh = useCallback((tool) => {
    const module = TOOL_TO_MODULE[tool];
    if (!module) return;
    setRefreshTick((prev) => ({ ...prev, [module]: prev[module] + 1 }));
  }, []);

  return (
    <AgentRefreshContext.Provider value={{ refreshTick, triggerRefresh }}>
      {children}
    </AgentRefreshContext.Provider>
  );
}

export function useAgentRefresh() {
  const ctx = useContext(AgentRefreshContext);
  if (!ctx) throw new Error("useAgentRefresh must be used inside AgentRefreshProvider");
  return ctx;
}
