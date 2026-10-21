import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tmdb } from '../services/api';

// Fetches Home page hero + curated rows from Backend MongoDB (with automatic TMDB fallback)
export const fetchHome = createAsyncThunk('movies/home', async () => {
  return await tmdb.home();
});

export default createSlice({
  name: 'movies',
  initialState: { hero: [], rows: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) =>
    b
      .addCase(fetchHome.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchHome.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.hero = payload.hero || [];
        s.rows = payload.rows || [];
      })
      .addCase(fetchHome.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Could not load movies. Ensure backend is running.';
      }),
}).reducer;
