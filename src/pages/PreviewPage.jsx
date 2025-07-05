// frontend/src/pages/PreviewPage.jsx
import React from 'react';
import './PreviewPage.css'; // Import the CSS for this page
// import Modal from '../components/Modal/Modal'; // Uncomment if you need a modal on this page

/**
 * PreviewPage Component
 * Displays information about the game before the user starts playing.
 * @param {Object} currentUser - The current logged-in user object { id, username, pfpUrl, team: { name, color } }.
 * @param {function} onStartGame - Callback function to transition to the game screen.
 */
const PreviewPage = ({ currentUser, onStartGame }) => {
  // Safely access user data from currentUser prop
  const username = currentUser?.username || 'Player';
  const pfpUrl = currentUser?.pfpUrl || 'https://placehold.co/80x80/cccccc/000000?text=PFP'; // Fallback PFP
  const teamName = currentUser?.team?.name || 'Unknown';
  const teamColor = currentUser?.team?.color || '#6A0DAD'; // Default color if not available

  return (
    <div className="app-container"> {/* Changed from 'app' to 'app-container' to avoid conflict */}
      {/* Animated Background */}
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape shape-0"></div>
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="screen-container"> {/* This is the main content wrapper */}
        <div className="preview-screen-content"> {/* Renamed from 'login-screen' for clarity */}
          <div className="succinct-logo-section">
            <span className="logo-text">Who Wants To Be A Provernaire</span>
            <span className="logo-subtitle">Test your knowledge and win $PROVE tokens!</span>
          </div>

          {/* User Info Display */}
          <div className="user-info-large">
            <img
              src={pfpUrl}
              alt="Profile"
              className="user-pfp-large"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/000000?text=PFP'; }}
            />
            <div>
              <h2 className="username-large">{username}</h2>
              <div
                className="user-team-display"
                style={{ backgroundColor: teamColor }} // Apply dynamic color via inline style
              >
                {teamName}
              </div>
            </div>
          </div>

          {/* Game Instructions */}
          <div className="game-instructions-section">
            <h3 className="game-rules-title">Game Rules</h3>

            <div className="game-rules-content">
              <div className="rule-item">
                <strong className="rule-highlight-objective">Objective:</strong> Answer 10 questions correctly to win the grand prize of 1,000,000 $PROVE tokens!
              </div>

              <div className="rule-item">
                <strong className="rule-highlight-prize">Prize Structure:</strong> Each correct answer increases your prize money. Wrong answer = game over!
              </div>

              <div className="rule-item">
                <strong className="rule-highlight-lifelines">🛟 Lifelines:</strong> You have 4 lifelines to help you:
                <ul className="lifeline-list">
                  <li><strong>50/50:</strong> Removes 2 wrong answers</li>
                  <li><strong>Phone Addy:</strong> Get the correct answer</li>
                  <li><strong>Phone Yinger:</strong> Get the correct answer</li>
                  <li><strong>Ask Audience:</strong> See how the audience voted</li>
                </ul>
              </div>

              <div className="rule-item">
                <strong className="rule-highlight-walkaway">Walk Away:</strong> You can walk away at any time with your current prize (except on question 1).
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            onClick={onStartGame}
            className="start-game-button"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
