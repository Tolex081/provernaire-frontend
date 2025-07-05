// frontend/src/api/api.js
// Centralized place for frontend API calls

// Determine the API base URL based on the environment
// In a real Vercel deployment, REACT_APP_API_URL would be set to your backend URL.
// For local development, it might point to http://localhost:5000 (or your backend port).
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Registers or logs in a user.
 * Sends username and profile picture file to the backend.
 * @param {FormData} userData - FormData object containing 'username' and 'profilePicture' (File object).
 * @returns {Promise<Object>} - A promise that resolves to the backend response.
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      // When sending FormData, the 'Content-Type' header is automatically set to 'multipart/form-data'
      // by the browser, so we don't explicitly set it here.
      body: userData, // Pass the FormData object directly
    });

    // Check if the response is OK (status code 200-299)
    if (!response.ok) {
      const errorData = await response.json();
      // Throw an error with the backend's message for better error handling
      throw new Error(errorData.message || 'Failed to register/login user.');
    }

    return await response.json(); // Parse and return the JSON response
  } catch (error) {
    console.error('API Error (registerUser):', error);
    // Return a structured error object for the frontend to handle
    return { success: false, message: error.message || 'Network error or server issue.' };
  }
};

/**
 * Sends the selected team to the backend to update the user's profile.
 * @param {string} userId - The ID of the user whose team is being selected.
 * @param {string} teamName - The name of the team selected by the user.
 * @returns {Promise<Object>} - A promise that resolves to the backend response.
 */
export const selectUserTeam = async (userId, teamName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You might add an Authorization header here if using JWT tokens for authenticated requests
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId, teamName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to select team.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (selectUserTeam):', error);
    return { success: false, message: error.message || 'Network error or server issue.' };
  }
};

/**
 * Fetches a specified number of random questions from the backend for the game.
 * @param {number} limit - The number of questions to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the backend response containing questions.
 */
export const getGameQuestions = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/game/questions?limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch game questions.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (getGameQuestions):', error);
    return { success: false, message: error.message || 'Network error or server issue.' };
  }
};

/**
 * Updates a user's game score and session status on the backend.
 * @param {Object} scoreData - Object containing game session details.
 * @returns {Promise<Object>} - A promise that resolves to the backend response.
 */
export const updateGameScore = async (scoreData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/scores/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update game score.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (updateGameScore):', error);
    return { success: false, message: error.message || 'Network error or server issue.' };
  }
};

/**
 * Fetches the overall leaderboard data from the backend.
 * @returns {Promise<Array>} - A promise that resolves to an array of leaderboard entries.
 */
export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/scores/leaderboard`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch leaderboard data.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (getLeaderboard):', error);
    // Return an empty array or a structured error if fetching fails, depending on desired behavior
    return []; // Return empty array for now, LeaderboardPage handles error state
  }
};
