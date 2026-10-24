import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ThumbsUp,
  MessageSquare,
  SlidersHorizontal,
  Compass,
  Film,
} from 'lucide-react';
import { tmdb } from '../services/api';
import { OTT_LIST, INDUSTRY_LIST, MOVIE_GENRES } from '../config/constants';
import { openPreferenceModal, setRegionAndCurrency } from '../store/preferencesSlice';
import Carousel from '../components/Carousel';
import MovieRow from '../components/MovieRow';
import ScrollRow from '../components/ScrollRow';
import Top10Showcase from '../components/Top10Showcase';
import MoodExplorer from '../components/MoodExplorer';
import SafeImage from '../components/ui/SafeImage';

const GENRE_CARDS = [
  { name: 'Action', id: 28, emoji: '💥', tone: 'from-rose-500/20 to-orange-500/10 border-rose-500/30' },
  { name: 'Thriller', id: 53, emoji: '🕵️', tone: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30' },
  { name: 'Drama', id: 18, emoji: '🎭', tone: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30' },
  { name: 'Comedy', id: 35, emoji: '😂', tone: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30' },
  { name: 'Sci-Fi', id: 878, emoji: '🚀', tone: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/30' },
  { name: 'Romance', id: 10749, emoji: '❤️', tone: 'from-pink-500/20 to-rose-500/10 border-pink-500/30' },
  { name: 'Crime', id: 80, emoji: '🔫', tone: 'from-purple-500/20 to-violet-500/10 border-purple-500/30' },
  { name: 'Horror', id: 27, emoji: '👻', tone: 'from-red-500/20 to-rose-900/20 border-red-500/30' },
  { name: 'Mystery', id: 9648, emoji: '🧩', tone: 'from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/30' },
  { name: 'Adventure', id: 12, emoji: '🗺️', tone: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30' },
  { name: 'Family', id: 10751, emoji: '👨‍👩‍👧‍👦', tone: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30' },
  { name: 'Animation', id: 16, emoji: '✨', tone: 'from-amber-400/20 to-orange-500/10 border-amber-400/30' },
];

export default function Home() {
  const dispatch = useDispatch();
  const prefs = useSelector((s) => s.preferences);
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    tmdb
      .home({
        region: prefs.region,
        industries: (prefs.industries || []).join(','),
        genres: (prefs.genres || []).join(','),
      })
      .then((data) => {
        if (alive) {
          setFeed(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [prefs.region, prefs.industries, prefs.genres]);

  if (loading && !feed) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  const heroItems = feed?.hero || [];
  const upcomingItems = feed?.upcoming?.items || [];
  const top10Today = feed?.top10Today || [];
  const top10Week = feed?.top10Week || [];
  const celebrities = feed?.celebrities || [];
  const blogs = feed?.blogs || [];
  // Requirement 4: Deduplicate titles across rows so the same movie/series never repeats in row after row
  const rawRows = feed?.rows || [];
  const usedInEarlierRows = new Set();
  const getItemIdentity = (it) => {
    if (!it) return '';
    const titleSlug = String(it.title || it.name || '').toLowerCase().trim();
    return `${it.id || ''}::${titleSlug}`;
  };
  const rows = rawRows
    .map((row) => {
      const rowItems = Array.isArray(row.items) ? row.items : [];
      const uniqueForRow = [];
      const seenInThisRow = new Set();
      for (const item of rowItems) {
        const idKey = `${item?.type || 'movie'}:${item?.id}`;
        const nameKey = String(item?.title || item?.name || '').toLowerCase().trim();
        if (!item?.id || seenInThisRow.has(idKey) || (nameKey && seenInThisRow.has(nameKey))) continue;
        seenInThisRow.add(idKey);
        if (nameKey) seenInThisRow.add(nameKey);
        if (!usedInEarlierRows.has(idKey) && (!nameKey || !usedInEarlierRows.has(nameKey))) {
          uniqueForRow.push(item);
        }
      }
      // Register selected items so subsequent rows show different content
      for (const item of uniqueForRow) {
        const idKey = `${item?.type || 'movie'}:${item?.id}`;
        const nameKey = String(item?.title || item?.name || '').toLowerCase().trim();
        usedInEarlierRows.add(idKey);
        if (nameKey) usedInEarlierRows.add(nameKey);
      }
      return {
        ...row,
        items: uniqueForRow,
      };
    })
    .filter((r) => r.items && r.items.length > 0);

  return (
    <div className="pb-12">
      {/* 1. Featured Hero Carousel (Shows SuperAdmin Featured -> Falls back to Trending) */}
      <Carousel items={heroItems} heroSource={feed?.heroSource} />

      {/* 2. Personalized Taste & Regional Currency Strip */}
      <section className="mx-auto mt-5 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 sm:flex-row sm:items-center sm:p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Sparkles size={18} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs font-extrabold text-white sm:text-sm">
                  {prefs.region === 'IN'
                    ? '🇮🇳 Indian Cinema First • All Budgets in ₹ Rupees (Crores)'
                    : '🌍 International Edition • All Budgets in $ USD (Millions)'}
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400">
                Personalized for {(prefs.industries || []).slice(0, 4).join(', ').toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(setRegionAndCurrency(prefs.region === 'IN' ? 'GLOBAL' : 'IN'))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Switch to {prefs.region === 'IN' ? '🌍 Global ($ USD)' : '🇮🇳 India (₹ INR)'}
            </button>
            <button
              type="button"
              onClick={() => dispatch(openPreferenceModal())}
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-extrabold text-black hover:brightness-110"
            >
              <SlidersHorizontal size={13} /> Customize Taste
            </button>
          </div>
        </div>
      </section>

      {/* 3. Upcoming Movies Carousel (Right below Hero & Taste Strip) */}
      {upcomingItems.length > 0 && (
        <MovieRow
          title={feed?.upcoming?.title || 'Upcoming Movies & Theatrical Releases'}
          subtitle={feed?.upcoming?.subtitle || 'New movies arriving soon in cinemas & OTT'}
          items={upcomingItems}
          type="movie"
          seeAllTo="/browse/movie?list=upcoming"
        />
      )}

      {/* 4. Explore by Genre — Stacked Multi-Row Grid on Mobile & Desktop (Zero X-Axis Scroll!) */}
      <section className="mx-auto my-7 max-w-7xl px-4 sm:px-6">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Compass size={16} />
            </span>
            <div>
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-lg font-extrabold tracking-tight sm:text-xl"
              >
                Browse by Genre
              </h2>
              <p className="text-[11px] text-zinc-400">
                Tap any genre tile to explore all movies & web series in that genre
              </p>
            </div>
          </div>

          <Link
            to="/browse/movie"
            className="flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand"
          >
            <span>All Genres</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Stacked Multi-Row Grid (3 columns on mobile, 4 on tablet, 6 on desktop — no horizontal scroll!) */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 sm:gap-2.5">
          {GENRE_CARDS.map((g) => (
            <Link
              key={g.id}
              to={`/browse/movie?genre=${g.id}`}
              className={`flex items-center gap-2 rounded-2xl border bg-gradient-to-br ${g.tone} px-3 py-2.5 transition active:scale-95 hover:-translate-y-0.5 hover:border-brand`}
            >
              <span className="text-base sm:text-lg">{g.emoji}</span>
              <span className="truncate text-xs font-extrabold text-white">{g.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Watch by Mood Section — Stacked Multi-Row Grid on Mobile & Desktop (Zero X-Axis Scroll!) */}
      <MoodExplorer />

      {/* 6. Distinct Top 10 Today & Top 10 This Week Leaderboard Showcase */}
      <Top10Showcase
        today={top10Today}
        week={top10Week}
        region={prefs.region}
      />

      {/* 7. Top Celebrities in Your Region — Full Extent Uncropped Portrait Cards (Requirement 6) */}
      {celebrities.filter((c) => c && c.profileUrl).length > 0 && (
        <ScrollRow
          title={prefs.region === 'IN' ? 'Top Indian Celebrities & Filmmakers' : 'Top Global Celebrities & Directors'}
          subtitle="Tap any star or director to open all their movies and web series"
        >
          {celebrities
            .filter((c) => c && c.profileUrl)
            .map((celeb) => (
              <Link
                key={celeb.name}
                to={`/person/${encodeURIComponent(celeb.name)}${celeb.id ? `?id=${celeb.id}` : ''}`}
                className="group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] text-center transition duration-300 active:scale-95 hover:-translate-y-1 hover:border-brand/50 sm:w-44"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                  <SafeImage
                    src={celeb.profileUrl}
                    alt={celeb.name}
                    size="h632"
                    variant="poster"
                    className="h-full w-full object-contain object-center transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <h3 className="w-full truncate text-xs font-bold text-white group-hover:text-brand sm:text-sm">
                    {celeb.name}
                  </h3>
                  <span className="mt-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                    {celeb.industry || celeb.department || 'Actor'}
                  </span>
                  <p className="mt-1 line-clamp-2 text-[10px] text-zinc-400">
                    {celeb.knownFor || 'View complete filmography'}
                  </p>
                </div>
              </Link>
            ))}
        </ScrollRow>
      )}

      {/* 8. OTT Platforms & Cinema Industries — Wrapped Grid on Mobile (No X-Axis Scroll!) */}
      <section className="mx-auto my-6 max-w-7xl space-y-4 px-4 sm:px-6">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
              Stream by OTT Platform
            </h3>
            <Link to="/ott" className="text-xs font-extrabold text-brand hover:underline">
              ✨ Open Master OTT Page →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {OTT_LIST.map((ott) => (
              <Link
                key={ott.key}
                to={`/ott?provider=${ott.key}`}
                className={`rounded-2xl bg-gradient-to-br ${ott.color} keep-white px-3.5 py-2.5 text-center text-xs font-extrabold text-white shadow-md transition active:scale-95 hover:brightness-110`}
              >
                {ott.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2.5 text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
            Explore by Cinema Industry
          </h3>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_LIST.map((ind) => (
              <Link
                key={ind.key}
                to={`/browse/movie?industry=${ind.key}`}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0e131f] px-3 py-2 text-xs font-bold text-zinc-300 transition active:scale-95 hover:border-brand hover:text-brand"
              >
                <span>{ind.emoji}</span>
                <span>{ind.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9. All Regional & Curated Carousel Rows (Every Row Has "See All ->") */}
      {rows.map((r) => (
        <MovieRow
          key={r.key || r.title}
          title={r.title}
          subtitle={r.subtitle}
          items={r.items}
          seeAllTo={r.seeAllTo || '/browse/movie'}
        />
      ))}

      {/* 10. Bottom Section: Editorial Blogs & Movie Articles */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
              <BookOpen size={20} />
            </span>
            <div>
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-lg font-extrabold tracking-tight text-white sm:text-2xl"
              >
                Movies Hub Editorial & Box Office Blogs
              </h2>
              <p className="text-xs text-zinc-400">
                Deep-dive reviews, box office breakdowns, and OTT guides
              </p>
            </div>
          </div>

          <Link
            to="/blogs"
            className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-bold text-brand transition hover:bg-brand hover:text-black"
          >
            <span>See All Blogs</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {blogs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0e131f] p-8 text-center">
            <p className="text-sm font-semibold text-zinc-300">No editorial blog posts published yet.</p>
            <p className="mt-1 text-xs text-zinc-500">
              Admins and SuperAdmins can publish movie-linked blogs from the Admin Studio Blog Editor.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((b) => (
              <Link
                key={b.id}
                to={`/blogs/${b.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0e131f] transition duration-300 hover:-translate-y-1 hover:border-brand/50"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                  <SafeImage
                    src={b.coverImage || b.posterImage}
                    alt={b.title}
                    size="w780"
                    variant="backdrop"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="keep-white absolute top-3 left-3 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold text-brand uppercase backdrop-blur-md">
                    {b.category}
                  </span>
                  {b.linkedTitle?.title && (
                    <span className="keep-white absolute bottom-3 left-3 rounded-lg bg-brand px-2.5 py-0.5 text-[10px] font-extrabold text-black">
                      🎬 {b.linkedTitle.title}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="line-clamp-2 text-base font-extrabold text-white group-hover:text-brand">
                      {b.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {b.summary}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-zinc-400">
                    <span>{b.authorName} • {b.readTimeMinutes} min read</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} /> {b.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} /> {b.commentCount || 0}
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
