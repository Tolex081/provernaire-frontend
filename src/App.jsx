// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import TeamSelectionPage from './pages/TeamSelectionPage';
import PreviewPage from './pages/PreviewPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import './App.css'; // Global CSS for the overall app layout/body
import Modal from './components/Modal/Modal'; // Import the Modal component

/**
 * App Component
 * This is the main application component that handles routing/flow
 * between different screens based on user authentication and game state.
 */
const App = () => {
  // State to hold the current user's data (username, pfpUrl, team, etc.)
  const [currentUser, setCurrentUser] = useState(null);
  // State to manage the currently active screen/page
  const [currentScreen, setCurrentScreen] = useState('login'); // Initial screen
  // State to store the result of the last game played
  const [latestGameResult, setLatestGameResult] = useState(null);

  // Modal states for global messages
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Effect to load user data from local storage on initial app load
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      if (storedUser && storedUser._id) { // Check for _id from backend
        // Map backend's _id to frontend's id for consistency
        setCurrentUser({ ...storedUser, id: storedUser._id });
        // Determine initial screen based on stored user data
        if (storedUser.team && storedUser.team.name) {
          setCurrentScreen('preview'); // If user has team, go to preview
        } else {
          setCurrentScreen('teamSelection'); // If user logged in but no team, go to team selection
        }
      } else {
        setCurrentScreen('login'); // Fallback if no valid user data
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
      localStorage.removeItem('currentUser'); // Clear invalid data
      setCurrentScreen('login'); // Fallback to login
    }
  }, []); // Empty dependency array means this runs once on mount

  /**
   * Callback function for successful login/registration.
   * Updates the current user state and persists it to local storage.
   * Transitions to the team selection screen.
   * @param {Object} userData - The user object returned from the backend after login/registration.
   */
  const handleLoginSuccess = (userData) => {
    // Map backend's _id to frontend's id for consistency
    const userWithFrontendId = { ...userData, id: userData._id };
    setCurrentUser(userWithFrontendId);
    localStorage.setItem('currentUser', JSON.stringify(userWithFrontendId)); // Persist user data
    // After login, check if user already has a team.
    if (userData.team && userData.team.name) {
      setCurrentScreen('preview'); // If user has team, go to preview
    } else {
      setCurrentScreen('teamSelection'); // If new user or no team, go to team selection
    }
  };

  /**
   * Callback function for successful team selection.
   * Updates the current user state with the new team information and persists it.
   * Transitions to the preview screen.
   * @param {Object} updatedUser - The user object with updated team information.
   */
  const handleTeamSelectionSuccess = (updatedUser) => {
    // Ensure updatedUser also has 'id' if it's coming from a backend response directly
    const userToSet = updatedUser.id ? updatedUser : { ...updatedUser, id: updatedUser._id };
    setCurrentUser(userToSet);
    localStorage.setItem('currentUser', JSON.stringify(userToSet)); // Update persisted user data
    setCurrentScreen('preview'); // After team selection, go to preview
  };

  /**
   * Callback function to start the game from the preview screen.
   * Transitions to the game screen.
   */
  const handleStartGame = () => {
    setCurrentScreen('game'); // Transition to the game screen
  };

  /**
   * Callback function for when a game ends.
   * Saves the game result and transitions to the result screen.
   * @param {number} finalScore - The final score achieved in the game.
   * @param {string} reason - The reason the game ended (e.g., 'win', 'lose', 'walk_away', 'time_up').
   */
  const handleGameEnd = (finalScore, reason) => {
    console.log(`Game ended. Final Score: ${finalScore}, Reason: ${reason}`);
    setLatestGameResult({ score: finalScore, reason: reason, timestamp: new Date().toISOString() });
    setCurrentScreen('result'); // Transition to the result screen
  };

  /**
   * Callback function to update the user's score on the backend.
   * This is called periodically during the game or at key events.
   * @param {Object} scoreData - Object containing user ID, score, question number, and game status.
   */
  const handleScoreUpdate = async (scoreData) => {
    console.log('App.jsx - Sending score update to backend:', scoreData);
    // In a real application, you would make an API call here:
    // try {
    //   const response = await updateGameScore(scoreData); // You'll create this API function
    //   if (response.success) {
    //     console.log('Score updated successfully on backend.');
    //     // Optionally update currentUser with new totalScore if backend returns it
    //     if (response.user) {
    //       // Ensure the user object from backend also has 'id' mapped from '_id'
    //       const updatedUser = { ...response.user, id: response.user._id };
    //       setCurrentUser(updatedUser);
    //       localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    //     }
    //   } else {
    //     console.error('Failed to update score on backend:', response.message);
    //   }
    // } catch (error) {
    //   console.error('Error updating score:', error);
    //   setModalMessage('Error updating score. Please try again.');
    //   setShowModal(true);
    // }
    // For now, just log:
    console.log('Mock backend score update:', scoreData);
  };

  /**
   * Callback function to navigate to the leaderboard screen.
   */
  const handleNavigateToLeaderboard = () => {
    setCurrentScreen('leaderboard');
  };

  /**
   * Callback function to handle playing the game again.
   * Resets game state and navigates to the preview page.
   */
  const handlePlayAgain = () => {
    setLatestGameResult(null); // Clear previous result
    setCurrentScreen('preview'); // Go back to preview to start a new game
  };


  // Conditional rendering based on the currentScreen state
  return (
    <div className="app-container"> {/* Main container for the whole app */}
      {/* Render the appropriate page based on currentScreen state */}
      {(() => {
        switch (currentScreen) {
          case 'login':
            return <LoginPage onLogin={handleLoginSuccess} />;
          case 'teamSelection':
            return <TeamSelectionPage currentUser={currentUser} onTeamSelected={handleTeamSelectionSuccess} />;
          case 'preview':
            if (currentUser) {
              return <PreviewPage currentUser={currentUser} onStartGame={handleStartGame} />;
            }
            return <LoginPage onLogin={handleLoginSuccess} />; // Fallback if currentUser is null
          case 'game':
            if (currentUser) {
              return (
                <GamePage
                  currentUser={currentUser}
                  onGameEnd={handleGameEnd}
                  onScoreUpdate={handleScoreUpdate}
                  onNavigateToLeaderboard={handleNavigateToLeaderboard}
                />
              );
            }
            return <LoginPage onLogin={handleLoginSuccess} />; // Fallback
          case 'result':
            if (currentUser && latestGameResult) {
              return (
                <ResultPage
                  currentUser={currentUser}
                  gameResult={latestGameResult}
                  onPlayAgain={handlePlayAgain}
                  onNavigateToLeaderboard={handleNavigateToLeaderboard}
                  onScoreUpdate={handleScoreUpdate}
                />
              );
            }
            return <LoginPage onLogin={handleLoginSuccess} />; // Fallback if no user or result
          case 'leaderboard':
            if (currentUser) {
              return (
                <LeaderboardPage
                  currentUser={currentUser}
                  onBackToGame={handlePlayAgain} // Use handlePlayAgain to go back to preview
                  isVisible={currentScreen === 'leaderboard'} // Pass visibility prop
                />
              );
            }
            return <LoginPage onLogin={handleLoginSuccess} />; // Fallback
          default:
            return <LoginPage onLogin={handleLoginSuccess} />;
        }
      })()}

      {/* Global Modal for app-wide messages */}
      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
    </div>
  );
};

export default App;
