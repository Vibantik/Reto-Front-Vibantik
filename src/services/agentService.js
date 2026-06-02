const API_URL = import.meta.env.VITE_API_URL;

export async function sendAgentMessage(messages, uuid_de_usuario, signal) {
  const res = await fetch(`${API_URL}/api/ia/agentic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, uuid_de_usuario }),
    signal,
  });

  if (!res.ok) throw new Error("Error al conectar con el agente");

  const contentType = res.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();
    return { jsonResponse: data };
  }

  return { reader: res.body.getReader(), decoder: new TextDecoder() };
}

export async function executeAgentAction(
  confirmation_token,
  uuid_de_usuario,
  confirmed,
  paramsOverrides = {}
) {
  const res = await fetch(`${API_URL}/api/agent/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      confirmation_token,
      uuid_de_usuario,
      confirmed,
      params: paramsOverrides,
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Error al ejecutar la accion");
  }
  return payload;
}
