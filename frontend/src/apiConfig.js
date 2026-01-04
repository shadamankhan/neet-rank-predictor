export const getApiBase = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return "http://localhost:5000";
  }
  return "https://neet-rank-predictor-backend.onrender.com";
};
