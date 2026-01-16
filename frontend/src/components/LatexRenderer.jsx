import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

// Manual LaTeX Renderer Component to bypass plugin issues
const LatexRenderer = ({ children }) => {
    // If children is not a string, render as is
    if (typeof children !== 'string') return <>{children}</>;

    // Normalize: Ensure all $ are standard and unescape harmless \$
    // Also handle potential accidental double escapes \\$ 
    const normalized = children
        .replace(/\\\$/g, '$')   // Unescape \$ -> $
        .replace(/\\\\\$/g, '$'); // Unescape \\$ -> $ (Double backslash case)

    // Split by $ delimiter. 
    // Even indices (0, 2, 4...) are TEXT. Odd indices (1, 3, 5...) are MATH.
    const parts = normalized.split('$');

    return (
        <span className="latex-renderer-debug">
            {parts.map((part, index) => {
                // Determine if this segment is math
                // A segment is math if it's odd-indexed AND not empty
                const isMath = index % 2 === 1;

                if (isMath) {
                    try {
                        const html = katex.renderToString(part, {
                            throwOnError: false,
                            displayMode: false
                        });
                        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
                    } catch (e) {
                        return <span key={index} className="katex-error" style={{ color: 'red' }}>{part}</span>;
                    }
                } else {
                    // Render generic Markdown-like features for text parts (Bold only for now)
                    const textParts = part.split(/(\*\*.*?\*\*)/g);
                    return (
                        <span key={index}>
                            {textParts.map((t, i) => {
                                if (t.startsWith('**') && t.endsWith('**')) {
                                    return <strong key={i}>{t.slice(2, -2)}</strong>;
                                }
                                return t;
                            })}
                        </span>
                    );
                }
            })}
        </span>
    );
};

export default LatexRenderer;
