// frontend/src/pages/ResultPage.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import html2canvas from 'html2canvas'; // Note: This should be 'html2canvas' in a real project
import './ResultPage.css'; // Import the CSS for this page

/**
 * ResultPage Component
 * Displays the final results of a game, including score and game status.
 * Provides options to play again, navigate to the leaderboard, and download/share results.
 * @param {Object} currentUser - The current logged-in user object { id, username, pfpUrl, team: { name, color } }.
 * @param {Object} gameResult - Object containing the game's outcome { score, reason, timestamp }.
 * @param {function} onPlayAgain - Callback to restart the game (navigate to preview).
 * @param {function} onNavigateToLeaderboard - Callback to navigate to the leaderboard.
 * @param {function} onScoreUpdate - Callback to update score on the backend.
 */
const ResultPage = ({ currentUser, gameResult, onPlayAgain, onNavigateToLeaderboard, onScoreUpdate }) => {
  const resultCardRef = useRef(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Default values if props are not fully provided
  const finalScore = gameResult?.score || 0;
  const gameReason = gameResult?.reason || 'unknown';
  const username = currentUser?.username || 'Player';
  const pfpUrl = currentUser?.pfpUrl || 'https://placehold.co/80x80/cccccc/000000?text=PFP';
  const teamName = currentUser?.team?.name || 'Unknown Team';
  const teamColor = currentUser?.team?.color || '#6A0DAD';

  // Memoized callback to submit the final score to the backend
  const submitFinalScore = useCallback(() => {
    // Only submit if onScoreUpdate is provided and score hasn't been submitted yet
    if (onScoreUpdate && finalScore !== null && !scoreSubmitted) {
      // Determine question number based on finalScore, assuming prize structure from GamePage
      // This is a simplified calculation; a more robust solution might pass the actual questionNumber from GamePage
      let questionNumberAchieved = 0;
      if (finalScore >= 1000) { // Assuming 1000 is the first prize tier
        const prizeStructure = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
        questionNumberAchieved = prizeStructure.indexOf(finalScore) + 1;
      }

      onScoreUpdate({
        userId: currentUser.id, // Use userId for backend identification
        username: username,
        pfpUrl: pfpUrl,
        team: currentUser.team, // Pass the full team object
        score: finalScore,
        questionNumber: questionNumberAchieved,
        completed: gameReason === 'win',
        failed: gameReason === 'lose' || gameReason === 'time_up',
        walkedAway: gameReason === 'walk_away',
        timeUp: gameReason === 'time_up',
        gameStatus: gameReason // Pass the reason as gameStatus
      });
      setScoreSubmitted(true); // Mark score as submitted
    }
  }, [onScoreUpdate, finalScore, scoreSubmitted, currentUser, username, pfpUrl, gameReason]);

  // Effect to submit score when component mounts and score is available
  useEffect(() => {
    submitFinalScore();
  }, [submitFinalScore]); // Depend on submitFinalScore memoized callback

  // Function to download the result card as an image
  const downloadResult = async () => {
    if (resultCardRef.current) {
      try {
        // Add clean-export class to hide elements not desired in the screenshot
        resultCardRef.current.classList.add('clean-export');

        const canvas = await html2canvas(resultCardRef.current, {
          backgroundColor: null, // Transparent background
          scale: 2, // Higher scale for better quality
          useCORS: true, // Enable cross-origin images if any
          // Specify width/height if you want a fixed size for the screenshot,
          // otherwise, html2canvas will use the element's rendered size.
          // width: 600, // Example fixed width
          // height: 800, // Example fixed height
        });

        // Remove the class after rendering to restore original display
        resultCardRef.current.classList.remove('clean-export');

        const link = document.createElement('a');
        link.download = `succinct-trivia-${username.replace(/[^a-zA-Z0-9]/g, '')}-${finalScore}prove.png`;
        link.href = canvas.toDataURL('image/png'); // Get data URL as PNG
        link.click(); // Trigger download
      } catch (error) {
        console.error('❌ Error generating image:', error);
        // Optionally show a modal message to the user
      }
    }
  };

  // Function to share result to X (Twitter)
  const shareToX = () => {
    const text = `Just won ${finalScore.toLocaleString()} $PROVE tokens playing Succinct Labs Trivia! 🎯🚀 Think you can beat my score? My team: ${teamName}!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer'); // Open in new tab, secure
  };

  // Determine the message and emoji based on the final score
  const getResultMessage = useCallback(() => {
    if (finalScore === 0) {
      return {
        title: "Better Luck Next Time!",
        message: "Don't worry, every expert was once a beginner. Study up on Succinct Labs and try again!",
        emoji: "😅"
      };
    } else if (finalScore < 10000) {
      return {
        title: "Great Start!",
        message: "You're on your way to becoming a Succinct Labs expert!",
        emoji: "🎯"
      };
    } else if (finalScore < 50000) {
      return {
        title: "Impressive Knowledge!",
        message: "You really know your stuff about Succinct Labs!",
        emoji: "🔥"
      };
    } else if (finalScore < 100000) {
      return {
        title: "Succinct Master!",
        message: "Outstanding! You're a true Succinct Labs expert!",
        emoji: "⭐"
      };
    } else { // finalScore >= 100000
      return {
        title: "PERFECT GAME!",
        message: "Incredible! You've mastered everything about Succinct Labs!",
        emoji: "🏆"
      };
    }
  }, [finalScore]); // Recalculate only if finalScore changes

  const resultDisplay = getResultMessage(); // Get the result message and emoji

  return (
    <div className="result-page-container">
      {/* 3D Background Animation */}
      <div className="background-animation">
        <div className="floating-shapes celebration">
          {[...Array(30)].map((_, i) => (
            <div key={i} className={`shape shape-${i % 6} celebration-shape`}></div>
          ))}
        </div>
        <div className="confetti">
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`confetti-piece confetti-${i % 4}`}></div>
          ))}
        </div>
      </div>

      <div className="result-content-wrapper">
        <div ref={resultCardRef} className="result-card">
          <div className="result-card-header">
            <div className="succinct-logo">
              <span className="logo-text">Who Wants To Be A Provernaire</span>
              <span className="logo-subtitle">Trivia Challenge</span>
            </div>
          </div>

          <div className="result-card-content">
            <div className="user-info-large">
              <img
                src={pfpUrl}
                alt="Profile"
                className="user-pfp-large"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/000000?text=PFP'; }}
              />
              <div className="user-details">
                <h2 className="username-large">{username}</h2>
                <div
                  className="team-badge-large"
                  style={{ backgroundColor: teamColor }}
                >
                  {teamName}
                </div>
              </div>
            </div>

            <div className="score-display">
              <div className="result-emoji">{resultDisplay.emoji}</div>
              <h1 className="final-score">{finalScore.toLocaleString()}</h1>
              <div className="prove-token">$PROVE TOKENS</div>
            </div>

            <div className="result-message">
              <h3 className="result-title">{resultDisplay.title}</h3>
              <p className="result-text">{resultDisplay.message}</p>
            </div>

            {finalScore > 0 && (
              <div className="staking-reminder">
                <div className="reminder-icon">💎</div>
                <div className="reminder-text">
                  <strong>Don't forget to stake your $PROVE tokens!</strong>
                  <br />
                  Maximize your rewards in the Succinct ecosystem
                </div>
              </div>
            )}

            <div className="card-footer">
              <div className="succinct-branding">
                <span>Powered by Succinct Labs</span>
                <div className="team-colors">
                  <div className="color-dot" style={{ backgroundColor: '#B753FF' }}></div>
                  <div className="color-dot" style={{ backgroundColor: '#FF955E' }}></div>
                  <div className="color-dot" style={{ backgroundColor: '#B0FF6F' }}></div>
                  <div className="color-dot" style={{ backgroundColor: '#61C3FF' }}></div>
                  <div className="color-dot" style={{ backgroundColor: '#FF54D7' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <div className="primary-actions">
            <button className="download-button" onClick={downloadResult}>
              <span>Download Result</span>
            </button>
            <button className="share-x-button" onClick={shareToX}>
              <span>Share on X</span>
            </button>
          </div>

          <div className="secondary-actions">
            <button className="play-again-button" onClick={onPlayAgain}>
              <span>Play Again</span>
            </button>

            <button className="leaderboard-button" onClick={onNavigateToLeaderboard}>
              <span>Leaderboard</span>
            </button>
          </div>

          {finalScore > 0 && (
            <div className="staking-action">
              <button className="stake-button">
                <span>Stake Your $PROVE Tokens</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
