import { $, $$, request, state, toast } from './core.js';
import { loadBooks } from './catalog.js';

export function setUser(user) {
  state.user = user;
  $('#user-label').textContent = user ? user.nombre.split(' ')[0] : 'Mi cuenta';
  $('#user-avatar').textContent = user ? user.nombre.trim().charAt(0).toUpperCase() : '?';
  $$('.admin-only').forEach(element => element.classList.toggle('hidden', user?.rol !== 'admin'));
  $('#switch-auth').classList.toggle('hidden', Boolean(user));
  $('#account-form').classList.toggle('hidden', Boolean(user));
  $('#logout-button').classList.toggle('hidden', !user);
  $('#account-title').textContent = user ? `Hola, ${user.nombre.split(' ')[0]}.` : 'Qué bueno verte.';
  $('#account-subtitle').textContent = user ? `Sesión iniciada como ${user.rol}.` : 'Inicia sesión para continuar tu viaje.';
}

export async function restoreSession() {
  try {
    setUser(await request('/usuarios/perfil'));
  } catch (error) {
    if (!['Usuario no autorizado'].includes(error.message)) console.error('No fue posible restaurar la sesión:', error);
    setUser(null);
  }
}

export function openAccount() {
  $('#account-error').classList.add('hidden');
  $('#account-modal').showModal();
}

export function setAuthMode(register) {
  state.register = register;
  ['identity-field', 'name-field', 'phone-field', 'address-field'].forEach(id => $(`#${id}`).classList.toggle('hidden', !register));
  $('#account-password').autocomplete = register ? 'new-password' : 'current-password';
  $('#account-title').textContent = register ? 'Tu historia comienza aquí.' : 'Qué bueno verte.';
  $('#account-subtitle').textContent = register ? 'Crea tu cuenta para guardar tus lecturas.' : 'Inicia sesión para continuar tu viaje.';
  $('#account-submit').innerHTML = register ? 'Crear cuenta <span>→</span>' : 'Iniciar sesión <span>→</span>';
  $('#switch-auth').innerHTML = register
    ? '¿Ya tienes cuenta? <button type="button" id="auth-mode-toggle">Inicia sesión</button>'
    : '¿Aún no tienes cuenta? <button type="button" id="auth-mode-toggle">Regístrate</button>';
  $('#account-error').classList.add('hidden');
}

export async function handleAccountSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const error = $('#account-error');
  const submit = $('#account-submit');
  submit.disabled = true;
  error.classList.add('hidden');
  try {
    if (state.register) {
      await request('/usuarios', { method: 'POST', body: JSON.stringify(values) });
      state.register = false;
      form.reset();
      setAuthMode(false);
      $('#account-email').value = values.email;
      toast('Cuenta creada. Ahora puedes iniciar sesión.');
      return;
    }
    const user = await request('/usuarios/login', { method: 'POST', body: JSON.stringify({ email: values.email, password: values.password }) });
    setUser(user);
    $('#account-modal').close();
    toast(`¡Bienvenido, ${user.nombre.split(' ')[0]}!`);
    if (user.rol === 'admin') await loadBooks($('#search-input').value);
  } catch (err) {
    error.textContent = err.message;
    error.classList.remove('hidden');
  } finally {
    submit.disabled = false;
  }
}

export async function logout() {
  try {
    await request('/usuarios/logout', { method: 'POST' });
    setUser(null);
    $('#account-modal').close();
    toast('Sesión cerrada.');
    return true;
  } catch (error) {
    toast(error.message, true);
    return false;
  }
}
