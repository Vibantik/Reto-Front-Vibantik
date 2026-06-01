import { useState, useRef, useEffect, useCallback } from "react";
import { sanitize } from "./sanitizer";
import { useAgentRefresh } from "../../utils/agentRefreshContext";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    type: "text",
    content: "¡Hola! Soy Aura, tu asistente virtual de Banorte. ¿En qué puedo ayudarte hoy?",
  },
];

export function useChatbot(uuid) {
  const { triggerRefresh } = useAgentRefresh();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

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
        console.error("Error al iniciar la conversaciÃ³n en el backend:", err);
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

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/ia/agentic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid_de_usuario: uuid,
          conversation_id: conversationId,
          agent_preferences: {
            enable_finance_agent: true,
            allow_ui_tools: true,
          },
          messages: updatedMessages
            .map((message) => ({
              role: message.role,
              content: message.content,
            }))
            .filter((message) => message.content),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Error al conectar con el backend");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let structuredPayload = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);

            if (json.type === "ui_tool") {
              structuredPayload = {
                role: "assistant",
                type: "ui_tool",
                tool: json.tool,
                data: json.data || {},
                content:
                  json.message?.content ||
                  "Te comparti una herramienta interactiva para continuar.",
              };
            }

            if (json.type === "action_proposal") {
              structuredPayload = {
                role: "assistant",
                type: "action_proposal",
                data: json.data || {},
                content:
                  json.data?.message ||
                  "Tengo una propuesta de accion lista para confirmar.",
              };
            }

            if (json.type === "action_result") {
              structuredPayload = {
                role: "assistant",
                type: "action_result",
                data: json,
                content: json.message || "",
              };
            }

            if (json.type === "agent_error") {
              structuredPayload = {
                role: "assistant",
                type: "agent_error",
                content:
                  json.content ||
                  json.message ||
                  "Necesito mas datos antes de preparar esa accion.",
                missingFields: json.missingFields || [],
              };
            }

            if (
              json.message?.content &&
              !["ui_tool", "action_proposal", "action_result", "agent_error"].includes(json.type)
            ) {
              accumulated += json.message.content;
              // corte del json q se recibe
              const trimmed = accumulated.trimStart();
              const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("```");
              if (!looksLikeJson) {
                setStreamingText(accumulated);
              }
            }
          } catch {
            // skip pedazos malformados del JSON
          }
        }
      }

      // arreglo estructura del json de gemini 
      let finalContent = accumulated;
      try {
        const stripped = accumulated.trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/, "");
        const parsed = JSON.parse(stripped);
        if (parsed && typeof parsed.mensaje_texto === "string") {
          finalContent = parsed.mensaje_texto;
        }
      } catch {
        // Not JSON, use accumulated as-is
      }

      if (structuredPayload) {
        setMessages((prev) => [...prev, structuredPayload]);
      } else if (finalContent.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "text", content: finalContent },
        ]);
      }
      setStreamingText("");

      const responseToPersist = structuredPayload?.content || finalContent;
      if (conversationId && responseToPersist.trim()) {
        try {
          await fetch(import.meta.env.VITE_API_URL + "/api/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_conv: conversationId,
              mensaje_usuario: text,
              respuesta_ia: responseToPersist,
            }),
          });
        } catch (postErr) {
          console.error("Error guardando el mensaje:", postErr);
        }
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
            "Lo siento, no pude conectarme al servidor de IA. Por favor intenta de nuevo.",
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

  const handleProposalConfirm = useCallback(
    (result) => {
      if (result?.tool) {
        triggerRefresh(result.tool);
      }

      appendMessage({
        role: "assistant",
        type: "action_result",
        data: result,
        content: result?.message || "",
      });
    },
    [appendMessage, triggerRefresh]
  );

  const handleProposalCancel = useCallback(() => {
    appendMessage({
      role: "assistant",
      type: "text",
      content: "Accion cancelada. No hice cambios.",
    });
  }, [appendMessage]);

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
