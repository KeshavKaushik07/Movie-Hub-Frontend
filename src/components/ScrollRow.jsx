import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export default function ScrollRow({ title, subtitle, seeAllTo, action, children }) {
  const ref = useRef(null);
  const slide = (dir) => ref.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });

  return (
    <section className="mx-auto my-7 max-w-7xl px-4 sm:px-6">
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <div>
          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-lg font-extrabold tracking-tight sm:text-xl"
          >
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {action}
          {seeAllTo && (
            <Link
              to={seeAllTo}
              className="flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-black"
            >
              <span>See All</span>
              <ArrowRight size={13} />
            </Link>
          )}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => slide(-1)}
              aria-label="Scroll left"
              className="rounded-full border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => slide(1)}
              aria-label="Scroll right"
              className="rounded-full border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2">
        {children}
      </div>
    </section>
  );
}
