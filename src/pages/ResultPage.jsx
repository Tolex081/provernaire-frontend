// frontend/src/pages/ResultPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import html2canvas from 'html2canvas'; // Import html2canvas
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
  const resultCardRef = useRef(null); // Ref for the result card to capture for download

  // Determine game outcome message, emoji, and styling based on score and reason
  const getOutcomeDetails = useCallback(() => {
    const score = gameResult?.score || 0;
    const reason = gameResult?.reason;

    let title = 'Game Ended';
    let message = `Your final score is ${score.toLocaleString()} $PROVE.`;
    let emoji = '🎮';
    let animationClass = '';
    let resultClass = 'result-default';

    if (reason === 'win') {
      title = '🎉 Congratulations, Provernaire!';
      message = `You answered all 10 questions correctly and won ${score.toLocaleString()} $PROVE!`;
      emoji = '🏆';
      animationClass = 'win-animation';
      resultClass = 'result-win';
    } else if (reason === 'lose') {
      title = 'Game Over!';
      message = `You answered incorrectly. Your secured prize was ${score.toLocaleString()} $PROVE.`;
      emoji = '❌';
      animationClass = 'lose-animation';
      resultClass = 'result-lose';
    } else if (reason === 'walk_away') {
      title = 'Smart Move!';
      message = `You walked away with a secured prize of ${score.toLocaleString()} $PROVE.`;
      emoji = '🚶';
      animationClass = 'walk-away-animation';
      resultClass = 'result-walk-away';
    } else if (reason === 'time_up') {
      title = 'Time Ran Out!';
      message = `You ran out of time. Your secured prize was ${score.toLocaleString()} $PROVE.`;
      emoji = '⏰';
      animationClass = 'time-up-animation';
      resultClass = 'result-time-up';
    } else if (score === 0) {
      title = "Better Luck Next Time!";
      message = "Don't worry, every expert was once a beginner. Study up on Succinct Labs and try again!";
      emoji = "😅";
    } else if (score < 10000) {
      title = "Great Start!";
      message = "You're on your way to becoming a Succinct Labs expert!";
      emoji = "🎯";
    } else if (score < 50000) {
      title = "Impressive Knowledge!";
      message = "You really know your stuff about Succinct Labs!";
      emoji = "�";
    } else if (score < 100000) {
      title = "Succinct Master!";
      message = "Outstanding! You're a true Succinct Labs expert!";
      emoji = "⭐";
    } else if (score >= 1000000) { // Assuming 1,000,000 is the max prize for "Perfect Game"
      title = "PERFECT GAME!";
      message = "Incredible! You've mastered everything about Succinct Labs!";
      emoji = "🏆";
    }

    return { title, message, emoji, class: resultClass, animationClass };
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


  // --- Handle navigation to the external staking platform ---
  const handleNavigateToExternalStake = useCallback(() => {
    if (gameResult.score > 0) {
      const stakingPlatformURL = `http://localhost:3001/?score=${gameResult.score}`; // Example local URL
      window.open(stakingPlatformURL, '_blank');
    } else {
      setModalMessage('You need a score greater than 0 to stake tokens.');
      setShowModal(true);
    }
  }, [gameResult, setShowModal, setModalMessage]);

  // --- Download Result Function ---
  const handleDownloadResult = useCallback(async () => {
    if (resultCardRef.current) {
      try {
        // Add a class to hide elements that shouldn't be in the screenshot (e.g., buttons)
        // This is handled by CSS, where .clean-export hides certain elements.
        resultCardRef.current.classList.add('clean-export');

        const canvas = await html2canvas(resultCardRef.current, {
          backgroundColor: '#1F2937', // Use the solid background color of the card
          scale: 2, // Increase scale for better quality
          useCORS: true, // Important for images loaded from other origins (like PFPs)
          // Explicitly set width and height for consistency in download, if needed
          // These values should ideally match the actual rendered size of the card
          width: resultCardRef.current.offsetWidth,
          height: resultCardRef.current.offsetHeight,
        });

        // Remove the class after rendering the canvas
        resultCardRef.current.classList.remove('clean-export');

        const link = document.createElement('a');
        link.download = `provernaire_game_result_${currentUser?.username || 'user'}_${gameResult.score}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setModalMessage('Result downloaded as image!');
        setShowModal(true);
      } catch (error) {
        console.error('Error generating screenshot:', error);
        setModalMessage('Failed to download result. Please try again.');
        setShowModal(true);
      }
    } else {
      setModalMessage('Could not find the result card to download.');
      setShowModal(true);
    }
  }, [currentUser, gameResult, setShowModal, setModalMessage]);

  // --- Share on X (Twitter) Function ---
  const handleShareOnX = useCallback(() => {
    const tweetText = `I just played Who Wants To Be A Provernaire and ${outcome.message} And i
    I won ${gameResult.score.toLocaleString()} $PROVE! Test your knowledge!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  }, [gameResult, outcome.message]);


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

      <div className="result-container"> {/* This now acts as the main content wrapper */}
        {/* The Result Card - this is what will be downloaded */}
        <div ref={resultCardRef} className={`result-card ${outcome.class}`}>
          <div className="result-card-header">
            <div className="succinct-logo">
              <span className="logo-text">Who Wants To Be A Provernaire</span>
              <span className="logo-subtitle">Trivia Challenge</span>
            </div>
          </div>

          <div className="result-card-content">
            <div className="user-info-large">
              <img
                src={currentUser?.pfpUrl || 'https://placehold.co/80x80/cccccc/000000?text=PFP'}
                alt="User Profile"
                className="user-pfp-large"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/000000?text=PFP'; }}
              />
              <div className="user-details">
                <h2 className="username-large">@{currentUser?.username || 'Guest'}</h2>
                <div
                  className="team-badge-large"
                  style={{ backgroundColor: currentUser?.team?.color }}
                >
                  {currentUser?.team?.name || 'No Team'}
                </div>
              </div>
            </div>

            <div className="score-display">
              <div className="result-emoji">{outcome.emoji}</div>
              <h1 className="final-score">{gameResult.score.toLocaleString()}</h1>
              <div className="prove-token">$PROVE TOKENS</div>
            </div>

            <div className="result-message">
              <h3 className="result-title">{outcome.title}</h3>
              <p className="result-text">{outcome.message}</p>
            </div>

            {gameResult.score > 0 && (
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
        </div> {/* End of result-card */}

        {/* Action Buttons - Moved outside the result-card */}
        <div className="result-actions"> {/* This is the wrapper for all buttons */}
          <div className="primary-actions">
            <button className="result-button download-button" onClick={handleDownloadResult}>
              <span>Download Result</span>
            </button>
            <button className="result-button share-x-button" onClick={handleShareOnX}>
              <span>Share on X</span>
            </button>
          </div>

          <div className="secondary-actions">
            <button className="result-button play-again-button" onClick={onPlayAgain}>
              <span>Play Again</span>
            </button>
            {/* <button className="result-button leaderboard-button" onClick={onNavigateToLeaderboard}>
              <span>Leaderboard</span>
            </button> */}
          </div>

          {gameResult.score > 0 && (
            <div className="staking-action">
              <button className="result-button stake-button" onClick={handleNavigateToExternalStake}>
                <span>Stake Your {gameResult.score.toLocaleString()} $PROVE Tokens</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
    </div>
  );
};

export default ResultPage;
