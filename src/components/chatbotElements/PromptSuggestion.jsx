// NOTA: ADAPTADO PARA JS DESDE: https://www.prompt-kit.com/docs/prompt-suggestion

import React from "react";
import '../css/chatPrompt.css';

function PromptSuggestion({
    children,
    className = "",
    highlight,
    ...props
}) {
    const isHighlightMode = highlight !== undefined && highlight.trim() !== ""
    const content = typeof children === "string" ? children : ""

    if (!isHighlightMode) {
        return (
            <button
                className={`prompt-btn prompt-btn-outline ${className}`}
                {...props}
            >
                {children}
            </button>
        )
    }

    if (!content) {
        return (
            <button
                className={`prompt-btn prompt-btn-ghost ${className}`}
                {...props}
            >
                {children}
            </button>
        )
    }

    const trimmedHighlight = highlight.trim()
    const contentLower = content.toLowerCase()
    const highlightLower = trimmedHighlight.toLowerCase()
    const shouldHighlight = contentLower.includes(highlightLower)

    return (
        <button
            className={`prompt-btn prompt-btn-ghost ${className}`}
            {...props}
        >
            {shouldHighlight ? (
                (() => {
                    const index = contentLower.indexOf(highlightLower)
                    if (index === -1)
                        return (
                            <span className="prompt-text-muted">
                                {content}
                            </span>
                        )

                    const actualHighlightedText = content.substring(
                        index,
                        index + highlightLower.length
                    )

                    const before = content.substring(0, index)
                    const after = content.substring(index + actualHighlightedText.length)

                    return (
                        <>
                            {before && (
                                <span className="prompt-text-muted">
                                    {before}
                                </span>
                            )}
                            <span className="prompt-text-highlight">
                                {actualHighlightedText}
                            </span>
                            {after && (
                                <span className="prompt-text-muted">
                                    {after}
                                </span>
                            )}
                        </>
                    )
                })()
            ) : (
                <span className="prompt-text-muted">
                    {content}
                </span>
            )}
        </button>
    )
}

export { PromptSuggestion }
