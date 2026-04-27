const API_URL = "http://localhost:3000";

const normalizeMeta = (meta, index) => {
  const id = meta.id_meta ?? meta.id ?? index + 1;
  const monto = Number(meta.monto_meta ?? meta.monto ?? 0);
  const fechaInicio = meta.fecha_inicio ?? meta.start_date ?? null;
  const fechaFin = meta.fecha_fin ?? meta.end_date ?? null;
  const plazoDias = Number(meta.plazo_dias ?? meta.plazo ?? 0);
  const progreso = Number(meta.progreso ?? 0);
  const titulo = meta.titulo ?? meta.nombre ?? `Meta ${id}`;

  return {
    id,
    titulo,
    monto,
    fechaInicio,
    fechaFin,
    plazoDias,
    progreso: Number.isFinite(progreso) ? Math.min(Math.max(progreso, 0), 1) : 0,
  };
};

export const fetchMetas = async (uuid = "dbf9f839-b57e-415f-8b5b-9213524ed827") => {
  const query = new URLSearchParams();
  if (uuid) query.set("uuid_de_usuario", uuid);

  const response = await fetch(`${API_URL}/api/metas?${query}`);
  if (!response.ok) throw new Error("Error al obtener metas");

  const payload = await response.json();
  const rawList = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(rawList)) throw new Error("Formato de metas invalido");

  return rawList.map(normalizeMeta);
};