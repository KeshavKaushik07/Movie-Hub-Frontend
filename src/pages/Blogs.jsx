import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BookOpen,
  Search,
  ThumbsUp,
  MessageSquare,
  Clock,
  Sparkles,
  PenTool,
  Film,
} from 'lucide-react';
import { blogApi } from '../services/api';
import { BLOG_CATEGORIES, ROLES } from '../config/constants';
import SafeImage from '../components/ui/SafeImage';
import CustomSelect from '../components/ui/CustomSelect';
import InfoPatch from '../components/ui/InfoPatch';

export default function Blogs() {
  const user = useSelector((s) => s.auth.user);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');

  const loadBlogs = () => {
    setLoading(true);
    blogApi
      .list({
        category: category === 'all' ? undefined : category,
        sort,
        q: q.trim() || undefined,
        limit: 24,
      })
      .then((res) => setBlogs(res.items || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Editorial Blogs, Reviews & Box Office Reports | Movies Hub';
    loadBlogs();
  }, [category, sort]); // eslint-disable-line

  const featuredBlog = blogs.find((b) => b.isFeatured || b.isPinned) || blogs[0];
  const restBlogs = featuredBlog ? blogs.filter((b) => b.id !== featuredBlog.id) : blogs;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5b942]/15 text-[#f5b942]">
            <BookOpen size={24} />
          </span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-extrabold sm:text-3xl">
              Movies Hub Editorial & Blogs
            </h1>
            <p className="text-xs text-zinc-400">
              Deep-dive film essays, box office trade analysis, and OTT recommendations
            </p>
          </div>
        </div>

        {isStaff && (
          <Link
            to="/admin/blogs"
            className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-5 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-[#f5b942]/20 hover:brightness-110"
          >
            <PenTool size={14} /> Open Blog Studio Editor
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {['all', ...BLOG_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                category === cat
                  ? 'bg-[#f5b942] text-black'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? 'All Articles' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadBlogs();
            }}
            className="relative flex-1 sm:w-56"
          >
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles or movies..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-8 text-xs text-white focus:border-[#f5b942] focus:outline-none"
            />
          </form>

          <div className="w-40">
            <CustomSelect
              value={sort}
              onChange={setSort}
              options={[
                { value: 'recent', label: 'Newest First' },
                { value: 'popular', label: 'Most Popular' },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent" />
        </div>
      ) : blogs.length === 0 ? (
        <InfoPatch
          type="not-found"
          title={q ? `No Editorial Articles Found for "${q}"` : 'No Blog Articles Match This Category'}
          message={
            isStaff
              ? 'No articles matched your filter. You can reset the search filter or open the Blog Studio Editor to publish a new movie-linked article.'
              : 'We could not find any editorial articles matching your current search or category filter.'
          }
          actions={[
            ...(q || category !== 'all'
              ? [
                  {
                    label: 'Show All Articles',
                    primary: true,
                    onClick: () => {
                      setQ('');
                      setCategory('all');
                      setTimeout(loadBlogs, 0);
                    },
                  },
                ]
              : []),
          ]}
        />
      ) : (
        <div className="space-y-8">
          {/* Featured Top Article Banner */}
          {featuredBlog && (
            <Link
              to={`/blogs/${featuredBlog.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-white/15 bg-[#0e131f] shadow-2xl transition hover:border-[#f5b942]/50 lg:grid-cols-12"
            >
              <div className="relative aspect-video overflow-hidden lg:col-span-7 lg:aspect-auto">
                <SafeImage
                  src={featuredBlog.coverImage || featuredBlog.posterImage}
                  alt={featuredBlog.title}
                  size="w1280"
                  variant="backdrop"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="keep-white absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#f5b942] px-3 py-1 text-[11px] font-extrabold text-black uppercase">
                  <Sparkles size={12} /> {featuredBlog.category}
                </span>
              </div>
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
                <div className="space-y-3">
                  {featuredBlog.linkedTitle?.title && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-bold text-[#f5b942]">
                      <Film size={13} /> Featured Movie: {featuredBlog.linkedTitle.title} ({featuredBlog.linkedTitle.year || '—'})
                    </span>
                  )}
                  <h2
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-xl font-extrabold text-white group-hover:text-[#f5b942] sm:text-3xl"
                  >
                    {featuredBlog.title}
                  </h2>
                  {featuredBlog.subtitle && (
                    <p className="text-xs font-semibold text-zinc-300">{featuredBlog.subtitle}</p>
                  )}
                  <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    {featuredBlog.summary}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-400">
                  <span>
                    By <b className="text-white">{featuredBlog.author?.name || 'Editorial'}</b> • {featuredBlog.readTimeMinutes} min read
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={13} /> {featuredBlog.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={13} /> {featuredBlog.commentCount || 0}
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid of Remaining Articles */}
          {restBlogs.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restBlogs.map((b) => (
                <Link
                  key={b.id}
                  to={`/blogs/${b.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0e131f] transition duration-300 hover:-translate-y-1 hover:border-[#f5b942]/50"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <SafeImage
                      src={b.coverImage || b.posterImage}
                      alt={b.title}
                      size="w780"
                      variant="backdrop"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="keep-white absolute top-3 left-3 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold text-[#f5b942] uppercase backdrop-blur-md">
                      {b.category}
                    </span>
                    {b.linkedTitle?.title && (
                      <span className="keep-white absolute bottom-3 left-3 rounded-lg bg-[#f5b942] px-2.5 py-0.5 text-[10px] font-extrabold text-black">
                        🎬 {b.linkedTitle.title}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h3 className="line-clamp-2 text-base font-extrabold text-white group-hover:text-[#f5b942]">
                        {b.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">
                        {b.summary}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {b.readTimeMinutes} min read
                      </span>
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
        </div>
      )}
    </div>
  );
}
