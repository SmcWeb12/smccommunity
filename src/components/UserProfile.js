import React, { useState } from 'react';
import { firestore, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './UserProfile.css'; // Import CSS file for styling

const UserProfile = ({ user, onClose }) => {
  const [name, setName] = useState(user.name || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!user || !user.uid) {
      console.error("User is not defined or missing UID.");
      return; // Early return if user or uid is not available
    }

    setLoading(true);
    let imageUrl = user.profilePicture; // Default to current picture
    if (profilePicture) {
      const imageRef = ref(storage, `profilePictures/${profilePicture.name}`);
      await uploadBytes(imageRef, profilePicture);
      imageUrl = await getDownloadURL(imageRef);
    }

    const userRef = doc(firestore, 'users', user.uid); // Ensure uid is defined
    await updateDoc(userRef, {
      name,
      profilePicture: imageUrl,
    });

    setLoading(false);
    onClose(); // Close the profile after saving
  };

  return (
    <div className="user-profile-modal">
      <div className="modal-header">
        <h2>Edit Profile</h2>
        <button className="close-button" onClick={onClose}>✖</button>
      </div>
      <div className="profile-content">
        <div className="profile-picture">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" />
          ) : (
            <div className="default-profile-pic">No Picture</div>
          )}
        </div>
        <label className="profile-input">
          Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="profile-input">
          Profile Picture:
          <input type="file" accept="image/*" onChange={handleProfilePictureChange} />
        </label>
        {loading ? (
          <p className="saving-status">Saving...</p>
        ) : (
          <button className="save-button" onClick={handleSave}>Save Changes</button>
        )}
      </div>
      <button className="cancel-button" onClick={onClose}>Cancel</button>
    </div>
  );
};

export default UserProfile;
