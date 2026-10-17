import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import movies from './moviesSlice';
import theme from './themeSlice';
import preferences from './preferencesSlice';

export default configureStore({
  reducer: {
    auth,
    movies,
    theme,
    preferences,
  },
});
