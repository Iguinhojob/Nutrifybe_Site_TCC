// Utilitários de exibição. Não alteram dados: apenas formatam o que a API devolve.

export const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return undefined;
};

export const idOf = (obj) => pick(obj, 'id', 'Id');
export const nameOf = (obj, fallback = 'Paciente') => pick(obj, 'nome', 'Nome') || fallback;
export const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';
export const initialOf = (name) => (String(name || '').trim().charAt(0) || '?').toUpperCase();

const nf = (digits) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const isNum = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(String(value).replace(',', '.')));
export const toNum = (value) => (isNum(value) ? Number(String(value).replace(',', '.')) : null);

export function fmtNum(value, digits = 0) {
  const n = toNum(value);
  return n === null ? '—' : nf(digits).format(n);
}

/** Data local AAAA-MM-DD de um registro do diário. Usa entryDate (dia escolhido no app) quando existir. */
export function recordDay(record) {
  if (!record) return null;
  const entry = record.entryDate;
  if (typeof entry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry)) return entry;
  const raw = record.criadoEm || record.createdAt;
  if (!raw) return null;
  // Datas sem fuso (AAAA-MM-DD ou AAAA-MM-DDTHH:mm) já são locais.
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/.test(raw)) return raw.slice(0, 10);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return localKey(date);
}

export function localKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const todayKey = () => localKey(new Date());

export function fmtDay(key, opts = { weekday: 'long', day: 'numeric', month: 'long' }) {
  if (!key) return '—';
  const date = new Date(`${key}T12:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString('pt-BR', opts);
}

export function relativeDay(key) {
  if (!key) return '';
  const today = new Date(`${todayKey()}T12:00:00`);
  const day = new Date(`${key}T12:00:00`);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff === -1) return 'amanhã';
  if (diff > 1 && diff < 7) return `há ${diff} dias`;
  if (diff < -1 && diff > -7) return `em ${-diff} dias`;
  return fmtDay(key, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtTime(raw) {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function bmi(peso, alturaCm) {
  const p = toNum(peso);
  const a = toNum(alturaCm);
  if (!p || !a) return null;
  return p / ((a / 100) ** 2);
}

export function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

/** Converte erros técnicos em mensagens claras para quem usa o sistema. */
export function friendlyError(error, fallback = 'Algo deu errado. Tente novamente.') {
  if (!error) return fallback;
  if (error.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  if (error.status === 403) return 'Você não tem permissão para fazer isso.';
  if (error.name === 'TypeError' || /failed to fetch|networkerror|load failed/i.test(error.message || '')) {
    return 'Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.';
  }
  const msg = String(error.message || '');
  if (!msg || /^HTTP error!/i.test(msg) || msg.startsWith('<')) return fallback;
  return msg;
}

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
}
