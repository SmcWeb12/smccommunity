import React, { useState, useEffect } from 'react';
import { firestore, storage } from '../firebase'; // Adjust path to your firebase config
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ProfilePage.css'; // Import CSS for styling

const ProfilePage = ({ userId }) => {
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name);
        setImageUrl(userData.profilePicture || '');
      }
    };

    fetchUserData();
  }, [userId]);

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      console.error("User ID is not defined.");
      return;
    }

    setLoading(true);
    setError(null); // Reset error state

    try {
      let newImageUrl = imageUrl; // Default to current picture
      if (profilePicture) {
        const imageRef = ref(storage, `profilePictures/${profilePicture.name}`);
        await uploadBytes(imageRef, profilePicture);
        newImageUrl = await getDownloadURL(imageRef);
      }

      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        name,
        profilePicture: newImageUrl,
      });

      alert("Profile updated successfully!");
      setImageUrl(newImageUrl); // Update local state with new image URL

    } catch (err) {
      console.error("Error saving profile: ", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h2>Edit Profile</h2>
      <div className="profile-picture">
        {imageUrl ? (
          <img src={imageUrl} alt="Profile" className="profile-img" />
        ) : (
          <div className="default-profile-pic">No Picture</div>
        )}
      </div>
      <label className="profile-input">
        Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="name-input"
        />
      </label>
      <label className="profile-input">
        Profile Picture:
        <input
          type="file"
          accept="image/*"
          onChange={handleProfilePictureChange}
          className="file-input"
        />
      </label>
      {loading ? (
        <p className="saving-status">Saving...</p>
      ) : (
        <button className="save-button" onClick={handleSave}>Save Changes</button>
      )}
      {error && <p className="error-message">{error}</p>} {/* Display error message if exists */}
    </div>
  );
};

export default ProfilePage;
