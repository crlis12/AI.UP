// Centralized API base URL
function getDefaultApiBase() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If hosted on Azure Static Web Apps, point to the deployed backend
    if (hostname.includes('azurestaticapps.net')) {
      return 'https://ai-up-backend.azurewebsites.net';
    }
  }
  // Local development fallback
  return 'http://localhost:3001';
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || getDefaultApiBase();

export default API_BASE;


