/* frontend/src/apiConfig.js */
const FALLBACK = "https://neet-rank-predictor-backend.onrender.com";
export const getApiBase = () => {
  // 1. Check if explicitly set via Vite env
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Auto-detect local development environment (including mobile/network access)
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    // If localhost, 127.0.0.1, or typical private network IP (192.168.x.x, 10.x.x.x, 172.x.x.x)
    // We assume the backend is running on the same host at port 5000.
    if (h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10.") || h.startsWith("172.")) {
      // Return the same hostname but port 5000
      // This allows mobile dictices to connect to http://192.168.1.5:5000 instead of localhost:5000
      return `http://${h}:5000`;
    }
  }

  // 3. Check legacy process.env
  try {
    if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) {
      return process.env.REACT_APP_API_BASE;
    }
  } catch (e) { }

  return FALLBACK;
};
