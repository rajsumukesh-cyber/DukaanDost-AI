/**
 * DukaanBot API Service
 * Centralized HTTP client communicating with Python FastAPI backend
 */

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('dukaanbot_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    return res.json();
  },

  async login(phone, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  // Shop
  async getShop(shopId) {
    const res = await fetch(`${API_BASE}/shop/${shopId}`);
    if (!res.ok) throw new Error('Shop not found');
    return res.json();
  },

  async getAllShops() {
    const res = await fetch(`${API_BASE}/shops/all`);
    if (!res.ok) return [];
    return res.json();
  },

  async updateShop(shopId, data) {
    const res = await fetch(`${API_BASE}/shop/${shopId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update shop');
    return res.json();
  },

  // FAQs
  async getFAQs(shopId) {
    const res = await fetch(`${API_BASE}/faq/${shopId}`);
    if (!res.ok) return [];
    return res.json();
  },

  async createFAQ(data) {
    const res = await fetch(`${API_BASE}/faq`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create FAQ');
    return res.json();
  },

  async updateFAQ(faqId, data) {
    const res = await fetch(`${API_BASE}/faq/${faqId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update FAQ');
    return res.json();
  },

  async deleteFAQ(faqId) {
    const res = await fetch(`${API_BASE}/faq/${faqId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete FAQ');
    return res.json();
  },

  async bulkGenerateFAQs(shopId, rawText) {
    const res = await fetch(`${API_BASE}/faq/bulk-generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shop_id: shopId, raw_text: rawText })
    });
    if (!res.ok) throw new Error('Bulk generation failed');
    return res.json();
  },

  // Customer Chat
  async sendChatMessage(shopId, query, isVoice = false) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shopId, query, is_voice: isVoice })
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json();
  },

  // Analytics
  async getAnalytics(shopId) {
    const res = await fetch(`${API_BASE}/analytics/${shopId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  }
};
