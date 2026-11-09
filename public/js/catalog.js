import { $, currency, escapeHtml, request, state } from './core.js';

const colors = [
  ['#687c69', '#fffaf0'], ['#b77859', '#fff9ed'], ['#d3b47d', '#34493e'],
  ['#788b9a', '#fffaf0'], ['#a77772', '#fffaf0'], ['#637e7a', '#fffaf0'],
  ['#c18a61', '#fffaf0'], ['#81806c', '#fffaf0']
];

export async function loadBooks(search = '') {
  try {
    const query = search.trim() ? `?buscar=${encodeURIComponent(search.trim())}` : '';
    state.books = await request(`/libros${query}`);
    renderBooks();
    if (state.user?.rol === 'admin') {
      const { renderInventory } = await import('./inventory.js');
      renderInventory();
    }
  } catch (error) {
    $('#book-count').textContent = 'No fue posible cargar el catálogo';
    $('#book-grid').innerHTML = `<p class="activity-empty">${escapeHtml(error.message)}</p>`;
  }
}

function coverFor(book, index) {
  const [background, foreground] = colors[index % colors.length];
  const shortTitle = escapeHtml(book.titulo || 'Sin título');
  const words = shortTitle.split(/\s+/).slice(0, 5).join(' ');
  return `<div class="cover-wrap" style="--cover-bg:${background};--cover-ink:${foreground}">
    <span class="cover-decoration"></span><div class="cover-content">
      <div class="cover-category">${escapeHtml(book.categoria || 'Lecturas')}</div>
      <div class="cover-title">${words}</div>
      <div class="cover-author">${escapeHtml(book.autor || '')}</div>
    </div><span class="cover-id">${escapeHtml(book.codigo || '')}</span>
  </div>`;
}

export function renderBooks() {
  const grid = $('#book-grid');
  $('#book-count').textContent = `${state.books.length} ${state.books.length === 1 ? 'título disponible' : 'títulos disponibles'}`;
  $('#empty-state').classList.toggle('hidden', state.books.length !== 0);
  grid.innerHTML = state.books.map((book, index) => {
    const inCart = state.cart.get(Number(book.id))?.cantidad || 0;
    return `<article class="book-card">
      ${coverFor(book, index)}
      <div class="book-info">
        <div class="book-category">${escapeHtml(book.categoria || 'Biblioteca')}</div>
        <h3 class="book-title" title="${escapeHtml(book.titulo)}">${escapeHtml(book.titulo)}</h3>
        <p class="book-author">${escapeHtml(book.autor)}</p>
        <div class="book-bottom"><span class="book-price">${currency.format(Number(book.precio) || 0)}</span>
          <span class="book-stock">${Number(book.stock) > 0 ? `${book.stock} disp.` : 'Agotado'}</span>
          <button class="card-add" data-add="${Number(book.id)}" aria-label="Agregar ${escapeHtml(book.titulo)} a la cesta" ${Number(book.stock) <= 0 ? 'disabled' : ''}>${inCart ? `✓${inCart}` : '+'}</button>
        </div>
      </div>
    </article>`;
  }).join('');
}
