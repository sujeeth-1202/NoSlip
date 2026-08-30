// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKat0ytJLXnZ5kQPAEA00JltSmRgN5oFs",
  authDomain: "noslip-120tsp26.firebaseapp.com",
  databaseURL: "https://noslip-120tsp26-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "noslip-120tsp26",
  storageBucket: "noslip-120tsp26.firebasestorage.app",
  messagingSenderId: "727111782292",
  appId: "1:727111782292:web:c0d3614c1b97caf1344981",
  measurementId: "G-CCZSSF4017"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);