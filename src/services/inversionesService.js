// src/services/inversionesService.js
const API_URL = import.meta.env.VITE_API_URL;

export const fetchInversiones = async () => {
  const response = await fetch(`${API_URL}/api/inversiones`);
  if (!response.ok) throw new Error("Error al obtener inversiones");
  return response.json();
};