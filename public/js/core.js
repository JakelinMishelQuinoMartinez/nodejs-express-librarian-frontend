export const state = {
  books: [],
  cart: new Map(),
  user: null,
  view: 'catalog',
  activity: 'prestamos',
  register: false,
  searchTimer: null
};

const API_BASE = (window.LIBRARIAN_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

export function dateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

export function toast(message, error = false) {
  const item = document.createElement('div');
  item.className = `toast${error ? ' error' : ''}`;
  item.textContent = message;
  $('#toast-region').append(item);
  window.setTimeout(() => item.remove(), 3600);
}

export async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const validation = data?.errores?.map(item => item.msg).filter(Boolean).join(', ');
    throw new Error(validation || data?.error || data?.mensaje || `Error ${response.status}`);
  }
  return data;
}
