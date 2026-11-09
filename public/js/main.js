import { $, $$, dateString, request, state, toast } from './core.js';
import { loadBooks, renderBooks } from './catalog.js';
import { addToCart, changeQuantity, closeCart, openCart, submitOrder, updateCart } from './cart.js';
import { handleAccountSubmit, logout, openAccount, restoreSession, setAuthMode } from './auth.js';
import { loadActivity, returnLoan } from './activity.js';
import { openBookForm, renderInventory, saveBook } from './inventory.js';

function showView(view) {
  if (view === 'activity' && !state.user) return openAccount();
  if (view === 'admin' && state.user?.rol !== 'admin') return toast('Esta sección requiere una cuenta de administrador.', true);
  state.view = view;
  $$('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $$('.view').forEach(section => {
    const visible = section.id === `${view}-view`;
    section.classList.toggle('hidden', !visible);
    section.classList.toggle('active', visible);
  });
  $('#page-title').textContent = { catalog: 'Explorar', activity: 'Mis movimientos', admin: 'Inventario' }[view];
  if (view === 'activity') loadActivity();
  if (view === 'admin') renderInventory();
  closeCart();
}

async function handleClick(event) {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.view) return showView(target.dataset.view);
  if (target.dataset.add) return addToCart(Number(target.dataset.add));
  if (target.dataset.quantity) return changeQuantity(target);
  if (target.dataset.return) return returnLoan(Number(target.dataset.return));
  if (target.dataset.edit) return openBookForm(state.books.find(book => Number(book.id) === Number(target.dataset.edit)));
  if (target.dataset.deactivate) {
    if (!window.confirm('¿Desactivar este libro del catálogo?')) return;
    try {
      await request(`/libros/${target.dataset.deactivate}`, { method: 'DELETE' });
      toast('Libro desactivado.');
      await loadBooks($('#search-input').value);
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }
  if (target.dataset.activity) {
    state.activity = target.dataset.activity;
    $$('.activity-tab').forEach(button => button.classList.toggle('selected', button === target));
    return loadActivity();
  }
  if (target.hasAttribute('data-close-modal')) return target.closest('dialog').close();
  if (target.id === 'auth-mode-toggle') return setAuthMode(!state.register);
  if (target.id === 'account-button') {
    if (state.user) {
      $('#account-form').classList.add('hidden');
      $('#switch-auth').classList.add('hidden');
      $('#logout-button').classList.remove('hidden');
      $('#account-title').textContent = `Hola, ${state.user.nombre.split(' ')[0]}.`;
      $('#account-subtitle').textContent = `Sesión iniciada como ${state.user.rol}.`;
    } else {
      $('#account-form').classList.remove('hidden');
      $('#logout-button').classList.add('hidden');
      $('#switch-auth').classList.remove('hidden');
      setAuthMode(false);
    }
    return openAccount();
  }
  if (target.id === 'logout-button') {
    if (await logout() && state.view !== 'catalog') showView('catalog');
    return;
  }
  if (target.id === 'cart-toggle') return openCart();
  if (target.id === 'close-cart' || target.id === 'overlay') return closeCart();
  if (target.id === 'add-book') return openBookForm();
  if (target.id === 'refresh-activity') return loadActivity();
  if (target.id === 'loan-button') return submitOrder('loan');
  if (target.id === 'buy-button') return submitOrder('buy');
}

function initializeDates() {
  const start = new Date();
  const due = new Date(start);
  due.setDate(due.getDate() + 14);
  $('#loan-start').value = dateString(start);
  $('#loan-due').value = dateString(due);
  $('#loan-start').min = dateString(start);
  $('#loan-due').min = dateString(start);
}

document.addEventListener('click', handleClick);
$('#account-form').addEventListener('submit', handleAccountSubmit);
$('#book-form').addEventListener('submit', saveBook);
$('#search-input').addEventListener('input', event => {
  window.clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(() => loadBooks(event.target.value), 250);
});
$('#admin-search').addEventListener('input', renderInventory);
$('#loan-start').addEventListener('change', event => { $('#loan-due').min = event.target.value; });
$('#overlay').addEventListener('click', closeCart);
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
}));

initializeDates();
updateCart();
restoreSession();
loadBooks();
