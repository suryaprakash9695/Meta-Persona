/**
 * MetaPersona — API Utility Module
 * Handles all HTTP requests to the backend
 */

const API_BASE = '/api';

// ========================
// Token Management
// ========================
const Auth = {
  getToken: () => localStorage.getItem('mp_token'),
  setToken: (token) => localStorage.setItem('mp_token', token),
  clearToken: () => localStorage.removeItem('mp_token'),

  getUser: () => {
    try {
      const u = localStorage.getItem('mp_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },
  setUser: (user) => localStorage.setItem('mp_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('mp_user'),

  isLoggedIn: () => !!localStorage.getItem('mp_token'),

  logout: () => {
    Auth.clearToken();
    Auth.clearUser();
    window.location.href = '/';
  }
};

// ========================
// HTTP Request Helper
// ========================
async function request(method, endpoint, body = null, requireAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const token = Auth.getToken();
    if (!token) {
      Auth.logout();
      throw new Error('No auth token found.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body && method !== 'GET') options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 && requireAuth) {
        Auth.logout();
      }
      throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw err;
  }
}

const api = {
  get: (endpoint, requireAuth = true) => request('GET', endpoint, null, requireAuth),
  post: (endpoint, body, requireAuth = true) => request('POST', endpoint, body, requireAuth),
  put: (endpoint, body, requireAuth = true) => request('PUT', endpoint, body, requireAuth),
  delete: (endpoint, body, requireAuth = true) => request('DELETE', endpoint, body, requireAuth),
};

// ========================
// Toast Notification System
// ========================
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error', 4500),
  warning: (msg) => Toast.show(msg, 'warning'),
  info: (msg) => Toast.show(msg, 'info'),
};

// ========================
// Loading State Helper
// ========================
function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.2);border-top-color:white;"></div>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText || btn.dataset.originalText || btn.innerHTML;
  }
}

// ========================
// Form Data Helper
// ========================
function getFormData(formEl) {
  const data = {};
  const formData = new FormData(formEl);
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return data;
}

// ========================
// Date Formatting Helper
// ========================
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

// ========================
// Confirm Dialog
// ========================
async function confirmAction(message = 'Are you sure?') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:380px;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:16px;">⚠️</div>
        <h3 style="margin-bottom:8px;">Confirm Action</h3>
        <p style="margin-bottom:24px;color:var(--text-secondary);font-size:0.9rem;">${message}</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="confirm-cancel" class="btn btn-secondary">Cancel</button>
          <button id="confirm-ok" class="btn btn-danger">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

// ========================
// Modal Helper
// ========================
function openModal(html, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(overlay);

  function close() {
    overlay.remove();
    if (onClose) onClose();
  }

  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  const closeBtn = overlay.querySelector('[data-modal-close]');
  if (closeBtn) closeBtn.onclick = close;

  return { overlay, close };
}

// Expose globally
window.api = api;
window.Auth = Auth;
window.Toast = Toast;
window.setButtonLoading = setButtonLoading;
window.getFormData = getFormData;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.confirmAction = confirmAction;
window.openModal = openModal;
