import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { setInMemoryAccessToken } from '../services/backendApi';

const errText = (e) => e.response?.data?.message || e.message;
const thunk = (name, fn) =>
  createAsyncThunk(`auth/${name}`, (arg, { rejectWithValue }) =>
    fn(arg).catch((e) => rejectWithValue(errText(e))),
  );

export const login = thunk('login', authService.login);
export const signup = thunk('signup', authService.signup);
export const restoreSession = thunk(
  'restoreSession',
  authService.restoreSession,
);
export const fetchMe = thunk('fetchMe', authService.me);
export const updateProfile = thunk('updateProfile', authService.updateProfile);
export const deleteMyAccount = thunk(
  'deleteMyAccount',
  authService.deleteMyAccount,
);

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    access: null, // Strictly in-memory (RAM)
    initializing: true,
    loading: false,
    error: null,
    logoutModalOpen: false,
  },
  reducers: {
    clearSession: (s) => {
      s.user = null;
      s.access = null;
      s.initializing = false;
      s.logoutModalOpen = false;
      setInMemoryAccessToken(null);
    },
    setAccess: (s, { payload }) => {
      s.access = payload;
      setInMemoryAccessToken(payload);
    },
    setSessionFromRefresh: (s, { payload }) => {
      s.access = payload.access || null;
      if (payload.user) s.user = payload.user;
      s.initializing = false;
      setInMemoryAccessToken(payload.access || null);
    },
    clearError: (s) => {
      s.error = null;
    },
    openLogoutModal: (s) => {
      s.logoutModalOpen = true;
    },
    closeLogoutModal: (s) => {
      s.logoutModalOpen = false;
    },
  },
  extraReducers: (b) => {
    [login, signup].forEach((t) =>
      b
        .addCase(t.pending, (s) => {
          s.loading = true;
          s.error = null;
        })
        .addCase(t.fulfilled, (s, { payload }) => {
          s.loading = false;
          s.initializing = false;
          s.user = payload.user;
          s.access = payload.access;
          setInMemoryAccessToken(payload.access);
        })
        .addCase(t.rejected, (s, a) => {
          s.loading = false;
          s.error = a.payload;
        }),
    );

    b.addCase(restoreSession.pending, (s) => {
      s.initializing = true;
    });
    b.addCase(restoreSession.fulfilled, (s, { payload }) => {
      s.initializing = false;
      s.access = payload.access;
      s.user = payload.user || s.user;
      setInMemoryAccessToken(payload.access);
    });
    b.addCase(restoreSession.rejected, (s) => {
      s.initializing = false;
      s.user = null;
      s.access = null;
      setInMemoryAccessToken(null);
    });

    b.addCase(fetchMe.fulfilled, (s, { payload }) => {
      if (payload) s.user = payload;
    });
    b.addCase(fetchMe.rejected, (s, a) => {
      if (
        String(a.payload || '')
          .toLowerCase()
          .includes('deactivated')
      ) {
        s.user = null;
        s.access = null;
        s.error = a.payload;
        setInMemoryAccessToken(null);
      }
    });

    b.addCase(updateProfile.fulfilled, (s, { payload }) => {
      s.user = payload;
    });

    b.addCase(deleteMyAccount.fulfilled, (s) => {
      s.user = null;
      s.access = null;
      s.logoutModalOpen = false;
      setInMemoryAccessToken(null);
    });
  },
});

export const {
  clearSession,
  setAccess,
  setSessionFromRefresh,
  clearError,
  openLogoutModal,
  closeLogoutModal,
} = slice.actions;

export const logout = () => (dispatch) => {
  authService.logout().catch(() => {});
  dispatch(clearSession());
};

export default slice.reducer;
