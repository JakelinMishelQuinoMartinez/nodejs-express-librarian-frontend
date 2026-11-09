import { $, currency, escapeHtml, request, state, toast } from './core.js';
import { loadBooks } from './catalog.js';

export function renderInventory() {
  const body = $('#inventory-body');
  const search = ($('#admin-search')?.value || '').trim().toLowerCase();
  const books = state.books.filter(book => `${book.titulo} ${book.autor} ${book.codigo}`.toLowerCase().includes(search));
  body.innerHTML = books.length ? books.map(book => `<tr>
    <td class="table-book">${escapeHtml(book.titulo)}<small>${escapeHtml(book.autor)}</small></td>
    <td>${escapeHtml(book.codigo)}</td><td>${escapeHtml(book.categoria || '—')}</td>
    <td>${Number(book.stock)}</td><td>${currency.format(Number(book.precio) || 0)}</td>
    <td><div class="table-actions"><button data-edit="${Number(book.id)}">Editar</button><button data-deactivate="${Number(book.id)}">Desactivar</button></div></td>
  </tr>`).join('') : '<tr><td colspan="6">No hay libros para mostrar.</td></tr>';
}

export function openBookForm(book = null) {
  const form = $('#book-form');
  form.reset();
  form.elements.id.value = book?.id || '';
  form.elements.titulo.value = book?.titulo || '';
  form.elements.autor.value = book?.autor || '';
  form.elements.codigo.value = book?.codigo || '';
  form.elements.categoria.value = book?.categoria || '';
  form.elements.precio.value = book?.precio ?? 0;
  form.elements.stock.value = book?.stock ?? 0;
  form.elements.descripcion.value = book?.descripcion || '';
  $('#book-modal-title').textContent = book ? 'Editar libro' : 'Agregar un libro';
  $('#book-error').classList.add('hidden');
  $('#book-modal').showModal();
}

export async function saveBook(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const id = values.id;
  delete values.id;
  values.precio = Number(values.precio);
  values.stock = Number(values.stock);
  if (!values.descripcion) values.descripcion = null;
  if (!values.categoria) values.categoria = null;
  try {
    await request(id ? `/libros/${id}` : '/libros', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(values)
    });
    $('#book-modal').close();
    toast(id ? 'Libro actualizado.' : 'Libro agregado al catálogo.');
    await loadBooks($('#search-input').value);
  } catch (error) {
    $('#book-error').textContent = error.message;
    $('#book-error').classList.remove('hidden');
  }
}
