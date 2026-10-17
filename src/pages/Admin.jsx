import { useEffect, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  Users,
  Database,
  Cpu,
  KeyRound,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Check,
  Search,
  Film,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  Image as ImageIcon,
  Play,
  Square,
  RefreshCw,
  Sun,
  Moon,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Shield,
} from 'lucide-react';
import { ROLES, BLOG_CATEGORIES } from '../config/constants';
import { authService } from '../services/authService';
import { reviewService } from '../services/reviewService';
import { tmdb, featuredApi, blogApi, communityApi } from '../services/api';
import { openLogoutModal } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';
import { setRegionAndCurrency } from '../store/preferencesSlice';
import {
  formatBudgetOrBoxOffice,
  getMovieFinancials,
} from '../utils/formatters';
import { RenderRichBlogContent } from './BlogDetail';
import TitleEditorModal from '../components/TitleEditorModal';
import SafeImage from '../components/ui/SafeImage';
import CustomSelect from '../components/ui/CustomSelect';

export default function Admin() {
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const { region } = useSelector((s) => s.preferences);
  const isSuper = user?.role === ROLES.SUPERADMIN;

  const location = useLocation();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  // Sub-route resolution inside /admin/*
  const subPath = location.pathname.replace(/^\/admin\/?/, '') || 'overview';
  const activeSection = subPath.split('/')[0] || 'overview';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // ==================== 1. OVERVIEW & STATS STATE ====================
  const [stats, setStats] = useState(null);

  // ==================== 2. FEATURED HERO CAROUSEL STATE ====================
  const [featuredItems, setFeaturedItems] = useState([]);
  const [featSearchQ, setFeatSearchQ] = useState('');
  const [featSearchResults, setFeatSearchResults] = useState([]);
  const [featForm, setFeatForm] = useState({
    tmdbId: '',
    type: 'movie',
    badgeText: 'Featured on Movies Hub',
    customTitle: '',
    customTagline: '',
    customOverview: '',
    customBackdropUrl: '',
  });

  // ==================== 3. FULL-FLEDGED BLOG STUDIO EDITOR STATE ====================
  const [blogs, setBlogs] = useState([]);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [editorMode, setEditorMode] = useState('split'); // 'write' | 'split' | 'preview'
  const [blogMovieSearchQ, setBlogMovieSearchQ] = useState('');
  const [blogMovieHits, setBlogMovieHits] = useState([]);
  const [fetchingAssets, setFetchingAssets] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    subtitle: '',
    summary: '',
    content: '',
    category: 'Editorial',
    tags: 'bollywood, box-office, review',
    tmdbId: '',
    mediaType: 'movie',
    coverImage: '',
    posterImage: '',
    galleryImages: [],
    linkedTitle: null,
    status: 'published',
    isFeatured: true,
    isPinned: false,
  });

  // ==================== 4. COMMUNITY ROOMS & CHAT MODERATION STATE ====================
  const [commRooms, setCommRooms] = useState([]);
  const [newRoomForm, setNewRoomForm] = useState({
    name: '',
    description: '',
    icon: '🎬',
    topic: 'general',
    slowModeSeconds: 0,
  });

  // ==================== 5. REVIEWS & COMMENTS MODERATION STATE ====================
  const [allReviews, setAllReviews] = useState([]);
  const [allComments, setAllComments] = useState([]);

  // ==================== 6. USERS & STAFF MANAGEMENT STATE ====================
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.ADMIN,
  });

  // ==================== 7. SUPERADMIN CATALOG, CRAWLER & API KEYS STATE ====================
  const [dbTitles, setDbTitles] = useState([]);
  const [titleQuery, setTitleQuery] = useState('');
  const [titleTypeFilter, setTitleTypeFilter] = useState('');
  const [modalTitle, setModalTitle] = useState(null);
  const [creatingNewTitle, setCreatingNewTitle] = useState(false);

  const [crawler, setCrawler] = useState(null);
  const [quotaForm, setQuotaForm] = useState({
    maxTitles: 100000,
    movieQuota: 50000,
    webSeriesQuota: 25000,
    tvQuota: 25000,
    maxPerYearMovie: 1200,
    maxPerYearWebSeries: 700,
    maxPerYearTv: 700,
  });

  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState({ label: '', key: '', priority: 10 });

  // Loaders
  const loadOverview = () =>
    reviewService.admin
      .stats()
      .then(setStats)
      .catch(() => {});
  const loadFeatured = () =>
    featuredApi
      .listAdmin()
      .then(setFeaturedItems)
      .catch(() => {});
  const loadBlogs = () =>
    blogApi
      .list({ status: 'all', limit: 50 })
      .then((r) => setBlogs(r.items || []))
      .catch(() => {});
  const loadCommunity = () =>
    communityApi
      .listRooms()
      .then(setCommRooms)
      .catch(() => {});
  const loadModeration = () => {
    reviewService.admin
      .reviews()
      .then((d) => setAllReviews(d.reviews || []))
      .catch(() => {});
    reviewService.admin
      .comments()
      .then((d) => setAllComments(d.comments || []))
      .catch(() => {});
  };
  const loadUsers = () =>
    authService
      .users({ q: userSearch })
      .then(setUsers)
      .catch(() => {});
  const loadCatalog = () => {
    if (!isSuper) return;
    reviewService.superadmin
      .titles({ q: titleQuery, type: titleTypeFilter })
      .then((d) => setDbTitles(d.items || []))
      .catch(() => {});
  };
  const loadCrawler = () => {
    if (!isSuper) return;
    reviewService.superadmin
      .crawlerStatus()
      .then((c) => {
        setCrawler(c);
        if (c?.quotas) {
          setQuotaForm({
            maxTitles: c.quotas.total || 100000,
            movieQuota: c.quotas.movie || 50000,
            webSeriesQuota: c.quotas.webseries || 25000,
            tvQuota: c.quotas.tv || 25000,
            maxPerYearMovie: c.quotas.maxPerYearMovie || 1200,
            maxPerYearWebSeries: c.quotas.maxPerYearWebSeries || 700,
            maxPerYearTv: c.quotas.maxPerYearTv || 700,
          });
        }
      })
      .catch(() => {});
  };
  const loadKeys = () => {
    if (!isSuper) return;
    reviewService.superadmin
      .keys()
      .then(setKeys)
      .catch(() => {});
  };

  useEffect(() => {
    setSidebarOpen(false);
    if (activeSection === 'overview') loadOverview();
    if (activeSection === 'featured') loadFeatured();
    if (activeSection === 'blogs') loadBlogs();
    if (activeSection === 'community') loadCommunity();
    if (activeSection === 'reviews') loadModeration();
    if (activeSection === 'users') loadUsers();
    if (activeSection === 'catalog') loadCatalog();
    if (activeSection === 'crawler') loadCrawler();
    if (activeSection === 'api-keys') loadKeys();
  }, [activeSection]); // eslint-disable-line

  // Auto-populate Blog Editor if navigated from Movie Details (/admin/blogs?tmdbId=550&type=movie)
  useEffect(() => {
    const qTmdbId = searchParams.get('tmdbId');
    const qType = searchParams.get('type') || 'movie';
    const qEditId = searchParams.get('editId');

    if (activeSection === 'blogs' && qTmdbId) {
      handleFetchMovieAssetsForBlog(qType, qTmdbId);
    }
    if (activeSection === 'blogs' && qEditId) {
      blogApi
        .get(qEditId)
        .then((res) => {
          if (res.blog) startEditingBlog(res.blog);
        })
        .catch(() => {});
    }
  }, [activeSection, searchParams]); // eslint-disable-line

  // ==================== BLOG STUDIO EDITOR HELPERS ====================
  const handleFetchMovieAssetsForBlog = async (type, tmdbId) => {
    if (!tmdbId) return;
    setFetchingAssets(true);
    try {
      const assets = await blogApi.previewMovieAssets(type || 'movie', tmdbId);
      setBlogForm((prev) => ({
        ...prev,
        tmdbId: assets.tmdbId,
        mediaType: assets.subType || assets.mediaType || type,
        coverImage: assets.coverImage || prev.coverImage,
        posterImage: assets.posterImage || prev.posterImage,
        galleryImages: assets.galleryImages || [],
        linkedTitle: assets.linkedTitleSnapshot || null,
        title:
          prev.title ||
          `${assets.linkedTitleSnapshot?.title || 'Movie'}: Complete Review & Box Office Breakdown`,
        subtitle:
          prev.subtitle ||
          `Everything you need to know about ${assets.linkedTitleSnapshot?.title || 'this release'} — story, performances, and trade verdict.`,
      }));
      notify(
        `Fetched backdrop, poster & ${assets.galleryImages?.length || 0} stills for ${assets.linkedTitleSnapshot?.title}!`,
      );
    } catch (err) {
      notify(
        err.response?.data?.message ||
          'Could not fetch movie images for that ID',
      );
    } finally {
      setFetchingAssets(false);
    }
  };

  const searchMovieForBlog = async (e) => {
    e.preventDefault();
    if (!blogMovieSearchQ.trim()) return;
    const res = await tmdb.search(blogMovieSearchQ.trim());
    setBlogMovieHits((res.items || res.results || []).slice(0, 6));
  };

  const insertIntoBlogContent = (snippet) => {
    setBlogForm((prev) => ({
      ...prev,
      content: `${prev.content}${prev.content.endsWith('\n') || !prev.content ? '' : '\n\n'}${snippet}\n\n`,
    }));
  };

  const startEditingBlog = (b) => {
    setEditingBlogId(b.id);
    setBlogForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      summary: b.summary || '',
      content: b.content || '',
      category: b.category || 'Editorial',
      tags: (b.tags || []).join(', '),
      tmdbId: b.tmdbId || '',
      mediaType: b.subType || b.mediaType || 'movie',
      coverImage: b.coverImage || '',
      posterImage: b.posterImage || '',
      galleryImages: b.galleryImages || [],
      linkedTitle: b.linkedTitle || null,
      status: b.status || 'published',
      isFeatured: Boolean(b.isFeatured),
      isPinned: Boolean(b.isPinned),
    });
  };

  const resetBlogForm = () => {
    setEditingBlogId(null);
    setBlogForm({
      title: '',
      subtitle: '',
      summary: '',
      content: '',
      category: 'Editorial',
      tags: 'bollywood, box-office, review',
      tmdbId: '',
      mediaType: 'movie',
      coverImage: '',
      posterImage: '',
      galleryImages: [],
      linkedTitle: null,
      status: 'published',
      isFeatured: true,
      isPinned: false,
    });
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...blogForm,
        tmdbId: blogForm.tmdbId ? Number(blogForm.tmdbId) : null,
        tags: String(blogForm.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (editingBlogId) {
        await blogApi.update(editingBlogId, payload);
        notify('Blog article updated!');
      } else {
        await blogApi.create(payload);
        notify('New blog article published!');
      }
      resetBlogForm();
      loadBlogs();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save blog');
    }
  };

  // ==================== FEATURED HERO CAROUSEL HELPERS ====================
  const searchMovieForFeatured = async (e) => {
    e.preventDefault();
    if (!featSearchQ.trim()) return;
    const res = await tmdb.search(featSearchQ.trim());
    setFeatSearchResults((res.items || res.results || []).slice(0, 6));
  };

  const handleAddFeatured = async (e) => {
    e.preventDefault();
    if (!featForm.tmdbId) return;
    try {
      await featuredApi.add({
        ...featForm,
        tmdbId: Number(featForm.tmdbId),
      });
      setFeatForm({
        tmdbId: '',
        type: 'movie',
        badgeText: 'Featured on Movies Hub',
        customTitle: '',
        customTagline: '',
        customOverview: '',
        customBackdropUrl: '',
      });
      loadFeatured();
      notify('Added to Home Featured Hero Carousel!');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to add featured item');
    }
  };

  const moveFeaturedItem = async (idx, dir) => {
    const next = [...featuredItems];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setFeaturedItems(next);
    await featuredApi.reorder(next.map((x) => x.featuredId || x.id));
    loadFeatured();
  };

  // ==================== SIDEBAR NAVIGATION ITEMS ====================
  const navGroups = [
    {
      title: 'Management Studio',
      items: [
        {
          key: 'overview',
          to: '/admin',
          label: 'Analytics Overview',
          icon: LayoutDashboard,
        },
        {
          key: 'featured',
          to: '/admin/featured',
          label: 'Featured Hero Carousel',
          icon: Sparkles,
        },
        {
          key: 'blogs',
          to: '/admin/blogs',
          label: 'Blog Studio & Editor',
          icon: BookOpen,
        },
        {
          key: 'community',
          to: '/admin/community',
          label: 'Community & Chat Rooms',
          icon: MessageSquare,
        },
        {
          key: 'reviews',
          to: '/admin/reviews',
          label: 'Critics & Moderation',
          icon: Award,
        },
        {
          key: 'users',
          to: '/admin/users',
          label: isSuper ? 'Users & Staff Roles' : 'User Management',
          icon: Users,
        },
      ],
    },
    ...(isSuper
      ? [
          {
            title: 'SuperAdmin Exclusive',
            items: [
              {
                key: 'catalog',
                to: '/admin/catalog',
                label: 'Media & Box Office DB',
                icon: Database,
              },
              {
                key: 'crawler',
                to: '/admin/crawler',
                label: '1-Lakh Crawler Engine',
                icon: Cpu,
              },
              {
                key: 'api-keys',
                to: '/admin/api-keys',
                label: 'TMDB API Key Pool',
                icon: KeyRound,
              },
            ],
          },
        ]
      : []),
  ];

  const c = stats?.counts || {};

  return (
    <div className='flex min-h-screen bg-[#070a10] text-white'>
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className='fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden'
        />
      )}

      {/* Left Sidebar (Dedicated Admin & SuperAdmin Panel) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0e131f] transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Studio Brand Header */}
        <div className='flex items-center justify-between border-b border-white/10 px-5 py-4'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5b942] to-amber-500 text-black shadow-lg shadow-[#f5b942]/20'>
              <Shield size={20} />
            </span>
            <div>
              <h1
                style={{ fontFamily: 'var(--font-display)' }}
                className='text-base font-extrabold'
              >
                Movies Hub Studio
              </h1>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                  isSuper
                    ? 'bg-[#f5b942] text-black'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {user?.role} Panel
              </span>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setSidebarOpen(false)}
            className='rounded-lg p-1 text-zinc-400 lg:hidden'
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className='studio-scroll flex-1 space-y-6 overflow-y-auto px-3.5 py-5'>
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className='mb-2 px-3 text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase'>
                {group.title}
              </p>
              <div className='space-y-1'>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.key;
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                        active
                          ? 'bg-[#f5b942] text-black shadow-md shadow-[#f5b942]/20'
                          : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Back to User Panel & Sign Out */}
        <div className='space-y-2 border-t border-white/10 p-4'>
          <Link
            to='/'
            className='flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white hover:border-[#f5b942] hover:text-[#f5b942]'
          >
            <ArrowLeft size={14} /> Exit to User App
          </Link>
          <button
            type='button'
            onClick={() => dispatch(openLogoutModal())}
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20'
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className='flex flex-1 flex-col min-w-0'>
        {/* Top Studio Bar */}
        <header className='sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#070a10]/90 px-4 py-3.5 backdrop-blur-xl sm:px-8'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => setSidebarOpen(true)}
              className='rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 lg:hidden'
            >
              <Menu size={18} />
            </button>
            <div>
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className='text-lg font-extrabold capitalize'
              >
                {activeSection.replace('-', ' ')}
              </h2>
              <p className='text-[11px] text-zinc-400'>
                Logged in as <b className='text-white'>{user?.name}</b> (
                {user?.role})
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {toast && (
              <span className='rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1 text-xs font-bold text-emerald-300'>
                {toast}
              </span>
            )}
            <button
              type='button'
              onClick={() =>
                dispatch(
                  setRegionAndCurrency(region === 'IN' ? 'GLOBAL' : 'IN'),
                )
              }
              className='rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-200'
            >
              {region === 'IN' ? '🇮🇳 ₹ INR' : '🌍 $ USD'}
            </button>
            <button
              type='button'
              onClick={() => dispatch(toggleTheme())}
              className='flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:text-[#f5b942]'
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Active Section Body */}
        <main className='flex-1 p-4 sm:p-8'>
          {/* =================================================================
              SECTION 1: OVERVIEW & ANALYTICS
             ================================================================= */}
          {activeSection === 'overview' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
                {[
                  {
                    label: 'Total Catalog',
                    value: c.titles || 0,
                    sub: 'Target: 1,00,000',
                  },
                  {
                    label: 'Movies',
                    value: c.movies || 0,
                    sub: 'Feature Films',
                  },
                  {
                    label: 'Web Series (OTT)',
                    value: c.webSeries || 0,
                    sub: 'Streaming Originals',
                  },
                  {
                    label: 'Featured Hero Slides',
                    value: c.featuredHeroCount || 0,
                    sub: 'Home Carousel',
                  },
                  {
                    label: 'Published Blogs',
                    value: c.blogsCount || 0,
                    sub: `${c.blogCommentsCount || 0} blog comments`,
                  },
                  {
                    label: 'Community Rooms',
                    value: c.communityRoomsCount || 0,
                    sub: `${c.communityMessagesCount || 0} chat msgs`,
                  },
                  {
                    label: 'Audience Reviews',
                    value: c.userReviews || 0,
                    sub: `${c.criticReviews || 0} critic reviews`,
                  },
                  {
                    label: 'Total Users',
                    value: c.users || 0,
                    sub: `${c.activeUsers || 0} active`,
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className='rounded-3xl border border-white/10 bg-[#0e131f] p-5'
                  >
                    <p className='text-xs text-zinc-400'>{k.label}</p>
                    <p className='mt-2 text-2xl font-extrabold text-white'>
                      {Number(k.value).toLocaleString('en-IN')}
                    </p>
                    <p className='mt-1 text-[11px] text-[#f5b942]'>{k.sub}</p>
                  </div>
                ))}
              </div>

              <div className='grid gap-6 lg:grid-cols-2'>
                <div className='rounded-3xl border border-white/10 bg-[#0e131f] p-6'>
                  <h3 className='mb-4 text-sm font-extrabold'>
                    Titles by Cinema Industry
                  </h3>
                  <div className='space-y-2.5 text-xs'>
                    {(stats?.byIndustry || []).slice(0, 8).map((row) => (
                      <div
                        key={row._id}
                        className='flex items-center justify-between'
                      >
                        <span className='capitalize text-zinc-300'>
                          {row._id}
                        </span>
                        <span className='font-bold text-[#f5b942]'>
                          {row.count.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='rounded-3xl border border-white/10 bg-[#0e131f] p-6'>
                  <h3 className='mb-4 text-sm font-extrabold'>
                    Titles by OTT Streaming Platform
                  </h3>
                  <div className='space-y-2.5 text-xs'>
                    {(stats?.byOtt || []).slice(0, 8).map((row) => (
                      <div
                        key={row._id}
                        className='flex items-center justify-between'
                      >
                        <span className='uppercase text-zinc-300'>
                          {row._id}
                        </span>
                        <span className='font-bold text-emerald-400'>
                          {row.count.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 2: FEATURED HERO CAROUSEL MANAGER (Admin & SuperAdmin)
             ================================================================= */}
          {activeSection === 'featured' && (
            <div className='space-y-6'>
              <div className='rounded-3xl border border-[#f5b942]/30 bg-[#0e131f] p-6'>
                <h3 className='text-base font-extrabold text-white'>
                  Manage Home Page Featured Hero Carousel
                </h3>
                <p className='mt-1 text-xs text-zinc-400'>
                  When active items exist below,{' '}
                  <b className='text-[#f5b942]'>
                    only these selected movies/web-series
                  </b>{' '}
                  are displayed on the Home page Hero Carousel. If this list is
                  empty, the Home page automatically falls back to Trending
                  Movies & Series.
                </p>

                {/* Quick Search Movie to Add */}
                <form
                  onSubmit={searchMovieForFeatured}
                  className='mt-4 flex gap-2'
                >
                  <input
                    value={featSearchQ}
                    onChange={(e) => setFeatSearchQ(e.target.value)}
                    placeholder='Search any movie or web series by title to add to Featured Carousel...'
                    className='flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white'
                  />
                  <button className='rounded-xl bg-[#f5b942] px-5 py-2 text-xs font-extrabold text-black'>
                    Search Catalog
                  </button>
                </form>

                {featSearchResults.length > 0 && (
                  <div className='no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-2'>
                    {featSearchResults.map((m) => (
                      <button
                        key={`${m.type}-${m.id}`}
                        type='button'
                        onClick={() => {
                          setFeatForm({
                            ...featForm,
                            tmdbId: m.id,
                            type: m.isWebSeries
                              ? 'webseries'
                              : m.type || 'movie',
                            customTitle: m.title || m.name,
                          });
                          setFeatSearchResults([]);
                        }}
                        className='flex shrink-0 items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 p-2 text-left text-xs hover:border-[#f5b942]'
                      >
                        <SafeImage
                          src={m.posterUrl}
                          alt={m.title}
                          className='h-12 w-8 rounded object-cover'
                        />
                        <div>
                          <p className='font-bold text-white'>
                            {m.title || m.name}
                          </p>
                          <p className='text-[10px] text-zinc-400'>
                            ID: {m.id} • {m.year}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleAddFeatured}
                  className='mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-4'
                >
                  <input
                    required
                    type='number'
                    placeholder='Movie TMDB ID (e.g. 550)'
                    value={featForm.tmdbId}
                    onChange={(e) =>
                      setFeatForm({ ...featForm, tmdbId: e.target.value })
                    }
                    className='rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
                  />
                  <CustomSelect
                    value={featForm.type}
                    onChange={(val) => setFeatForm({ ...featForm, type: val })}
                    options={[
                      { value: 'movie', label: '🎬 Movie' },
                      { value: 'webseries', label: '🔥 Web Series' },
                      { value: 'tv', label: '📺 TV Show' },
                    ]}
                  />
                  <input
                    placeholder='Badge Text (e.g. Featured on Movies Hub)'
                    value={featForm.badgeText}
                    onChange={(e) =>
                      setFeatForm({ ...featForm, badgeText: e.target.value })
                    }
                    className='rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
                  />
                  <button className='rounded-xl bg-[#f5b942] py-2 text-xs font-extrabold text-black hover:brightness-110'>
                    + Add to Hero Carousel
                  </button>
                </form>
              </div>

              {/* Current Featured Slides List */}
              <div className='space-y-3'>
                {featuredItems.length === 0 ? (
                  <p className='rounded-3xl border border-white/10 bg-[#0e131f] p-10 text-center text-xs text-zinc-400'>
                    No custom Featured items set — Home page is currently
                    showing Trending Movies & Series automatically.
                  </p>
                ) : (
                  featuredItems.map((item, idx) => (
                    <div
                      key={item.featuredId || item.id}
                      className='flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0e131f] p-4 sm:flex-row'
                    >
                      <div className='flex items-center gap-4'>
                        <span className='flex h-8 w-8 items-center justify-center rounded-full bg-[#f5b942] text-xs font-extrabold text-black'>
                          #{idx + 1}
                        </span>
                        <SafeImage
                          src={item.backdropUrl || item.posterUrl}
                          alt={item.title}
                          size='w300'
                          variant='backdrop'
                          className='h-16 w-28 rounded-xl object-cover'
                        />
                        <div>
                          <div className='flex items-center gap-2'>
                            <h4 className='text-sm font-bold text-white'>
                              {item.title}
                            </h4>
                            <span className='rounded bg-white/10 px-2 py-0.5 text-[10px] text-[#f5b942]'>
                              {item.badgeText}
                            </span>
                          </div>
                          <p className='text-xs text-zinc-400'>
                            TMDB #{item.id} • {item.year} •{' '}
                            {item.isActive ? 'Active on Home' : 'Paused'}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => moveFeaturedItem(idx, -1)}
                          disabled={idx === 0}
                          className='rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:bg-white/10 disabled:opacity-30'
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type='button'
                          onClick={() => moveFeaturedItem(idx, 1)}
                          disabled={idx === featuredItems.length - 1}
                          className='rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:bg-white/10 disabled:opacity-30'
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type='button'
                          onClick={() =>
                            featuredApi
                              .update(item.featuredId, {
                                isActive: !item.isActive,
                              })
                              .then(loadFeatured)
                          }
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                            item.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Hidden'}
                        </button>
                        <button
                          type='button'
                          onClick={() =>
                            featuredApi
                              .remove(item.featuredId)
                              .then(loadFeatured)
                          }
                          className='rounded-xl bg-rose-500/15 p-2 text-rose-400 hover:bg-rose-500/25'
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 3: FULL-FLEDGED BLOG STUDIO EDITOR (Admin & SuperAdmin)
             ================================================================= */}
          {activeSection === 'blogs' && (
            <div className='space-y-8'>
              <div className='rounded-3xl border border-white/15 bg-[#0e131f] p-6 shadow-2xl'>
                <div className='mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4'>
                  <div>
                    <h3 className='text-lg font-extrabold text-white'>
                      {editingBlogId
                        ? 'Editing Blog Article'
                        : 'Create New Movie-Linked Blog Article'}
                    </h3>
                    <p className='text-xs text-zinc-400'>
                      Select any movie by title or ID to automatically pull its
                      backdrop, poster, and gallery stills into your blog!
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    {['write', 'split', 'preview'].map((m) => (
                      <button
                        key={m}
                        type='button'
                        onClick={() => setEditorMode(m)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${
                          editorMode === m
                            ? 'bg-[#f5b942] text-black'
                            : 'bg-white/5 text-zinc-300'
                        }`}
                      >
                        {m === 'split' ? 'Split Studio' : m}
                      </button>
                    ))}
                    {editingBlogId && (
                      <button
                        type='button'
                        onClick={resetBlogForm}
                        className='rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300'
                      >
                        + New Article
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 1: Select a Movie to Auto-Fetch Images */}
                <div className='mb-6 rounded-2xl border border-[#f5b942]/25 bg-[#070a10]/70 p-4'>
                  <label className='mb-2 block text-xs font-bold text-[#f5b942] uppercase'>
                    Step 1 — Select Movie / Web Series to Auto-Fetch Backdrop &
                    Gallery Images
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    <div className='flex flex-1 gap-2 min-w-[240px]'>
                      <input
                        value={blogMovieSearchQ}
                        onChange={(e) => setBlogMovieSearchQ(e.target.value)}
                        placeholder='Search movie name (e.g. Jawan, Pushpa, Oppenheimer)...'
                        className='flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
                      />
                      <button
                        type='button'
                        onClick={searchMovieForBlog}
                        className='rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20'
                      >
                        Search
                      </button>
                    </div>

                    <div className='flex items-center gap-2'>
                      <input
                        type='number'
                        placeholder='Or TMDB ID'
                        value={blogForm.tmdbId}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, tmdbId: e.target.value })
                        }
                        className='w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                      />
                      <div className='w-36'>
                        <CustomSelect
                          value={blogForm.mediaType}
                          onChange={(val) =>
                            setBlogForm({ ...blogForm, mediaType: val })
                          }
                          options={[
                            { value: 'movie', label: '🎬 Movie' },
                            { value: 'webseries', label: '🔥 Web Series' },
                            { value: 'tv', label: '📺 TV Show' },
                          ]}
                        />
                      </div>
                      <button
                        type='button'
                        disabled={fetchingAssets}
                        onClick={() =>
                          handleFetchMovieAssetsForBlog(
                            blogForm.mediaType,
                            blogForm.tmdbId,
                          )
                        }
                        className='rounded-xl bg-[#f5b942] px-4 py-2 text-xs font-extrabold text-black'
                      >
                        {fetchingAssets ? 'Fetching...' : 'Fetch Movie Images'}
                      </button>
                    </div>
                  </div>

                  {blogMovieHits.length > 0 && (
                    <div className='no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1'>
                      {blogMovieHits.map((mv) => (
                        <button
                          key={mv.id}
                          type='button'
                          onClick={() => {
                            setBlogMovieHits([]);
                            handleFetchMovieAssetsForBlog(
                              mv.isWebSeries ? 'webseries' : mv.type || 'movie',
                              mv.id,
                            );
                          }}
                          className='flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-[#0e131f] p-2 text-left text-xs hover:border-[#f5b942]'
                        >
                          <SafeImage
                            src={mv.posterUrl}
                            alt={mv.title}
                            className='h-12 w-8 rounded object-cover'
                          />
                          <div>
                            <p className='font-bold text-white'>
                              {mv.title || mv.name}
                            </p>
                            <p className='text-[10px] text-[#f5b942]'>
                              Click to auto-fetch images
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Auto-Fetched Movie Stills Strip (Click any still to set as cover or insert into article!) */}
                  {blogForm.galleryImages?.length > 0 && (
                    <div className='mt-4 border-t border-white/10 pt-3'>
                      <p className='mb-2 text-[11px] text-zinc-400'>
                        Auto-fetched Stills for{' '}
                        <b className='text-white'>
                          {blogForm.linkedTitle?.title}
                        </b>{' '}
                        — Click any image to insert into your blog body:
                      </p>
                      <div className='no-scrollbar flex gap-2.5 overflow-x-auto pb-1'>
                        {blogForm.galleryImages.map((imgUrl, i) => (
                          <div key={i} className='group relative shrink-0'>
                            <SafeImage
                              src={imgUrl}
                              alt='Still'
                              className='h-16 w-28 rounded-xl border border-white/15 object-cover'
                            />
                            <div className='absolute inset-0 flex items-center justify-center gap-1 rounded-xl bg-black/75 opacity-0 transition group-hover:opacity-100'>
                              <button
                                type='button'
                                onClick={() =>
                                  setBlogForm({
                                    ...blogForm,
                                    coverImage: imgUrl,
                                  })
                                }
                                className='rounded bg-[#f5b942] px-1.5 py-0.5 text-[9px] font-bold text-black'
                              >
                                Cover
                              </button>
                              <button
                                type='button'
                                onClick={() =>
                                  insertIntoBlogContent(
                                    `![${blogForm.linkedTitle?.title || 'Movie Still'}](${imgUrl})`,
                                  )
                                }
                                className='rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-black'
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
                <form onSubmit={handleSaveBlog} className='space-y-4'>
                  <div className='grid gap-4 sm:grid-cols-3'>
                    <div className='sm:col-span-2'>
                      <label className='mb-1 block text-xs text-zinc-400'>
                        Article Headline *
                      </label>
                      <input
                        required
                        value={blogForm.title}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, title: e.target.value })
                        }
                        placeholder='e.g. Why Kalki 2898 AD Redefined Indian Sci-Fi Blockbusters'
                        className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-bold text-white'
                      />
                    </div>
                    <CustomSelect
                      label='Editorial Category'
                      value={blogForm.category}
                      onChange={(val) =>
                        setBlogForm({ ...blogForm, category: val })
                      }
                      options={BLOG_CATEGORIES.map((c) => ({
                        value: c,
                        label: c,
                      }))}
                    />
                  </div>

                  <div className='grid gap-4 sm:grid-cols-3'>
                    <div className='sm:col-span-2'>
                      <label className='mb-1 block text-xs text-zinc-400'>
                        Subtitle / Deck
                      </label>
                      <input
                        value={blogForm.subtitle}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, subtitle: e.target.value })
                        }
                        placeholder='A concise hook shown below the headline...'
                        className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
                      />
                    </div>
                    <div>
                      <label className='mb-1 block text-xs text-zinc-400'>
                        Tags (comma separated)
                      </label>
                      <input
                        value={blogForm.tags}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, tags: e.target.value })
                        }
                        className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
                      />
                    </div>
                  </div>

                  {/* Rich Formatting Toolbar */}
                  <div className='flex flex-wrap items-center gap-1.5 rounded-t-2xl border border-white/10 bg-[#070a10] p-2'>
                    <button
                      type='button'
                      onClick={() =>
                        insertIntoBlogContent('## Section Heading')
                      }
                      className='flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white'
                    >
                      <Heading1 size={13} /> H2
                    </button>
                    <button
                      type='button'
                      onClick={() => insertIntoBlogContent('### Sub-Heading')}
                      className='flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white'
                    >
                      <Heading2 size={13} /> H3
                    </button>
                    <button
                      type='button'
                      onClick={() =>
                        insertIntoBlogContent(
                          '> “Insert a standout critic quote or box office highlight here.”',
                        )
                      }
                      className='flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white'
                    >
                      <Quote size={13} /> Quote
                    </button>
                    <button
                      type='button'
                      onClick={() =>
                        insertIntoBlogContent(
                          '- Key Highlight 1\n- Key Highlight 2\n- Key Highlight 3',
                        )
                      }
                      className='flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white'
                    >
                      <List size={13} /> Bullet List
                    </button>
                    {blogForm.coverImage && (
                      <button
                        type='button'
                        onClick={() =>
                          insertIntoBlogContent(
                            `![${blogForm.linkedTitle?.title || 'Movie Scene'}](${blogForm.coverImage})`,
                          )
                        }
                        className='flex items-center gap-1 rounded-lg bg-[#f5b942]/15 px-2.5 py-1.5 text-xs font-bold text-[#f5b942]'
                      >
                        <ImageIcon size={13} /> Insert Movie Backdrop
                      </button>
                    )}
                  </div>

                  {/* Editor + Live Preview Pane */}
                  <div
                    className={`grid gap-4 ${editorMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}
                  >
                    {editorMode !== 'preview' && (
                      <textarea
                        required
                        rows={14}
                        value={blogForm.content}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, content: e.target.value })
                        }
                        placeholder='Write your full article here... Use ## for headings, > for quotes, - for lists, and click any movie still above to embed images!'
                        className='w-full rounded-b-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs leading-relaxed text-white focus:border-[#f5b942] focus:outline-none'
                      />
                    )}

                    {editorMode !== 'write' && (
                      <div className='studio-scroll max-h-[380px] overflow-y-auto rounded-2xl border border-white/10 bg-[#070a10] p-5'>
                        <span className='mb-2 inline-block text-[10px] font-bold tracking-wider text-[#f5b942] uppercase'>
                          Live Article Preview
                        </span>
                        {blogForm.coverImage && (
                          <SafeImage
                            src={blogForm.coverImage}
                            alt={blogForm.title}
                            className='mb-4 aspect-video w-full rounded-xl object-cover'
                          />
                        )}
                        <h2 className='mb-3 text-xl font-extrabold text-white'>
                          {blogForm.title || 'Untitled Blog Post'}
                        </h2>
                        <RenderRichBlogContent
                          content={
                            blogForm.content ||
                            'Start typing on the left to preview your formatted article...'
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className='flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4'>
                    <div className='flex flex-wrap items-center gap-4 text-xs'>
                      <div className='w-40'>
                        <CustomSelect
                          value={blogForm.status}
                          onChange={(val) =>
                            setBlogForm({ ...blogForm, status: val })
                          }
                          options={[
                            { value: 'published', label: '🟢 Published' },
                            { value: 'draft', label: '📝 Draft' },
                            { value: 'archived', label: '📦 Archived' },
                          ]}
                        />
                      </div>
                      <label className='flex items-center gap-2 text-zinc-300'>
                        <input
                          type='checkbox'
                          checked={blogForm.isFeatured}
                          onChange={(e) =>
                            setBlogForm({
                              ...blogForm,
                              isFeatured: e.target.checked,
                            })
                          }
                          className='accent-[#f5b942]'
                        />
                        Featured Blog
                      </label>
                      <label className='flex items-center gap-2 text-zinc-300'>
                        <input
                          type='checkbox'
                          checked={blogForm.isPinned}
                          onChange={(e) =>
                            setBlogForm({
                              ...blogForm,
                              isPinned: e.target.checked,
                            })
                          }
                          className='accent-[#f5b942]'
                        />
                        Pin to Top
                      </label>
                    </div>

                    <button className='rounded-full bg-[#f5b942] px-7 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-[#f5b942]/20 hover:brightness-110'>
                      {editingBlogId
                        ? 'Save Updated Article'
                        : 'Publish Blog Article'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Blogs Table */}
              <div className='space-y-3'>
                <h3 className='text-base font-extrabold'>
                  All Managed Blog Articles ({blogs.length})
                </h3>
                {blogs.map((b) => (
                  <div
                    key={b.id}
                    className='flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0e131f] p-4 sm:flex-row'
                  >
                    <div className='flex items-center gap-4'>
                      <SafeImage
                        src={b.coverImage || b.posterImage}
                        alt={b.title}
                        className='h-14 w-24 rounded-xl object-cover'
                      />
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className='rounded bg-[#f5b942]/15 px-2 py-0.5 text-[10px] font-bold text-[#f5b942]'>
                            {b.category}
                          </span>
                          <span className='rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase'>
                            {b.status}
                          </span>
                        </div>
                        <Link
                          to={`/blogs/${b.slug}`}
                          className='mt-1 block text-sm font-bold text-white hover:text-[#f5b942]'
                        >
                          {b.title}
                        </Link>
                        <p className='text-[11px] text-zinc-400'>
                          {b.linkedTitle?.title
                            ? `🎬 ${b.linkedTitle.title} • `
                            : ''}
                          {b.likeCount || 0} likes • {b.commentCount || 0}{' '}
                          comments • {b.viewsCount || 0} views
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Link
                        to={`/blogs/${b.slug}`}
                        className='rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10'
                      >
                        View Page
                      </Link>
                      <button
                        type='button'
                        onClick={() => {
                          startEditingBlog(b);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className='flex items-center gap-1 rounded-xl bg-[#f5b942] px-3 py-1.5 text-xs font-bold text-black'
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => blogApi.remove(b.id).then(loadBlogs)}
                        className='rounded-xl bg-rose-500/15 p-2 text-rose-400 hover:bg-rose-500/25'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 4: COMMUNITY ROOMS & CHAT MODERATION
             ================================================================= */}
          {activeSection === 'community' && (
            <div className='space-y-6'>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await communityApi.createRoom(newRoomForm);
                  setNewRoomForm({
                    name: '',
                    description: '',
                    icon: '🎬',
                    topic: 'general',
                    slowModeSeconds: 0,
                  });
                  loadCommunity();
                  notify('Community chat room created!');
                }}
                className='rounded-3xl border border-white/10 bg-[#0e131f] p-6'
              >
                <h3 className='mb-3 text-sm font-extrabold'>
                  Create New Official Community Lounge
                </h3>
                <div className='grid gap-3 sm:grid-cols-5'>
                  <input
                    required
                    placeholder='Lounge Name'
                    value={newRoomForm.name}
                    onChange={(e) =>
                      setNewRoomForm({ ...newRoomForm, name: e.target.value })
                    }
                    className='rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white sm:col-span-2'
                  />
                  <input
                    placeholder='Description'
                    value={newRoomForm.description}
                    onChange={(e) =>
                      setNewRoomForm({
                        ...newRoomForm,
                        description: e.target.value,
                      })
                    }
                    className='rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white sm:col-span-2'
                  />
                  <button className='rounded-xl bg-[#f5b942] py-2 text-xs font-extrabold text-black'>
                    + Create Lounge
                  </button>
                </div>
              </form>

              <div className='grid gap-3 sm:grid-cols-2'>
                {commRooms.map((r) => (
                  <div
                    key={r.id}
                    className='flex items-center justify-between rounded-2xl border border-white/10 bg-[#0e131f] p-4'
                  >
                    <div>
                      <p className='text-sm font-bold text-white'>
                        {r.icon} {r.name}
                      </p>
                      <p className='text-xs text-zinc-400'>
                        {r.messageCount || 0} messages • {r.onlineCount || 0}{' '}
                        online
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() =>
                          communityApi
                            .updateRoom(r.id, { isLocked: !r.isLocked })
                            .then(loadCommunity)
                        }
                        className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${
                          r.isLocked
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {r.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                        {r.isLocked ? 'Locked' : 'Open'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 5: CRITICS & AUDIENCE MODERATION
             ================================================================= */}
          {activeSection === 'reviews' && (
            <div className='space-y-6'>
              <h3 className='text-base font-extrabold'>
                Audience & Critic Reviews ({allReviews.length})
              </h3>
              <div className='space-y-2.5'>
                {allReviews.map((r) => (
                  <div
                    key={r._id || r.id}
                    className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-4 text-xs'
                  >
                    <div className='max-w-2xl'>
                      <div className='flex items-center gap-2'>
                        <span className='rounded bg-[#f5b942]/15 px-2 py-0.5 font-bold text-[#f5b942] uppercase'>
                          {r.reviewType} • ★ {r.rating}/10
                        </span>
                        <b>{r.criticName || r.user?.name || 'User'}</b>
                        <span className='text-zinc-500'>
                          ({r.type} #{r.tmdbId})
                        </span>
                      </div>
                      <p className='mt-1.5 text-zinc-300'>{r.text}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() =>
                          reviewService.admin
                            .moderateReview(r._id || r.id, {
                              isHidden: !r.isHidden,
                            })
                            .then(loadModeration)
                        }
                        className='rounded-xl border border-white/10 px-3 py-1.5 text-xs'
                      >
                        {r.isHidden ? 'Unhide' : 'Hide'}
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          reviewService.admin
                            .deleteReview(r._id || r.id)
                            .then(loadModeration)
                        }
                        className='rounded-xl bg-rose-500/15 p-2 text-rose-400'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 6: USERS & STAFF ROLES
             ================================================================= */}
          {activeSection === 'users' && (
            <div className='space-y-6'>
              {isSuper && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await authService.createStaff(newStaff);
                    setNewStaff({
                      name: '',
                      email: '',
                      password: '',
                      role: ROLES.ADMIN,
                    });
                    loadUsers();
                    notify('Account created!');
                  }}
                  className='grid gap-3 rounded-3xl border border-white/10 bg-[#0e131f] p-5 sm:grid-cols-5'
                >
                  <input
                    required
                    placeholder='Full Name'
                    value={newStaff.name}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, name: e.target.value })
                    }
                    className='rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                  />
                  <input
                    required
                    type='email'
                    placeholder='Email'
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                    className='rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                  />
                  <input
                    required
                    type='password'
                    minLength={6}
                    placeholder='Password'
                    value={newStaff.password}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, password: e.target.value })
                    }
                    className='rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                  />
                  <CustomSelect
                    value={newStaff.role}
                    onChange={(val) => setNewStaff({ ...newStaff, role: val })}
                    options={[
                      { value: ROLES.ADMIN, label: '🛡️ Admin' },
                      { value: ROLES.USER, label: '👤 User' },
                    ]}
                  />
                  <button className='rounded-xl bg-[#f5b942] py-2 text-xs font-extrabold text-black'>
                    + Create Account
                  </button>
                </form>
              )}

              <div className='overflow-x-auto rounded-3xl border border-white/10 bg-[#0e131f]'>
                <table className='w-full text-left text-xs'>
                  <thead className='border-b border-white/10 text-zinc-400'>
                    <tr>
                      <th className='p-4'>Name</th>
                      <th className='p-4'>Email</th>
                      <th className='p-4'>Role</th>
                      <th className='p-4'>Status</th>
                      <th className='p-4 text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/5'>
                    {users.map((u) => {
                      const canToggle =
                        u.id !== user.id &&
                        u.role !== ROLES.SUPERADMIN &&
                        (isSuper || u.role === ROLES.USER);
                      return (
                        <tr key={u.id}>
                          <td className='p-4 font-bold text-white'>{u.name}</td>
                          <td className='p-4 text-zinc-400'>{u.email}</td>
                          <td className='p-4'>
                            {isSuper &&
                            u.role !== ROLES.SUPERADMIN &&
                            u.id !== user.id ? (
                              <div className='w-32'>
                                <CustomSelect
                                  value={u.role}
                                  onChange={(val) =>
                                    authService
                                      .setRole(u.id, val)
                                      .then(loadUsers)
                                  }
                                  options={[
                                    { value: ROLES.USER, label: 'user' },
                                    { value: ROLES.ADMIN, label: 'admin' },
                                  ]}
                                />
                              </div>
                            ) : (
                              <span className='rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase'>
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className='p-4'>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                u.isActive !== false
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {u.isActive !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className='p-4 text-right'>
                            <div className='flex justify-end gap-2'>
                              {canToggle && (
                                <button
                                  type='button'
                                  onClick={() =>
                                    authService
                                      .setActive(u.id, u.isActive === false)
                                      .then(loadUsers)
                                  }
                                  className='rounded-xl border border-white/10 px-3 py-1 text-xs font-bold'
                                >
                                  {u.isActive === false
                                    ? 'Activate'
                                    : 'Suspend'}
                                </button>
                              )}
                              {isSuper &&
                                u.role !== ROLES.SUPERADMIN &&
                                u.id !== user.id && (
                                  <button
                                    type='button'
                                    onClick={() =>
                                      authService
                                        .removeUser(u.id)
                                        .then(loadUsers)
                                    }
                                    className='rounded-xl bg-rose-500/15 p-1.5 text-rose-400'
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 7: SUPERADMIN MEDIA & BOX OFFICE DB EDITOR
             ================================================================= */}
          {activeSection === 'catalog' && isSuper && (
            <div className='space-y-5'>
              <div className='flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#0e131f] p-5'>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadCatalog();
                  }}
                  className='flex flex-1 flex-wrap items-center gap-2.5'
                >
                  <input
                    value={titleQuery}
                    onChange={(e) => setTitleQuery(e.target.value)}
                    placeholder='Search title or TMDB ID...'
                    className='flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
                  />
                  <div className='w-44'>
                    <CustomSelect
                      value={titleTypeFilter}
                      onChange={setTitleTypeFilter}
                      options={[
                        { value: '', label: 'All Types' },
                        { value: 'movie', label: '🎬 Movies' },
                        { value: 'webseries', label: '🔥 Web Series' },
                        { value: 'tv', label: '📺 TV Shows' },
                      ]}
                    />
                  </div>
                  <button className='rounded-xl bg-[#f5b942] px-5 py-2 text-xs font-extrabold text-black'>
                    Search DB
                  </button>
                </form>

                <button
                  type='button'
                  onClick={() => setCreatingNewTitle(true)}
                  className='flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-black'
                >
                  <Plus size={14} /> Add Custom Movie / Series
                </button>
              </div>

              <div className='overflow-x-auto rounded-3xl border border-white/10 bg-[#0e131f]'>
                <table className='w-full text-left text-xs'>
                  <thead className='border-b border-white/10 text-zinc-400'>
                    <tr>
                      <th className='p-4'>Title</th>
                      <th className='p-4'>Type</th>
                      <th className='p-4'>Year</th>
                      <th className='p-4'>
                        Budget / Box Office ({region === 'IN' ? '₹' : '$'})
                      </th>
                      <th className='p-4 text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/5'>
                    {dbTitles.map((t) => (
                      <tr key={`${t.type}-${t.id}`}>
                        <td className='p-4 font-bold text-white'>{t.title}</td>
                        <td className='p-4 uppercase'>{t.subType || t.type}</td>
                        <td className='p-4'>{t.year || '—'}</td>
                        <td className='p-4 text-[#f5b942]'>
                          {getMovieFinancials(t, region).budgetText} /{' '}
                          <span className='text-emerald-400'>
                            {getMovieFinancials(t, region).revenueText}
                          </span>
                        </td>
                        <td className='p-4 text-right'>
                          <div className='flex justify-end gap-2'>
                            <button
                              type='button'
                              onClick={() => setModalTitle(t)}
                              className='flex items-center gap-1 rounded-xl bg-[#f5b942] px-3 py-1.5 text-xs font-bold text-black'
                            >
                              <Edit3 size={12} /> Edit Details / ₹ / Songs
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                reviewService.superadmin
                                  .deleteTitle(t.type, t.id)
                                  .then(loadCatalog)
                              }
                              className='rounded-xl bg-rose-500/15 p-1.5 text-rose-400'
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 8: SUPERADMIN 1-LAKH CRAWLER ENGINE
             ================================================================= */}
          {activeSection === 'crawler' && isSuper && crawler && (
            <div className='space-y-6 rounded-3xl border border-white/10 bg-[#0e131f] p-6'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <h3 className='text-lg font-extrabold'>
                    Quota-Balanced & Year-Interleaved 1-Lakh Crawler
                  </h3>
                  <p className='text-xs text-zinc-400'>
                    Status:{' '}
                    <b className='text-[#f5b942]'>
                      {crawler.running ? 'RUNNING' : 'IDLE'}
                    </b>{' '}
                    • Stored:{' '}
                    <b>{(crawler.titlesStored || 0).toLocaleString('en-IN')}</b>{' '}
                    / {(crawler.targetCap || 100000).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <button
                    type='button'
                    onClick={() =>
                      reviewService.superadmin
                        .crawlerStart({ restart: false })
                        .then(loadCrawler)
                    }
                    className='flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-2 text-xs font-extrabold text-black'
                  >
                    <Play size={13} fill='currentColor' /> Start / Resume
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      reviewService.superadmin.crawlerStop().then(loadCrawler)
                    }
                    className='flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-extrabold text-white'
                  >
                    <Square size={13} fill='currentColor' /> Stop
                  </button>
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-4'>
                {[
                  ['Total Cap', 'maxTitles'],
                  ['Movie Quota', 'movieQuota'],
                  ['Web Series Quota', 'webSeriesQuota'],
                  ['TV Quota', 'tvQuota'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className='mb-1 block text-xs text-zinc-400'>
                      {label}
                    </label>
                    <input
                      type='number'
                      value={quotaForm[key]}
                      onChange={(e) =>
                        setQuotaForm({
                          ...quotaForm,
                          [key]: Number(e.target.value),
                        })
                      }
                      className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                    />
                  </div>
                ))}
              </div>
              <button
                type='button'
                onClick={() =>
                  reviewService.superadmin
                    .crawlerUpdateCap(quotaForm)
                    .then(() => {
                      loadCrawler();
                      notify('Crawler quotas updated!');
                    })
                }
                className='rounded-xl bg-[#f5b942] px-5 py-2 text-xs font-extrabold text-black'
              >
                Save Crawler Quotas
              </button>
            </div>
          )}

          {/* =================================================================
              SECTION 9: SUPERADMIN ENCRYPTED TMDB API KEY POOL
             ================================================================= */}
          {activeSection === 'api-keys' && isSuper && (
            <div className='space-y-6'>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await reviewService.superadmin.addKey(newKey);
                  setNewKey({ label: '', key: '', priority: 10 });
                  loadKeys();
                  notify('TMDB API Key encrypted & added to pool!');
                }}
                className='grid gap-3 rounded-3xl border border-white/10 bg-[#0e131f] p-6 sm:grid-cols-4'
              >
                <input
                  required
                  placeholder='Key Label (e.g. Backup Key #2)'
                  value={newKey.label}
                  onChange={(e) =>
                    setNewKey({ ...newKey, label: e.target.value })
                  }
                  className='rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
                />
                <input
                  required
                  placeholder='32-char TMDB v3 API Key'
                  value={newKey.key}
                  onChange={(e) =>
                    setNewKey({ ...newKey, key: e.target.value })
                  }
                  className='rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 font-mono text-xs text-white sm:col-span-2'
                />
                <button className='rounded-xl bg-[#f5b942] py-2 text-xs font-extrabold text-black'>
                  + Add Encrypted Key
                </button>
              </form>

              <div className='space-y-2.5'>
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className='flex items-center justify-between rounded-2xl border border-white/10 bg-[#0e131f] p-4 text-xs'
                  >
                    <div>
                      <span className='font-bold text-white'>{k.label}</span>
                      <span className='ml-2 font-mono text-zinc-400'>
                        {k.maskedKey}
                      </span>
                      {k.inUse && (
                        <span className='ml-2 rounded bg-[#f5b942] px-2 py-0.5 text-[10px] font-bold text-black'>
                          ACTIVE NOW
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-zinc-400'>
                        {(k.requestCount || 0).toLocaleString()} reqs
                      </span>
                      <button
                        type='button'
                        onClick={() =>
                          reviewService.superadmin
                            .deleteKey(k.id)
                            .then(loadKeys)
                        }
                        className='rounded-xl bg-rose-500/15 p-1.5 text-rose-400'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {(modalTitle || creatingNewTitle) && (
        <TitleEditorModal
          title={modalTitle}
          onClose={() => {
            setModalTitle(null);
            setCreatingNewTitle(false);
          }}
          onSaved={loadCatalog}
        />
      )}
    </div>
  );
}
