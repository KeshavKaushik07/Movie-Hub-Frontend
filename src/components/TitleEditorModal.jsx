import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Film,
  DollarSign,
  Music,
} from 'lucide-react';
import {
  BOX_OFFICE_VERDICTS,
  INDUSTRY_LIST,
  OTT_LIST,
} from '../config/constants';
import { reviewService } from '../services/reviewService';
import CustomSelect from './ui/CustomSelect';

export default function TitleEditorModal({ title, onClose, onSaved }) {
  const isNew = !title?.id && !title?.tmdbId;
  const mediaType = title?.type || title?.mediaType || 'movie';
  const tmdbId = title?.id || title?.tmdbId;

  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    mediaType: title?.subType === 'webseries' ? 'webseries' : mediaType,
    subType: title?.subType || (title?.isWebSeries ? 'webseries' : mediaType),
    isWebSeries: Boolean(title?.isWebSeries || title?.subType === 'webseries'),
    title: title?.title || title?.name || '',
    tagline: title?.tagline || '',
    overview: title?.overview || '',
    posterPath: title?.posterUrl || title?.poster_path || '',
    backdropPath: title?.backdropUrl || title?.backdrop_path || '',
    releaseDate:
      title?.releaseDate || title?.release_date || title?.first_air_date || '',
    year: title?.year || '',
    runtime: title?.runtime || '',
    status: title?.status || 'Released',
    originalLanguage: title?.originalLanguage || 'hi',
    certification: title?.certification || 'UA',
    trailerKey: title?.trailerKey || '',
    budget: title?.budget || 0,
    revenue: title?.revenue || 0,
    boxOffice: {
      budgetFormatted: title?.boxOffice?.budgetFormatted || '',
      domesticCollection: title?.boxOffice?.domesticCollection || '',
      internationalCollection: title?.boxOffice?.internationalCollection || '',
      worldwideCollection: title?.boxOffice?.worldwideCollection || '',
      indiaNetCollection: title?.boxOffice?.indiaNetCollection || '',
      indiaGrossCollection: title?.boxOffice?.indiaGrossCollection || '',
      openingWeekend: title?.boxOffice?.openingWeekend || '',
      openingDay: title?.boxOffice?.openingDay || '',
      verdict: title?.boxOffice?.verdict || '',
      notes: title?.boxOffice?.notes || '',
    },
    regions: title?.regions || [],
    ottProviders: title?.ottProviders || [],
    listTags: title?.listTags || [],
    directors: (title?.directors || []).join(', '),
    musicDirectors: (title?.musicDirectors || []).join(', '),
    songs: Array.isArray(title?.songs) ? title.songs : [],
  });

  const toggleArrayItem = (field, key) => {
    setForm((prev) => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(key)
          ? arr.filter((x) => x !== key)
          : [...arr, key],
      };
    });
  };

  const addSong = () => {
    setForm((prev) => ({
      ...prev,
      songs: [
        ...prev.songs,
        {
          title: '',
          youtubeKey: '',
          artist: '',
          composer: '',
          lyricist: '',
          duration: '',
        },
      ],
    }));
  };

  const updateSong = (idx, key, val) => {
    setForm((prev) => ({
      ...prev,
      songs: prev.songs.map((s, i) => (i === idx ? { ...s, [key]: val } : s)),
    }));
  };

  const removeSong = (idx) => {
    setForm((prev) => ({
      ...prev,
      songs: prev.songs.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        budget: Number(form.budget) || 0,
        revenue: Number(form.revenue) || 0,
        year: form.year ? Number(form.year) : undefined,
        runtime: form.runtime ? Number(form.runtime) : undefined,
        directors: String(form.directors || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        musicDirectors: String(form.musicDirectors || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        songs: form.songs.filter((s) => s.title && s.youtubeKey),
      };

      let saved;
      if (isNew) {
        saved = await reviewService.superadmin.createTitle(payload);
      } else {
        saved = await reviewService.superadmin.updateTitle(
          mediaType,
          tmdbId,
          payload,
        );
      }
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to save title',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSyncTmdb = async () => {
    if (isNew) return;
    setSyncing(true);
    setError('');
    try {
      const synced = await reviewService.superadmin.syncTitle(
        mediaType,
        tmdbId,
      );
      onSaved?.(synced);
      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'TMDB sync failed',
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6'>
      <div className='flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0e131f] text-white shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-white/10 px-6 py-4'>
          <div>
            <h2 className='text-lg font-extrabold text-white'>
              {isNew
                ? 'Add New Movie / Web Series to Database'
                : `Edit Title: ${form.title} (#${tmdbId})`}
            </h2>
            <p className='text-xs text-zinc-400'>
              All manual edits are automatically locked in MongoDB so TMDB syncs
              never overwrite them.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {!isNew && (
              <button
                type='button'
                onClick={handleSyncTmdb}
                disabled={syncing}
                className='flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 disabled:opacity-50'
              >
                <RefreshCw
                  size={13}
                  className={syncing ? 'animate-spin' : ''}
                />
                Sync TMDB
              </button>
            )}
            <button
              type='button'
              onClick={onClose}
              className='rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white'
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-1 border-b border-white/10 bg-[#070a10]/60 px-6 pt-2'>
          {[
            { id: 'general', label: 'General & OTT', icon: Film },
            {
              id: 'boxoffice',
              label: 'Budget & Box Office (₹ / $)',
              icon: DollarSign,
            },
            {
              id: 'songs',
              label: `Trailers & Songs (${form.songs.length})`,
              icon: Music,
            },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type='button'
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                  tab === t.id
                    ? 'border-[#f5b942] text-[#f5b942]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <form
          onSubmit={handleSave}
          className='studio-scroll flex-1 space-y-5 overflow-y-auto p-6'
        >
          {error && (
            <div className='rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300'>
              {error}
            </div>
          )}

          {tab === 'general' && (
            <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='sm:col-span-2'>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Title Name *
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white focus:border-[#f5b942] focus:outline-none'
                  />
                </div>
                <CustomSelect
                  label='Category / Format'
                  value={form.subType}
                  onChange={(val) =>
                    setForm({
                      ...form,
                      subType: val,
                      isWebSeries: val === 'webseries',
                      mediaType: val === 'movie' ? 'movie' : 'tv',
                    })
                  }
                  options={[
                    { value: 'movie', label: '🎬 Movie' },
                    { value: 'webseries', label: '🔥 Web Series (OTT)' },
                    { value: 'tv', label: '📺 TV Show' },
                  ]}
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-3'>
                <div>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Release Year
                  </label>
                  <input
                    type='number'
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Runtime ( mins )
                  </label>
                  <input
                    type='number'
                    value={form.runtime}
                    onChange={(e) =>
                      setForm({ ...form, runtime: e.target.value })
                    }
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Primary Trailer YouTube URL / Key
                  </label>
                  <input
                    value={form.trailerKey}
                    onChange={(e) =>
                      setForm({ ...form, trailerKey: e.target.value })
                    }
                    placeholder='e.g. dQw4w9WgXcQ'
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white'
                  />
                </div>
              </div>

              <div>
                <label className='mb-1 block text-xs text-zinc-400'>
                  Overview / Synopsis
                </label>
                <textarea
                  rows={3}
                  value={form.overview}
                  onChange={(e) =>
                    setForm({ ...form, overview: e.target.value })
                  }
                  className='w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white focus:border-[#f5b942] focus:outline-none'
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Poster Image URL
                  </label>
                  <input
                    value={form.posterPath}
                    onChange={(e) =>
                      setForm({ ...form, posterPath: e.target.value })
                    }
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Backdrop Image URL
                  </label>
                  <input
                    value={form.backdropPath}
                    onChange={(e) =>
                      setForm({ ...form, backdropPath: e.target.value })
                    }
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                  />
                </div>
              </div>

              <div>
                <label className='mb-1.5 block text-xs font-semibold text-zinc-400'>
                  Cinema Industries
                </label>
                <div className='flex flex-wrap gap-1.5'>
                  {INDUSTRY_LIST.map((ind) => (
                    <button
                      key={ind.key}
                      type='button'
                      onClick={() => toggleArrayItem('regions', ind.key)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                        form.regions.includes(ind.key)
                          ? 'border-[#f5b942] bg-[#f5b942]/20 text-[#f5b942]'
                          : 'border-white/10 bg-white/5 text-zinc-400'
                      }`}
                    >
                      {ind.emoji} {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className='mb-1.5 block text-xs font-semibold text-zinc-400'>
                  OTT Streaming Platforms
                </label>
                <div className='flex flex-wrap gap-1.5'>
                  {OTT_LIST.map((o) => (
                    <button
                      key={o.key}
                      type='button'
                      onClick={() => toggleArrayItem('ottProviders', o.key)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                        form.ottProviders.includes(o.key)
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/10 bg-white/5 text-zinc-400'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'boxoffice' && (
            <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Raw Budget (Numeric USD)
                  </label>
                  <input
                    type='number'
                    value={form.budget}
                    onChange={(e) =>
                      setForm({ ...form, budget: e.target.value })
                    }
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs text-zinc-400'>
                    Raw Worldwide Revenue (Numeric USD)
                  </label>
                  <input
                    type='number'
                    value={form.revenue}
                    onChange={(e) =>
                      setForm({ ...form, revenue: e.target.value })
                    }
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white'
                  />
                </div>
                <CustomSelect
                  label='Trade Verdict'
                  value={form.boxOffice.verdict}
                  onChange={(val) =>
                    setForm({
                      ...form,
                      boxOffice: { ...form.boxOffice, verdict: val },
                    })
                  }
                  options={BOX_OFFICE_VERDICTS.map((v) => ({
                    value: v,
                    label: v || 'Auto-Compute from ROI',
                  }))}
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-3'>
                {[
                  ['budgetFormatted', 'Formatted Budget (e.g. ₹300 Cr)'],
                  ['indiaNetCollection', 'India Net Collection (e.g. ₹640 Cr)'],
                  [
                    'indiaGrossCollection',
                    'India Gross Collection (e.g. ₹760 Cr)',
                  ],
                  ['worldwideCollection', 'Worldwide Gross (e.g. ₹1,148 Cr)'],
                  ['openingDay', 'Opening Day (e.g. ₹75 Cr)'],
                  ['openingWeekend', 'Opening Weekend (e.g. ₹280 Cr)'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className='mb-1 block text-xs text-zinc-400'>
                      {label}
                    </label>
                    <input
                      value={form.boxOffice[key]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          boxOffice: {
                            ...form.boxOffice,
                            [key]: e.target.value,
                          },
                        })
                      }
                      className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'songs' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <p className='text-xs text-zinc-400'>
                  Add official movie songs, lyrical videos, or jukeboxes by
                  YouTube URL or 11-char ID.
                </p>
                <button
                  type='button'
                  onClick={addSong}
                  className='flex items-center gap-1.5 rounded-xl bg-[#f5b942] px-3.5 py-2 text-xs font-bold text-black'
                >
                  <Plus size={14} /> Add Song
                </button>
              </div>
              {form.songs.map((song, idx) => (
                <div
                  key={idx}
                  className='grid gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:grid-cols-6'
                >
                  <input
                    placeholder='Song Title *'
                    value={song.title}
                    onChange={(e) => updateSong(idx, 'title', e.target.value)}
                    className='rounded-lg border border-white/10 bg-[#070a10] px-3 py-1.5 text-xs text-white sm:col-span-2'
                  />
                  <input
                    placeholder='YouTube URL or ID *'
                    value={song.youtubeKey}
                    onChange={(e) =>
                      updateSong(idx, 'youtubeKey', e.target.value)
                    }
                    className='rounded-lg border border-white/10 bg-[#070a10] px-3 py-1.5 text-xs text-white sm:col-span-2'
                  />
                  <input
                    placeholder='Singer / Composer'
                    value={song.artist || ''}
                    onChange={(e) => updateSong(idx, 'artist', e.target.value)}
                    className='rounded-lg border border-white/10 bg-[#070a10] px-3 py-1.5 text-xs text-white'
                  />
                  <button
                    type='button'
                    onClick={() => removeSong(idx)}
                    className='flex items-center justify-center rounded-lg bg-rose-500/15 text-xs font-semibold text-rose-400 hover:bg-rose-500/25'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className='flex justify-end gap-3 border-t border-white/10 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex items-center gap-2 rounded-xl bg-[#f5b942] px-6 py-2 text-xs font-extrabold text-black hover:brightness-110 disabled:opacity-50'
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
