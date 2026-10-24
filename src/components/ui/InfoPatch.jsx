import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  SearchX,
  X,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { subscribeInfoPatches } from '../../utils/notify';

const PATCH_STYLES = {
  success: {
    icon: CheckCircle2,
    badge: 'SUCCESS',
    dark: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/50',
    light: 'border-emerald-300 bg-emerald-50/95 text-emerald-950 shadow-emerald-500/10',
    iconColor: 'text-emerald-400',
    lightIconColor: 'text-emerald-600',
    pillDark: 'bg-emerald-500/20 text-emerald-300',
    pillLight: 'bg-emerald-600 text-white',
  },
  error: {
    icon: XCircle,
    badge: 'ERROR',
    dark: 'border-rose-500/45 bg-rose-950/90 text-rose-100 shadow-rose-950/50',
    light: 'border-rose-300 bg-rose-50/95 text-rose-950 shadow-rose-500/10',
    iconColor: 'text-rose-400',
    lightIconColor: 'text-rose-600',
    pillDark: 'bg-rose-500/20 text-rose-300',
    pillLight: 'bg-rose-600 text-white',
  },
  warning: {
    icon: AlertTriangle,
    badge: 'NOTICE',
    dark: 'border-amber-500/45 bg-amber-950/90 text-amber-100 shadow-amber-950/50',
    light: 'border-amber-300 bg-amber-50/95 text-amber-950 shadow-amber-500/10',
    iconColor: 'text-brand',
    lightIconColor: 'text-amber-600',
    pillDark: 'bg-brand/20 text-brand',
    pillLight: 'bg-amber-500 text-black',
  },
  'not-found': {
    icon: SearchX,
    badge: 'NOT FOUND',
    dark: 'border-brand/40 bg-[#0e131f]/95 text-zinc-100 shadow-black/60',
    light: 'border-amber-300 bg-amber-50/90 text-slate-900 shadow-slate-300/50',
    iconColor: 'text-brand',
    lightIconColor: 'text-amber-600',
    pillDark: 'bg-brand/20 text-brand',
    pillLight: 'bg-brand text-black',
  },
  info: {
    icon: Info,
    badge: 'INFO',
    dark: 'border-sky-500/40 bg-slate-900/95 text-sky-100 shadow-slate-950/50',
    light: 'border-sky-300 bg-sky-50/95 text-slate-900 shadow-sky-500/10',
    iconColor: 'text-sky-400',
    lightIconColor: 'text-sky-600',
    pillDark: 'bg-sky-500/20 text-sky-300',
    pillLight: 'bg-sky-600 text-white',
  },
};

/**
 * Inline Information Patch Card — Used across Search, Browse, OTT Hub,
 * Details, Blogs, Person, and Admin pages to clearly show Not Found states,
 * active filter/search summaries, or operation results.
 */
