import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // ImmutableStateInvariantMiddleware uyarısını azaltmak için
      // Development'ta bile daha az sıkı kontrol yapıyoruz
      immutableCheck: {
        // Sadece 32ms'den uzun süren işlemleri uyar
        warnAfter: 128, // Varsayılan 32ms yerine 128ms
      },
      // SerializableCheck'i de optimize ediyoruz
      serializableCheck: {
        warnAfter: 128,
      },
    }),
})