import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './OnlineUsers.css';

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const users = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isOnline) { // Assuming you have an 'isOnline' field in your user document
          users.push({
            id: doc.id,
            email: data.email,
            name: data.name || 'Anonymous',
          });
        }
      });
      setOnlineUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="online-users-container">
      <h2>Online Users</h2>
      {loading ? (
        <div>Loading online users...</div>
      ) : (
        <ul className="online-users-list">
          {onlineUsers.length > 0 ? (
            onlineUsers.map((user) => (
              <li key={user.id} className="online-user">
                {user.name} ({user.email})
              </li>
            ))
          ) : (
            <li>No users are currently online.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default OnlineUsers;
