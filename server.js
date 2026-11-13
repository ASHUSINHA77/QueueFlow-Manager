const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || 'queueflow-demo-session-secret-change-me';
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function seedStore() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return {
    queues: [{ id: 'q-main', name: 'Main reception', createdAt: now.toISOString(), nextNumber: 106 }],
    tokens: [
      { id: 't101', queueId: 'q-main', number: 101, name: 'Olivia Chen', status: 'waiting', createdAt: new Date(now - 38 * 60000).toISOString() },
      { id: 't102', queueId: 'q-main', number: 102, name: 'Marcus Johnson', status: 'waiting', createdAt: new Date(now - 31 * 60000).toISOString() },
      { id: 't103', queueId: 'q-main', number: 103, name: 'Priya Sharma', status: 'serving', createdAt: new Date(now - 23 * 60000).toISOString(), calledAt: new Date(now - 3 * 60000).toISOString() },
      { id: 't104', queueId: 'q-main', number: 104, name: 'Noah Williams', status: 'waiting', createdAt: new Date(now - 13 * 60000).toISOString() },
      { id: 't105', queueId: 'q-main', number: 105, name: 'Sofia Martinez', status: 'waiting', createdAt: new Date(now - 4 * 60000).toISOString() }
    ],
    events: [
      { kind: 'completed', queueId: 'q-main', at: `${today}T08:45:00.000Z`, waitMinutes: 12 },
      { kind: 'completed', queueId: 'q-main', at: `${today}T09:30:00.000Z`, waitMinutes: 16 },
      { kind: 'completed', queueId: 'q-main', at: `${today}T10:15:00.000Z`, waitMinutes: 14 },
      { kind: 'completed', queueId: 'q-main', at: `${today}T11:05:00.000Z`, waitMinutes: 18 }
    ], order: { 'q-main': ['t101', 't102', 't103', 't104', 't105'] }
  };
}

function readStore() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify(seedStore(), null, 2));
  try { return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')); } catch { const fresh = seedStore(); writeStore(fresh); return fresh; }
}
function writeStore(store) { fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true }); fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2)); }
let db = readStore();

function sign(value) { return crypto.createHmac('sha256', SECRET).update(value).digest('hex'); }
function auth(req, res, next) {
  const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('qf_session='))?.slice(11);
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  const [payload, signature] = token.split('.');
  if (!payload || !signature || signature.length !== 64 || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  try { const session = JSON.parse(Buffer.from(payload, 'base64url').toString()); if (session.exp < Date.now()) return res.status(401).json({ error: 'Session expired. Please sign in again.' }); req.manager = session.email; next(); } catch { return res.status(401).json({ error: 'Invalid session.' }); }
}
function save() { writeStore(db); }
function waitingTokens(queueId) {
  const order = db.order[queueId] || [];
  const live = db.tokens.filter(t => t.queueId === queueId && ['waiting', 'serving'].includes(t.status));
  return [...live].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}
