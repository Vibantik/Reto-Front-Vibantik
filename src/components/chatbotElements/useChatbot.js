import { useState, useRef, useEffect, useCallback } from "react";
import { sanitize } from "./sanitizer";
import { sendAgentMessage } from "../../services/agentService";
import { useAgentRefresh } from "../../utils/agentRefreshContext";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    type: "text",
    content: "¡Hola! Soy Aura, tu asistente virtual de Banorte. ¿En qué puedo ayudarte hoy?",
  },
];

export function useChatbot(uuid) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // Contexto de refresh de módulos
  const { triggerRefresh } = useAgentRefresh();

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Cuando cambia el usuario, resetear e iniciar conversación
  useEffect(() => {
    if (!uuid) return;
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setStreamingText("");

    const uuid_de_usuario = uuid;
    const initConversation = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/chat/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid_de_usuario }),
        });
        const data = await res.json();
        if (data.id_conv) {
          setConversationId(data.id_conv);
        }
      } catch (err) {
        console.error("Error al iniciar la conversación en el backend:", err);
      }
    };

    initConversation();
  }, [uuid]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // ── Handler cuando el usuario confirma una propuesta ──────────────────────
  const handleProposalConfirm = useCallback(
    (result) => {
      // Sustituir la tarjeta de propuesta por la tarjeta de resultado
      setMessages((prev) => {
        const withoutProposal = prev.filter((m) => m.type !== "action_proposal");
        return [
          ...withoutProposal,
          { role: "assistant", type: "action_result", data: result },
        ];
      });

      if (result.success && result.tool) {
        triggerRefresh(result.tool);
      }
    },
    [triggerRefresh]
  );

  // ── Handler cuando el usuario cancela una propuesta ───────────────────────
  const handleProposalCancel = useCallback(() => {
    setMessages((prev) => {
      const withoutProposal = prev.filter((m) => m.type !== "action_proposal");
      return [
        ...withoutProposal,
        {
          role: "assistant",
          type: "text",
          content: "Acción cancelada. ¿Hay algo más en lo que pueda ayudarte?",
        },
      ];
    });
  }, []);

  // ── Procesar respuesta JSON del agente ────────────────────────────────────
  const handleJsonResponse = useCallback(
    (data, originalText) => {
      switch (data.type) {
        case "action_proposal":
          appendMessage({
            role: "assistant",
            type: "action_proposal",
            data,
            content: data.message,
          });
          break;

        case "action_result":
          appendMessage({
            role: "assistant",
            type: "action_result",
            data,
            content: data.message,
          });
          if (data.success && data.tool) {
            triggerRefresh(data.tool);
          }
          break;

        case "agent_error":
          if (data.code === "TOKEN_EXPIRED") {
            appendMessage({
              role: "assistant",
              type: "text",
              content:
                "⏰ La sesión de confirmación expiró. Por favor intenta de nuevo tu solicitud.",
            });
            // Re-enviar el mensaje original automáticamente
            if (originalText) {
              setTimeout(() => {
                setInput(originalText);
              }, 400);
            }
          } else if (data.code === "PARAMS_INCOMPLETE") {
            const missing = data.meta?.missing_fields ?? [];
            appendMessage({
              role: "assistant",
              type: "agent_error",
              data,
              content: data.message,
              missingFields: missing,
            });
          } else {
            appendMessage({
              role: "assistant",
              type: "text",
              content: data.message || "Ocurrió un error inesperado. Intenta de nuevo.",
            });
          }
          break;

        default:
          // Respuesta JSON desconocida — mostrar como texto
          appendMessage({
            role: "assistant",
            type: "text",
            content: data.message || JSON.stringify(data),
          });
      }
    },
    [appendMessage, triggerRefresh]
  );

  // ── Procesar stream NDJSON (igual que antes) ──────────────────────────────
  const handleStream = useCallback(
    async (reader, decoder, text, conversId) => {
      let accumulated = "";
      let toolPayload = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);

            if (json.type === "ui_tool") {
              toolPayload = {
                role: "assistant",
                type: "ui_tool",
                tool: json.tool,
                data: json.data || {},
                content:
                  json.message?.content ||
                  "Te compartí una herramienta interactiva para continuar.",
              };
            }

            if (json.message?.content && json.type !== "ui_tool") {
              accumulated += json.message.content;
              setStreamingText(accumulated);
            }
          } catch {
            // chunk malformado — ignorar
          }
        }
      }

      if (toolPayload) {
        setMessages((prev) => [...prev, toolPayload]);
      } else if (accumulated.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "text", content: accumulated },
        ]);
      }
      setStreamingText("");

      // Persistir en historial de conversación
      const responseToPersist = toolPayload?.content || accumulated;
      if (conversId && responseToPersist.trim()) {
        try {
          await fetch(import.meta.env.VITE_API_URL + "/api/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_conv: conversId,
              mensaje_usuario: text,
              respuesta_ia: responseToPersist,
            }),
          });
        } catch (postErr) {
          console.error("Error guardando el mensaje:", postErr);
        }
      }
    },
    []
  );

  // ── sendMessage ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const raw = input.trim();
    if (!raw || loading) return;

    const { safe, text, reason } = sanitize(raw);

    if (!safe) {
      setMessages((prev) => [
        ...prev,
        { role: "user", type: "text", content: raw },
        { role: "assistant", type: "text", content: reason },
      ]);
      setInput("");
      return;
    }

    const userMsg = { role: "user", type: "text", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    // Historial limpio para el backend (solo role + content)
    const apiMessages = updatedMessages
      .map((m) => ({ role: m.role, content: m.content }))
      .filter((m) => m.content);

    try {
      const response = await sendAgentMessage(apiMessages, uuid, controller.signal);

      if (response.jsonResponse) {
        // Respuesta agentic JSON
        handleJsonResponse(response.jsonResponse, text);
      } else {
        // Stream NDJSON
        await handleStream(response.reader, response.decoder, text, conversationId);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setStreamingText("");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content:
            "Lo siento, no pude conectarme al servidor. Verifica tu conexión e intenta de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return {
    messages,
    input,
    setInput,
    loading,
    streamingText,
    messagesEndRef,
    sendMessage,
    handleKeyDown,
    appendMessage,
    handleProposalConfirm,
    handleProposalCancel,
  };
}
