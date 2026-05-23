// src/services/inversionesService.js
const API_URL = "http://localhost:3000";

export const fetchInversiones = async (uuid) => {
  const url = `${API_URL}/api/inversiones/u/${uuid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al obtener inversiones");
  return response.json();
};