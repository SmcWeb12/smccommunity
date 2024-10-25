// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import VoiceChat from './components/VoiceChat';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import OnlineUsers from './components/OnlineUsers'; // Import OnlineUsers component
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { onSnapshot, collection } from 'firebase/firestore';
import { firestore } from './firebase'; // Firebase Firestore import

const App = () => {
  const [user] = useAuthState(auth);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const onlineUsersList = [];
      snapshot.forEach((doc) => {
        if (doc.data().isOnline) {
          onlineUsersList.push(doc.data().email);
        }
      });
      setOnlineUsers(onlineUsersList);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat" element={user ? <Chat /> : <Login />} />
        <Route path="/voice-chat" element={user ? <VoiceChat /> : <Login />} />
        <Route path="/online-users" element={<OnlineUsers users={onlineUsers} />} /> {/* Online Users Route */}
      </Routes>
    </Router>
  );
};

export default App;
