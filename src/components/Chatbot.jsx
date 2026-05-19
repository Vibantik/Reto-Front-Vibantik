import React, { useState, useEffect } from "react";
import { useChatbot } from "./chatbotElements/useChatbot";
import { X, Send } from "lucide-react";
import PromptContainer from "./chatbotElements/PromptContainer";
import ChatBubble from "./chatbotElements/ChatBubble";

export default function Chatbot({ open, onClose, systemPrompt = null, suggestions = null, initialUserMessage = null }) {
  const { messages,
    input,
    setInput,
    loading,
    streamingText,
    messagesEndRef,
    sendMessage,
    handleKeyDown,
  } = useChatbot({ systemPrompt });

  // auto-send initial message when provided
  const [sentInitial, setSentInitial] = useState(false);
  useEffect(() => {
    if (open && initialUserMessage && !sentInitial) {
      setInput(initialUserMessage);
      // small timeout to ensure state updates
      setTimeout(() => {
        sendMessage();
        setSentInitial(true);
      }, 50);
    }
  }, [open, initialUserMessage, sentInitial, setInput, sendMessage]);

  // reset sentInitial when chatbot is closed or when a new initialUserMessage arrives
  useEffect(() => {
    if (!open) setSentInitial(false);
  }, [open]);

  useEffect(() => {
    if (initialUserMessage) setSentInitial(false);
  }, [initialUserMessage]);

  // if an initialUserMessage prop is provided, auto-send it when component mounts
  // (accept prop if passed in via rest)
  // we'll read it from props via arguments: second param not available; instead check window.__INITIAL_CHAT_MESSAGE (temporary) - but better accept prop
  

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
          {messages.filter(m => m.role !== "system").map((msg, i) => (
            <div
              key={i}
              message={msg}
              onToolComplete={appendMessage}
            />
          ))}

          {/* shows text token by token */}
          {loading && streamingText && (
            <ChatBubble
              message={{ role: "assistant", type: "text", content: streamingText }}
              streaming
            />
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

          {messages.length === 1 && <PromptContainer setInput={setInput} suggestions={suggestions} />}
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
