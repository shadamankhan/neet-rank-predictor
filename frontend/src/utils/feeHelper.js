export const parseFeeToNumber = (fee) => {
    if (!fee) return 0;
    if (typeof fee === 'number') return fee;

    // Remove commas, currency symbols, spaces
    let cleaned = fee.toString().replace(/,/g, '').replace(/₹/g, '').replace(/INR/i, '').trim();

    // Handle "Lakhs" or "L" suffix logic if relevant (though mostly raw numbers in backend)
    // Checking for simple number parse first
    let num = Number(cleaned);
    if (!isNaN(num)) return num;

    // Handle ranges like "1200000-1500000" -> take lower bound or average? 
    // Usually for budget finder, if any part of range fits, it's relevant.
    // Let's take the first number found.
    const match = cleaned.match(/(\d+)/);
    if (match) {
        return Number(match[1]);
    }

    return 0;
};
