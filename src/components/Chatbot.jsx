import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen3.5:2b";

const SYSTEM_PROMPT = `Eres Aura, el asistente virtual inteligente de Banorte.
Ayudas a los clientes con consultas sobre sus cuentas bancarias, gastos, inversiones y servicios financieros.
Responde siempre en español, de forma clara y concisa. No uses Markdown. Sé breve, amable, y profesional.
No respondas preguntas que no sean relacionadas a Banorte, sus productos financieros, o consultas de finanzas personales.

A continuación, los datos del usuario:

Nombre: Ricardo
Edad: 27 años

Tarjeta de Crédito **5426
Producto: Banorte One Up
Movimientos recientes (CSV):
Fecha,Establecimiento / Concepto en Estado de Cuenta,Categoría,Monto
01/03/2026,NETFLIX.COM BEVERLY HILLS CA,Entretenimiento,$219.00
01/03/2026,NWM DE MEXICO SA DE CV SUC 2410,Supermercado,"$1,450.50"
02/03/2026,STARBUCKS COFFEE MTY AEROPUERTO,Cafetería,$85.00
02/03/2026,EST SERV PEMEX 4921 SAN PEDRO,Transporte,$900.00
04/03/2026,FARM AHORRO SUC 12 CENTRO,Salud,$320.00
05/03/2026,UBER * PENDING HELP.UBER.COM,Transporte,$115.00
05/03/2026,TAQUERIA EL INFIERNO MTY NL,Restaurante,$240.00
07/03/2026,AMAZON MEXICO MX POS,Compras online,$560.00
08/03/2026,PAGO DE SERVICIO CFE INTERNET,Servicios,$640.00
08/03/2026,STARBUCKS COFFEE MTY AEROPUERTO,Cafetería,$92.00
10/03/2026,SMART FIT MEXICO SUR,Cuidado Personal,$599.00
12/03/2026,NWM DE MEXICO SA DE CV SUC 2410,Supermercado,$890.00
13/03/2026,UBER *EATS PENDING HELP.UBER,Restaurante,$310.00
15/03/2026,APPLE.COM/BILL ITUNES.COM,Suscripciones,$170.00
15/03/2026,ZARA MEXICO SA SUC 0918,Ropa,"$1,299.00"
18/03/2026,OXXO LOMA LARGA MTY,Tienda de conv.,$45.00
20/03/2026,EST SERV PEMEX 4921 SAN PEDRO,Transporte,$850.00
22/03/2026,PETCO MEXICO SUC 042,Mascotas,$420.00
24/03/2026,CINEPOLIS ONLINE TICKET,Entretenimiento,$280.00
25/03/2026,OXXO LOMA LARGA MTY,Tienda de conv.,$62.00`;

export default function Chatbot({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "¡Hola! Soy Aura, tu asistente virtual de Banorte. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

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

      // Streaming done — commit the full message
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) return null;

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-panel">
        <div className="chatbot-header">
          <button className="chatbot-close" onClick={onClose}>
            <X size={20} />
          </button>
          <span className="chatbot-title">Habla con Aura</span>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.role === "user" ? "user" : "bot"} bubble-enter`}
            >
              {msg.content}
            </div>
          ))}

          {/* Streaming bubble — shows text token by token */}
          {loading && streamingText && (
            <div className="chat-bubble bot bubble-enter">
              {streamingText}
              <span className="cursor-blink" />
            </div>
          )}

          {/* Typing dots — only when waiting for first token */}
          {loading && !streamingText && (
            <div className="chat-bubble bot bubble-enter">
              <span className="typing-indicator">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          <input
            type="text"
            className="chatbot-input"
            placeholder="Escribe aquí..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="chatbot-send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
