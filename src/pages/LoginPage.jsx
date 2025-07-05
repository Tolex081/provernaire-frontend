// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import './LoginPage.css'; // Import the CSS for this page
import Modal from '../components/Modal/Modal'; // Import the custom Modal component
import { registerUser } from '../api/api'; // Import the API function for user registration

/**
 * LoginPage Component
 * Handles user login/registration, profile picture upload, and initial user data submission.
 * @param {function} onLogin - Callback function to execute after successful login,
 * passing user data to the parent component (e.g., App.jsx).
 */
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState(null); // Stores the File object
  const [previewUrl, setPreviewUrl] = useState(null); // Stores the URL for PFP preview
  const [showModal, setShowModal] = useState(false); // State for showing/hiding the modal
  const [modalMessage, setModalMessage] = useState(''); // Message to display in the modal

  /**
   * Handles the file input change event for profile picture upload.
   * Creates a preview URL for the selected image.
   * @param {Event} event - The file input change event.
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePicture(file);
      // Create a URL for the file to display a preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setProfilePicture(null);
      setPreviewUrl(null);
    }
  };

  /**
   * Handles the login/submit button click.
   * Validates input, sends user data and PFP to the backend.
   * Replaces alert() with a custom modal for user feedback.
   */
  const handleLogin = async () => {
    if (!username.trim()) {
      setModalMessage('Please enter a username.');
      setShowModal(true);
      return;
    }
    if (!profilePicture) {
      setModalMessage('Please upload a profile picture.');
      setShowModal(true);
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, ''); // Remove leading '@' if present

    // FormData is used to send files along with other data in a multipart/form-data request
    const formData = new FormData();
    formData.append('username', cleanUsername);
    formData.append('profilePicture', profilePicture); // Append the File object

    try {
      // Call the backend API to register/login the user
      const response = await registerUser(formData);

      if (response.success) {
        // If login/registration is successful, pass user data to the parent component
        onLogin(response.user); // Assuming response.user contains { username, pfpUrl, team }
      } else {
        // Display error message from the backend
        setModalMessage(response.message || 'Login failed. Please try again.');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setModalMessage('An error occurred. Please try again later.');
      setShowModal(true);
    }
  };

  return (
    <div className="screen-container"> {/* Updated class name */}
      {/* Animated Background */}
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape shape-0"></div>
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="login-screen"> {/* Updated class name */}
        {/* Header */}
        <h1 className="login-title">Who Wants To Be A Provernaire</h1>
        <p className="login-subtitle">
          Test your knowledge and win <span className="highlight-text">$PROVE</span> tokens!
        </p>

        {/* Form Section */}
        <div className="login-form-section">
          {/* Username Input */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your X username"
              className="form-input"
            />
          </div>

          {/* Profile Picture Upload */}
          <div className="form-group">
            <label htmlFor="pfp" className="form-label">
              Profile Picture
            </label>
            <input
              id="pfp"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="form-input file-input"
            />

            {/* PFP Preview */}
            {previewUrl && (
              <div className="pfp-preview-container">
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="pfp-preview-image"
                />
              </div>
            )}
          </div>
        </div>

        {/* Login Button */}
        <button onClick={handleLogin} className="login-button">
          Submit
        </button>
      </div>

      {/* Custom Modal for alerts */}
      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
    </div>
  );
};

export default LoginPage;
