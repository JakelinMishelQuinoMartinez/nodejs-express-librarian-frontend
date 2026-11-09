import { $, currency, dateString, escapeHtml, request, state, toast } from './core.js';
import { loadBooks, renderBooks } from './catalog.js';
import { loadActivity } from './activity.js';

export function addToCart(bookId) {
  const book = state.books.find(item => Number(item.id) === bookId);
  if (!book) return;
  const current = state.cart.get(bookId)?.cantidad || 0;
  if (current >= Number(book.stock)) return toast('No hay más ejemplares disponibles.', true);
  state.cart.set(bookId, { libro: book, cantidad: current + 1 });
  updateCart();
  renderBooks();
  openCart();
}

export function changeQuantity(button) {
  const id = Number(button.dataset.quantity);
  const entry = state.cart.get(id);
  if (!entry) return;
  const next = entry.cantidad + Number(button.dataset.step);
  if (next <= 0) state.cart.delete(id);
  else if (next <= Number(entry.libro.stock)) state.cart.set(id, { ...entry, cantidad: next });
  else return toast('No hay más ejemplares disponibles.', true);
  updateCart();
  renderBooks();
}

export function updateCart() {
  const entries = [...state.cart.entries()];
  const count = entries.reduce((sum, [, entry]) => sum + entry.cantidad, 0);
  const total = entries.reduce((sum, [, entry]) => sum + entry.cantidad * Number(entry.libro.precio || 0), 0);
  $('#cart-count').textContent = count;
  $('#cart-total').textContent = currency.format(total);
  $('#cart-items').innerHTML = entries.length ? entries.map(([id, entry]) => `
    <div class="cart-item">
      <strong>${escapeHtml(entry.libro.titulo)}</strong><small>${escapeHtml(entry.libro.autor)}</small>
      <span class="cart-item-price">${currency.format(Number(entry.libro.precio || 0) * entry.cantidad)}</span>
      <div class="quantity-control"><button data-quantity="${id}" data-step="-1" aria-label="Quitar una unidad">−</button><span>${entry.cantidad}</span><button data-quantity="${id}" data-step="1" aria-label="Agregar una unidad">＋</button></div>
    </div>`).join('') : '<p class="cart-empty">Tu cesta está esperando una buena historia.</p>';
  $('#loan-button').disabled = !count;
  $('#buy-button').disabled = !count;
}

export function openCart() {
  $('#cart-drawer').classList.add('open');
  $('#cart-drawer').setAttribute('aria-hidden', 'false');
  $('#overlay').classList.remove('hidden');
}

export function closeCart() {
  $('#cart-drawer').classList.remove('open');
  $('#cart-drawer').setAttribute('aria-hidden', 'true');
  $('#overlay').classList.add('hidden');
}

export async function submitOrder(kind) {
  const entries = [...state.cart.values()];
  if (!entries.length) return;
  if (!state.user) {
    closeCart();
    const { openAccount } = await import('./auth.js');
    return openAccount();
  }
  const books = entries.map(({ libro, cantidad }) => ({ id: Number(libro.id), cantidad }));
  const body = kind === 'loan'
    ? { libros: books, fechaPrestamo: $('#loan-start').value, fechaDevolucionTentativa: $('#loan-due').value }
    : { libros: books, fecha: dateString(new Date()) };
  if (kind === 'loan' && (!body.fechaPrestamo || !body.fechaDevolucionTentativa || body.fechaDevolucionTentativa < body.fechaPrestamo)) {
    return toast('Revisa las fechas del préstamo.', true);
  }
  const button = kind === 'loan' ? $('#loan-button') : $('#buy-button');
  button.disabled = true;
  try {
    const result = await request(kind === 'loan' ? '/prestamos' : '/ventas', { method: 'POST', body: JSON.stringify(body) });
    state.cart.clear();
    updateCart();
    renderBooks();
    closeCart();
    toast(kind === 'loan' ? 'Préstamo registrado. ¡Feliz lectura!' : `Compra realizada por ${currency.format(Number(result.total) || 0)}.`);
    await loadBooks($('#search-input').value);
    if (state.view === 'activity') await loadActivity();
  } catch (error) {
    toast(error.message, true);
  } finally {
    button.disabled = false;
  }
}
