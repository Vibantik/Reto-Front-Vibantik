const API_URL = import.meta.env.VITE_API_URL;

const normalizeMeta = (meta, index) => {
  const id = meta.id_meta ?? meta.id ?? index + 1;
  const monto = Number(meta.monto_meta ?? meta.monto ?? 0);
  const fechaInicio = meta.fecha_inicio ?? meta.start_date ?? null;
  const fechaFin = meta.fecha_fin ?? meta.end_date ?? null;
  const plazoDias = Number(meta.plazo_dias ?? meta.plazo ?? 0);
  const progreso = Number(meta.progreso ?? 0);
  const nombreMeta = meta.nombreMeta ?? "";

  return {
    id,
    nombreMeta,
    monto,
    fechaInicio,
    fechaFin,
    plazoDias,
    progreso: Number.isFinite(progreso) ? Math.min(Math.max(progreso, 0), 1) : 0,
  };
};

const getBackendErrorMessage = async (response) => {
  try {
    const errorPayload = await response.json();
    return errorPayload?.message || errorPayload?.error || "";
  } catch {
    return "";
  }
};

export const fetchMetas = async (uuid) => {
  const query = new URLSearchParams();
  if (uuid) query.set("uuid_de_usuario", uuid);

  const response = await fetch(`${API_URL}/api/metas?${query}`);
  if (!response.ok) throw new Error("Error al obtener metas");

  const payload = await response.json();
  const rawList = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(rawList)) throw new Error("Formato de metas invalido");

  return rawList.map(normalizeMeta);
};

export const createMeta = async ({
  uuid,
  nombreMeta,
  monto,
  fechaInicio,
  fechaFin,
  plazoDias,
}) => {
  const response = await fetch(`${API_URL}/api/metas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uuid_de_usuario: uuid,
      nombreMeta,
      monto_meta: monto,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      plazo_dias: plazoDias,
    }),
  });

  if (!response.ok) {
    const backendMessage = await getBackendErrorMessage(response);
    const details = backendMessage ? ` (${backendMessage})` : "";
    throw new Error(`Error al crear meta: ${response.status}${details}`);
  }

  const payload = await response.json();
  return normalizeMeta(payload);
};

export const updateMeta = async ({
  idMeta,
  uuid,
  nombreMeta,
  monto,
  fechaInicio,
  fechaFin,
  plazoDias,
}) => {
  const query = new URLSearchParams({
    uuid_de_usuario: String(uuid ?? ""),
    nombreMeta: String(nombreMeta ?? ""),
    monto_meta: String(monto ?? ""),
    fecha_inicio: String(fechaInicio ?? ""),
    fecha_fin: String(fechaFin ?? ""),
    plazo_dias: String(plazoDias ?? ""),
  });

  const response = await fetch(`${API_URL}/api/metas/${idMeta}?${query}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uuid_de_usuario: uuid,
      nombreMeta,
      monto_meta: monto,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      plazo_dias: plazoDias,
    }),
  });

  if (!response.ok) {
    const backendMessage = await getBackendErrorMessage(response);
    const details = backendMessage ? ` (${backendMessage})` : "";
    throw new Error(`Error al actualizar meta: ${response.status}${details}`);
  }

  const payload = await response.json();
  return normalizeMeta(payload);
};

export const deleteMeta = async ({ idMeta, uuid }) => {
  const query = new URLSearchParams({
    uuid_de_usuario: String(uuid ?? ""),
  });

  const response = await fetch(`${API_URL}/api/metas/${idMeta}?${query}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uuid_de_usuario: uuid,
    }),
  });

  if (!response.ok) {
    const backendMessage = await getBackendErrorMessage(response);
    const details = backendMessage ? ` (${backendMessage})` : "";
    throw new Error(`Error al eliminar meta: ${response.status}${details}`);
  }

  return true;
};