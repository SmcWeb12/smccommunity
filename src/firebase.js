// firebase.js (your Firebase configuration file)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyChdT7JmO3-iXEUmoo_q0I6GPYWla8Xrtg",
  authDomain: "my-chat-app2-f825f.firebaseapp.com",
  databaseURL: "https://my-chat-app2-f825f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-chat-app2-f825f",
  storageBucket: "my-chat-app2-f825f.appspot.com",
  messagingSenderId: "339896168596",
  appId: "1:339896168596:web:717b7d7b6c063afb4e4481",
  measurementId: "G-08P92GWQMB"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // Initialize Firebase Storage

// Export the required Firebase services
export { auth, firestore, storage }; // Export storage as well