export function InfoPatch({
  type = 'info',
  title,
  message,
  subtitle,
  actions = [],
  onClose,
  compact = false,
  className = '',
}) {
  const theme = useSelector((s) => s.theme?.mode || 'dark');
  const isLight = theme === 'light';
  const cfg = PATCH_STYLES[type] || PATCH_STYLES.info;
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div
        role="status"
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-md transition ${
          isLight ? cfg.light : cfg.dark
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isLight ? 'bg-white/80' : 'bg-white/10'
            } ${isLight ? cfg.lightIconColor : cfg.iconColor}`}
          >
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                  isLight ? cfg.pillLight : cfg.pillDark
                }`}
              >
                {cfg.badge}
              </span>
              {title && <p className="text-xs font-extrabold sm:text-sm">{title}</p>}
            </div>
            {message && (
              <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions.map((act, idx) => (
            <button
              key={idx}
              type="button"
              onClick={act.onClick}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                act.primary
                  ? 'bg-brand text-black hover:brightness-110'
                  : isLight
                    ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                    : 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {act.label}
            </button>
          ))}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss patch"
              className="cursor-pointer rounded-lg p-1 opacity-75 hover:opacity-100"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`rounded-3xl border p-7 text-center shadow-xl sm:p-10 ${
        isLight ? cfg.light : cfg.dark
      } ${className}`}
    >
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${
          isLight
            ? 'border-amber-300/80 bg-white shadow-sm'
            : 'border-white/15 bg-white/5'
        } ${isLight ? cfg.lightIconColor : cfg.iconColor}`}
      >
        <Icon size={28} />
      </div>

      <span
        className={`mt-3 inline-block rounded-full px-3 py-0.5 text-[10px] font-extrabold tracking-widest uppercase ${
          isLight ? cfg.pillLight : cfg.pillDark
        }`}
      >
        {cfg.badge} PATCH
      </span>

      {title && (
        <h3
          style={{ fontFamily: 'var(--font-display)' }}
          className={`mt-2 text-lg font-extrabold sm:text-xl ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {title}
        </h3>
      )}

      {message && (
        <p
          className={`mx-auto mt-1.5 max-w-xl text-xs leading-relaxed sm:text-sm ${
            isLight ? 'text-slate-600' : 'text-zinc-300'
          }`}
        >
          {message}
        </p>
      )}

      {subtitle && (
        <p
          className={`mx-auto mt-1 max-w-lg text-[11px] ${
            isLight ? 'text-slate-500' : 'text-zinc-400'
          }`}
        >
          {subtitle}
        </p>
      )}

      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actions.map((act, idx) => (
            <button
              key={idx}
              type="button"
              onClick={act.onClick}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-extrabold transition ${
                act.primary
                  ? 'bg-brand text-black shadow-md shadow-brand/20 hover:brightness-110'
                  : isLight
                    ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                    : 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Floating Global Status Patch Stack (Mounted once in App.jsx)
 * Shows immediate feedback patches whenever actions succeed, fail, or return Not Found.
 */
export function GlobalStatusPatch() {
  const [patches, setPatches] = useState([]);
  const theme = useSelector((s) => s.theme?.mode || 'dark');
  const isLight = theme === 'light';

  useEffect(() => {
    return subscribeInfoPatches((item) => {
      setPatches((prev) => {
        // Deduplicate identical messages within 1.5s
        const duplicate = prev.some(
          (p) => p.message === item.message && p.type === item.type,
        );
        if (duplicate) return prev;
        return [item, ...prev].slice(0, 4);
      });

      if (item.duration !== 0) {
        setTimeout(() => {
          setPatches((prev) => prev.filter((p) => p.id !== item.id));
        }, item.duration || 4200);
      }
    });
  }, []);

  if (!patches.length) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-20 z-120 flex w-full max-w-sm flex-col gap-2.5 sm:top-20 sm:bottom-auto"
    >
      {patches.map((p) => {
        const cfg = PATCH_STYLES[p.type] || PATCH_STYLES.info;
        const Icon = cfg.icon;
        return (
          <div
            key={p.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-200 ${
              isLight ? cfg.light : cfg.dark
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                isLight ? 'bg-white/90' : 'bg-white/10'
              } ${isLight ? cfg.lightIconColor : cfg.iconColor}`}
            >
              <Icon size={17} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                    isLight ? cfg.pillLight : cfg.pillDark
                  }`}
                >
                  {cfg.badge}
                </span>
                <p className="truncate text-xs font-extrabold">{p.title}</p>
              </div>
              <p
                className={`mt-1 text-xs leading-snug ${
                  isLight ? 'text-slate-700' : 'text-zinc-200'
                }`}
              >
                {p.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setPatches((prev) => prev.filter((item) => item.id !== p.id))
              }
              className="cursor-pointer rounded-lg p-1 opacity-70 transition hover:opacity-100"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Top-Level Security & Crash Recovery Error Boundary
 */
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering issue occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <div className="rounded-3xl border border-rose-500/40 bg-[#0e131f] p-8 text-white shadow-2xl">
            <ShieldAlert size={36} className="mx-auto text-brand" />
            <span className="mt-3 inline-block rounded-full bg-rose-500/20 px-3 py-0.5 text-[10px] font-extrabold tracking-widest text-rose-300 uppercase">
              RECOVERY PATCH
            </span>
            <h2 className="mt-2 text-xl font-extrabold">
              Something Interrupted This View
            </h2>
            <p className="mt-2 text-xs text-zinc-400">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.href = '/';
              }}
              className="cursor-pointer mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-extrabold text-black hover:brightness-110"
            >
              <RotateCcw size={14} /> Reload Movies Hub Safely
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default InfoPatch;
