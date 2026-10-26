import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Check, X } from 'lucide-react';
import { INDUSTRY_LIST, MOVIE_GENRES } from '../config/constants';
import {
  setPreferences,
  closePreferenceModal,
} from '../store/preferencesSlice';
import { updateProfile } from '../store/authSlice';

export default function PreferenceModal() {
  const dispatch = useDispatch();
  const prefs = useSelector((s) => s.preferences);
  const user = useSelector((s) => s.auth.user);

  const [industries, setIndustries] = useState(
    prefs.industries || ['bollywood', 'tollywood', 'hollywood'],
  );
  const [genres, setGenres] = useState(prefs.genres || [28, 53, 18, 35]);
  const [contentTypes, setContentTypes] = useState(
    prefs.contentTypes || ['movie', 'webseries', 'tv'],
  );

  useEffect(() => {
    setIndustries(prefs.industries || []);
    setGenres(prefs.genres || []);
    setContentTypes(prefs.contentTypes || ['movie', 'webseries', 'tv']);
  }, [prefs.industries, prefs.genres, prefs.contentTypes]);

  const shouldShow = Boolean(prefs.modalOpen);
  if (!shouldShow) return null;

  const toggleItem = (list, setList, val) => {
    if (list.includes(val)) {
      if (list.length > 1) setList(list.filter((x) => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const handleSave = async () => {
    const langs = INDUSTRY_LIST.filter((i) => industries.includes(i.key)).map(
      (i) => i.lang,
    );
    const payload = {
      region: prefs.region,
      currency: prefs.currency,
      industries,
      languages: langs.length
        ? langs
        : prefs.region === 'IN'
          ? ['hi', 'te', 'ta', 'en']
          : ['en'],
      genres,
      contentTypes,
      onboardingCompleted: true,
    };

    dispatch(setPreferences(payload));
    dispatch(closePreferenceModal());

    if (user) {
      const genreNames = Object.entries(MOVIE_GENRES)
        .filter(([, id]) => genres.includes(id))
        .map(([name]) => name);
      dispatch(
        updateProfile({
          preferences: payload,
          favoriteGenres: genreNames,
        }),
      );
    }
  };

  const handleDismiss = () => {
    dispatch(
      setPreferences({
        onboardingCompleted: true,
      }),
    );
    dispatch(closePreferenceModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="studio-scroll relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0e131f] p-6 text-white shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand">
            <Sparkles size={22} />
          </span>
          <div>
            <h2
              className="text-xl font-extrabold sm:text-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Customize Your Cinema & Genre Taste
            </h2>
            <p className="text-xs text-zinc-400">
              Select your favorite cinema industries, genres, and formats to personalize your Home feed.
            </p>
          </div>
        </div>

        {/* 1. Preferred Cinema Industries */}
        <div className="mb-6">
          <label className="mb-2.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase">
            1. Favorite Cinema Industries
          </label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_LIST.map((ind) => {
              const active = industries.includes(ind.key);
              return (
                <button
                  key={ind.key}
                  type="button"
                  onClick={() => toggleItem(industries, setIndustries, ind.key)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-brand bg-brand/15 text-brand'
                      : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <span>{ind.emoji}</span>
                  <span>{ind.label}</span>
                  {active && <Check size={13} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Preferred Genres */}
        <div className="mb-6">
          <label className="mb-2.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase">
            2. Favorite Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MOVIE_GENRES).map(([name, id]) => {
              const active = genres.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleItem(genres, setGenres, id)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-brand bg-brand text-black'
                      : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Content Format */}
        <div className="mb-7">
          <label className="mb-2.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase">
            3. What Do You Love Watching?
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { key: 'movie', label: '🎬 Feature Movies' },
              { key: 'webseries', label: '🔥 OTT Web Series' },
              { key: 'tv', label: '📺 TV Shows' },
            ].map((ct) => {
              const active = contentTypes.includes(ct.key);
              return (
                <button
                  key={ct.key}
                  type="button"
                  onClick={() =>
                    toggleItem(contentTypes, setContentTypes, ct.key)
                  }
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    active
                      ? 'border-brand bg-brand/15 text-brand'
                      : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-brand to-amber-500 px-6 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-brand/20 hover:brightness-110"
          >
            <Sparkles size={15} />
            Save My Taste & Personalize Home
          </button>
        </div>
      </div>
    </div>
  );
}
