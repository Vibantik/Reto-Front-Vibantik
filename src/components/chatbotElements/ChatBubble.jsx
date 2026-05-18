import BudgetWizardWidget from "./tools/BudgetWizardWidget";

const TOOL_COMPONENTS = {
  generate_budget_wizard: BudgetWizardWidget,
};

export default function ChatBubble({
  message,
  role,
  content,
  streaming = false,
  onToolComplete,
}) {
  const resolvedMessage = message || {
    role,
    content,
    type: "text",
  };

  const side = resolvedMessage.role === "user" ? "user" : "bot";
  const ToolComponent = resolvedMessage.tool
    ? TOOL_COMPONENTS[resolvedMessage.tool]
    : null;

  return (
    <div className={`chat-bubble ${side} bubble-enter`}>
      {resolvedMessage.content ? <div>{resolvedMessage.content}</div> : null}

      {resolvedMessage.type === "ui_tool" && ToolComponent ? (
        <ToolComponent data={resolvedMessage.data} onComplete={onToolComplete} />
      ) : null}

      {resolvedMessage.type === "ui_tool" && resolvedMessage.tool && !ToolComponent ? (
        <div>
          Este widget interactivo no esta disponible por ahora. Visita la pestana
          de Presupuestos para continuar.
        </div>
      ) : null}

      {streaming && <span className="cursor-blink" />}
    </div>
  );
}
