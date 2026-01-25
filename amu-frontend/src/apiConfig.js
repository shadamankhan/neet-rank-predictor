// amu-frontend/src/apiConfig.js
export const getApiBase = () => {
    // In production, use the env var or hardcoded backend
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    // Fallback for local development if not in env
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return "http://localhost:5000";
    }
    return "https://neet-rank-predictor-backend.onrender.com";
};