function publicToken(t, index, queueId) {
  const ahead = Math.max(0, waitingTokens(queueId).filter(x => x.status === 'waiting').indexOf(t));
  return { ...t, position: t.status === 'waiting' ? ahead + 1 : 0, estimatedWait: t.status === 'waiting' ? ahead * 8 : 0 };
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email !== (process.env.MANAGER_EMAIL || 'manager@queueflow.app') || password !== (process.env.MANAGER_PASSWORD || 'queue123')) return res.status(401).json({ error: 'That email and password do not match.' });
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url');
  res.setHeader('Set-Cookie', `qf_session=${payload}.${sign(payload)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ manager: { email } });
});
app.post('/api/logout', (req, res) => { res.setHeader('Set-Cookie', 'qf_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/me', auth, (req, res) => res.json({ manager: { email: req.manager } }));

app.get('/api/queues', auth, (req, res) => res.json({ queues: db.queues.map(q => ({ ...q, waitingCount: waitingTokens(q.id).filter(t => t.status === 'waiting').length, serving: waitingTokens(q.id).find(t => t.status === 'serving') || null })) }));
app.post('/api/queues', auth, (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name || name.length > 50) return res.status(400).json({ error: 'Queue name must be between 1 and 50 characters.' });
  if (db.queues.some(q => q.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: 'A queue with that name already exists.' });
  const queue = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), nextNumber: 1 };
  db.queues.push(queue); db.order[queue.id] = []; save(); res.status(201).json({ queue });
});
app.get('/api/queues/:id/tokens', auth, (req, res) => {
  const queue = db.queues.find(q => q.id === req.params.id); if (!queue) return res.status(404).json({ error: 'Queue not found.' });
  res.json({ tokens: waitingTokens(queue.id).map((t, i) => publicToken(t, i, queue.id)), history: db.tokens.filter(t => t.queueId === queue.id && ['completed', 'cancelled'].includes(t.status)).slice(-8).reverse() });
});
app.post('/api/queues/:id/tokens', auth, (req, res) => {
  const queue = db.queues.find(q => q.id === req.params.id); if (!queue) return res.status(404).json({ error: 'Queue not found.' });
  const name = String(req.body?.name || '').trim(); if (!name || name.length > 60) return res.status(400).json({ error: 'Name must be between 1 and 60 characters.' });
  const token = { id: crypto.randomUUID(), queueId: queue.id, number: queue.nextNumber++, name, status: 'waiting', createdAt: new Date().toISOString() };
  db.tokens.push(token); (db.order[queue.id] ||= []).push(token.id); save(); res.status(201).json({ token: publicToken(token, 0, queue.id) });
});
app.post('/api/queues/:id/reorder', auth, (req, res) => {
  const queue = db.queues.find(q => q.id === req.params.id); if (!queue) return res.status(404).json({ error: 'Queue not found.' });
  const { tokenId, direction } = req.body || {}; const list = waitingTokens(queue.id); const i = list.findIndex(t => t.id === tokenId);
  if (i < 0 || list[i].status !== 'waiting') return res.status(404).json({ error: 'Waiting token not found.' });
  const j = direction === 'up' ? i - 1 : direction === 'down' ? i + 1 : -1;
  if (j < 0 || j >= list.length || list[j].status !== 'waiting') return res.status(400).json({ error: 'That move is not available.' });
  [list[i], list[j]] = [list[j], list[i]]; db.order[queue.id] = list.map(t => t.id); save(); res.json({ tokens: waitingTokens(queue.id).map((t, n) => publicToken(t, n, queue.id)) });
});
app.post('/api/queues/:id/call-next', auth, (req, res) => {
  const queue = db.queues.find(q => q.id === req.params.id); if (!queue) return res.status(404).json({ error: 'Queue not found.' });
  if (waitingTokens(queue.id).some(t => t.status === 'serving')) return res.status(409).json({ error: 'Finish the current service before calling the next person.' });
  const token = waitingTokens(queue.id).find(t => t.status === 'waiting'); if (!token) return res.status(400).json({ error: 'There is nobody waiting in this queue.' });
  token.status = 'serving'; token.calledAt = new Date().toISOString(); save(); res.json({ token });
});
app.post('/api/tokens/:id/complete', auth, (req, res) => {
  const token = db.tokens.find(t => t.id === req.params.id && t.status === 'serving'); if (!token) return res.status(404).json({ error: 'Active service not found.' });
  token.status = 'completed'; token.completedAt = new Date().toISOString();
  db.events.push({ kind: 'completed', queueId: token.queueId, at: token.completedAt, waitMinutes: Math.max(0, Math.round((new Date(token.calledAt) - new Date(token.createdAt)) / 60000)) }); save(); res.json({ token });
});
app.post('/api/tokens/:id/cancel', auth, (req, res) => {
  const token = db.tokens.find(t => t.id === req.params.id && ['waiting', 'serving'].includes(t.status)); if (!token) return res.status(404).json({ error: 'Active token not found.' });
  token.status = 'cancelled'; token.cancelledAt = new Date().toISOString(); token.cancelReason = String(req.body?.reason || 'Cancelled by manager').slice(0, 100); save(); res.json({ token });
});
app.get('/api/dashboard', auth, (req, res) => {
  const queueIds = new Set(db.queues.map(q => q.id)); const active = db.tokens.filter(t => queueIds.has(t.queueId) && ['waiting', 'serving'].includes(t.status));
  const completed = db.events.filter(e => e.kind === 'completed'); const avg = completed.length ? Math.round(completed.reduce((s, e) => s + e.waitMinutes, 0) / completed.length) : 0;
  const today = new Date().toISOString().slice(0, 10); const todayCompleted = completed.filter(e => e.at.slice(0, 10) === today).length;
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = d.toISOString().slice(0, 10); return { date: key, label: new Date(`${key}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), arrivals: db.tokens.filter(t => t.createdAt?.slice(0, 10) === key).length, served: completed.filter(e => e.at.slice(0, 10) === key).length }; });
  res.json({ today, metrics: { waiting: active.filter(t => t.status === 'waiting').length, serving: active.filter(t => t.status === 'serving').length, avgWait: avg || 8, todayServed: todayCompleted, activeQueues: db.queues.length }, trend: days, queues: db.queues.map(q => ({ name: q.name, waiting: waitingTokens(q.id).filter(t => t.status === 'waiting').length })) });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`QueueFlow is running at http://localhost:${PORT}`));
