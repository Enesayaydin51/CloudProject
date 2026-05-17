// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from "react-native";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPhmWXn_OZX2g78jg9qzKyJ6_S1mhjSqU",
  authDomain: "gym-app-7d32e.firebaseapp.com",
  projectId: "gym-app-7d32e",
  storageBucket: "gym-app-7d32e.firebasestorage.app",
  messagingSenderId: "805187809101",
  appId: "1:805187809101:web:a09eccf40276c90a1dd104",
  measurementId: "G-GEGB0L342J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics'i sadece web platformunda ve destekleniyorsa başlat
// React Native'de Analytics çalışmaz, bu yüzden platform kontrolü yapıyoruz
let analytics = null;
if (Platform.OS === 'web') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((error) => {
    console.log('Firebase Analytics desteklenmiyor:', error);
  });
}

export default app;