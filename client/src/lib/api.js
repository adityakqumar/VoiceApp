const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('voiceapp_token');
    }
    return null;
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async login(displayName) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });
  }

  // Users
  async getProfile() {
    return this.request('/api/users/me');
  }

  async lookupUser(callId) {
    return this.request(`/api/users/lookup/${callId}`);
  }
}

const api = new ApiClient();
export default api;
