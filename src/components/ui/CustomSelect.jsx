import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * CustomSelect — Replaces all native browser <select> elements with a smooth,
 * keyboard-accessible, theme-phased custom dropdown menu.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  label = '',
  icon: Icon = null,
  className = '',
  buttonClassName = '',
  searchable = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const normalized = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? {
          value: opt.value ?? opt.key ?? '',
          label: opt.label ?? String(opt.value ?? ''),
          badge: opt.badge,
          emoji: opt.emoji,
        }
      : { value: opt, label: String(opt || placeholder) },
  );

  const selected =
    normalized.find((o) => String(o.value) === String(value)) || null;

  const filtered =
    (searchable || normalized.length > 8) && search.trim()
      ? normalized.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase()),
        )
      : normalized;

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className='mb-1.5 block text-[11px] font-semibold tracking-wider text-zinc-400 uppercase'>
          {label}
        </label>
      )}
      <button
        type='button'
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
            setSearch('');
          }
        }}
        className={`flex w-full items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-[#0e131f] px-3.5 py-2.5 text-left text-xs font-medium text-white shadow-sm hover:border-[#f5b942]/40 focus:border-[#f5b942] focus:outline-none disabled:opacity-50 ${buttonClassName}`}
      >
        <span className='flex items-center gap-2 truncate'>
          {Icon && <Icon size={14} className='shrink-0 text-[#f5b942]' />}
          {selected?.emoji && <span>{selected.emoji}</span>}
          <span className='truncate'>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180 text-[#f5b942]' : ''}`}
        />
      </button>

      {open && (
        <div className='absolute right-0 left-0 z-50 mt-1.5 min-w-[190px] overflow-auto rounded-2xl border border-white/15 bg-[#0e131f]/95 p-1.5 shadow-2xl backdrop-blur-xl'>
          {(searchable || normalized.length > 8) && (
            <div className='relative mb-1.5 px-1 pt-1'>
              <Search
                size={13}
                className=' absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400'
              />
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Filter options...'
                className='w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white placeholder-zinc-500 focus:border-[#f5b942] focus:outline-none'
              />
            </div>
          )}
          <div className='studio-scroll max-h-60 overflow-y-auto'>
            {filtered.length === 0 ? (
              <p className='px-3 py-2.5 text-center text-xs text-zinc-500'>
                No matching options
              </p>
            ) : (
              filtered.map((opt) => {
                const isActive = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type='button'
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                      isActive
                        ? 'bg-[#f5b942]/15 font-semibold text-[#f5b942]'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className='flex items-center gap-2 truncate'>
                      {opt.emoji && <span>{opt.emoji}</span>}
                      <span className={`truncate `}>{opt.label}</span>
                    </span>
                    <span className='flex items-center gap-1.5'>
                      {opt.badge && (
                        <span className='rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400'>
                          {opt.badge}
                        </span>
                      )}
                      {isActive && (
                        <Check size={13} className='shrink-0 text-[#f5b942]' />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
