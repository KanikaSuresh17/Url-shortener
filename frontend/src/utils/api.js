const BASE_URL = `${import.meta.env.VITE_BACKEND_URL || ''}/api`;

// Dispatch a global logout event so App.jsx can react
function triggerAuthLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout'));
}

// Helper to make fetch requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  // 401 Unauthorized — token expired or invalid, auto-logout
  if (response.status === 401) {
    triggerAuthLogout();
    const err = new Error(data.error || 'Session expired. Please login again.');
    err.status = 401;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = response.status;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  register: async (email, password, username) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username })
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // URLs
  getUrls: async () => {
    return await request('/urls');
  },

  createUrl: async (longUrl) => {
    return await request('/urls', {
      method: 'POST',
      body: JSON.stringify({ longUrl })
    });
  },

  deleteUrl: async (id) => {
    return await request(`/urls/${id}`, {
      method: 'DELETE'
    });
  },

  // Analytics
  getAnalytics: async (id) => {
    return await request(`/urls/${id}/analytics`);
  },

  // Admin
  getAllUrlsAdmin: async () => {
    return await request('/urls/all');
  },

  adminDeleteUrl: async (id) => {
    return await request(`/urls/admin/${id}`, {
      method: 'DELETE'
    });
  }
};
