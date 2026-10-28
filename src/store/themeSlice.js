import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('movieshub_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
};

const applyThemeToDom = (mode) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('movieshub_theme', mode);
  }
};

const initialMode = getInitialTheme();
applyThemeToDom(initialMode);

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: initialMode },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      applyThemeToDom(state.mode);
    },
    setTheme: (state, { payload }) => {
      state.mode = payload === 'light' ? 'light' : 'dark';
      applyThemeToDom(state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
