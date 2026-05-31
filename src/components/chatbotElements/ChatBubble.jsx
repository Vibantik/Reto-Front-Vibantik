import BudgetWizardWidget from "./tools/BudgetWizardWidget";
import ActionProposalCard from "./ActionProposalCard";
import ActionResultCard from "./ActionResultCard";
import "./css/agentCards.css";

const TOOL_COMPONENTS = {
  generate_budget_wizard: BudgetWizardWidget,
};

export default function ChatBubble({
  message,
  role,
  content,
  streaming = false,
  onToolComplete,
  onProposalConfirm,
  onProposalCancel,
  uuid,
  onNavigate,
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

  // Si es un error de agente (missing fields), mostramos algo especial o simplemente el content normal.
  const isAgentAction = 
    resolvedMessage.type === "action_proposal" || 
    resolvedMessage.type === "action_result" ||
    resolvedMessage.type === "agent_error";

  // Render especial para los nuevos tipos agentic
  if (resolvedMessage.type === "action_proposal") {
    return (
      <ActionProposalCard
        proposal={resolvedMessage.data}
        uuid={uuid}
        onConfirm={onProposalConfirm}
        onCancel={onProposalCancel}
      />
    );
  }

  if (resolvedMessage.type === "action_result") {
    return (
      <ActionResultCard
        result={resolvedMessage.data}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className={`chat-bubble ${side} bubble-enter ${resolvedMessage.type === "agent_error" ? "agent-error-bubble" : ""}`}>
      {resolvedMessage.content ? (
        <div>
          {resolvedMessage.content}
          {resolvedMessage.type === "agent_error" && resolvedMessage.missingFields && (
            <div className="missing-fields-alert">
              Faltan datos: {resolvedMessage.missingFields.join(", ")}
            </div>
          )}
        </div>
      ) : null}

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
