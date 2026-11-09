import { $, currency, dateString, escapeHtml, request, state, toast } from './core.js';

export async function loadActivity() {
  const list = $('#activity-list');
  list.innerHTML = '<div class="activity-empty">Cargando movimientos...</div>';
  try {
    if (!state.user) throw new Error('Inicia sesión para ver tus movimientos.');
    let rows;
    if (state.activity === 'prestamos') {
      rows = state.user.rol === 'admin'
        ? await request('/prestamos')
        : (await request(`/usuarios/${state.user.id}/historial`)).prestamos;
    } else {
      rows = await request('/ventas');
    }
    renderActivity(Array.isArray(rows) ? rows : []);
  } catch (error) {
    list.innerHTML = `<div class="activity-empty">${escapeHtml(error.message)}</div>`;
  }
}

function renderActivity(rows) {
  const list = $('#activity-list');
  if (!rows.length) {
    list.innerHTML = `<div class="activity-empty">Aún no tienes ${state.activity === 'prestamos' ? 'préstamos' : 'compras'} registrados. ¡Tu próxima historia está en el catálogo!</div>`;
    return;
  }
  list.innerHTML = rows.map(item => {
    const loan = state.activity === 'prestamos';
    const date = loan ? item.fecha_prestamo : item.fecha;
    const status = loan ? (item.estado || 'activo') : 'compra realizada';
    const title = loan ? `Préstamo #${item.id}` : `Compra #${item.id}`;
    const detail = loan
      ? `Solicitado el ${formatDate(date)}${item.fecha_devolucion_tentativa ? ` · Devolver antes del ${formatDate(item.fecha_devolucion_tentativa)}` : ''}${item.usuario ? ` · ${escapeHtml(item.usuario)}` : ''}`
      : `Realizada el ${formatDate(date)}${item.total != null ? ` · ${currency.format(Number(item.total))}` : ''}`;
    return `<article class="activity-card">
      <div class="activity-info"><div class="activity-icon">${loan ? '↗' : '✳'}</div><div><strong>${title}</strong><span>${detail}</span></div></div>
      <div class="activity-status">ESTADO<strong>${escapeHtml(status)}</strong>
        ${loan && item.estado !== 'devuelto' && Number(item.usuario_id) === Number(state.user.id) ? `<button class="button button-outline" data-return="${Number(item.id)}">Registrar devolución</button>` : ''}
      </div>
    </article>`;
  }).join('');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export async function returnLoan(id) {
  try {
    await request(`/prestamos/${id}/devolver`, { method: 'PATCH', body: JSON.stringify({ fechaDevolucion: dateString(new Date()) }) });
    toast('Devolución registrada. ¡Gracias por cuidar el libro!');
    await loadActivity();
  } catch (error) {
    toast(error.message, true);
  }
}
