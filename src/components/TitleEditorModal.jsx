import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { BOX_OFFICE_VERDICTS } from '../config/constants';
import { reviewService } from '../services/reviewService';
import { notifyPatch } from '../utils/notify';

const INDUSTRIES_LIST = [
  { key: 'bollywood', label: 'Bollywood (Hindi)' },
  { key: 'tollywood', label: 'Tollywood (Telugu)' },
  { key: 'kollywood', label: 'Kollywood (Tamil)' },
  { key: 'mollywood', label: 'Mollywood (Malayalam)' },
  { key: 'sandalwood', label: 'Sandalwood (Kannada)' },
  { key: 'hollywood', label: 'Hollywood (English)' },
  { key: 'korean', label: 'Korean' },
  { key: 'japanese', label: 'Japanese & Anime' },
  { key: 'spanish', label: 'Spanish' },
  { key: 'french', label: 'French' },
];

const PLATFORMS_LIST = [
  { key: 'netflix', label: 'Netflix' },
  { key: 'prime', label: 'Prime Video' },
  { key: 'hotstar', label: 'JioHotstar' },
  { key: 'jiocinema', label: 'JioCinema' },
  { key: 'sonyliv', label: 'SonyLIV' },
  { key: 'zee5', label: 'ZEE5' },
  { key: 'apple', label: 'Apple TV+' },
  { key: 'max', label: 'Max (HBO)' },
  { key: 'hulu', label: 'Hulu' },
  { key: 'crunchyroll', label: 'Crunchyroll' },
];

const parseYtId = (val = '') => {
  const s = String(val || '').trim();
  const m = s.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return '';
};

const buildFormFromTitle = (title) => {
  const rawType = title?.type || title?.mediaType || 'movie';
  const subType = title?.subType || (title?.isWebSeries ? 'webseries' : rawType);
  const mediaType = subType === 'webseries' ? 'tv' : rawType;

  return {
    mediaType,
    subType,
    isWebSeries: subType === 'webseries',
    title: title?.title || title?.name || '',
    tagline: title?.tagline || '',
    overview: title?.overview || '',
    posterPath: title?.posterUrl || title?.poster_path || title?.customPosterUrl || '',
    backdropPath: title?.backdropUrl || title?.backdrop_path || title?.customBackdropUrl || '',
    releaseDate: title?.releaseDate || title?.release_date || title?.first_air_date || '',
    year: title?.year || '',
    runtime: title?.runtime || '',
    status: title?.status || 'Released',
    originalLanguage: title?.originalLanguage || 'hi',
    certification: title?.certification || 'UA',
    trailerKey: title?.trailerKey || '',
    budget: Number(title?.budget) || 0,
    revenue: Number(title?.revenue || title?.boxOffice?.worldwideCollection) || 0,
    boxOffice: {
      budgetFormatted: title?.boxOffice?.budgetFormatted || '',
      domesticCollection: title?.boxOffice?.domesticCollection || '',
      internationalCollection: title?.boxOffice?.internationalCollection || '',
      worldwideCollection: title?.boxOffice?.worldwideCollection || title?.revenue || '',
      indiaNetCollection: title?.boxOffice?.indiaNetCollection || '',
      indiaGrossCollection: title?.boxOffice?.indiaGrossCollection || '',
      openingWeekend: title?.boxOffice?.openingWeekend || '',
      openingDay: title?.boxOffice?.openingDay || '',
      verdict: title?.boxOffice?.verdict || '',
      notes: title?.boxOffice?.notes || '',
    },
    regions: Array.isArray(title?.regions) ? title.regions : ['bollywood'],
    ottProviders: Array.isArray(title?.ottProviders) ? title.ottProviders : [],
    listTags: Array.isArray(title?.listTags) ? title.listTags : [],
    directors: Array.isArray(title?.directors) ? title.directors.join(', ') : '',
    musicDirectors: Array.isArray(title?.musicDirectors) ? title.musicDirectors.join(', ') : '',
    songs: Array.isArray(title?.songs)
      ? title.songs.map((s) => ({
          title: s.title || '',
          youtubeKey: s.youtubeKey || s.key || '',
        }))
      : [],
  };
};

