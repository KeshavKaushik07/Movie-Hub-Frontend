import { OTT_LIST } from '../../config/constants';

export const formatAdminDate = (dateInput) => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatShortId = (id = '') => {
  const s = String(id || '');
  if (!s) return '—';
  return s.length > 8 ? `#${s.slice(-6).toUpperCase()}` : `#${s}`;
};

export const resolveOttMeta = (key) => {
  const clean = String(key || '').toLowerCase().trim();
  return (
    OTT_LIST.find((o) => o.key === clean) || {
      key: clean,
      label: clean.toUpperCase(),
      badge: '#334155',
      short: clean.slice(0, 2).toUpperCase(),
    }
  );
};
