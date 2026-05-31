import { useChatbot } from "./chatbotElements/useChatbot";
import { X, Send } from "lucide-react";
import PromptContainer from "./chatbotElements/PromptContainer";
import ChatBubble from "./chatbotElements/ChatBubble";

export default function Chatbot({ open, onClose, uuid, onNavigate }) {
  const { messages,
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
  } = useChatbot(uuid);

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
            <ChatBubble
              key={i}
              message={msg}
              onToolComplete={appendMessage}
              onProposalConfirm={handleProposalConfirm}
              onProposalCancel={handleProposalCancel}
              uuid={uuid}
              onNavigate={(tab) => {
                onClose();
                if (onNavigate) onNavigate(tab);
              }}
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

          {messages.length === 1 && <PromptContainer setInput={setInput} />}
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
