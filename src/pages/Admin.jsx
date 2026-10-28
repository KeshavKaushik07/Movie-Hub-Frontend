import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ROLES } from '../config/constants';
import { authService } from '../services/authService';
import { reviewService } from '../services/reviewService';
import { tmdb, featuredApi, blogApi, communityApi } from '../services/api';
import { openLogoutModal } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';
import { notifyPatch } from '../utils/notify';

import TitleEditorModal from '../components/TitleEditorModal';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import OverviewSection from '../components/admin/OverviewSection';
import FeaturedSection from '../components/admin/FeaturedSection';
import BlogStudioSection from '../components/admin/BlogStudioSection';
import CommunitySection from '../components/admin/CommunitySection';
import ReviewsModerationSection from '../components/admin/ReviewsModerationSection';
import UsersSection from '../components/admin/UsersSection';
import CatalogSection from '../components/admin/CatalogSection';
import CrawlerSection from '../components/admin/CrawlerSection';
import ApiKeysSection from '../components/admin/ApiKeysSection';
import SettingsSection from '../components/admin/SettingsSection';
import {
  AdminOverviewSkeleton,
  AdminFeaturedSkeleton,
  AdminBlogsSkeleton,
  AdminCommunitySkeleton,
  AdminReviewsSkeleton,
  AdminUsersSkeleton,
  AdminCatalogSkeleton,
  AdminCrawlerSkeleton,
  AdminApiKeysSkeleton,
} from '../components/ui/Skeletons';
import {
  ReviewDetailEditModal,
  ChangePasswordModal,
  DeleteUserConfirmModal,
  DeleteRoomConfirmModal,
} from '../components/admin/AdminModals';

const CATALOG_PAGE_SIZE = 100;
const CATALOG_VISIBLE_LIMIT_KEY = 'movieshub_catalog_visible_limit_v1';

