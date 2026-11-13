const $ = s => document.querySelector(s);
const state = { queues: [], queueId: null, manager: null, tokens: [], history: [], page: 'overview' };
const api = async (url, options = {}) => {
  const res = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && url !== '/api/login') showLogin(); throw new Error(body.error || 'Something went wrong.'); }
  return body;
};
function toast(message, error = false) { const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = message; $('#toast-root').append(el); setTimeout(() => el.remove(), 3300); }
function showLogin() { $('#app-view').classList.add('hidden'); $('#login-view').classList.remove('hidden'); }
function showApp() { $('#login-view').classList.add('hidden'); $('#app-view').classList.remove('hidden'); }
async function boot() {
  try { const { manager } = await api('/api/me'); state.manager = manager; showApp(); $('#manager-email').textContent = manager.email; await refreshAll(); }
  catch { showLogin(); }
}
async function refreshAll() {
  const [queues, dashboard] = await Promise.all([api('/api/queues'), api('/api/dashboard')]);
  state.queues = queues.queues;
  if (!state.queueId || !state.queues.some(q => q.id === state.queueId)) state.queueId = state.queues[0]?.id || null;
  renderDashboard(dashboard); renderQueueSidebar(); await loadSelectedQueue();
}
async function loadSelectedQueue() {
  if (!state.queueId) { state.tokens = []; state.history = []; renderQueueManager(); return; }
  const data = await api(`/api/queues/${state.queueId}/tokens`); state.tokens = data.tokens; state.history = data.history; renderQueueManager();
}
function renderDashboard(d) {
  $('#overview-date').textContent = new Date(`${d.today}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).toUpperCase();
  $('#metric-waiting').textContent = d.metrics.waiting; $('#metric-wait').textContent = d.metrics.avgWait; $('#metric-served').textContent = d.metrics.todayServed; $('#metric-queues').textContent = d.metrics.activeQueues;
  $('#nav-count').textContent = d.metrics.waiting; $('#queue-total').textContent = d.metrics.activeQueues;
  const max = Math.max(1, ...d.trend.flatMap(x => [x.arrivals, x.served]));
  $('#trend-chart').innerHTML = d.trend.map(x => `<div class="chart-day"><div class="chart-bar" style="height:${Math.max(x.arrivals ? 8 : 3, x.arrivals / max * 95)}%" title="${x.arrivals} arrivals"></div><div class="chart-bar served" style="height:${Math.max(x.served ? 8 : 3, x.served / max * 95)}%" title="${x.served} served"></div><span class="chart-day-label">${esc(x.label)}</span></div>`).join('');
  $('#queue-overview-list').innerHTML = d.queues.length ? d.queues.map(q => `<div class="summary-row"><div class="queue-symbol">☷</div><div class="summary-name"><b>${esc(q.name)}</b><small>Currently in line</small></div><div><span class="summary-number">${q.waiting}</span><span class="summary-tail">waiting</span></div></div>`).join('') : '<div class="empty-state"><b>No queues yet</b><p>Create a queue to get started.</p></div>';
  const waiting = state.queues.flatMap(q => []); // Queue detail is fetched below for the selected queue.
  $('#live-queue-list').innerHTML = state.tokens.filter(t => t.status === 'waiting').slice(0, 4).map(t => liveRow(t)).join('') || '<div class="empty-state"><b>No one waiting right now</b><p>Your live queue will appear here.</p></div>';
}
function liveRow(t) { return `<div class="live-row"><div class="token-badge">${tokenLabel(t.number)}</div><div><div class="person-name">${esc(t.name)}</div><div class="person-sub">Joined ${timeAgo(t.createdAt)}</div></div><span class="position-tag">#${t.position} in line</span><span class="wait-tag">~${t.estimatedWait} min</span></div>`; }
function renderQueueSidebar() {
  $('#queue-list').innerHTML = state.queues.map(q => `<button class="queue-select ${q.id === state.queueId ? 'selected' : ''}" data-queue="${q.id}"><span class="queue-symbol">☷</span><span><b>${esc(q.name)}</b><small>${q.waitingCount} waiting${q.serving ? ' · 1 serving' : ''}</small></span><span class="mini-count">${q.waitingCount}</span></button>`).join('') || '<div class="empty-state"><b>No queues yet</b><p>Create your first queue.</p></div>';
  $('#queue-list').querySelectorAll('[data-queue]').forEach(b => b.addEventListener('click', async () => { state.queueId = b.dataset.queue; renderQueueSidebar(); await loadSelectedQueue(); }));
}
function renderQueueManager() {
  const queue = state.queues.find(q => q.id === state.queueId); const serving = state.tokens.find(t => t.status === 'serving'); const waiting = state.tokens.filter(t => t.status === 'waiting');
  $('#waiting-total').textContent = waiting.length; $('#call-next').disabled = !waiting.length || !!serving; $('#call-next').style.opacity = (!waiting.length || serving) ? '.55' : '1';
  $('#serving-panel').innerHTML = serving ? `<div class="serving-band"><span class="serving-light"></span><div><div class="serving-label">NOW IN SERVICE</div><div class="person-name">${esc(serving.name)}</div></div><div class="token-badge">${tokenLabel(serving.number)}</div></div><div class="serving-actions"><span>Started ${timeAgo(serving.calledAt)}</span><button class="btn finish" data-finish="${serving.id}">✓ &nbsp; Finish service</button></div>` : `<div class="no-service"><span class="serving-light"></span><div><b>No one is being served</b><small>Call the next person when you're ready.</small></div></div>`;
  $('#waiting-list').innerHTML = waiting.map((t, i) => `<div class="waiting-row"><div class="token-badge">${tokenLabel(t.number)}</div><div><div class="person-name">${esc(t.name)}</div><div class="person-sub">Joined ${timeAgo(t.createdAt)}</div></div><span class="wait-estimate">~${t.estimatedWait} min</span><div class="move-controls"><button class="move-btn" data-move="${t.id}" data-direction="up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button><button class="move-btn" data-move="${t.id}" data-direction="down" title="Move down" ${i === waiting.length - 1 ? 'disabled' : ''}>↓</button></div><button class="cancel-btn" data-cancel="${t.id}" title="Cancel token">×</button></div>`).join('');
  $('#empty-queue').classList.toggle('hidden', waiting.length > 0);
  $('#history-list').innerHTML = state.history.length ? state.history.slice(0, 5).map(t => `<div class="history-row"><span class="history-status ${t.status}">${t.status === 'completed' ? '✓' : '×'}</span><div><b>${esc(t.name)}</b><small>${t.status === 'completed' ? 'Service completed' : 'Token cancelled'} · ${timeAgo(t.completedAt || t.cancelledAt)}</small></div><span class="history-token">${tokenLabel(t.number)}</span></div>`).join('') : '<div class="empty-state"><p>Completed and cancelled tokens will show here.</p></div>';
  $('#call-next').onclick = () => action(async () => { await api(`/api/queues/${state.queueId}/call-next`, { method: 'POST', body: '{}' }); toast('Next person called for service.'); await refreshAll(); });
  $('#serving-panel').querySelector('[data-finish]')?.addEventListener('click', e => action(async () => { await api(`/api/tokens/${e.currentTarget.dataset.finish}/complete`, { method: 'POST', body: '{}' }); toast('Service marked complete.'); await refreshAll(); }));
  $('#waiting-list').querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => action(async () => { await api(`/api/queues/${state.queueId}/reorder`, { method: 'POST', body: JSON.stringify({ tokenId: b.dataset.move, direction: b.dataset.direction }) }); await refreshAll(); })));
  $('#waiting-list').querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', () => showConfirm('Cancel this token?', 'This person will be removed from the active queue.', 'Cancel token', async () => { await api(`/api/tokens/${b.dataset.cancel}/cancel`, { method: 'POST', body: JSON.stringify({ reason: 'Cancelled by manager' }) }); toast('Token cancelled.'); await refreshAll(); })));
  if (queue) $('#live-queue-list').innerHTML = waiting.slice(0, 4).map(liveRow).join('') || '<div class="empty-state"><b>No one waiting right now</b><p>Your live queue will appear here.</p></div>';
}
async function action(fn) { try { await fn(); } catch (e) { toast(e.message, true); } }
function setPage(page) { state.page = page; $('#overview-page').classList.toggle('hidden', page !== 'overview'); $('#queues-page').classList.toggle('hidden', page !== 'queues'); $('#breadcrumb-page').textContent = page === 'overview' ? 'Overview' : 'Queue manager'; document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page)); addButton?.classList.toggle('hidden', page !== 'queues'); }
function openModal({ title, description, label, placeholder, submit, initial = '' }) {
  const root = $('#modal-root'); root.innerHTML = `<div class="modal-backdrop"><div class="modal"><h3>${esc(title)}</h3><p>${esc(description)}</p><form id="modal-form"><label class="field-label">${esc(label)}<input name="value" maxlength="60" placeholder="${esc(placeholder)}" value="${esc(initial)}" required autofocus></label><div class="modal-actions"><button class="btn secondary" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Add</button></div></form></div></div>`;
  root.querySelector('[data-close]').onclick = () => root.innerHTML = ''; root.querySelector('.modal-backdrop').onclick = e => { if (e.target.classList.contains('modal-backdrop')) root.innerHTML = ''; };
  root.querySelector('form').onsubmit = async e => { e.preventDefault(); const button = root.querySelector('[type=submit]'); button.disabled = true; try { await submit(new FormData(e.currentTarget).get('value').trim()); root.innerHTML = ''; } catch (err) { toast(err.message, true); button.disabled = false; } };
  root.querySelector('input').focus();
}
function showConfirm(title, description, confirmText, run) {
  const root = $('#modal-root'); root.innerHTML = `<div class="modal-backdrop"><div class="modal"><h3>${esc(title)}</h3><p>${esc(description)}</p><div class="modal-actions"><button class="btn secondary" data-close>Keep token</button><button class="btn primary" data-confirm>${esc(confirmText)}</button></div></div></div>`;
  root.querySelector('[data-close]').onclick = () => root.innerHTML = ''; root.querySelector('[data-confirm]').onclick = async () => { root.innerHTML = ''; await action(run); };
}
function attachCreateQueue(el) { el.addEventListener('click', () => openModal({ title: 'Create a queue', description: 'Give your queue a clear name so your team can find it.', label: 'Queue name', placeholder: 'e.g. Main reception', submit: async name => { const { queue } = await api('/api/queues', { method: 'POST', body: JSON.stringify({ name }) }); state.queueId = queue.id; await refreshAll(); setPage('queues'); toast('Queue created.'); } })); }
function attachAddToken(el) { el.addEventListener('click', () => { if (!state.queueId) return toast('Create a queue first.', true); const q = state.queues.find(x => x.id === state.queueId); openModal({ title: 'Add someone to the line', description: `Create a token in ${q?.name || 'this queue'}.`, label: 'Person’s name', placeholder: 'Enter full name', submit: async name => { const { token } = await api(`/api/queues/${state.queueId}/tokens`, { method: 'POST', body: JSON.stringify({ name }) }); await refreshAll(); toast(`${tokenLabel(token.number)} added to the queue.`); } }); }); }
function tokenLabel(n) { return `#${String(n).padStart(3, '0')}`; }
function timeAgo(date) { if (!date) return 'just now'; const n = Math.max(0, Math.floor((Date.now() - new Date(date)) / 60000)); return n < 1 ? 'just now' : n < 60 ? `${n} min ago` : `${Math.floor(n / 60)}h ${n % 60}m ago`; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

$('#login-form').addEventListener('submit', async e => { e.preventDefault(); const data = new FormData(e.currentTarget); $('#login-error').textContent = ''; try { const result = await api('/api/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) }); state.manager = result.manager; showApp(); $('#manager-email').textContent = result.manager.email; await refreshAll(); } catch (err) { $('#login-error').textContent = err.message; } });
$('#logout-btn').onclick = async () => { await api('/api/logout', { method: 'POST', body: '{}' }); showLogin(); };
document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => { setPage(b.dataset.page); if (b.dataset.page === 'queues') refreshAll().catch(e => toast(e.message, true)); }));
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { setPage(b.dataset.goto); refreshAll().catch(e => toast(e.message, true)); }));
attachCreateQueue($('#create-queue')); attachCreateQueue($('#create-queue-top')); attachCreateQueue($('#create-queue-inline')); attachCreateQueue($('#create-queue-side'));
const addButton = document.createElement('button'); addButton.className = 'btn primary'; addButton.innerHTML = '<span class="plus">＋</span> Add person';
// A dedicated add control sits beside the queue title and is available only after a queue exists.
$('#create-queue').insertAdjacentElement('afterend', addButton);
addButton.onclick = () => { if (!state.queueId) return toast('Create a queue first.', true); const q = state.queues.find(x => x.id === state.queueId); openModal({ title: 'Add someone to the line', description: `Create a token in ${q?.name || 'this queue'}.`, label: 'Person’s name', placeholder: 'Enter full name', submit: async name => { const { token } = await api(`/api/queues/${state.queueId}/tokens`, { method: 'POST', body: JSON.stringify({ name }) }); await refreshAll(); toast(`${tokenLabel(token.number)} added to the queue.`); } }); };
document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => { addButton.classList.toggle('hidden', b.dataset.page !== 'queues'); }));
addButton.classList.add('hidden');
$('#refresh-btn').onclick = () => refreshAll().then(() => toast('Queue data refreshed.')).catch(e => toast(e.message, true));
$('#today-label').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
$('#help-btn').onclick = () => toast('Help center is coming soon.');
boot().catch(e => toast(e.message, true));
