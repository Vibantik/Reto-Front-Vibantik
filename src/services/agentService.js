const API_URL = import.meta.env.VITE_API_URL;

/**
 * Envía un mensaje al agente y devuelve:
 *   - { jsonResponse } si el Content-Type es application/json   → acción agentic
 *   - { reader, decoder }  si el Content-Type es text/plain      → stream NDJSON
 *
 * @param {Array}  messages         - historial de mensajes [{ role, content }]
 * @param {string} uuid_de_usuario  - UUID del usuario activo
 * @param {AbortSignal} signal      - señal de AbortController
 */
export async function sendAgentMessage(messages, uuid_de_usuario, signal) {
  const res = await fetch(`${API_URL}/api/agent/chat`, {
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

  // text/plain → stream NDJSON
  return { reader: res.body.getReader(), decoder: new TextDecoder() };
}

/**
 * Confirma o cancela una propuesta de acción.
 *
 * @param {string}  confirmation_token
 * @param {string}  uuid_de_usuario
 * @param {boolean} confirmed
 */
export async function executeAgentAction(confirmation_token, uuid_de_usuario, confirmed, paramsOverrides = {}) {
  const res = await fetch(`${API_URL}/api/agent/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation_token, uuid_de_usuario, confirmed, params: paramsOverrides }),
  });

  if (!res.ok) throw new Error("Error al ejecutar la acción");
  return res.json();
}
