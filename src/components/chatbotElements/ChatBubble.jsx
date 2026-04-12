export default function ChatBubble({ role, content, streaming = false }) {
  const side = role === "user" ? "user" : "bot";

  return (
    <div className={`chat-bubble ${side} bubble-enter`}>
      {content}
      {streaming && <span className="cursor-blink" />}
    </div>
  );
}
