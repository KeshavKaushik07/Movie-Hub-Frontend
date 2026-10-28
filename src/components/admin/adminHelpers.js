import { OTT_LIST } from '../../config/constants';

export const formatAdminDateTime = (dateInput) => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
};

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

export const formatShortId = (id = '', fallbackIndex = null) => {
  if (fallbackIndex !== null && fallbackIndex !== undefined) {
    return `#${fallbackIndex}`;
  }
  const s = String(id || '');
  if (!s) return '—';
  if (/^\d+$/.test(s)) return `#${s}`;
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
