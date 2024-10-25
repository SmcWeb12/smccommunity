import React, { useState } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiSend } from 'react-icons/fi';
import { MdImage } from 'react-icons/md';
import './MessageInput.css';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    if (selectedImage && selectedImage.size <= 5 * 1024 * 1024) {
      setImage(selectedImage);
      const imageURL = URL.createObjectURL(selectedImage);
      setImagePreview(imageURL);
    } else if (selectedImage) {
      alert('Image size should be under 5 MB.');
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !image) return;

    setIsLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        const storage = getStorage();
        const imageRef = ref(storage, `images/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(firestore, 'messages'), {
        text: message,
        user: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: Timestamp.now(),
        profilePicture: auth.currentUser.photoURL || null,
        imageUrl: imageUrl || null,
      });

      setMessage('');
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error sending message: ", error);
      alert("Failed to send message. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-container">
      <label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="image-input"
          hidden
        />
        <MdImage className="upload-icon" />
      </label>

      <textarea
        value={message}
        onChange={handleChange}
        placeholder="Type a message"
        className="message-input"
        disabled={isLoading}
        rows="1"
      />

      <button type="submit" className="send-button" disabled={isLoading || (!message.trim() && !image)}>
        {isLoading ? <span className="loading-spinner" /> : <FiSend />}
      </button>
    </form>
  );
};

export default MessageInput;
