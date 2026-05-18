import { useState, useRef, useEffect, useCallback } from "react";
import { sanitize } from "./sanitizer";
import { getUserUuid } from "../../utils/userUuid";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    type: "text",
    content: "¡Hola! Soy Aura, tu asistente virtual de Banorte. ¿En qué puedo ayudarte hoy?",
  },
];

export function useChatbot() {
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
    const uuid_de_usuario = getUserUuid();

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
  }, []);

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
                  "Te comparti una herramienta interactiva para continuar.",
              };
            }

            if (json.message?.content && json.type !== "ui_tool") {
              accumulated += json.message.content;
              setStreamingText(accumulated);
            }
          } catch {
            // skip malformed JSON chunks
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

      const responseToPersist = toolPayload?.content || accumulated;
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
            "Lo siento, no pude conectarme al servidor de IA. Verifica que Ollama estÃ© corriendo",
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
  };
}
