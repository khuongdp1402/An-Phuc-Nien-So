const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5062';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...options.headers },
  });

  if (res.status === 204) return null;

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// ── Config ───────────────────────────────────────────────────────────

export function getLunarYear() {
  return request('/api/config/lunar-year');
}

export function setLunarYear(year) {
  return request('/api/config/lunar-year', json('PUT', { year }));
}

// ── Dashboard ────────────────────────────────────────────────────────

export function getDashboardSummary(year) {
  const qs = year ? `?year=${year}` : '';
  return request(`/api/dashboard/summary${qs}`);
}

export function getSaoHanStats() {
  return request('/api/dashboard/sao-han-stats');
}

// ── Families CRUD ────────────────────────────────────────────────────

export function getFamilies(search, page = 1, pageSize = 18) {
  const p = new URLSearchParams();
  if (search) p.set('search', search);
  p.set('page', page);
  p.set('pageSize', pageSize);
  return request(`/api/families?${p}`);
}

export function getFamilyDetail(id, year) {
  const qs = year ? `?year=${year}` : '';
  return request(`/api/families/${id}${qs}`);
}

export function createFamily(data) {
  return request('/api/families', json('POST', data));
}

export function updateFamily(id, data) {
  return request(`/api/families/${id}`, json('PUT', data));
}

export function deleteFamily(id) {
  return request(`/api/families/${id}`, { method: 'DELETE' });
}

// ── Members CRUD ─────────────────────────────────────────────────────

export function addMember(familyId, data) {
  return request(`/api/families/${familyId}/members`, json('POST', data));
}

export function updateMember(familyId, memberId, data) {
  return request(`/api/families/${familyId}/members/${memberId}`, json('PUT', data));
}

export function deleteMember(familyId, memberId) {
  return request(`/api/families/${familyId}/members/${memberId}`, { method: 'DELETE' });
}

export function getFamilyPrayerRecords(familyId, page = 1, pageSize = 10) {
  return request(`/api/families/${familyId}/prayer-records?page=${page}&pageSize=${pageSize}`);
}

// ── Family autocomplete ──────────────────────────────────────────────

export function searchFamilies(q) {
  return request(`/api/families/autocomplete?q=${encodeURIComponent(q)}`);
}

// ── Prayer Records ───────────────────────────────────────────────────

export function getPrayerRecords(year, type, page = 1, pageSize = 20) {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  if (type) params.set('type', type);
  params.set('page', page);
  params.set('pageSize', pageSize);
  return request(`/api/prayer-records?${params}`);
}

export function getPrayerSummaries() {
  return request('/api/prayer-records/summary');
}

export function getPrintData(year, type, recordId) {
  const p = new URLSearchParams({ year, type });
  if (recordId) p.set('recordId', recordId);
  return request(`/api/prayer-records/print-data?${p}`);
}

export function createPrayerRecord(data) {
  return request('/api/prayer-records', json('POST', data));
}

export function updatePrayerRecord(id, data) {
  return request(`/api/prayer-records/${id}`, json('PUT', data));
}

export function deletePrayerRecord(id) {
  return request(`/api/prayer-records/${id}`, { method: 'DELETE' });
}

// ── Import ───────────────────────────────────────────────────────────

export function processText(text) {
  return request('/api/import/process-text', json('POST', { text }));
}

export function ocrImage(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/api/import/ocr', { method: 'POST', body: form });
}

export function saveImport(payload) {
  return request('/api/import/save', json('POST', payload));
}
