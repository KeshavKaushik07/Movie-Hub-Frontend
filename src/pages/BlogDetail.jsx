import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Clock,
  Calendar,
  Star,
  Film,
  Send,
  Reply,
  Trash2,
  Edit3,
  Eye,
} from 'lucide-react';
import { blogApi } from '../services/api';
import { getTitlePath } from '../utils/formatters';
import { ROLES, ROUTES } from '../config/constants';
import SafeImage from '../components/ui/SafeImage';

/**
 * Rich formatted blog body renderer:
 * Supports ## Headings, > Blockquotes, - Bullet lists, ![Caption](url) images, and paragraphs.
 */
export function RenderRichBlogContent({ content = '' }) {
  const blocks = String(content || '').split(/\n\n+/);
  return (
    <div className="space-y-4 text-sm leading-relaxed text-zinc-200 sm:text-base">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="pt-3 text-lg font-extrabold text-white sm:text-xl">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              style={{ fontFamily: 'var(--font-display)' }}
              className="pt-4 text-xl font-extrabold text-[#f5b942] sm:text-2xl"
            >
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={idx}
              style={{ fontFamily: 'var(--font-display)' }}
              className="pt-4 text-2xl font-extrabold text-white sm:text-3xl"
            >
              {trimmed.slice(2)}
            </h1>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="rounded-2xl border-l-4 border-[#f5b942] bg-[#f5b942]/10 p-4 italic text-zinc-200"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          return (
            <figure key={idx} className="my-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f]">
              <SafeImage
                src={imgMatch[2]}
                alt={imgMatch[1] || 'Movie Still'}
                size="w1280"
                variant="backdrop"
                className="max-h-[460px] w-full object-cover"
              />
              {imgMatch[1] && (
                <figcaption className="p-2.5 text-center text-xs text-zinc-400">
                  {imgMatch[1]}
                </figcaption>
              )}
            </figure>
          );
        }
        if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          return (
            <ul key={idx} className="list-disc space-y-1.5 pl-6 text-zinc-300">
              {trimmed.split('\n').map((li, i) => (
                <li key={i}>{li.trim().replace(/^[-*]\s+/, '')}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="whitespace-pre-line leading-relaxed text-zinc-300">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);

  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadArticle = () => {
    setLoading(true);
    blogApi
      .get(slug)
      .then((res) => {
        setBlog(res.blog);
        setRelated(res.related || []);
        document.title = `${res.blog?.title || 'Article'} — Movies Hub Blog`;
        if (res.blog?.id) {
          blogApi.listComments(res.blog.id).then(setComments).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadArticle();
  }, [slug]); // eslint-disable-line

  const handleToggleLike = async () => {
    if (!user || !blog) return;
    const res = await blogApi.toggleLike(blog.id);
    setBlog((prev) => ({ ...prev, liked: res.liked, likeCount: res.likeCount }));
  };

  const handlePostComment = async (e, parentId = null) => {
    e.preventDefault();
    const body = parentId ? replyText : commentText;
    if (!body.trim() || !blog) return;
    await blogApi.addComment(blog.id, { body: body.trim(), parent: parentId });
    if (parentId) {
      setReplyText('');
      setReplyTo(null);
    } else {
      setCommentText('');
    }
    const updated = await blogApi.listComments(blog.id);
    setComments(updated);
    setBlog((prev) => ({ ...prev, commentCount: updated.length }));
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent" />
      </div>
    );
  }
  if (!blog) return <p className="p-12 text-center text-zinc-400">Blog article not found.</p>;

  const topComments = comments.filter((c) => !c.parent);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parent) {
      acc[c.parent] = acc[c.parent] || [];
      acc[c.parent].push(c);
    }
    return acc;
  }, {});

  const linked = blog.linkedTitle;

  return (
    <article className="pb-16">
      {/* Hero Cover Image (Auto-fetched from Linked Movie Backdrop) */}
      <div className="hero-keep-white relative h-[52vh] min-h-[360px] w-full overflow-hidden">
        <SafeImage
          src={blog.coverImage || blog.posterImage}
          alt={blog.title}
          size="w1280"
          variant="backdrop"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a10] via-[#070a10]/65 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => nav('/blogs')}
              className="keep-white inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20"
            >
              <ArrowLeft size={14} /> All Blogs
            </button>
            {isStaff && (
              <Link
                to={`/admin/blogs?editId=${blog.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f5b942] px-4 py-1.5 text-xs font-extrabold text-black"
              >
                <Edit3 size={13} /> Edit Article in Studio
              </Link>
            )}
          </div>

          <span className="inline-block rounded-full bg-[#f5b942] px-3 py-1 text-[10px] font-extrabold text-black uppercase">
            {blog.category}
          </span>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="keep-white mt-2.5 text-2xl font-extrabold text-white sm:text-4xl lg:text-5xl"
          >
            {blog.title}
          </h1>
          {blog.subtitle && (
            <p className="mt-2 text-sm font-medium text-zinc-200 sm:text-base">{blog.subtitle}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-300">
            <span>By <b className="text-white">{blog.author?.name || 'Editorial'}</b></span>
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {new Date(blog.publishedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} /> {blog.readTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye size={13} /> {blog.viewsCount || 1} views
            </span>
          </div>
        </div>
      </div>

      {/* Main Content + Linked Movie Spotlight */}
      <div className="mx-auto mt-8 grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <RenderRichBlogContent content={blog.content} />

          {/* Movie Stills Gallery (Auto-fetched from TMDB Movie Images) */}
          {blog.galleryImages?.length > 1 && (
            <div className="pt-4">
              <h3 className="mb-3 text-sm font-extrabold tracking-wider text-zinc-400 uppercase">
                Official Movie Stills & Gallery
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {blog.galleryImages.slice(0, 6).map((url, idx) => (
                  <SafeImage
                    key={idx}
                    src={url}
                    alt={`${blog.title} still ${idx + 1}`}
                    size="w780"
                    variant="backdrop"
                    className="aspect-video w-full rounded-2xl border border-white/10 object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tags & Like Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0e131f] p-5">
            <div className="flex flex-wrap gap-1.5">
              {(blog.tags || []).map((t) => (
                <span key={t} className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  #{t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition ${
                blog.liked
                  ? 'bg-[#f5b942] text-black'
                  : 'border border-white/15 bg-white/5 text-white hover:border-[#f5b942]'
              }`}
            >
              <ThumbsUp size={15} /> {blog.liked ? 'Liked Article' : 'Like Article'} ({blog.likeCount || 0})
            </button>
          </div>

          {/* Threaded Blog Comments Section */}
          <div className="space-y-4 pt-4">
            <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-extrabold">
              Reader Comments ({comments.length})
            </h3>

            {user ? (
              <form onSubmit={(e) => handlePostComment(e, null)} className="flex gap-2 rounded-2xl border border-white/10 bg-[#0e131f] p-3">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts on this article..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <button className="flex items-center gap-1.5 rounded-full bg-[#f5b942] px-5 py-2 text-xs font-extrabold text-black">
                  <Send size={13} /> Comment
                </button>
              </form>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-[#0e131f] p-4 text-xs text-zinc-400">
                Please <Link to={ROUTES.LOGIN} className="font-bold text-[#f5b942] underline">log in</Link> to like or comment on this article.
              </p>
            )}

            <div className="space-y-3">
              {topComments.map((c) => {
                const replies = repliesMap[c.id] || [];
                return (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-[#0e131f] p-4">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-bold text-white">{c.user?.name || 'Reader'}</span>
                      <div className="flex items-center gap-3">
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        {(user?.id === c.user?.id || isStaff) && (
                          <button
                            type="button"
                            onClick={() => blogApi.deleteComment(c.id).then(() => blogApi.listComments(blog.id).then(setComments))}
                            className="text-zinc-400 hover:text-rose-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-200">{c.body}</p>
                    <div className="mt-2.5 flex items-center gap-4 text-[11px] text-zinc-400">
                      <button
                        type="button"
                        onClick={() => user && blogApi.toggleCommentLike(c.id).then(() => blogApi.listComments(blog.id).then(setComments))}
                        className={`flex items-center gap-1 ${c.liked ? 'text-[#f5b942]' : 'hover:text-white'}`}
                      >
                        <ThumbsUp size={12} /> {c.likesCount || 0}
                      </button>
                      {user && (
                        <button
                          type="button"
                          onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                          className="flex items-center gap-1 hover:text-white"
                        >
                          <Reply size={12} /> Reply
                        </button>
                      )}
                    </div>

                    {replyTo === c.id && (
                      <form onSubmit={(e) => handlePostComment(e, c.id)} className="mt-3 flex gap-2 pl-4">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                        />
                        <button className="rounded-xl bg-[#f5b942] px-3.5 py-1.5 text-xs font-bold text-black">
                          Reply
                        </button>
                      </form>
                    )}

                    {replies.length > 0 && (
                      <div className="mt-3 space-y-2 border-l-2 border-white/10 pl-4">
                        {replies.map((r) => (
                          <div key={r.id} className="rounded-xl bg-white/[0.03] p-2.5 text-xs">
                            <span className="font-bold text-white">{r.user?.name || 'Reader'}</span>
                            <p className="mt-1 text-zinc-300">{r.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Linked Movie Spotlight Card & Related Blogs */}
        <aside className="space-y-6 lg:col-span-4">
          {linked?.tmdbId && (
            <div className="overflow-hidden rounded-3xl border border-[#f5b942]/30 bg-[#0e131f] p-5 shadow-xl">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#f5b942] uppercase">
                <Film size={13} /> Movie Featured in This Article
              </span>
              <div className="mt-3 flex gap-4">
                <SafeImage
                  src={linked.posterUrl || blog.posterImage}
                  alt={linked.title}
                  size="w342"
                  variant="poster"
                  className="h-36 w-24 shrink-0 rounded-xl object-cover shadow-md"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white">{linked.title}</h3>
                    <p className="text-xs text-zinc-400">{linked.year}</p>
                    {linked.rating > 0 && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#f5b942]/15 px-2.5 py-0.5 text-xs font-bold text-[#f5b942]">
                        <Star size={11} fill="currentColor" /> {Number(linked.rating).toFixed(1)}
                      </span>
                    )}
                    {linked.verdict && linked.verdict !== 'TBA' && (
                      <p className="mt-1 text-[11px] font-bold text-emerald-400">{linked.verdict}</p>
                    )}
                  </div>
                  <Link
                    to={getTitlePath(linked, linked.type || 'movie', 'overview')}
                    className="mt-3 inline-block rounded-xl bg-[#f5b942] px-3.5 py-2 text-center text-xs font-extrabold text-black hover:brightness-110"
                  >
                    Open Movie Details →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-[#0e131f] p-5">
              <h3 className="mb-3 text-sm font-extrabold text-white">Related Articles</h3>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/blogs/${r.slug}`}
                    className="group flex gap-3 rounded-2xl p-2 transition hover:bg-white/5"
                  >
                    <SafeImage
                      src={r.coverImage || r.posterImage}
                      alt={r.title}
                      size="w300"
                      variant="backdrop"
                      className="h-16 w-24 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-bold text-white group-hover:text-[#f5b942]">
                        {r.title}
                      </p>
                      <span className="text-[10px] text-zinc-400">{r.readTimeMinutes} min read</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
