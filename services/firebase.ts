import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDKat0ytJLXnZ5kQPAEA00JltSmRgN5oFs',
  authDomain: 'noslip-120tsp26.firebaseapp.com',
  databaseURL:
    'https://noslip-120tsp26-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'noslip-120tsp26',
  storageBucket: 'noslip-120tsp26.firebasestorage.app',
  messagingSenderId: '727111782292',
  appId: '1:727111782292:web:c0d3614c1b97caf1344981',
  measurementId: 'G-CCZSSF4017',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);