import React from "react";
import { PromptSuggestion } from "./PromptSuggestion";
import '../css/chatPrompt.css';

export default function PromptContainer({ setInput, suggestions = null }) {
    const defaultSuggestions = [
        { text: "¿Cuál ha sido mi mayor gasto del mes?", highlight: "mayor gasto" },
        { text: "¿Cómo puedo empezar a invertir?", highlight: "invertir" },
        { text: "Ayúdame a planear mi siguiente meta financiera", highlight: "meta financiera" },
    ];

    const items = suggestions && suggestions.length ? suggestions : defaultSuggestions;

    return (
        <div className="chatbot-suggestions-container">
            <div className="chatbot-suggestions-list">
                {items.map((s, i) => (
                    <PromptSuggestion key={i} highlight={s.highlight} onClick={() => setInput(s.text)}>
                        {s.text}
                    </PromptSuggestion>
                ))}
            </div>
        </div>
    );
}