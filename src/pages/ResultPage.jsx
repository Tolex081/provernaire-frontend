// frontend/src/pages/ResultPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './ResultPage.css'; // Ensure this CSS file exists and is styled
import Modal from '../components/Modal/Modal'; // Import the Modal component

/**
 * ResultPage Component
 * Displays the outcome of the game (win/lose/walk away/time up), final score,
 * and provides options to play again, view leaderboard, or stake tokens.
 *
 * @param {Object} currentUser - The current logged-in user object { id, username, pfpUrl, team: { name, color } }.
 * @param {Object} gameResult - Object containing the game's final score and reason { score, reason, timestamp }.
 * @param {function} onPlayAgain - Callback to restart the game (go back to preview).
 * @param {function} onNavigateToLeaderboard - Callback to navigate to the leaderboard.
 * @param {function} onNavigateToStake - Callback to navigate to the staking page.
 * @param {function} onScoreUpdate - Callback to ensure final score is sent to backend.
 */
const ResultPage = ({
  currentUser,
  gameResult,
  onPlayAgain,
  onNavigateToLeaderboard,
  onNavigateToStake,
  onScoreUpdate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [hasFinalScoreBeenUpdated, setHasFinalScoreBeenUpdated] = useState(false);

  // Determine game outcome message and styling
  const getOutcomeDetails = useCallback(() => {
    switch (gameResult?.reason) {
      case 'win':
        return {
          title: '🎉 Congratulations, Provernaire!',
          message: `You answered all 10 questions and won ${gameResult.score.toLocaleString()} $PROVE!`,
          class: 'result-win',
          icon: '🏆',
          animationClass: 'win-animation'
        };
      case 'lose':
        return {
          title: 'Game Over!',
          message: `You answered incorrectly. Your secured prize was ${gameResult.score.toLocaleString()} $PROVE.`,
          class: 'result-lose',
          icon: '❌',
          animationClass: 'lose-animation'
        };
      case 'walk_away':
        return {
          title: 'Smart Move!',
          message: `You walked away with a secured prize of ${gameResult.score.toLocaleString()} $PROVE.`,
          class: 'result-walk-away',
          icon: '🚶',
          animationClass: 'walk-away-animation'
        };
      case 'time_up':
        return {
          title: 'Time Ran Out!',
          message: `You ran out of time. Your secured prize was ${gameResult.score.toLocaleString()} $PROVE.`,
          class: 'result-time-up',
          icon: '⏰',
          animationClass: 'time-up-animation'
        };
      default:
        return {
          title: 'Game Ended',
          message: `Your final score is ${gameResult?.score?.toLocaleString() || 0} $PROVE.`,
          class: 'result-default',
          icon: '🎮',
          animationClass: ''
        };
    }
  }, [gameResult]);

  const outcome = getOutcomeDetails();

  // Ensure the final score is updated on the backend when ResultPage loads
  useEffect(() => {
    if (currentUser?.id && gameResult && !hasFinalScoreBeenUpdated) {
      console.log('ResultPage: Sending final game result to backend...');
      // The GamePage already sends updates, but this ensures the final status is recorded
      // if the page is refreshed or navigated to directly.
      onScoreUpdate({
        userId: currentUser.id,
        username: currentUser.username,
        pfpUrl: currentUser.pfpUrl,
        team: currentUser.team,
        score: gameResult.score,
        questionNumber: gameResult.reason === 'win' ? 10 : (gameResult.reason === 'walk_away' ? gameResult.questionNumber : (gameResult.reason === 'lose' || gameResult.reason === 'time_up' ? gameResult.questionNumber : 0)),
        completed: gameResult.reason === 'win',
        failed: gameResult.reason === 'lose',
        walkedAway: gameResult.reason === 'walk_away',
        timeUp: gameResult.reason === 'time_up',
        gameStatus: gameResult.reason === 'win' ? 'finished' : (gameResult.reason === 'walk_away' ? 'walked_away' : 'game_over')
      });
      setHasFinalScoreBeenUpdated(true);
    }
  }, [currentUser, gameResult, onScoreUpdate, hasFinalScoreBeenUpdated]);


  // Fallback if gameResult is not available
  if (!gameResult) {
    return (
      <div className="result-page-container">
        <div className="result-card">
          <h2 className="result-title">No Game Result Found</h2>
          <p className="result-message">Please play a game first to see your results.</p>
          <button className="result-button primary-button" onClick={onPlayAgain}>
            Play Now!
          </button>
        </div>
      </div>
    );
  }

  // --- NEW: Handle navigation to the external staking platform ---
  const handleNavigateToExternalStake = () => {
    if (gameResult.score > 0) {
      // IMPORTANT: Replace this with the actual URL where you will deploy your new staking platform.
      // For local testing, it might be 'http://localhost:8080/index.html' or similar.
      // For a deployed version, it would be 'https://your-staking-platform-url.vercel.app'.
      const stakingPlatformURL = `https://provernaire-staker.vercel.app/?score=${gameResult.score}`; // Example local URL
      // OR for deployed: const stakingPlatformURL = `https://your-staking-platform-url.vercel.app?score=${gameResult.score}`;

      window.open(stakingPlatformURL, '_blank'); // Open in a new tab/window
      // Alternatively, if you want to navigate within the same tab:
      // window.location.href = stakingPlatformURL;
    } else {
      setModalMessage('You need a score greater than 0 to stake tokens.');
      setShowModal(true);
    }
  };

  return (
    <div className={`result-page-container ${outcome.class}`}>
      {/* Background Animation - can be dynamic based on outcome */}
      <div className={`animated-background ${outcome.animationClass}`}>
        <div className="floating-shapes">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`shape shape-${i % 4}`}></div>
          ))}
        </div>
      </div>

      <div className="result-content-wrapper">
        <div className={`result-card ${outcome.class}`}>
          <div className="result-icon">{outcome.icon}</div>
          <h2 className="result-title">{outcome.title}</h2>
          <p className="result-message">{outcome.message}</p>

          <div className="user-summary">
            <img
              src={currentUser?.pfpUrl || 'https://placehold.co/80x80/cccccc/000000?text=PFP'}
              alt="User Profile"
              className="user-pfp"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/000000?text=PFP'; }}
            />
            <div className="user-details">
              <span className="username">@{currentUser?.username || 'Guest'}</span>
              <span className="team-name" style={{ color: currentUser?.team?.color }}>
                {currentUser?.team?.name || 'No Team'}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="result-button primary-button" onClick={onPlayAgain}>
              Play Again
            </button>
            <button className="result-button secondary-button" onClick={onNavigateToLeaderboard}>
              View Leaderboard
            </button>
            {/* NEW: Stake Tokens Button - now calls the external navigation handler */}
            {gameResult.score > 0 && (
              <button className="result-button stake-button" onClick={handleNavigateToExternalStake}>
                Stake Your {gameResult.score.toLocaleString()} $PROVE
              </button>
            )}
          </div>

          {/* Staking Reminder (optional, can be removed if stake button is prominent) */}
          {gameResult.score > 0 && (
            <div className="staking-reminder">
              <p>Don't forget to stake your $PROVE tokens!</p>
          </div>
          )}
        </div>
      </div>
      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
    </div>
  );
};

export default ResultPage;
