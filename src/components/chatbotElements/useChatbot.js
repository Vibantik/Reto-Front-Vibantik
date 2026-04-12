import { useState, useRef, useEffect, useCallback } from "react";
import { OLLAMA_URL, MODEL, SYSTEM_PROMPT } from "./config";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content: "¡Hola! Soy Aura, tu asistente virtual de Banorte. ¿En qué puedo ayudarte hoy?",
  },
];

export function useChatbot() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // auto scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // send messaje
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    // system prompt + history of convo = context 
    try {
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Error al conectar con Ollama");

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
    } catch (err) {
      if (err.name === "AbortError") return;
      setStreamingText("");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Lo siento, no pude conectarme al servidor de IA. Verifica que Ollama esté corriendo en localhost:11434.",
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
