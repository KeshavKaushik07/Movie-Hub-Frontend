import { Link } from 'react-router-dom';
import {
  Heading1,
  Heading2,
  Quote,
  List,
  Image as ImageIcon,
  Eye,
  Edit3,
  Trash2,
  Save,
  Plus,
} from 'lucide-react';
import { BLOG_CATEGORIES } from '../../config/constants';
import { RenderRichBlogContent } from '../../pages/BlogDetail';
import SafeImage from '../ui/SafeImage';
import CustomSelect from '../ui/CustomSelect';
import InfoPatch from '../ui/InfoPatch';
import { formatAdminDate } from './adminHelpers';

export default function BlogStudioSection({
  blogs,
  editingBlogId,
  editorMode,
  setEditorMode,
  blogMovieSearchQ,
  setBlogMovieSearchQ,
  blogMovieHits,
  setBlogMovieHits,
  blogSearchAttempted,
  setBlogSearchAttempted,
  fetchingAssets,
  blogForm,
  setBlogForm,
  searchMovieForBlog,
  handleFetchMovieAssetsForBlog,
  insertIntoBlogContent,
  startEditingBlog,
  resetBlogForm,
  handleSaveBlog,
  onDeleteBlog,
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0e131f] p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white sm:text-lg">
              {editingBlogId ? 'Editing Editorial Article' : 'Create New Movie-Linked Blog Article'}
            </h3>
            <p className="text-xs text-zinc-400">
              Select any movie by title or ID to automatically pull its backdrop, poster, and gallery stills into your blog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['write', 'split', 'preview'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setEditorMode(m)}
                className={`admin-btn capitalize ${
                  editorMode === m ? 'admin-btn-primary' : 'admin-btn-secondary'
                }`}
              >
                {m === 'split' ? 'Split Studio' : m}
              </button>
            ))}
            {editingBlogId && (
              <button
                type="button"
                onClick={resetBlogForm}
                className="admin-btn admin-btn-secondary"
              >
                <Plus size={13} /> New Article
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Select a Movie to Auto-Fetch Images */}
        <div className="mb-5 rounded-2xl border border-brand/25 bg-[#070a10]/70 p-3.5 sm:p-4">
          <label className="mb-2.5 block text-xs font-bold text-brand uppercase">
            Step 1 — Select Movie / Web Series to Auto-Fetch Backdrop & Gallery Images
          </label>
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                value={blogMovieSearchQ}
                onChange={(e) => setBlogMovieSearchQ(e.target.value)}
                placeholder="Search movie name (e.g. Jawan, Pushpa, Mirzapur)..."
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={searchMovieForBlog}
                className="admin-btn admin-btn-secondary"
              >
                Search
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <input
                type="number"
                placeholder="Or TMDB ID"
                value={blogForm.tmdbId}
                onChange={(e) => setBlogForm({ ...blogForm, tmdbId: e.target.value })}
                className="min-w-0 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white sm:w-28"
              />
              <div className="min-w-0 w-full sm:w-36">
                <CustomSelect
                  value={blogForm.mediaType}
                  onChange={(val) => setBlogForm({ ...blogForm, mediaType: val })}
                  options={[
                    { value: 'movie', label: '🎬 Movie' },
                    { value: 'webseries', label: '🔥 Web Series' },
                    { value: 'tv', label: '📺 TV Show' },
                  ]}
                />
              </div>
              <button
                type="button"
                disabled={fetchingAssets}
                onClick={() => handleFetchMovieAssetsForBlog(blogForm.mediaType, blogForm.tmdbId)}
                className="admin-btn admin-btn-primary col-span-2 w-full sm:col-span-1 sm:w-auto"
              >
                {fetchingAssets ? 'Fetching...' : 'Fetch Movie Images'}
              </button>
            </div>
          </div>

          {blogSearchAttempted && blogMovieHits.length === 0 && (
            <InfoPatch
              compact
              type="not-found"
              title={`No Movies Found for "${blogMovieSearchQ}"`}
              message="Check the spelling or enter a TMDB ID directly to fetch images."
              onClose={() => setBlogSearchAttempted(false)}
              className="mt-3"
            />
          )}

          {blogMovieHits.length > 0 && (
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {blogMovieHits.map((mv) => (
                <button
                  key={mv.id}
                  type="button"
                  onClick={() => {
                    setBlogMovieHits([]);
                    setBlogSearchAttempted(false);
                    handleFetchMovieAssetsForBlog(
                      mv.isWebSeries ? 'webseries' : mv.type || 'movie',
                      mv.id,
                    );
                  }}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-[#0e131f] p-2 text-left text-xs hover:border-brand"
                >
                  <SafeImage src={mv.posterUrl} alt={mv.title} className="h-11 w-8 rounded object-cover" />
                  <div>
                    <p className="font-bold text-white">{mv.title || mv.name}</p>
                    <p className="text-[10px] text-brand">Click to auto-fetch images</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {blogForm.galleryImages?.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="mb-2 text-[11px] text-zinc-400">
                Auto-fetched Stills for <b className="text-white">{blogForm.linkedTitle?.title}</b> — Click to set Cover or insert into body:
              </p>
              <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
                {blogForm.galleryImages.map((imgUrl, i) => (
                  <div key={i} className="group relative shrink-0">
                    <SafeImage
                      src={imgUrl}
                      alt="Still"
                      className="h-16 w-28 rounded-xl border border-white/15 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-xl bg-black/75 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, coverImage: imgUrl })}
                        className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-bold text-black"
                      >
                        Cover
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertIntoBlogContent(`![${blogForm.linkedTitle?.title || 'Movie Still'}](${imgUrl})`)
                        }
                        className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-black"
                      >
                        + Body
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Rich Blog Metadata & Editor */}
        <form onSubmit={handleSaveBlog} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Article Headline *</label>
              <input
                required
                value={blogForm.title}
                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                placeholder="e.g. Why Kalki 2898 AD Redefined Indian Sci-Fi Blockbusters"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-bold text-white"
              />
            </div>
            <CustomSelect
              label="Editorial Category"
              value={blogForm.category}
              onChange={(val) => setBlogForm({ ...blogForm, category: val })}
              options={BLOG_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Subtitle / Deck</label>
              <input
                value={blogForm.subtitle}
                onChange={(e) => setBlogForm({ ...blogForm, subtitle: e.target.value })}
                placeholder="A concise hook shown below the headline..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Tags (comma separated)</label>
              <input
                value={blogForm.tags}
                onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-t-2xl border border-white/10 bg-[#070a10] p-2">
            <button
              type="button"
              onClick={() => insertIntoBlogContent('## Section Heading')}
              className="admin-btn admin-btn-secondary py-1 px-2.5"
            >
              <Heading1 size={13} /> H2
            </button>
            <button
              type="button"
              onClick={() => insertIntoBlogContent('### Sub-Heading')}
              className="admin-btn admin-btn-secondary py-1 px-2.5"
            >
              <Heading2 size={13} /> H3
            </button>
            <button
              type="button"
              onClick={() => insertIntoBlogContent('> “Insert a standout critic quote or box office highlight here.”')}
              className="admin-btn admin-btn-secondary py-1 px-2.5"
            >
              <Quote size={13} /> Quote
            </button>
            <button
              type="button"
              onClick={() => insertIntoBlogContent('- Key Highlight 1\n- Key Highlight 2\n- Key Highlight 3')}
              className="admin-btn admin-btn-secondary py-1 px-2.5"
            >
              <List size={13} /> Bullet List
            </button>
            {blogForm.coverImage && (
              <button
                type="button"
                onClick={() =>
                  insertIntoBlogContent(`![${blogForm.linkedTitle?.title || 'Movie Scene'}](${blogForm.coverImage})`)
                }
                className="admin-btn admin-btn-amber py-1 px-2.5"
              >
                <ImageIcon size={13} /> Insert Movie Backdrop
              </button>
            )}
          </div>

          {/* Editor + Live Preview Pane */}
          <div className={`grid gap-4 ${editorMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {editorMode !== 'preview' && (
              <textarea
                required
                rows={12}
                value={blogForm.content}
                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                placeholder="Write your full article here... Use ## for headings, > for quotes, - for lists."
                className="w-full rounded-b-2xl border border-white/10 bg-white/3 p-4 font-mono text-xs leading-relaxed text-white focus:border-brand focus:outline-none"
              />
            )}

            {editorMode !== 'write' && (
              <div className="studio-scroll max-h-85 overflow-y-auto rounded-2xl border border-white/10 bg-[#070a10] p-5">
                <span className="mb-2 inline-block text-[10px] font-bold tracking-wider text-brand uppercase">
                  Live Article Preview
                </span>
                {blogForm.coverImage && (
                  <SafeImage
                    src={blogForm.coverImage}
                    alt={blogForm.title}
                    className="mb-4 aspect-video w-full rounded-xl object-cover"
                  />
                )}
                <h2 className="mb-3 text-xl font-extrabold text-white">
                  {blogForm.title || 'Untitled Blog Post'}
                </h2>
                <RenderRichBlogContent
                  content={blogForm.content || 'Start typing on the left to preview your formatted article...'}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="w-40">
                <CustomSelect
                  value={blogForm.status}
                  onChange={(val) => setBlogForm({ ...blogForm, status: val })}
                  options={[
                    { value: 'published', label: '🟢 Published' },
                    { value: 'draft', label: '📝 Draft' },
                    { value: 'archived', label: '📦 Archived' },
                  ]}
                />
              </div>
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="checkbox"
                  checked={blogForm.isFeatured}
                  onChange={(e) => setBlogForm({ ...blogForm, isFeatured: e.target.checked })}
                  className="accent-brand"
                />
                Featured Blog
              </label>
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="checkbox"
                  checked={blogForm.isPinned}
                  onChange={(e) => setBlogForm({ ...blogForm, isPinned: e.target.checked })}
                  className="accent-brand"
                />
                Pin to Top
              </label>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary px-5 py-2.5">
              <Save size={14} /> {editingBlogId ? 'Update Blog Article' : 'Publish Blog Article'}
            </button>
          </div>
        </form>
      </div>

      {/* Published & Draft Blogs Table */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-extrabold text-white">
          All Editorial Articles ({blogs.length})
        </h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Linked Movie</th>
                <th>Author</th>
                <th>Published</th>
                <th>Stats</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-zinc-400">
                    No blog articles published yet.
                  </td>
                </tr>
              ) : (
                blogs.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <SafeImage
                          src={b.coverImage || b.posterImage}
                          alt={b.title}
                          size="w300"
                          variant="backdrop"
                          className="h-10 w-16 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-bold text-white">{b.title}</p>
                          <p className="truncate text-[10px] text-zinc-400">{b.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rounded bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                        {b.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-zinc-300">
                      {b.linkedTitle?.title || '—'}
                    </td>
                    <td className="whitespace-nowrap text-zinc-300">
                      {b.author?.name || 'Editorial'}
                    </td>
                    <td className="whitespace-nowrap text-zinc-400">
                      {formatAdminDate(b.createdAt)}
                    </td>
                    <td className="whitespace-nowrap text-zinc-400">
                      👍 {b.likeCount || 0} • 💬 {b.commentCount || 0}
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge uppercase ${
                          b.status === 'published'
                            ? 'admin-status-emerald'
                            : 'admin-status-amber'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/blogs/${b.slug}`}
                          className="admin-btn admin-btn-secondary"
                          title="View Article"
                        >
                          <Eye size={13} /> View
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditingBlog(b)}
                          className="admin-btn admin-btn-sky"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBlog(b.id)}
                          className="admin-btn admin-btn-danger"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
