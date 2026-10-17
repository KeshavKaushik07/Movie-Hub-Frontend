import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Sparkles,
  Check,
  Globe,
  IndianRupee,
  DollarSign,
  X,
} from 'lucide-react';
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
  const initializing = useSelector((s) => s.auth.initializing);

  const [region, setRegion] = useState(prefs.region || 'IN');
  const [industries, setIndustries] = useState(
    prefs.industries || ['bollywood', 'tollywood', 'hollywood'],
  );
  const [genres, setGenres] = useState(prefs.genres || [28, 53, 18, 35]);
  const [contentTypes, setContentTypes] = useState(
    prefs.contentTypes || ['movie', 'webseries', 'tv'],
  );
  const [autoShown, setAutoShown] = useState(false);

  useEffect(() => {
    setRegion(prefs.region || 'IN');
    setIndustries(prefs.industries || []);
    setGenres(prefs.genres || []);
    setContentTypes(prefs.contentTypes || ['movie', 'webseries', 'tv']);
  }, [prefs.region, prefs.industries, prefs.genres, prefs.contentTypes]);

  // Automatically prompt first-time visitors once auth session check finishes
  const shouldShow =
    prefs.modalOpen ||
    (!initializing && !prefs.onboardingCompleted && !autoShown);

  if (!shouldShow) return null;

  const toggleItem = (list, setList, val) => {
    if (list.includes(val)) {
      if (list.length > 1) setList(list.filter((x) => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const handleSave = async () => {
    const currency = region === 'IN' ? 'INR' : 'USD';
    const langs = INDUSTRY_LIST.filter((i) => industries.includes(i.key)).map(
      (i) => i.lang,
    );
    const payload = {
      region,
      currency,
      industries,
      languages: langs.length
        ? langs
        : region === 'IN'
          ? ['hi', 'te', 'ta', 'en']
          : ['en'],
      genres,
      contentTypes,
      onboardingCompleted: true,
    };

    dispatch(setPreferences(payload));
    dispatch(closePreferenceModal());
    setAutoShown(true);

    // If user is logged in, persist their preferences to MongoDB (`User.preferences`) immediately!
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
        region,
        currency: region === 'IN' ? 'INR' : 'USD',
        onboardingCompleted: true,
      }),
    );
    dispatch(closePreferenceModal());
    setAutoShown(true);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md'>
      <div className='studio-scroll relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0e131f] p-6 text-white shadow-2xl sm:p-8'>
        <button
          type='button'
          onClick={handleDismiss}
          className='absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
        >
          <X size={18} />
        </button>

        <div className='mb-6 flex items-center gap-3'>
          <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5b942]/15 text-[#f5b942]'>
            <Sparkles size={22} />
          </span>
          <div>
            <h2
              className='text-xl font-extrabold sm:text-2xl'
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Personalize Your Movies Hub Experience
            </h2>
            <p className='text-xs text-zinc-400'>
              Saved locally for instant personalization and synced to your
              account whenever you sign in.
            </p>
          </div>
        </div>

        {/* 1. Region & Currency Selection */}
        <div className='mb-6'>
          <label className='mb-2.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase'>
            1. Select Your Region & Box Office Currency
          </label>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <button
              type='button'
              onClick={() => {
                setRegion('IN');
                if (!industries.includes('bollywood')) {
                  setIndustries([
                    'bollywood',
                    'tollywood',
                    'kollywood',
                    'mollywood',
                    'hollywood',
                  ]);
                }
              }}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                region === 'IN'
                  ? 'border-[#f5b942] bg-[#f5b942]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5b942]/20 text-lg'>
                🇮🇳
              </span>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-bold text-white'>
                    India (₹ Rupees)
                  </span>
                  {region === 'IN' && (
                    <Check size={16} className='text-[#f5b942]' />
                  )}
                </div>
                <p className='mt-1 text-[11px] text-zinc-400'>
                  Prioritizes Bollywood, Tollywood, South Indian & OTT Web
                  Series + Global Hits. All budgets shown in{' '}
                  <strong className='text-[#f5b942]'>₹ Crores</strong>.
                </p>
              </div>
            </button>

            <button
              type='button'
              onClick={() => {
                setRegion('GLOBAL');
                if (!industries.includes('hollywood')) {
                  setIndustries([
                    'hollywood',
                    'korean',
                    'japanese',
                    'bollywood',
                  ]);
                }
              }}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                region === 'GLOBAL'
                  ? 'border-[#f5b942] bg-[#f5b942]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-lg'>
                🌍
              </span>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-bold text-white'>
                    International ($ USD)
                  </span>
                  {region === 'GLOBAL' && (
                    <Check size={16} className='text-[#f5b942]' />
                  )}
                </div>
                <p className='mt-1 text-[11px] text-zinc-400'>
                  Prioritizes Hollywood, Global Streaming Originals, K-Drama &
                  Anime. All budgets shown in{' '}
                  <strong className='text-sky-400'>
                    $ Millions / Billions
                  </strong>
                  .
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Preferred Cinema Industries */}
        <div className='mb-6'>
          <label className='mb-2.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase'>
            2. Favorite Cinema Industries
          </label>
          <div className='flex flex-wrap gap-2'>
            {INDUSTRY_LIST.map((ind) => {
              const active = industries.includes(ind.key);
              return (
                <button
                  key={ind.key}
                  type='button'
                  onClick={() => toggleItem(industries, setIndustries, ind.key)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-[#f5b942] bg-[#f5b942]/15 text-[#f5b942]'
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

        {/* 3. Preferred Genres */}
        <div className='mb-6'>
          <label className='mb-2.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase'>
            3. Favorite Genres
          </label>
          <div className='flex flex-wrap gap-2'>
            {Object.entries(MOVIE_GENRES).map(([name, id]) => {
              const active = genres.includes(id);
              return (
                <button
                  key={id}
                  type='button'
                  onClick={() => toggleItem(genres, setGenres, id)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-[#f5b942] bg-[#f5b942] text-black'
                      : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Content Format */}
        <div className='mb-7'>
          <label className='mb-2.5 block text-xs font-bold tracking-wider text-zinc-400 uppercase'>
            4. What Do You Love Watching?
          </label>
          <div className='grid grid-cols-3 gap-2.5'>
            {[
              { key: 'movie', label: '🎬 Feature Movies' },
              { key: 'webseries', label: '🔥 OTT Web Series' },
              { key: 'tv', label: '📺 TV Shows' },
            ].map((ct) => {
              const active = contentTypes.includes(ct.key);
              return (
                <button
                  key={ct.key}
                  type='button'
                  onClick={() =>
                    toggleItem(contentTypes, setContentTypes, ct.key)
                  }
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    active
                      ? 'border-[#f5b942] bg-[#f5b942]/15 text-[#f5b942]'
                      : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className='flex items-center justify-end gap-3 border-t border-white/10 pt-5'>
          <button
            type='button'
            onClick={handleDismiss}
            className='rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/5'
          >
            Skip for Now
          </button>
          <button
            type='button'
            onClick={handleSave}
            className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f5b942] to-amber-500 px-6 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-[#f5b942]/20 hover:brightness-110'
          >
            <Sparkles size={15} />
            Save My Taste & Personalize Home
          </button>
        </div>
      </div>
    </div>
  );
}
