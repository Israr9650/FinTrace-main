const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Unable to connect to the graph database.');
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the graph database.');
    }
    throw error;
  }
}

export const api = {
  getHealth: async () => {
    return fetchJson(`${API_BASE_URL}/health`);
  },

  getStats: async () => {
    return fetchJson(`${API_BASE_URL}/stats`);
  },

  getEntities: async (search = '', type = 'all') => {
    const query = new URLSearchParams({ search, type }).toString();
    return fetchJson(`${API_BASE_URL}/entities?${query}`);
  },

  getEntityById: async (id) => {
    return fetchJson(`${API_BASE_URL}/entities/${id}`);
  },

  getEntityNetwork: async (id) => {
    return fetchJson(`${API_BASE_URL}/entities/${id}/network`);
  },

  getOwnershipPath: async (sourceId, targetId) => {
    const query = new URLSearchParams({ sourceId, targetId }).toString();
    return fetchJson(`${API_BASE_URL}/ownership/path?${query}`);
  },

  getRiskAnalysis: async () => {
    return fetchJson(`${API_BASE_URL}/risk-analysis`);
  }
};
