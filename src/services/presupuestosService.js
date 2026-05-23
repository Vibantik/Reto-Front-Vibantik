// src/services/presupuestosService.js
import { getUserUuid } from "../utils/userUuid";

const API_URL = import.meta.env.VITE_API_URL;

//! ── Categorias ────────────────────────────────────────────────────────── 

export const fetchCategorias = async () => {
  const response = await fetch(`${API_URL}/api/categorias`);
  if (!response.ok) throw new Error("Error al obtener categorías");
  return response.json();
};

export const createCategoria = async ({ nombre_categ, icon, color }) => {
  const response = await fetch(`${API_URL}/api/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre_categ, icon, color }),
  });
  if (!response.ok) throw new Error("Error al crear categoría");
  return response.json();
};

export const updateCategoria = async (id, data) => {
  const response = await fetch(`${API_URL}/api/categorias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar categoría");
  return response.json();
};

export const deleteCategoria = async (id) => {
  const response = await fetch(`${API_URL}/api/categorias/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar categoría");
  return response.json();
};

//! ── Presupuestos ────────────────────────────────────────────────────────── 

export const fetchPresupuestos = async (uuid = getUserUuid(), { activos = false } = {}) => {
  const query = new URLSearchParams();
  query.set("uuid", uuid);
  if (activos) query.set("activos", "true");

  const response = await fetch(`${API_URL}/api/presupuestos?${query}`);
  if (!response.ok) throw new Error("Error al obtener presupuestos");
  return response.json();
};

export const fetchPresupuesto = async (id) => {
  const response = await fetch(`${API_URL}/api/presupuestos/${id}`);
  if (!response.ok) throw new Error("Error al obtener presupuesto");
  return response.json();
};

export const fetchLastPresupuesto = async (uuid = getUserUuid()) => {
  const query = new URLSearchParams({ uuid });
  const response = await fetch(`${API_URL}/api/presupuestos/last-month?${query}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Error al obtener el ultimo presupuesto");
  }

  return response.json();
};

export const createPresupuesto = async (data) => {
  const payload = {
    ...data,
    uuid_de_usuario: data?.uuid_de_usuario || getUserUuid(),
  };

  const response = await fetch(`${API_URL}/api/presupuestos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const erroData = await response.json().catch(()=>({}));
    console.error("backend error: ", erroData);
    throw new Error(erroData.message || "error al crear presupuesto");
  }
  return response.json();
};

export const updatePresupuesto = async (id, data) => {
  const response = await fetch(`${API_URL}/api/presupuestos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al crear presupuesto");
  }
  return response.json();
};

export const deletePresupuesto = async (id) => {
  const response = await fetch(`${API_URL}/api/presupuestos/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar presupuesto");
  return response.json();
};