export default function TitleEditorModal({ title, onClose, onSaved }) {
  const isNew = !title?.id && !title?.tmdbId;
  const tmdbId = title?.id || title?.tmdbId;
  const mediaType = title?.subType === 'webseries' ? 'tv' : title?.type || title?.mediaType || 'movie';

  const [tab, setTab] = useState('general'); // 'general' | 'financials' | 'songs'
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState(() => buildFormFromTitle(title));

  const updateField = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const updateBoxOfficeField = (field, val) => {
    setForm((prev) => ({
      ...prev,
      boxOffice: {
        ...prev.boxOffice,
        [field]: val,
      },
    }));
  };

  const toggleRegion = (regionKey) => {
    setForm((prev) => {
      const exists = prev.regions.includes(regionKey);
      return {
        ...prev,
        regions: exists
          ? prev.regions.filter((r) => r !== regionKey)
          : [...prev.regions, regionKey],
      };
    });
  };

  const togglePlatform = (ottKey) => {
    setForm((prev) => {
      const exists = prev.ottProviders.includes(ottKey);
      return {
        ...prev,
        ottProviders: exists
          ? prev.ottProviders.filter((o) => o !== ottKey)
          : [...prev.ottProviders, ottKey],
      };
    });
  };

  // Songs
  const handleAddSong = () => {
    setForm((prev) => ({
      ...prev,
      songs: [...prev.songs, { title: '', youtubeKey: '' }],
    }));
    setTab('songs');
  };

  const handleUpdateSong = (idx, key, val) => {
    setForm((prev) => {
      const copy = [...prev.songs];
      copy[idx] = { ...copy[idx], [key]: val };
      return { ...prev, songs: copy };
    });
  };

  const handleRemoveSong = (idx) => {
    setForm((prev) => ({
      ...prev,
      songs: prev.songs.filter((_, i) => i !== idx),
    }));
  };

  // Sync from TMDB
  const handleSyncFromTmdb = async () => {
    if (isNew || !tmdbId) return;
    if (
      !window.confirm(
        'Syncing will replace all manual overrides with official TMDB data. Continue?',
      )
    )
      return;
    setSyncing(true);
    try {
      const res = await reviewService.superadmin.syncTitle(mediaType, tmdbId);
      const updated = res.title || res;
      setForm(buildFormFromTitle(updated));
      notifyPatch({
        type: 'success',
        title: 'Title Synced',
        message: 'All fields have been refreshed from TMDB data.',
      });
      if (onSaved) onSaved(updated);
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Sync Failed',
        message: err.response?.data?.message || 'Could not sync from TMDB',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Save Changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      overview: form.overview.trim(),
      customPosterUrl: form.posterPath.trim(),
      customBackdropUrl: form.backdropPath.trim(),
      year: form.year ? Number(form.year) : undefined,
      runtime: form.runtime ? Number(form.runtime) : undefined,
      status: form.status,
      originalLanguage: form.originalLanguage,
      certification: form.certification,
      subType: form.subType,
      isWebSeries: form.subType === 'webseries',
      trailerKey: parseYtId(form.trailerKey) || form.trailerKey.trim(),
      budget: Number(form.budget) || 0,
      revenue:
        Number(form.boxOffice?.worldwideCollection || form.revenue) || 0,
      boxOffice: {
        budgetFormatted: form.boxOffice.budgetFormatted || '',
        domesticCollection: Number(form.boxOffice.domesticCollection) || 0,
        internationalCollection:
          Number(form.boxOffice.internationalCollection) || 0,
        worldwideCollection:
          Number(form.boxOffice.worldwideCollection || form.revenue) || 0,
        indiaNetCollection: Number(form.boxOffice.indiaNetCollection) || 0,
        indiaGrossCollection: Number(form.boxOffice.indiaGrossCollection) || 0,
        openingWeekend: Number(form.boxOffice.openingWeekend) || 0,
        openingDay: Number(form.boxOffice.openingDay) || 0,
        verdict: form.boxOffice.verdict || undefined,
        notes: form.boxOffice.notes || '',
      },
      regions: form.regions,
      ottProviders: form.ottProviders,
      directors: form.directors
        ? form.directors.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      musicDirectors: form.musicDirectors
        ? form.musicDirectors.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      songs: form.songs
        .filter((s) => s.title.trim() || s.youtubeKey.trim())
        .map((s, idx) => ({
          id: `song-${Date.now()}-${idx}`,
          title: s.title.trim() || 'Track',
          youtubeKey: parseYtId(s.youtubeKey) || s.youtubeKey.trim(),
          isOfficial: true,
        })),
    };

    try {
      if (isNew) {
        await reviewService.superadmin.createTitle({
          ...payload,
          mediaType: form.subType === 'webseries' ? 'tv' : form.mediaType,
          type: form.subType === 'webseries' ? 'webseries' : form.mediaType,
        });
        notifyPatch({
          type: 'success',
          title: 'Title Created',
          message: `"${payload.title}" has been added to MongoDB!`,
        });
      } else {
        await reviewService.superadmin.updateTitle(mediaType, tmdbId, payload);
        notifyPatch({
          type: 'success',
          title: 'Changes Saved',
          message: `"${payload.title}" updated in MongoDB.`,
        });
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save title changes.');
    } finally {
      setSaving(false);
    }
  };

  const trailerId = parseYtId(form.trailerKey);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl max-h-[calc(100vh-48px)] flex flex-col bg-white dark:bg-[#0e131f] border border-[#d5d9e0] dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden text-[#1b2230] dark:text-[#f8fafc]"
      >
        {/* Header */}
        <header className="flex justify-between items-start gap-4 p-5 sm:px-8 sm:pt-6 sm:pb-4 border-b border-[#d5d9e0] dark:border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1b2230] dark:text-white leading-tight">
              {isNew ? 'Create New Title' : 'Edit title'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#4a5262] dark:text-zinc-400 leading-normal">
              <strong>{form.title || 'Untitled'}</strong> &middot;{' '}
              {tmdbId ? `#${tmdbId}` : 'New custom entry'}
              <br />
              Your edits are saved to MongoDB. &ldquo;Sync from TMDB&rdquo; replaces
              edited fields with official TMDB data.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isNew && tmdbId && (
              <button
                type="button"
                onClick={handleSyncFromTmdb}
                disabled={syncing}
                className="admin-btn admin-btn-secondary"
                title="Reset manual overrides with fresh official data from TMDB"
              >
                <RefreshCw
                  size={14}
                  className={syncing ? 'animate-spin text-brand' : ''}
                />
                <span className="hidden sm:inline">Sync from TMDB</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="admin-btn admin-btn-secondary admin-btn-icon"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Tab Buttons */}
        <div className="flex gap-2 px-5 sm:px-8 border-b border-[#d5d9e0] dark:border-white/10 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setTab('general')}
            className={`py-3.5 px-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === 'general'
                ? 'border-[#2350d8] text-[#1b2230] dark:text-white dark:border-brand font-bold'
                : 'border-transparent text-[#4a5262] dark:text-zinc-400 hover:text-zinc-200'
            }`}
          >
            General &amp; streaming
          </button>
          <button
            type="button"
            onClick={() => setTab('financials')}
            className={`py-3.5 px-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === 'financials'
                ? 'border-[#2350d8] text-[#1b2230] dark:text-white dark:border-brand font-bold'
                : 'border-transparent text-[#4a5262] dark:text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Budget &amp; box office
          </button>
          <button
            type="button"
            onClick={() => setTab('songs')}
            className={`py-3.5 px-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === 'songs'
                ? 'border-[#2350d8] text-[#1b2230] dark:text-white dark:border-brand font-bold'
                : 'border-transparent text-[#4a5262] dark:text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Trailers &amp; songs ({form.songs.length})
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-5 sm:mx-8 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
            {error}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto studio-scroll p-5 sm:px-8 sm:py-6 space-y-6">
          {/* TAB 1: General & Streaming */}
          {tab === 'general' && (
            <div className="space-y-6">
              <div>
                <p className="form-section-title">Basic details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1.5">
                      Title name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="e.g. Inception"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Category
                    </label>
                    <select
                      value={form.subType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          subType: val,
                          mediaType: val === 'webseries' ? 'tv' : val === 'tv' ? 'tv' : 'movie',
                          isWebSeries: val === 'webseries',
                        }));
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    >
                      <option value="movie">Movie</option>
                      <option value="webseries">Web series</option>
                      <option value="tv">TV show</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Release year
                    </label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={(e) => updateField('year', e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Runtime (minutes)
                    </label>
                    <input
                      type="number"
                      value={form.runtime}
                      onChange={(e) => updateField('runtime', e.target.value)}
                      placeholder="e.g. 143"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Trailer YouTube link or ID
                    </label>
                    <input
                      type="text"
                      value={form.trailerKey}
                      onChange={(e) => updateField('trailerKey', e.target.value)}
                      placeholder="e.g. dQw4w9WgXcQ or full link"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1.5">
                      Overview
                    </label>
                    <textarea
                      rows={3}
                      value={form.overview}
                      onChange={(e) => updateField('overview', e.target.value)}
                      placeholder="Movie or series synopsis..."
                      className="w-full p-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <p className="form-section-title">Images</p>
                <div className="space-y-4">
                  {/* Poster */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-[120px] aspect-[2/3] shrink-0 rounded-lg border border-dashed border-[#aeb5c2] dark:border-white/20 bg-slate-100 dark:bg-[#151c2c] overflow-hidden flex items-center justify-center text-center p-2 text-xs text-zinc-400">
                      {form.posterPath ? (
                        <img
                          src={form.posterPath}
                          alt="Poster preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>Poster<br />preview</span>
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold mb-1.5">
                        Poster image URL
                      </label>
                      <input
                        type="url"
                        value={form.posterPath}
                        onChange={(e) => updateField('posterPath', e.target.value)}
                        placeholder="https://image.tmdb.org/t/p/w500/..."
                        className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                      />
                      <span className="block mt-1 text-[11px] text-[#4a5262] dark:text-zinc-400">
                        Paste a link ending in .jpg or .png. The preview updates as you type.
                      </span>
                    </div>
                  </div>

                  {/* Backdrop */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-full sm:w-[240px] aspect-[16/9] shrink-0 rounded-lg border border-dashed border-[#aeb5c2] dark:border-white/20 bg-slate-100 dark:bg-[#151c2c] overflow-hidden flex items-center justify-center text-center p-2 text-xs text-zinc-400">
                      {form.backdropPath ? (
                        <img
                          src={form.backdropPath}
                          alt="Backdrop preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>Backdrop preview</span>
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold mb-1.5">
                        Backdrop image URL
                      </label>
                      <input
                        type="url"
                        value={form.backdropPath}
                        onChange={(e) => updateField('backdropPath', e.target.value)}
                        placeholder="https://image.tmdb.org/t/p/w1280/..."
                        className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                      />
                      <span className="block mt-1 text-[11px] text-[#4a5262] dark:text-zinc-400">
                        The wide image shown behind the title hero page.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cinema Industry Chips */}
              <div>
                <p className="form-section-title">Cinema industry (pick all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES_LIST.map((ind) => {
                    const isSelected = form.regions.includes(ind.key);
                    return (
                      <button
                        key={ind.key}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleRegion(ind.key)}
                        className={`chip ${isSelected ? 'active' : ''}`}
                      >
                        {isSelected && <span>&#10003;&nbsp;</span>}
                        {ind.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available On Chips */}
              <div>
                <p className="form-section-title">Available on (pick all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS_LIST.map((p) => {
                    const isSelected = form.ottProviders.includes(p.key);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => togglePlatform(p.key)}
                        className={`chip ${isSelected ? 'active' : ''}`}
                      >
                        {isSelected && <span>&#10003;&nbsp;</span>}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Budget & Box Office */}
          {tab === 'financials' && (
            <div className="space-y-6">
              <div>
                <p className="form-section-title">Numbers used for the verdict</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Budget (USD)
                    </label>
                    <input
                      type="number"
                      value={form.budget || ''}
                      onChange={(e) => updateField('budget', e.target.value)}
                      placeholder="e.g. 180000000"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                    <span className="block mt-1 text-[11px] text-[#4a5262] dark:text-zinc-400">
                      Number only, e.g. 180000000
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Worldwide revenue (USD)
                    </label>
                    <input
                      type="number"
                      value={form.boxOffice.worldwideCollection || form.revenue || ''}
                      onChange={(e) => {
                        updateField('revenue', e.target.value);
                        updateBoxOfficeField('worldwideCollection', e.target.value);
                      }}
                      placeholder="e.g. 450000000"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                    <span className="block mt-1 text-[11px] text-[#4a5262] dark:text-zinc-400">
                      Number only
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Trade verdict
                    </label>
                    <select
                      value={form.boxOffice.verdict || ''}
                      onChange={(e) => updateBoxOfficeField('verdict', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    >
                      <option value="">Auto-calculate from ROI</option>
                      {BOX_OFFICE_VERDICTS.filter((v) => v !== 'TBA').map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <span className="block mt-1 text-[11px] text-[#4a5262] dark:text-zinc-400">
                      Or choose one manually.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="form-section-title">Text shown to readers (₹)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Budget
                    </label>
                    <input
                      type="text"
                      value={form.boxOffice.budgetFormatted || ''}
                      onChange={(e) => updateBoxOfficeField('budgetFormatted', e.target.value)}
                      placeholder="e.g. ₹300 Cr"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      India net collection
                    </label>
                    <input
                      type="text"
                      value={form.boxOffice.indiaNetCollection || ''}
                      onChange={(e) => updateBoxOfficeField('indiaNetCollection', e.target.value)}
                      placeholder="e.g. ₹640 Cr"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      India gross collection
                    </label>
                    <input
                      type="text"
                      value={form.boxOffice.indiaGrossCollection || ''}
                      onChange={(e) => updateBoxOfficeField('indiaGrossCollection', e.target.value)}
                      placeholder="e.g. ₹760 Cr"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Worldwide gross
                    </label>
                    <input
                      type="text"
                      value={form.boxOffice.worldwideCollection || ''}
                      onChange={(e) => updateBoxOfficeField('worldwideCollection', e.target.value)}
                      placeholder="e.g. ₹1,148 Cr"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Opening day
                    </label>
                    <input
                      type="text"
                      value={form.boxOffice.openingDay || ''}
                      onChange={(e) => updateBoxOfficeField('openingDay', e.target.value)}
                      placeholder="e.g. ₹75 Cr"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Opening weekend
                    </label>
                    <input
                      type="text"
                      value={form.boxOffice.openingWeekend || ''}
                      onChange={(e) => updateBoxOfficeField('openingWeekend', e.target.value)}
                      placeholder="e.g. ₹280 Cr"
                      className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Trailers & Songs */}
          {tab === 'songs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <p className="text-xs sm:text-sm text-[#4a5262] dark:text-zinc-400">
                  Add official songs, lyric videos or jukeboxes using a YouTube link or the 11-character ID.
                </p>
                <button
                  type="button"
                  onClick={handleAddSong}
                  className="admin-btn admin-btn-primary shrink-0"
                >
                  + Add song
                </button>
              </div>

              {form.songs.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-[#d5d9e0] dark:border-white/15 text-sm text-[#4a5262] dark:text-zinc-400">
                  No songs added yet. Click &ldquo;+ Add song&rdquo; to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.songs.map((song, idx) => {
                    const songYtId = parseYtId(song.youtubeKey);
                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3.5 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-slate-50/50 dark:bg-[#151c2c]/40"
                      >
                        <div className="w-full sm:w-[140px] aspect-[16/9] shrink-0 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-black/40 overflow-hidden flex items-center justify-center text-center text-xs text-zinc-400">
                          {songYtId ? (
                            <img
                              src={`https://i.ytimg.com/vi/${songYtId}/mqdefault.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>Video thumbnail</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 w-full">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                              Song title
                            </label>
                            <input
                              type="text"
                              value={song.title}
                              onChange={(e) => handleUpdateSong(idx, 'title', e.target.value)}
                              placeholder="e.g. Song name"
                              className="w-full h-9 px-2.5 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#0e131f] text-xs text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                              YouTube link or ID
                            </label>
                            <input
                              type="text"
                              value={song.youtubeKey}
                              onChange={(e) => handleUpdateSong(idx, 'youtubeKey', e.target.value)}
                              placeholder="e.g. dQw4w9WgXcQ"
                              className="w-full h-9 px-2.5 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#0e131f] text-xs text-[#1b2230] dark:text-white focus:outline-2 focus:outline-[#2350d8]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSong(idx)}
                          className="admin-btn admin-btn-danger admin-btn-sm self-end sm:self-center"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-end items-center gap-3 px-5 sm:px-8 py-3.5 border-t border-[#d5d9e0] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </footer>
      </form>
    </div>
  );
}
