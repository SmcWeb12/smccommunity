import React, { useEffect, useState, useRef } from 'react';
import { firestore, storage } from '../firebase';
import { collection, query, onSnapshot, setDoc, updateDoc, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MessageInput from './MessageInput';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import './Chat.css';
import EditProfile from './EditProfile';
import UserProfile from './UserProfile';
import { format } from 'date-fns';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [user] = useAuthState(auth);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isImageOpen, setImageOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messageStatus, setMessageStatus] = useState({});
  const [starredMessages, setStarredMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaGallery, setMediaGallery] = useState([]);
  const [reactions, setReactions] = useState({});
  const [messageSearch, setMessageSearch] = useState('');
  const [localStream, setLocalStream] = useState(null); // Added localStream state

  const mediaRecorder = useRef(null);





  
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    document.body.classList.toggle('dark-mode', savedMode);
  }, []);

  useEffect(() => {
    if (user) {
      createUserDocument(user);
      updateUserStatus(true);
    }
    return () => {
      if (user) {
        updateUserStatus(false);
      }
    };
  }, [user]);

  const createUserDocument = async (user) => {
    const userRef = doc(firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      await setDoc(userRef, {
        name: user.displayName || user.email,
        email: user.email,
        profilePicture: user.photoURL || null,
        isOnline: true,
        lastSeen: new Date(),
      });
    } else {
      await updateDoc(userRef, {
        name: user.displayName || user.email,
        profilePicture: user.photoURL || null,
        isOnline: true,
      });
    }
  };

  const updateUserStatus = async (isOnline) => {
    if (user) {
      await updateDoc(doc(firestore, `users/${user.uid}`), { 
        isOnline, 
        lastSeen: new Date()
      });
    }
  };

  useEffect(() => {
    const q = query(collection(firestore, 'messages'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      const status = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data(); // Define data here
        msgs.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        });
        status[doc.id] = data.status || 'sent';
      });
      msgs.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(msgs);
      setLoading(false);
      setMessageStatus(status);

      if (msgs.length > messages.length) {
        setNotification(` ${msgs[msgs.length - 1].user}`);
        // Update media gallery
        if (msgs[msgs.length - 1].imageUrl || msgs[msgs.length - 1].audioUrl) {
          setMediaGallery((prev) => [...prev, msgs[msgs.length - 1]]);
        }
      }
    });

    return () => unsubscribe();
  }, [messages.length]);

  useEffect(() => {
    const q = query(collection(firestore, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = [];
      const online = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push(data);
        if (data.isOnline) {
          online.push(data);
        }
      });
      setAllUsers(users);
      setOnlineUsers(online);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(firestore, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isTyping && data.uid !== user.uid) {
          setTypingUser(data);
        } else if (data.uid !== user.uid && typingUser?.uid === data.uid) {
          setTypingUser(null);
        }
      });
    });

    return () => unsubscribe();
  }, [user, typingUser]);

  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      await updateDoc(doc(firestore, `users/${user.uid}`), { isTyping: true });
      setTimeout(async () => {
        setIsTyping(false);
        await updateDoc(doc(firestore, `users/${user.uid}`), { isTyping: false });
      }, 2000);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.body.classList.toggle('dark-mode', newMode);
  };

  const handleMessageSend = async (text, imageFile) => {
    const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let imageUrl = null;

    if (imageFile) {
      const imageRef = ref(storage, `images/${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    try {
      const messageRef = await addDoc(collection(firestore, 'messages'), {
        text: sanitizedText,
        user: user.displayName || user.email,
        profilePicture: user.photoURL || null,
        createdAt: new Date(),
        uid: user.uid,
        imageUrl: imageUrl,
        replyTo: replyMessage ? replyMessage.id : null,
        status: 'sent', // Initially marked as 'sent'
      });
      
      setReplyMessage(null);
    } catch (error) {
      alert("Error sending message.");
    }
  };

  const handleReactToMessage = (messageId, emoji) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: emoji,
    }));
  };

  const updateMessageStatus = async (messageId, newStatus) => {
    await updateDoc(doc(firestore, `messages/${messageId}`), {
      status: newStatus,
    });
  };

  const handleStarMessage = (messageId) => {
    setStarredMessages([...starredMessages, messageId]);
  };

  const handleReply = (message) => {
    setReplyMessage(message);
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = async (event) => {
        const audioBlob = new Blob([event.data], { type: 'audio/wav' });
        const audioRef = ref(storage, `audio/${Date.now()}.wav`);
        await uploadBytes(audioRef, audioBlob);
        const audioUrl = await getDownloadURL(audioRef);

        await addDoc(collection(firestore, 'messages'), {
          audioUrl,
          user: user.displayName || user.email,
          profilePicture: user.photoURL || null,
          createdAt: new Date(),
          uid: user.uid,
          status: 'sent',
        });
      };

      mediaRecorder.current.start();
    } catch (error) {
      console.error("Error accessing microphone: ", error);
      alert("Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const handleUserProfileClick = (uid) => {
    const userProfile = allUsers.find((user) => user.uid === uid);
    setSelectedUser(userProfile);
  };

  const closeUserProfile = () => {
    setSelectedUser(null);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setImageOpen(true);
  };

  return (
    <div className={`chat-layout ${darkMode ? 'dark' : 'light'}`}>
      <div className="chat-header">
        <h2>SMC Community</h2>
        <div className="chat-header-buttons">
          <button onClick={toggleDarkMode} className="toggle-dark-mode-btn">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => setEditProfileOpen(true)} className="edit-profile-btn">Edit Profile</button>
          <button onClick={() => setShowUsers(prev => !prev)} className="toggle-users-btn">
            {showUsers ? 'Hide Users' : 'Show All Users'}
          </button>
        </div>
      </div>

      {showUsers && (
        <div className="online-users">
          <h3>All Users</h3>
          <ul>
            {allUsers.map((onlineUser, index) => (
              <li key={index} onClick={() => handleUserProfileClick(onlineUser.uid)}>
                {onlineUser.name || onlineUser.email} {onlineUser.isOnline && <span className="online-indicator"> (Online)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

{/* voice recording */}
<div className="voice-recording-controls">
    {isRecording ? (
        <button onClick={stopRecording} className="stop-recording-btn">
            Stop Recording
        </button>
    ) : (
        <button onClick={startRecording} className="start-recording-btn">
            Start Recording
        </button>
    )}
</div>




      <div className="chat-window">
        {loading ? <div className="loading">Loading messages...</div> : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.user === (user.displayName || user.email) ? 'sent' : 'received'}`}
              onClick={() => handleUserProfileClick(msg.uid)}
            >
              <div className="message-content">
                {msg.profilePicture && <img src={msg.profilePicture} alt="Profile" className="message-profile-pic" />}
                <strong>{msg.user}</strong>
                <p>{msg.text}</p>
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Message"
                    className="message-image"
                    onClick={(e) => { e.stopPropagation(); handleImageClick(msg.imageUrl); }}
                  />
                )}
                {msg.audioUrl && (
                  <audio controls className="message-audio">
                    <source src={msg.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio tag.
                  </audio>
                )}
                <div className="message-meta">
                  <span>{format(msg.createdAt, 'h:mm a')}</span>
                </div>
              </div>
            </div>
          ))
        )}
        {isTyping && <div className="typing-indicator">Typing...</div>}
      </div>

      <MessageInput onSend={handleMessageSend} handleTyping={handleTyping} />






      {isImageOpen && (
        <div className="image-modal" onClick={() => setImageOpen(false)}>
          <img src={selectedImageUrl} alt="Full Size" className="full-screen-image" />
        </div>
      )}

      {selectedUser && <UserProfile user={selectedUser} onClose={closeUserProfile} />}
      {isEditProfileOpen && <EditProfile onClose={() => setEditProfileOpen(false)} />}
    </div>
  );
};


export default Chat;
