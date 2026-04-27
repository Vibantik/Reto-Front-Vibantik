import React from "react";
import { PromptSuggestion } from "./PromptSuggestion";
import '../css/chatPrompt.css';

export default function PromptContainer({ setInput }) {
    return (
        <div className="chatbot-suggestions-container">
            <div className="chatbot-suggestions-list">
                <PromptSuggestion
                    highlight="mayor gasto"
                    onClick={() => setInput("¿Cuál ha sido mi mayor gasto del mes?")}
                >
                    ¿Cuál ha sido mi mayor gasto del mes?
                </PromptSuggestion>
                <PromptSuggestion
                    highlight="invertir"
                    onClick={() => setInput("¿Cómo puedo empezar a invertir?")}
                >
                    ¿Cómo puedo empezar a invertir?
                </PromptSuggestion>
                <PromptSuggestion
                    highlight="meta financiera"
                    onClick={() => setInput("Ayúdame a planear mi siguiente meta financiera")}
                >
                    Ayúdame a planear mi siguiente meta financiera
                </PromptSuggestion>
            </div>
        </div>
    );
}