export default function Admin() {
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const { region } = useSelector((s) => s.preferences);
  const isSuper = user?.role === ROLES.SUPERADMIN;

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const subPath = location.pathname.replace(/^\/admin\/?/, '') || 'overview';
  const activeSection = subPath.split('/')[0] || 'overview';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [sectionTransitioning, setSectionTransitioning] = useState(false);

  const notify = (msg, patchType = 'info') => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
    const lower = String(msg || '').toLowerCase();
    const inferredType =
      patchType !== 'info'
        ? patchType
        : lower.includes('fail') ||
            lower.includes('could not') ||
            lower.includes('error') ||
            lower.includes('invalid')
          ? 'error'
          : lower.includes('not found') || lower.includes('no movie')
            ? 'not-found'
            : 'success';
    notifyPatch({
      type: inferredType,
      title:
        inferredType === 'error'
          ? 'Studio Action Failed'
          : inferredType === 'not-found'
            ? 'No Matches Found'
            : 'Studio Action Completed',
      message: msg,
    });
  };

  // ==================== SECTION STATES ====================
  const [stats, setStats] = useState(null);

  // Featured Hero Carousel
  const [featuredItems, setFeaturedItems] = useState([]);
  const [heroLimit, setHeroLimit] = useState(10);
  const [featSearchQ, setFeatSearchQ] = useState('');
  const [featSearchResults, setFeatSearchResults] = useState([]);
  const [featSearchAttempted, setFeatSearchAttempted] = useState(false);
  const [featForm, setFeatForm] = useState({
    tmdbId: '',
    type: 'movie',
    badgeText: 'Featured on Movies Hub',
    customTitle: '',
    customTagline: '',
    customOverview: '',
    customBackdropUrl: '',
  });

  // Blog Studio
  const [blogs, setBlogs] = useState([]);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [editorMode, setEditorMode] = useState('split');
  const [blogMovieSearchQ, setBlogMovieSearchQ] = useState('');
  const [blogMovieHits, setBlogMovieHits] = useState([]);
  const [blogSearchAttempted, setBlogSearchAttempted] = useState(false);
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

  // Community & Chat Rooms
  const [commRooms, setCommRooms] = useState([]);
  const [newRoomForm, setNewRoomForm] = useState({
    name: '',
    description: '',
    icon: '🎬',
    topic: 'general',
    slowModeSeconds: 0,
  });
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Critics & Reviews Moderation
  const [allReviews, setAllReviews] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [selectedReviewForModal, setSelectedReviewForModal] = useState(null);

  // Users & Staff (Separated in UI via /admin/users vs /admin/staff)
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.ADMIN,
  });
  const [userToDelete, setUserToDelete] = useState(null);
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [confirmUserPassword, setConfirmUserPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Media & Box Office DB (100 per page + SuperAdmin Visible Data Limit per Page)
  const [dbTitles, setDbTitles] = useState([]);
  const [dbTitlesTotal, setDbTitlesTotal] = useState(undefined);
  const [catalogFilteredTotal, setCatalogFilteredTotal] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [titleQuery, setTitleQuery] = useState('');
  const [titleTypeFilter, setTitleTypeFilter] = useState('');
  const [catalogSort, setCatalogSort] = useState('updated');
  const [catalogVisibleLimit, setCatalogVisibleLimit] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(CATALOG_VISIBLE_LIMIT_KEY));
      return Number.isFinite(saved) && saved >= 1 && saved <= CATALOG_PAGE_SIZE
        ? saved
        : CATALOG_PAGE_SIZE;
    } catch {
      return CATALOG_PAGE_SIZE;
    }
  });
  const [modalTitle, setModalTitle] = useState(null);
  const [creatingNewTitle, setCreatingNewTitle] = useState(false);

  const handleChangeCatalogVisibleLimit = (nextLimit) => {
    const clamped = Math.min(
      CATALOG_PAGE_SIZE,
      Math.max(1, Number(nextLimit) || CATALOG_PAGE_SIZE),
    );
    setCatalogVisibleLimit(clamped);
    try {
      localStorage.setItem(CATALOG_VISIBLE_LIMIT_KEY, String(clamped));
    } catch {
      /* ignore */
    }
    notify(
      `Now displaying ${clamped} out of ${CATALOG_PAGE_SIZE} data items on Page ${catalogPage}`,
    );
  };

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

  // Track which real lists have loaded so sidebar badges always reflect real section counts
  const [loadedFlags, setLoadedFlags] = useState({
    overview: false,
    featured: false,
    blogs: false,
    community: false,
    moderation: false,
    users: false,
    catalog: false,
    crawler: false,
    keys: false,
  });

  // ==================== DATA LOADERS ====================
  const loadOverview = () =>
    reviewService.admin
      .stats()
      .then((s) => {
        setStats(s);
        setLoadedFlags((p) => ({ ...p, overview: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, overview: true })));

  const loadFeatured = () =>
    featuredApi
      .listAdminFull()
      .then((res) => {
        const list = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        setFeaturedItems(list);
        if (Number.isFinite(Number(res?.heroLimit))) {
          setHeroLimit(Number(res.heroLimit));
        }
        setLoadedFlags((p) => ({ ...p, featured: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, featured: true })));

  const loadBlogs = () =>
    blogApi
      .list({ status: 'all', limit: 100 })
      .then((r) => {
        setBlogs(r.items || []);
        setLoadedFlags((p) => ({ ...p, blogs: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, blogs: true })));

  const loadCommunity = () =>
    communityApi
      .listRooms()
      .then((list) => {
        setCommRooms(Array.isArray(list) ? list : []);
        setLoadedFlags((p) => ({ ...p, community: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, community: true })));

  const loadModeration = () => {
    reviewService.admin
      .reviews()
      .then((d) => {
        setAllReviews(d.reviews || []);
        setLoadedFlags((p) => ({ ...p, moderation: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, moderation: true })));
    reviewService.admin
      .comments()
      .then((d) => setAllComments(d.comments || []))
      .catch(() => {});
  };

  const loadUsers = () =>
    authService
      .users({ q: userSearch, limit: 100 })
      .then((list) => {
        setUsers(Array.isArray(list) ? list : []);
        setLoadedFlags((p) => ({ ...p, users: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, users: true })));

  const loadCatalog = useCallback(
    (targetPage = catalogPage, overrides = {}) => {
      const nextPage = Math.max(1, Number(targetPage) || 1);
      const effectiveQ =
        overrides.q !== undefined ? overrides.q : titleQuery;
      const effectiveType =
        overrides.type !== undefined ? overrides.type : titleTypeFilter;
      const effectiveSort =
        overrides.sort !== undefined ? overrides.sort : catalogSort;

      const queryParams = {
        page: nextPage,
        limit: CATALOG_PAGE_SIZE,
        sort: effectiveSort,
      };
      if (effectiveQ && String(effectiveQ).trim()) {
        queryParams.q = String(effectiveQ).trim();
      }
      if (effectiveType === 'movie') {
        queryParams.type = 'movie';
        queryParams.subType = 'movie';
      } else if (effectiveType === 'webseries') {
        queryParams.type = 'tv';
        queryParams.subType = 'webseries';
      } else if (effectiveType === 'tv') {
        queryParams.type = 'tv';
        queryParams.subType = 'tv';
      }

      setCatalogLoading(true);
      reviewService.superadmin
        .titles(queryParams)
        .then((d) => {
          const items = Array.isArray(d?.items) ? d.items : [];
          const total = Number.isFinite(Number(d?.total))
            ? Number(d.total)
            : items.length;
          const totalPages = Math.max(
            1,
            Number(d?.totalPages) || Math.ceil(total / CATALOG_PAGE_SIZE) || 1,
          );

          setDbTitles(items);
          setCatalogPage(Number(d?.page) || nextPage);
          setCatalogFilteredTotal(total);
          setCatalogTotalPages(totalPages);

          if (!effectiveQ?.trim() && !effectiveType && Number.isFinite(d?.total)) {
            setDbTitlesTotal(d.total);
          }
          setLoadedFlags((p) => ({ ...p, catalog: true }));
        })
        .catch(() => setLoadedFlags((p) => ({ ...p, catalog: true })))
        .finally(() => setCatalogLoading(false));
    },
    [catalogPage, titleQuery, titleTypeFilter, catalogSort],
  );

  const loadCrawler = () => {
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
        setLoadedFlags((p) => ({ ...p, crawler: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, crawler: true })));
  };

  const loadKeys = () => {
    reviewService.superadmin
      .keys()
      .then((list) => {
        setKeys(Array.isArray(list) ? list : []);
        setLoadedFlags((p) => ({ ...p, keys: true }));
      })
      .catch(() => setLoadedFlags((p) => ({ ...p, keys: true })));
  };

  const loadAllAdminData = () => {
    loadOverview();
    loadFeatured();
    loadBlogs();
    loadCommunity();
    loadModeration();
    loadUsers();
    loadCatalog(1);
    loadCrawler();
    loadKeys();
  };

  // Preload all real section lists on mount so Sidebar numbers always match real content
  useEffect(() => {
    loadAllAdminData();
  }, [isSuper]); // eslint-disable-line

  const refreshActiveSection = (showSkeleton = false) => {
    if (showSkeleton) {
      setSectionTransitioning(true);
      setTimeout(() => setSectionTransitioning(false), 320);
    }
    loadOverview();
    if (activeSection === 'featured') loadFeatured();
    if (activeSection === 'blogs') loadBlogs();
    if (activeSection === 'community') loadCommunity();
    if (activeSection === 'reviews') loadModeration();
    if (activeSection === 'users' || activeSection === 'staff') loadUsers();
    if (activeSection === 'catalog') loadCatalog(catalogPage);
    if (activeSection === 'crawler') loadCrawler();
    if (activeSection === 'api-keys') loadKeys();
    if (activeSection === 'settings') {
      loadUsers();
      loadCrawler();
      loadFeatured();
      loadKeys();
    }
  };

  useEffect(() => {
    setSidebarOpen(false);
    setSectionTransitioning(true);
    refreshActiveSection(false);
    const mainEl = document.getElementById('admin-main-scroll');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'auto' });
    const t = setTimeout(() => setSectionTransitioning(false), 260);
    return () => clearTimeout(t);
  }, [activeSection]); // eslint-disable-line

  // Sync Catalog query parameters (`?type=movie|webseries|tv` and `?action=create`)
  useEffect(() => {
    if (activeSection !== 'catalog') return;
    const urlType = searchParams.get('type') || '';
    const urlAction = searchParams.get('action') || '';

    if (urlAction === 'create') {
      setCreatingNewTitle(true);
    }

    if (['', 'movie', 'webseries', 'tv'].includes(urlType) && urlType !== titleTypeFilter) {
      setTitleTypeFilter(urlType);
      setCatalogPage(1);
      loadCatalog(1, { type: urlType });
    }
  }, [activeSection, searchParams]); // eslint-disable-line

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

  // ==================== BLOG STUDIO HANDLERS ====================
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
        err.response?.data?.message || 'Could not fetch movie images for that ID',
        'error',
      );
    } finally {
      setFetchingAssets(false);
    }
  };

  const searchMovieForBlog = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!blogMovieSearchQ.trim()) return;
    setBlogSearchAttempted(true);
    const res = await tmdb.search(blogMovieSearchQ.trim());
    const hits = (res.items || res.results || []).slice(0, 6);
    setBlogMovieHits(hits);
    if (hits.length === 0) {
      notify(`No movies or web series found matching "${blogMovieSearchQ.trim()}"`, 'not-found');
    }
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
      notify(err.response?.data?.message || 'Failed to save blog', 'error');
    }
  };

  // ==================== FEATURED CAROUSEL HANDLERS ====================
  const searchMovieForFeatured = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!featSearchQ.trim()) return;
    setFeatSearchAttempted(true);
    const res = await tmdb.search(featSearchQ.trim());
    const hits = (res.items || res.results || []).slice(0, 6);
    setFeatSearchResults(hits);
    if (hits.length === 0) {
      notify(`No catalog titles found matching "${featSearchQ.trim()}"`, 'not-found');
    }
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
      notify(err.response?.data?.message || 'Failed to add featured item', 'error');
    }
  };

  const handleUpdateHeroLimit = async (nextLimit) => {
    try {
      const res = await featuredApi.updateConfig(nextLimit);
      const savedLimit = Number(res?.heroLimit) || Number(nextLimit) || 10;
      setHeroLimit(savedLimit);
      notify(`Home Hero Carousel slide count updated to ${savedLimit}!`);
    } catch (err) {
      notify(
        err.response?.data?.message || 'Failed to update Hero Carousel slide count',
        'error',
      );
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

  const handleQuickAddToFeatured = async (titleItem) => {
    try {
      await featuredApi.add({
        tmdbId: Number(titleItem.id || titleItem.tmdbId),
        type: titleItem.subType === 'webseries' ? 'webseries' : titleItem.type || 'movie',
        badgeText: 'Featured on Movies Hub',
      });
      notify(`Added "${titleItem.title}" to Home Featured Hero Carousel!`);
      loadFeatured();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not add to Featured Carousel', 'error');
    }
  };

  // Compute separated live counts for Sidebar dropdown badges
  const regularUsersList = (users || []).filter((u) => u.role === ROLES.USER);
  const adminUsersList = (users || []).filter((u) => u.role === ROLES.ADMIN);
  const superAdminUsersList = (users || []).filter(
    (u) => u.role === ROLES.SUPERADMIN,
  );
  const staffUsersList = (users || []).filter((u) =>
    [ROLES.ADMIN, ROLES.SUPERADMIN].includes(u.role),
  );
  const criticReviewsCount = (allReviews || []).filter(
    (r) => r.reviewType === 'critic',
  ).length;
  const audienceReviewsCount = (allReviews || []).filter(
    (r) => r.reviewType !== 'critic',
  ).length;

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#070a10] text-white">
      <AdminSidebar
        user={user}
        isSuper={isSuper}
        activeSection={activeSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={() => dispatch(openLogoutModal())}
        stats={stats}
        liveCounts={{
          featured: loadedFlags.featured ? featuredItems.length : undefined,
          blogs: loadedFlags.blogs ? blogs.length : undefined,
          community: loadedFlags.community ? commRooms.length : undefined,
          reviews: loadedFlags.moderation ? allReviews.length : undefined,
          criticReviews: loadedFlags.moderation ? criticReviewsCount : undefined,
          audienceReviews: loadedFlags.moderation ? audienceReviewsCount : undefined,
          comments: loadedFlags.moderation ? allComments.length : undefined,
          regularUsers:
            loadedFlags.users && !userSearch.trim() ? regularUsersList.length : undefined,
          activeRegularUsers:
            loadedFlags.users && !userSearch.trim()
              ? regularUsersList.filter((u) => u.isActive !== false).length
              : undefined,
          suspendedRegularUsers:
            loadedFlags.users && !userSearch.trim()
              ? regularUsersList.filter((u) => u.isActive === false).length
              : undefined,
          staffUsers:
            loadedFlags.users && !userSearch.trim() ? staffUsersList.length : undefined,
          adminUsers:
            loadedFlags.users && !userSearch.trim() ? adminUsersList.length : undefined,
          superAdminUsers:
            loadedFlags.users && !userSearch.trim()
              ? superAdminUsersList.length
              : undefined,
          titles: dbTitlesTotal ?? stats?.counts?.titles,
          apiKeys: loadedFlags.keys ? keys.length : undefined,
        }}
      />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar
          activeSection={activeSection}
          user={user}
          region={region}
          theme={theme}
          toast={toast}
          onOpenSidebar={() => setSidebarOpen(true)}
          onToggleTheme={() => dispatch(toggleTheme())}
          onRefreshActiveSection={() => refreshActiveSection(true)}
        />

        <main
          id="admin-main-scroll"
          className="studio-scroll flex-1 overflow-y-auto px-4 pb-6 pt-0 sm:px-6"
        >
          {activeSection === 'overview' &&
            (sectionTransitioning || (!stats && !loadedFlags.overview) ? (
              <div className="pt-4">
                <AdminOverviewSkeleton />
              </div>
            ) : (
              <OverviewSection stats={stats} isSuper={isSuper} />
            ))}

          {activeSection === 'featured' &&
            (sectionTransitioning || !loadedFlags.featured ? (
              <div className="pt-4">
                <AdminFeaturedSkeleton />
              </div>
            ) : (
              <FeaturedSection
                featuredItems={featuredItems}
                heroLimit={heroLimit}
                onUpdateHeroLimit={handleUpdateHeroLimit}
                featSearchQ={featSearchQ}
                setFeatSearchQ={setFeatSearchQ}
                featSearchResults={featSearchResults}
                setFeatSearchResults={setFeatSearchResults}
                featSearchAttempted={featSearchAttempted}
                setFeatSearchAttempted={setFeatSearchAttempted}
                featForm={featForm}
                setFeatForm={setFeatForm}
                searchMovieForFeatured={searchMovieForFeatured}
                handleAddFeatured={handleAddFeatured}
                moveFeaturedItem={moveFeaturedItem}
                onToggleFeaturedActive={(item) =>
                  featuredApi
                    .update(item.featuredId, { isActive: !item.isActive })
                    .then(loadFeatured)
                }
                onRemoveFeatured={(featuredId) =>
                  featuredApi.remove(featuredId).then(() => {
                    loadFeatured();
                    notify('Removed slide from Featured Carousel');
                  })
                }
              />
            ))}

          {activeSection === 'blogs' &&
            (sectionTransitioning || !loadedFlags.blogs ? (
              <div className="pt-4">
                <AdminBlogsSkeleton />
              </div>
            ) : (
              <BlogStudioSection
                blogs={blogs}
                editingBlogId={editingBlogId}
                editorMode={editorMode}
                setEditorMode={setEditorMode}
                blogMovieSearchQ={blogMovieSearchQ}
                setBlogMovieSearchQ={setBlogMovieSearchQ}
                blogMovieHits={blogMovieHits}
                setBlogMovieHits={setBlogMovieHits}
                blogSearchAttempted={blogSearchAttempted}
                setBlogSearchAttempted={setBlogSearchAttempted}
                fetchingAssets={fetchingAssets}
                blogForm={blogForm}
                setBlogForm={setBlogForm}
                searchMovieForBlog={searchMovieForBlog}
                handleFetchMovieAssetsForBlog={handleFetchMovieAssetsForBlog}
                insertIntoBlogContent={insertIntoBlogContent}
                startEditingBlog={startEditingBlog}
                resetBlogForm={resetBlogForm}
                handleSaveBlog={handleSaveBlog}
                onDeleteBlog={(id) =>
                  blogApi.remove(id).then(() => {
                    loadBlogs();
                    notify('Deleted blog article');
                  })
                }
              />
            ))}

          {activeSection === 'community' &&
            (sectionTransitioning || !loadedFlags.community ? (
              <div className="pt-4">
                <AdminCommunitySkeleton />
              </div>
            ) : (
              <CommunitySection
                commRooms={commRooms}
                currentUser={user}
                newRoomForm={newRoomForm}
                setNewRoomForm={setNewRoomForm}
                onCreateRoom={async (e) => {
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
                  notify('Official Community Lounge created!');
                }}
                onToggleRoomLock={(r) =>
                  communityApi.updateRoom(r.id, { isLocked: !r.isLocked }).then(() => {
                    loadCommunity();
                    notify(
                      `Community "${r.name}" ${!r.isLocked ? 'blocked' : 'unblocked'}`,
                    );
                  })
                }
                onRequestDeleteRoom={(r) => setRoomToDelete(r)}
                onRefreshCommunity={loadCommunity}
                notify={notify}
              />
            ))}

          {activeSection === 'reviews' &&
            (sectionTransitioning || !loadedFlags.moderation ? (
              <div className="pt-4">
                <AdminReviewsSkeleton />
              </div>
            ) : (
              <ReviewsModerationSection
                allReviews={allReviews}
                allComments={allComments}
                onSelectReviewForModal={(r) => setSelectedReviewForModal(r)}
                onToggleHideReview={(r) =>
                  reviewService.admin
                    .moderateReview(r._id || r.id, { isHidden: !r.isHidden })
                    .then(() => {
                      loadModeration();
                      notify(`Review ${!r.isHidden ? 'hidden' : 'made visible'}`);
                    })
                }
                onDeleteReview={(id) =>
                  reviewService.admin.deleteReview(id).then(() => {
                    loadModeration();
                    notify('Review deleted');
                  })
                }
                onAddCriticReview={async (payload) => {
                  await reviewService.addCriticReview(payload);
                  loadModeration();
                  notify('Published verified critic review!');
                }}
                onToggleHideComment={(c) =>
                  reviewService.admin
                    .moderateComment(c._id || c.id, { isHidden: !c.isHidden })
                    .then(() => {
                      loadModeration();
                      notify(`Comment ${!c.isHidden ? 'hidden' : 'unhidden'}`);
                    })
                }
                onDeleteComment={(id) =>
                  reviewService.admin.deleteComment(id).then(() => {
                    loadModeration();
                    notify('Comment deleted');
                  })
                }
              />
            ))}

          {/* User Management (Regular Users) */}
          {activeSection === 'users' &&
            (sectionTransitioning || !loadedFlags.users ? (
              <div className="pt-4">
                <AdminUsersSkeleton />
              </div>
            ) : (
              <UsersSection
                mode="users"
                users={users}
                currentUser={user}
                isSuper={isSuper}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                onSearchUsers={loadUsers}
                newStaff={newStaff}
                setNewStaff={setNewStaff}
                onCreateStaff={async (e) => {
                  e.preventDefault();
                  await authService.createStaff({
                    ...newStaff,
                    role: newStaff.role || ROLES.USER,
                  });
                  setNewStaff({
                    name: '',
                    email: '',
                    password: '',
                    role: ROLES.USER,
                  });
                  loadUsers();
                  notify('Regular User account created!');
                }}
                onChangeRole={(id, role) =>
                  authService.setRole(id, role).then(() => {
                    loadUsers();
                    notify(`Updated account role to ${role}`);
                  })
                }
                onToggleActive={(u) =>
                  authService.setActive(u.id, u.isActive === false).then(() => {
                    loadUsers();
                    notify(`${u.name} ${u.isActive === false ? 'activated' : 'suspended'}`);
                  })
                }
                onOpenPasswordModal={(u) => {
                  setPasswordModalUser(u);
                  setNewUserPassword('');
                  setConfirmUserPassword('');
                  setPasswordError('');
                  setShowNewPassword(false);
                }}
                onRequestDeleteUser={(u) => setUserToDelete(u)}
              />
            ))}

          {/* Staff (Admin & Super Admins) */}
          {activeSection === 'staff' &&
            (sectionTransitioning || !loadedFlags.users ? (
              <div className="pt-4">
                <AdminUsersSkeleton />
              </div>
            ) : (
              <UsersSection
                mode="staff"
                users={users}
                currentUser={user}
                isSuper={isSuper}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                onSearchUsers={loadUsers}
                newStaff={newStaff}
                setNewStaff={setNewStaff}
                onCreateStaff={async (e) => {
                  e.preventDefault();
                  await authService.createStaff({
                    ...newStaff,
                    role: newStaff.role || ROLES.ADMIN,
                  });
                  setNewStaff({
                    name: '',
                    email: '',
                    password: '',
                    role: ROLES.ADMIN,
                  });
                  loadUsers();
                  notify('Staff account provisioned!');
                }}
                onChangeRole={(id, role) =>
                  authService.setRole(id, role).then(() => {
                    loadUsers();
                    notify(`Updated staff role to ${role}`);
                  })
                }
                onToggleActive={(u) =>
                  authService.setActive(u.id, u.isActive === false).then(() => {
                    loadUsers();
                    notify(`${u.name} ${u.isActive === false ? 'activated' : 'suspended'}`);
                  })
                }
                onOpenPasswordModal={(u) => {
                  setPasswordModalUser(u);
                  setNewUserPassword('');
                  setConfirmUserPassword('');
                  setPasswordError('');
                  setShowNewPassword(false);
                }}
                onRequestDeleteUser={(u) => setUserToDelete(u)}
              />
            ))}

          {/* Media & Box Office DB */}
          {activeSection === 'catalog' &&
            (sectionTransitioning || !loadedFlags.catalog ? (
              <div className="pt-4">
                <AdminCatalogSkeleton />
              </div>
            ) : (
              <CatalogSection
                dbTitles={dbTitles}
                featuredItems={featuredItems}
                region={region}
                titleQuery={titleQuery}
                setTitleQuery={setTitleQuery}
                titleTypeFilter={titleTypeFilter}
                onChangeTypeFilter={(nextType) => {
                  setTitleTypeFilter(nextType);
                  setCatalogPage(1);
                  if (nextType) {
                    setSearchParams({ type: nextType });
                  } else {
                    setSearchParams({});
                  }
                  loadCatalog(1, { type: nextType });
                }}
                catalogSort={catalogSort}
                onChangeSort={(nextSort) => {
                  setCatalogSort(nextSort);
                  setCatalogPage(1);
                  loadCatalog(1, { sort: nextSort });
                }}
                catalogPage={catalogPage}
                catalogTotalPages={catalogTotalPages}
                catalogTotalItems={catalogFilteredTotal}
                catalogPageSize={CATALOG_PAGE_SIZE}
                catalogVisibleLimit={catalogVisibleLimit}
                onChangeVisibleLimit={handleChangeCatalogVisibleLimit}
                catalogLoading={catalogLoading}
                onPageChange={(nextPage) => {
                  setCatalogPage(nextPage);
                  loadCatalog(nextPage);
                }}
                onSearchCatalog={(pageArg = 1, overrides = {}) => {
                  setCatalogPage(pageArg);
                  loadCatalog(pageArg, overrides);
                }}
                onCreateNewTitle={() => setCreatingNewTitle(true)}
                onEditTitle={(t) => setModalTitle(t)}
                onSyncTitle={async (t) => {
                  try {
                    await reviewService.superadmin.syncTitle(t.type, t.id, true);
                    notify(`Synced "${t.title}" with official TMDB data!`);
                    loadCatalog(catalogPage);
                  } catch (err) {
                    notify(
                      err.response?.data?.message || 'Failed to sync with TMDB',
                      'error',
                    );
                  }
                }}
                onDeleteTitle={(t) =>
                  reviewService.superadmin.deleteTitle(t.type, t.id).then(() => {
                    loadCatalog(catalogPage);
                    notify(`Deleted "${t.title}" from database`);
                  })
                }
                onQuickAddToFeatured={handleQuickAddToFeatured}
              />
            ))}

          {activeSection === 'crawler' &&
            (sectionTransitioning || !crawler ? (
              <div className="pt-4">
                <AdminCrawlerSkeleton />
              </div>
            ) : (
              <CrawlerSection
                crawler={crawler}
                quotaForm={quotaForm}
                setQuotaForm={setQuotaForm}
                onStartCrawler={() =>
                  reviewService.superadmin.crawlerStart({ restart: false }).then(() => {
                    loadCrawler();
                    notify('Crawler started / resumed');
                  })
                }
                onStopCrawler={() =>
                  reviewService.superadmin.crawlerStop().then(() => {
                    loadCrawler();
                    notify('Crawler stop requested');
                  })
                }
                onSaveQuotas={() =>
                  reviewService.superadmin.crawlerUpdateCap(quotaForm).then(() => {
                    loadCrawler();
                    notify('Crawler quotas updated!');
                  })
                }
              />
            ))}

          {activeSection === 'api-keys' &&
            (sectionTransitioning || !loadedFlags.keys ? (
              <div className="pt-4">
                <AdminApiKeysSkeleton />
              </div>
            ) : (
              <ApiKeysSection
                keys={keys}
                newKey={newKey}
                setNewKey={setNewKey}
                onAddKey={async (e) => {
                  e.preventDefault();
                  await reviewService.superadmin.addKey(newKey);
                  setNewKey({ label: '', key: '', priority: 10 });
                  loadKeys();
                  notify('TMDB API Key encrypted & added to pool!');
                }}
                onDeleteKey={(id) =>
                  reviewService.superadmin.deleteKey(id).then(() => {
                    loadKeys();
                    notify('Removed TMDB API key');
                  })
                }
                onTestKey={(id) =>
                  reviewService.superadmin.testKey(id).then((res) => {
                    loadKeys();
                    notify(
                      res?.valid || res?.result === 'valid'
                        ? 'API Key verified valid with TMDB!'
                        : 'API Key test completed',
                    );
                  })
                }
              />
            ))}

          {activeSection === 'settings' &&
            (sectionTransitioning ? (
              <div className="pt-4">
                <AdminOverviewSkeleton />
              </div>
            ) : (
              <SettingsSection
                user={user}
                isSuper={isSuper}
                theme={theme}
                onToggleTheme={() => dispatch(toggleTheme())}
                users={users}
                stats={stats}
                heroLimit={heroLimit}
                onUpdateHeroLimit={handleUpdateHeroLimit}
                catalogVisibleLimit={catalogVisibleLimit}
                onChangeCatalogVisibleLimit={handleChangeCatalogVisibleLimit}
                crawler={crawler}
                quotaForm={quotaForm}
                setQuotaForm={setQuotaForm}
                onStartCrawler={() =>
                  reviewService.superadmin.crawlerStart({ restart: false }).then(() => {
                    loadCrawler();
                    notify('Crawler started / resumed');
                  })
                }
                onStopCrawler={() =>
                  reviewService.superadmin.crawlerStop().then(() => {
                    loadCrawler();
                    notify('Crawler stop requested');
                  })
                }
                onSaveQuotas={() =>
                  reviewService.superadmin.crawlerUpdateCap(quotaForm).then(() => {
                    loadCrawler();
                    notify('Crawler quotas updated!');
                  })
                }
                featuredItems={featuredItems}
                blogs={blogs}
                commRooms={commRooms}
                keys={keys}
                onOpenPasswordModal={(u) => {
                  setPasswordModalUser(u);
                  setNewUserPassword('');
                  setConfirmUserPassword('');
                  setPasswordError('');
                  setShowNewPassword(false);
                }}
                onToggleActive={(u) =>
                  authService.setActive(u.id, u.isActive === false).then(() => {
                    loadUsers();
                    notify(`${u.name} ${u.isActive === false ? 'activated' : 'suspended'}`);
                  })
                }
                onRefreshAll={loadAllAdminData}
                notify={notify}
              />
            ))}
        </main>
      </div>

      {/* Movie / Web Series Editor Modal */}
      {(modalTitle || creatingNewTitle) && (
        <TitleEditorModal
          title={modalTitle}
          onClose={() => {
            setModalTitle(null);
            setCreatingNewTitle(false);
            if (searchParams.get('action') === 'create') {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('action');
              setSearchParams(nextParams);
            }
          }}
          onSaved={() => loadCatalog(catalogPage)}
        />
      )}

      {/* Critic & Review Inspection / Edit Modal */}
      <ReviewDetailEditModal
        review={selectedReviewForModal}
        onClose={() => setSelectedReviewForModal(null)}
        onSaveReview={async (id, payload) => {
          await reviewService.admin.moderateReview(id, payload);
          loadModeration();
          notify('Review updated!');
        }}
        onDeleteReview={async (id) => {
          await reviewService.admin.deleteReview(id);
          loadModeration();
          notify('Review deleted');
        }}
      />

      {/* Change User Password Modal */}
      <ChangePasswordModal
        passwordModalUser={passwordModalUser}
        onClose={() => {
          setPasswordModalUser(null);
          setPasswordError('');
        }}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        confirmUserPassword={confirmUserPassword}
        setConfirmUserPassword={setConfirmUserPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        passwordError={passwordError}
        passwordSaving={passwordSaving}
        onSubmitPasswordChange={async (e) => {
          e.preventDefault();
          setPasswordError('');
          if (newUserPassword.trim().length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            return;
          }
          if (newUserPassword.trim() !== confirmUserPassword.trim()) {
            setPasswordError('Passwords do not match.');
            return;
          }
          setPasswordSaving(true);
          try {
            await authService.adminChangePassword(
              passwordModalUser.id,
              newUserPassword.trim(),
            );
            notify(`Password updated for ${passwordModalUser.name}!`);
            setPasswordModalUser(null);
          } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to update password.');
          } finally {
            setPasswordSaving(false);
          }
        }}
      />

      {/* Delete User Confirmation Modal */}
      <DeleteUserConfirmModal
        userToDelete={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirmDelete={async () => {
          try {
            await authService.removeUser(userToDelete.id);
            notify(`Deleted user ${userToDelete.name}`);
            setUserToDelete(null);
            loadUsers();
          } catch (err) {
            notify(err.response?.data?.message || 'Failed to delete user', 'error');
            setUserToDelete(null);
          }
        }}
      />

      {/* Delete Community Room Confirmation Modal */}
      <DeleteRoomConfirmModal
        roomToDelete={roomToDelete}
        onClose={() => setRoomToDelete(null)}
        onConfirmDelete={async () => {
          try {
            await communityApi.deleteRoom(roomToDelete.id);
            notify(`Deleted community room "${roomToDelete.name}"`);
            setRoomToDelete(null);
            loadCommunity();
          } catch (err) {
            notify(
              err.response?.data?.message || 'Failed to delete community room',
              'error',
            );
            setRoomToDelete(null);
          }
        }}
      />
    </div>
  );
}
