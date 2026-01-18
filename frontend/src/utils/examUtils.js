/**
 * Preprocesses content to fix common math formatting issues before rendering.
 * @param {string} text - Raw text content
 * @returns {string} - Processed text with corrected LaTeX delimiters and commands
 */
export const preprocessContent = (text) => {
    if (text === null || text === undefined) return "";

    // Ensure text is a string to prevent .replace errors
    let processed = String(text);

    // Strategy: Protect existing math tokens first, then process plain text, then restore.
    const tokens = [];
    const generateToken = (idx) => `__MATH_TOKEN_${idx}__`;

    // 1. Extract existing LaTeX delimiters \( ... \) and $ ... $
    // Normalize everything to $...$ for our manual renderer
    processed = processed.replace(/(\\\(.*?\\\)|\\\[.*?\\\]|\$.*?\$)/g, (match) => {
        const token = generateToken(tokens.length);
        let normalized = match;
        if (match.startsWith('\\(') && match.endsWith('\\)')) normalized = '$' + match.slice(2, -2) + '$';
        if (match.startsWith('\\[') && match.endsWith('\\]')) normalized = '$' + match.slice(2, -2) + '$';
        tokens.push(normalized);
        return token;
    });

    // 2. Handle Greek Letters written as text (e.g. "lambda", "pi")
    // Normalize: pi, \pi, \\pi -> $\pi$
    const greekMap = ['alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda', 'pi', 'sigma', 'omega', 'mu', 'nu', 'rho', 'tau', 'epsilon'];
    // Match any number of backslashes (captured in group 1), then boundary, then word.
    const greekRegex = new RegExp(`(\\\\*)\\\\b(${greekMap.join('|')})\\\\b`, 'gi');
    processed = processed.replace(greekRegex, (match, backslashes, word) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        // Always return canonical form with single backslash
        return `$\\${word.toLowerCase()}$`;
    });

    // SPECIAL FIX: Unescape literal `$\omega$` or `\$omega`
    // Convert explicitly broken `$\omega$`Patterns to `\(\omega\)`
    // If we see `$\word$` where word is greek, force it.
    processed = processed.replace(/\$\s*\\?(\w+)\s*\$/g, (match, word) => {
        const lower = word.toLowerCase();
        if (greekMap.includes(lower)) return `$\\${lower}$`;
        return match;
    });

    // 2b. Handle common physics constants "glued" to 0 or plain text: mu0, epsilon0
    processed = processed.replace(/\b(mu|epsilon)_?0\b/gi, (match, Greek) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$\\${Greek.toLowerCase()}_0$`;
    });

    // Generic Unescape: Convert `\$` to `$` (just in case)
    processed = processed.replace(/\\\$/g, '$');

    // 3a. Handle stripped "vec" commands: vecr -> \vec{r}, vec F -> \vec{F}
    processed = processed.replace(/\bvec\s*([a-zA-Z])\b/g, (match, varName) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$\\vec{${varName}}$`;
    });

    // 3b. Handle stripped "sqrt" commands: sqrtgR -> \sqrt{gR}, sqrt m/k -> \sqrt{m/k}
    processed = processed.replace(/\bsqrt\s*([a-zA-Z0-9]+(?:\/[a-zA-Z0-9]+)?)\b/g, (match, arg) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$\\sqrt{${arg}}$`;
    });

    // 3c. Handle "Delta" as text or merged: DeltaV -> \Delta V, Delta t -> \Delta t
    // Case 1: Merged DeltaV
    processed = processed.replace(/\bDelta\s*([a-zA-Z])\b/g, (match, varName) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$\\Delta ${varName}$`;
    });
    // Case 2: Isolated Delta (if not in greekMap or upper case missed)
    processed = processed.replace(/\bDelta\b/g, (match) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$\\Delta$`;
    });

    // 3d. Scientific Notation: 4.0x10^14 -> 4.0 \times 10^{14}
    processed = processed.replace(/\b(\d+(?:\.\d+)?)\s*[xX]\s*10\^?([+-]?\d+)\b/g, (match, base, exp) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$${base} \\times 10^{${exp}}$`;
    });

    // 3e. Complex Ions: CO3^2-, PO4^3-
    processed = processed.replace(/\b((?:[A-Z][a-z]?\d*)+)\^([0-9]*[+-])\b/g, (match, formula, charge) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        const fmtFormula = formula.replace(/(\d+)/g, '_{$1}');
        return `$${fmtFormula}^{${charge}}$`;
    });

    // 3f. Reaction Arrows: xrightarrow (often merged)
    processed = processed.replace(/xrightarrow/g, '$\\rightarrow$');

    // 3g. Units: mol L-1 s-1. Heuristic: specific units followed by negative number
    // Expanded list of units and better handling
    const unitPattern = /\b(m|cm|mm|nm|pm|s|ms|mol|kg|g|L|K|S|C|V|A|J|kJ|N|W|Hz|Pa|Omega|Ohm|ohm|Ω)\s?(-?\d+)\b/g;
    processed = processed.replace(unitPattern, (match, unit, power) => {
        if (match.includes('__MATH_TOKEN_')) return match;

        let safeUnit = unit;
        if (['Omega', 'Ohm', 'ohm', 'Ω'].includes(unit)) safeUnit = '\\Omega';

        // If it's a standard text unit (like mol), wrap in \text{}? 
        // Actually, for consistency with Validator, let's keep it simple: unit^{power}
        // But standard LaTeX usually recommends \text{mol}. 
        // However, the requested output was S m-1 -> S m^{-1}. 
        // Let's use \text for multi-letter units to identify them clearly, and plain math for single letters.

        const isMultiChar = safeUnit.length > 1 && !safeUnit.startsWith('\\');
        const finalUnit = isMultiChar ? `\\text{${safeUnit}}` : safeUnit;

        return `$${finalUnit}^{${power}}$`;
    });

    // 3h. Chemical Bonds (Simple)
    processed = processed.replace(/\bC=C\b/g, '$\\text{C}=\\text{C}$');
    processed = processed.replace(/\bC-C\b/g, '$\\text{C}-\\text{C}$');

    // 3. Handle Integrals and Sums appearing as raw text "\int" or "\sum"
    processed = processed.replace(/(\\int.*?dx|\\int[^=]+=[^$]+|s\s*=\s*\\int.*)/gi, (match) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$${match}$`;
    });

    // 3.5 Generic Restore of Common LaTeX commands if starting as words
    // Trigonometry and Functions
    processed = processed.replace(/\b(sin|cos|tan|cot|sec|cosec|ln|log|exp|lim)\b/g, (match) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$\\${match}$`;
    });

    // Vectors and Hats (hat i, hat j, hat k)
    processed = processed.replace(/\bhat\s*([ijk])\b/g, (match, unit) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$\\hat{${unit}}$`;
    });

    // Arrows and Relations
    processed = processed.replace(/\b(rightarrow|leftarrow|leftrightarrow|implies|to)\b/g, (match) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        if (match === 'to') return match; // 'to' is too common in English
        return `$\\${match}$`;
    });

    // Degrees: 45^o or 45deg -> 45^{\circ}
    processed = processed.replace(/(\^o|\bdeg\b)/g, '^{\\circ}');

    // 3.5. Detect Full Equations: "P = V0 I0", "v = 3t^2", "v = u + at"
    processed = processed.replace(/\b([a-zA-Z])\s*=\s*([0-9a-zA-Z\s\+\-\^._\\{}]+(?:\s?\(.*?\))?)/g, (match) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        if (match.includes('$') || match.includes('\\(')) return match; // Already has math delimiters

        // Verify it looks like math (has =, +, -, ^, or variable assignment)
        if (!/[=+\-^]/.test(match)) return match;

        const token = generateToken(tokens.length);
        tokens.push(`$${match}$`);
        return token;
    });

    // 4. Handle Complex Ions/Charges: CO3^2-, PO4^3-, O^2-
    // Pattern: Formula + optional ^ + number + sign
    processed = processed.replace(/\b([A-Z][a-z]?\d*)\^?(\d*[+-])\b/g, (match, formula, charge) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        const fmtFormula = formula.replace(/(\d+)/g, '_{$1}');
        return `$${fmtFormula}^{${charge}}$`;
    });

    // 6. Detect Chemical Species with Coefficients and States: 3H2(g)
    processed = processed.replace(/\b(\d*)([A-Z][a-zA-Z0-9]*)(\((?:g|l|s|aq)\))?/g, (match, coeff, formula, state) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        const hasNumber = /\d/.test(formula);
        const hasState = !!state;
        if (!hasNumber && !hasState) return match;

        const fmtFormula = formula.replace(/(\d+)/g, '_{$1}');
        const part1 = coeff ? coeff : '';
        const part3 = state ? state : '';
        return `$${part1}${fmtFormula}${part3}$`;
    });

    // 7. Handle Simple Chemical Formulas (fallback)
    processed = processed.replace(/\b(?=[A-Za-z]*\d)[A-Z][A-Za-z0-9]*\b/g, (match) => {
        if (match.includes('__MATH_TOKEN_') || match.includes('$')) return match;
        if (match.length > 10) return match;
        const formatted = match.replace(/(\d+)/g, '_{$1}');
        return `$${formatted}$`;
    });

    // 8. Handle implicit math with carets (e.g., m/s^2, 10^5, h/lambda^2)
    processed = processed.replace(/([a-zA-Z0-9/]+\^[a-zA-Z0-9-]+)/g, (match) => {
        if (match.includes('__MATH_TOKEN_')) return match;
        return `$${match}$`;
    });

    // 9. Restore tokens
    tokens.forEach((tokenVal, idx) => {
        processed = processed.replace(generateToken(idx), tokenVal);
    });

    return processed;
};

/**
 * Groups a flat array of questions into sections based on standard patterns or subject tags.
 * @param {Array} qs - Array of question objects
 * @returns {Object} - { sections: ['Physics', ...], questions: { Physics: [...], ... } }
 */
export const groupQuestionsIntoSections = (qs) => {
    let newSections = [];
    let newQs = {};

    if (!qs || qs.length === 0) return { sections: [], questions: {} };

    // Strategy 1: Standard NEET New Pattern (200 Qs -> 50 each)
    if (qs.length === 200) {
        newSections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
        newQs['Physics'] = qs.slice(0, 50);
        newQs['Chemistry'] = qs.slice(50, 100);
        newQs['Botany'] = qs.slice(100, 150);
        newQs['Zoology'] = qs.slice(150, 200);
    }
    // Strategy 2: Standard NEET Split (180 Qs -> 45 each)
    else if (qs.length === 180) {
        newSections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
        newQs['Physics'] = qs.slice(0, 45);
        newQs['Chemistry'] = qs.slice(45, 90);
        newQs['Botany'] = qs.slice(90, 135);
        newQs['Zoology'] = qs.slice(135, 180);
    }
    // Strategy 2.5: Handle User Defined Mixed Sets
    // 80 Qs -> 20 each
    else if (qs.length === 80) {
        newSections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
        newQs['Physics'] = qs.slice(0, 20);
        newQs['Chemistry'] = qs.slice(20, 40);
        newQs['Botany'] = qs.slice(40, 60);
        newQs['Zoology'] = qs.slice(60, 80);
    }
    // 100 Qs -> 25 each
    else if (qs.length === 100) {
        newSections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
        newQs['Physics'] = qs.slice(0, 25);
        newQs['Chemistry'] = qs.slice(25, 50);
        newQs['Botany'] = qs.slice(50, 75);
        newQs['Zoology'] = qs.slice(75, 100);
    }
    // 120 Qs -> 30 each
    else if (qs.length === 120) {
        newSections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
        newQs['Physics'] = qs.slice(0, 30);
        newQs['Chemistry'] = qs.slice(30, 60);
        newQs['Botany'] = qs.slice(60, 90);
        newQs['Zoology'] = qs.slice(90, 120);
    }
    else {
        // Strategy 3: Group by 'tags.subject' or 'subject' key if present
        const hasSubject = qs.some(q => q.subject || (q.tags && q.tags.subject));

        if (hasSubject) {
            qs.forEach(q => {
                // Normalize subject source
                const sub = q.subject || (q.tags && q.tags.subject) || 'General';
                // Capitalize first letter for consistency
                const safeSub = sub.charAt(0).toUpperCase() + sub.slice(1);

                if (!newQs[safeSub]) {
                    newQs[safeSub] = [];
                }
                // Add to section list if new
                if (newSections.indexOf(safeSub) === -1) {
                    newSections.push(safeSub);
                }
                newQs[safeSub].push(q);
            });
        }
        // Strategy 4: Fallback
        else {
            newSections = ['General'];
            newQs['General'] = qs;
        }
    }
    return { sections: newSections, questions: newQs };
};
