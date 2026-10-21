import { createSlice } from '@reduxjs/toolkit';
import { detectDefaultRegion } from '../utils/formatters';
import { login, signup, restoreSession, updateProfile } from './authSlice';

const PREF_STORAGE_KEY = 'movieshub_preferences_v4';

const getInitialPreferences = () => {
  const defaultRegion = detectDefaultRegion();
  const fallback = {
    region: defaultRegion,
    currency: defaultRegion === 'IN' ? 'INR' : 'USD',
    industries:
      defaultRegion === 'IN'
        ? ['bollywood', 'tollywood', 'kollywood', 'mollywood', 'sandalwood', 'hollywood']
        : ['hollywood', 'korean', 'japanese', 'bollywood'],
    languages: defaultRegion === 'IN' ? ['hi', 'te', 'ta', 'ml', 'kn', 'en'] : ['en', 'ko', 'ja'],
    genres: [28, 53, 18, 35, 878],
    contentTypes: ['movie', 'webseries', 'tv'],
    onboardingCompleted: false,
    modalOpen: false,
  };

  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      modalOpen: false,
    };
  } catch {
    return fallback;
  }
};

const saveToLocal = (state) => {
  try {
    const { modalOpen, ...rest } = state;
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(rest));
  } catch {
    /* ignore */
  }
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: getInitialPreferences(),
  reducers: {
    setPreferences: (state, { payload }) => {
      Object.assign(state, payload, { onboardingCompleted: true });
      if (payload.region && !payload.currency) {
        state.currency = payload.region === 'IN' ? 'INR' : 'USD';
      }
      saveToLocal(state);
    },
    setRegionAndCurrency: (state, { payload }) => {
      const region = payload === 'GLOBAL' ? 'GLOBAL' : 'IN';
      state.region = region;
      state.currency = region === 'IN' ? 'INR' : 'USD';
      saveToLocal(state);
    },
    openPreferenceModal: (state) => {
      state.modalOpen = true;
    },
    closePreferenceModal: (state) => {
      state.modalOpen = false;
    },
  },
  extraReducers: (b) => {
    // Whenever a user logs in, signs up, or restores session from backend, sync their backend preferences!
    const syncFromUser = (state, user) => {
      if (user?.preferences && user.preferences.onboardingCompleted) {
        state.region = user.preferences.region || state.region;
        state.currency = user.preferences.currency || (state.region === 'IN' ? 'INR' : 'USD');
        if (Array.isArray(user.preferences.industries) && user.preferences.industries.length) {
          state.industries = user.preferences.industries;
        }
        if (Array.isArray(user.preferences.languages) && user.preferences.languages.length) {
          state.languages = user.preferences.languages;
        }
        if (Array.isArray(user.preferences.genres) && user.preferences.genres.length) {
          state.genres = user.preferences.genres;
        }
        if (Array.isArray(user.preferences.contentTypes) && user.preferences.contentTypes.length) {
          state.contentTypes = user.preferences.contentTypes;
        }
        state.onboardingCompleted = true;
        saveToLocal(state);
      }
    };

    b.addCase(login.fulfilled, (state, { payload }) => syncFromUser(state, payload?.user));
    b.addCase(signup.fulfilled, (state, { payload }) => syncFromUser(state, payload?.user));
    b.addCase(restoreSession.fulfilled, (state, { payload }) => syncFromUser(state, payload?.user));
    b.addCase(updateProfile.fulfilled, (state, { payload }) => syncFromUser(state, payload));
  },
});

export const {
  setPreferences,
  setRegionAndCurrency,
  openPreferenceModal,
  closePreferenceModal,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
