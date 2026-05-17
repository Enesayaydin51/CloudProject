import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  email: null,
  password: null,
  isLoading: false,
  isAuth: false,
  user: null,
  userDetails: null,
  token: null,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setEmail: (state, action) => {
      state.email = action.payload?.toLowerCase();
    },

    setPassword: (state, action) => {
      state.password = action.payload;
    },

    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // 🔥 Backend success sonrası direkt login yap
    setAuth: (state, action) => {
      state.isAuth = action.payload;
    },

    // 🔥 Backend’den gelen kullanıcıyı kaydet
    setUser: (state, action) => {
      state.user = action.payload;
    },

    // profil detaylarını kaydet
    setUserDetails: (state, action) => {
      state.userDetails = action.payload;
    },

    // 🔥 Token kaydı
    setToken: (state, action) => {
      state.token = action.payload;
    },

    // logout için state temizleme
    clearUser: (state) => {
      state.email = null;
      state.password = null;
      state.isAuth = false;
      state.user = null;
      state.userDetails = null;
      state.token = null;
    },
  },
});

export const {
  setEmail,
  setPassword,
  setIsLoading,
  setAuth,
  setUser,
  setUserDetails,
  setToken,
  clearUser,
} = userSlice.actions;

export default userSlice.reducer;
