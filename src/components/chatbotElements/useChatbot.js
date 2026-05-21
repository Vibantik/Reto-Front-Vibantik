import { useState, useRef, useEffect, useCallback } from "react";
import { sanitize } from "./sanitizer";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
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
  
  // crear conversation
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
          body: JSON.stringify({ uuid_de_usuario }) 
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

  // auto scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // send messaje
  const sendMessage = async () => {
    const raw = input.trim();
    if (!raw || loading) return;

    // sanitizar en front
    const { safe, text, reason } = sanitize(raw);

    if (!safe) {
      // muestra intento del usuario, luego bot bloquea
      setMessages((prev) => [
        ...prev,
        { role: "user",      content: raw    },
        { role: "assistant", content: reason },
      ]);
      setInput("");
      return;
    }
   
    const userMsg = { role: "user", content: text };   // texto limpio
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
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Error al conectar con el backend");
 
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              accumulated += json.message.content;
              setStreamingText(accumulated);
            }
          } catch {
            // skip malformed JSON chunks
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulated },
      ]);
      setStreamingText("");

      // guardar mensaje del usuario y la respuesta !check ID de conversacion y respuesta valida
      if (conversationId && accumulated.trim()) {
        try {
          await fetch(import.meta.env.VITE_API_URL + "/api/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_conv: conversationId,
              mensaje_usuario: text,
              respuesta_ia: accumulated
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
          content:
            "Lo siento, no pude conectarme al servidor de IA. Verifica que Ollama esté corriendo",
        },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  //shortcut
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
  };
}
