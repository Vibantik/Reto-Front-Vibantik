// src/services/transactionsService.js
const API_URL = import.meta.env.VITE_API_URL;

export const fetchTransactions = async (params = {}) => {
  const {
    page = 1,
    limit = 15,
    type,
    category,
    search,
    startDate,
    endDate,
  } = params;

  const query = new URLSearchParams();
  query.set("page", page);
  query.set("limit", limit);
  if (type && type !== "all") query.set("type", type);
  if (category && category !== "all") query.set("category", category);
  if (search) query.set("search", search);
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  const response = await fetch(`${API_URL}/api/transactions?${query}`);
  if (!response.ok) throw new Error("Error al obtener transacciones");
  return response.json();
};