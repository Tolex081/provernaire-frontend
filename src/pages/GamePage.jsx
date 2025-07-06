// frontend/src/pages/GamePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { questions } from '../data/question'; // RE-ADDED: Using mock data for questions
import Lifeline from '../components/Lifeline/Lifeline';
import './GamePage.css';
import Modal from '../components/Modal/Modal';
import { updateGameScore } from '../api/api'; // getGameQuestions removed as it's no longer needed

/**
 * GamePage Component
 * Manages the main game logic, question display, answer submission, lifelines, and score tracking.
 * @param {Object} currentUser - The current logged-in user object { id, username, pfpUrl, team: { name, color } }.
 * @param {function} onGameEnd - Callback function to transition to the result screen, passing final score.
 * @param {function} onScoreUpdate - Callback function to update score on the backend (e.g., after each question).
 * @param {function} onNavigateToLeaderboard - Callback function to navigate to the leaderboard screen.
 */
const GamePage = ({ currentUser, onGameEnd, onScoreUpdate, onNavigateToLeaderboard }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [gameQuestions, setGameQuestions] = useState([]); // Will be initialized from local data
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    phoneAddy: true,
    phoneYinger: true,
    askAudience: true
  });
  const [removedAnswers, setRemovedAnswers] = useState([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [hasUpdatedScoreForCurrentQuestion, setHasUpdatedScoreForCurrentQuestion] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Updated prize structure: Question 1 = 1,000, Question 10 = 1,000,000
  const prizeStructure = [
    1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000
  ];

  // Memoized callback for game end to prevent unnecessary re-renders
  const handleGameEndCallback = useCallback((score, reason = 'completed') => {
    console.log('🎮 Game ending with score:', score, 'Reason:', reason);
    if (onGameEnd) {
      onGameEnd(score, reason);
    }
  }, [onGameEnd]);

  // Memoized callback for score update (to backend)
  // This now directly calls the API function
  const handleScoreUpdateCallback = useCallback(async (scoreData) => {
    console.log('📊 Attempting to update score via API:', scoreData);
    try {
      const response = await updateGameScore(scoreData);
      if (response.success) {
        console.log('Score updated successfully on backend.');
        // Optionally, if the backend returns the updated user, you might update currentUser here
        // if (response.user) {
        //   // This would require a prop to update currentUser in App.jsx
        // }
      } else {
        console.error('Failed to update score on backend:', response.message);
        // Optionally show a modal or alert the user about the failure
      }
    } catch (error) {
      console.error('Error calling updateGameScore API:', error);
      // Optionally show a modal or alert the user about the network error
    }
  }, []); // No dependencies on currentUser, as scoreData already contains userId etc.

  // Timer effect
  useEffect(() => {
    let interval;

    if (timerActive && timeRemaining > 0 && !isAnswerSubmitted) {
      interval = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(interval);
            setTimerActive(false);
            setIsAnswerSubmitted(true);

            const gameOverScore = currentQuestionIndex > 0 ? prizeStructure[currentQuestionIndex - 1] : 0;

            setTimeout(() => {
              if (currentUser?.id) {
                handleScoreUpdateCallback({
                  userId: currentUser.id,
                  username: currentUser.username,
                  pfpUrl: currentUser.pfpUrl,
                  team: currentUser.team,
                  score: gameOverScore,
                  questionNumber: currentQuestionIndex + 1,
                  timeUp: true,
                  gameStatus: 'time_up'
                });
              }
              handleGameEndCallback(gameOverScore, 'time_up');
            }, 500);

            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerActive, isAnswerSubmitted, timeRemaining, currentQuestionIndex, prizeStructure, currentUser, handleScoreUpdateCallback, handleGameEndCallback]);

  // Timer restart when moving to new question or game starts
  useEffect(() => {
    if (gameQuestions.length > 0 && gameQuestions[currentQuestionIndex] && !isAnswerSubmitted) {
      setTimeRemaining(60);
      setTimerActive(true);
      setHasUpdatedScoreForCurrentQuestion(false);
    } else if (isAnswerSubmitted) {
      setTimerActive(false);
    }
  }, [currentQuestionIndex, gameQuestions.length, isAnswerSubmitted]);

  // Initialize game questions on component mount from local data
  useEffect(() => {
    // Shuffle questions to ensure a random order each game
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    setGameQuestions(shuffledQuestions.slice(0, 10)); // Take the first 10 random questions
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setRemovedAnswers([]);
    setIsAnswerSubmitted(false);
    setLifelines({
      fiftyFifty: true,
      phoneAddy: true,
      phoneYinger: true,
      askAudience: true
    });
    setHasUpdatedScoreForCurrentQuestion(false);
    console.log('🎯 Game questions loaded from local data.');
  }, []); // Empty dependency array means this runs once on mount

  // Update leaderboard/score on backend when moving to a new question (or game start)
  useEffect(() => {
    if (gameQuestions.length > 0 && currentUser?.id && !hasUpdatedScoreForCurrentQuestion) {
      const scoreToUpdate = currentQuestionIndex > 0 ? prizeStructure[currentQuestionIndex - 1] : 0;

      console.log(`📈 Score update for entering question ${currentQuestionIndex + 1}, secured score: ${scoreToUpdate}`);

      handleScoreUpdateCallback({
        userId: currentUser.id,
        username: currentUser.username,
        pfpUrl: currentUser.pfpUrl,
        team: currentUser.team,
        score: scoreToUpdate,
        questionNumber: currentQuestionIndex + 1,
        gameStatus: 'in_progress'
      });

      setHasUpdatedScoreForCurrentQuestion(true);
    }
  }, [currentQuestionIndex, gameQuestions, currentUser, handleScoreUpdateCallback, hasUpdatedScoreForCurrentQuestion, prizeStructure]);


  const handleAnswerSelect = useCallback((answerIndex) => {
    if (removedAnswers.includes(answerIndex) || isAnswerSubmitted) return;
    setSelectedAnswerIndex(answerIndex);
  }, [removedAnswers, isAnswerSubmitted]);

  // Submit Answer function
  const submitAnswer = useCallback(() => {
    if (selectedAnswerIndex === null || !gameQuestions[currentQuestionIndex] || isAnswerSubmitted) {
      setModalMessage('Please select an answer before submitting.');
      setShowModal(true);
      return;
    }

    console.log(`🎯 Submitting answer ${selectedAnswerIndex} for question ${currentQuestionIndex + 1}`);
    setIsAnswerSubmitted(true);
    setTimerActive(false);

    const currentQuestionData = gameQuestions[currentQuestionIndex];
    const correct = currentQuestionData.correctAnswer === selectedAnswerIndex;

    setTimeout(() => {
      if (correct) {
        setModalMessage('✅ Correct Answer!');
        setShowModal(true);

        if (currentQuestionIndex === 9) {
          const finalScore = prizeStructure[currentQuestionIndex];
          console.log('🎉 Game completed! Final score:', finalScore);
          if (currentUser?.id) {
            handleScoreUpdateCallback({
              userId: currentUser.id,
              username: currentUser.username,
              pfpUrl: currentUser.pfpUrl,
              team: currentUser.team,
              score: finalScore,
              questionNumber: currentQuestionIndex + 1,
              completed: true,
              gameStatus: 'finished'
            });
          }
          handleGameEndCallback(finalScore, 'win');
        } else {
          console.log(`✅ Correct answer! Moving to question ${currentQuestionIndex + 2}`);
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswerIndex(null);
          setRemovedAnswers([]);
          setIsAnswerSubmitted(false);
          setHasUpdatedScoreForCurrentQuestion(false);
        }
      } else {
        setModalMessage('❌ Wrong Answer! Game Over.');
        setShowModal(true);

        const gameOverScore = currentQuestionIndex > 0 ? prizeStructure[currentQuestionIndex - 1] : 0;
        console.log('❌ Wrong answer! Game over with score:', gameOverScore);
        if (currentUser?.id) {
          handleScoreUpdateCallback({
            userId: currentUser.id,
            username: currentUser.username,
            pfpUrl: currentUser.pfpUrl,
            team: currentUser.team,
            score: gameOverScore,
            questionNumber: currentQuestionIndex + 1,
            failed: true,
            gameStatus: 'game_over'
          });
        }
        handleGameEndCallback(gameOverScore, 'lose');
      }
    }, 2000);
  }, [selectedAnswerIndex, gameQuestions, currentQuestionIndex, isAnswerSubmitted, prizeStructure, currentUser, handleScoreUpdateCallback, handleGameEndCallback]);

  // Callback to handle lifeline usage from the Lifeline component
  const handleLifelineUse = useCallback((type) => {
    console.log('Using lifeline:', type);
    setLifelines(prev => ({ ...prev, [type]: false }));

    const currentQuestionData = gameQuestions[currentQuestionIndex];
    if (!currentQuestionData) return;

    if (type === 'fiftyFifty') {
      const incorrectAnswers = currentQuestionData.options
        .map((_, i) => i)
        .filter(i => i !== currentQuestionData.correctAnswer);

      const answersToRemove = [];
      while (answersToRemove.length < 2 && incorrectAnswers.length > 0) {
        const randomIndex = Math.floor(Math.random() * incorrectAnswers.length);
        answersToRemove.push(incorrectAnswers.splice(randomIndex, 1)[0]);
      }
      setRemovedAnswers(answersToRemove);
      setModalMessage('50/50 used! Two incorrect answers have been removed.');
      setShowModal(true);
    } else if (type === 'phoneAddy' || type === 'phoneYinger') {
      setModalMessage(`Banger Bruhh that's easy the answer is: ${String.fromCharCode(65 + currentQuestionData.correctAnswer)} (${currentQuestionData.options[currentQuestionData.correctAnswer]})`);
      setShowModal(true);
    } else if (type === 'askAudience') {
      const votes = {};
      const correctAnswerIndex = currentQuestionData.correctAnswer;
      const totalVotes = 100;
      let remainingVotes = totalVotes;

      const correctVotes = Math.floor(Math.random() * (60 - 40 + 1)) + 40;
      votes[correctAnswerIndex] = correctVotes;
      remainingVotes -= correctVotes;

      const otherOptions = currentQuestionData.options.map((_, i) => i).filter(i => i !== correctAnswerIndex);
      const numOtherOptions = otherOptions.length;

      otherOptions.forEach((optionIndex, idx) => {
        if (idx === numOtherOptions - 1) {
          votes[optionIndex] = remainingVotes;
        } else {
          const voteShare = Math.floor(Math.random() * (remainingVotes / (numOtherOptions - idx) * 1.5));
          votes[optionIndex] = voteShare;
          remainingVotes -= voteShare;
        }
      });

      let audienceMessage = 'Audience votes:\n';
      currentQuestionData.options.forEach((option, index) => {
        audienceMessage += `${String.fromCharCode(65 + index)}: ${votes[index] || 0}%\n`;
      });
      setModalMessage(audienceMessage);
      setShowModal(true);
    }
  }, [gameQuestions, currentQuestionIndex]);


  // Walk Away function
  const walkAway = useCallback(() => {
    if (currentQuestionIndex === 0) {
      setModalMessage('You cannot walk away on the first question. You must answer!');
      setShowModal(true);
      return;
    }

    setTimerActive(false);
    setIsAnswerSubmitted(true);

    const currentPrizeSecured = prizeStructure[currentQuestionIndex - 1];
    console.log('🚶 Player walking away with:', currentPrizeSecured);

    if (currentUser?.id) {
      handleScoreUpdateCallback({
        userId: currentUser.id,
        username: currentUser.username,
        pfpUrl: currentUser.pfpUrl,
        team: currentUser.team,
        score: currentPrizeSecured,
        questionNumber: currentQuestionIndex,
        walkedAway: true,
        gameStatus: 'walked_away'
      });
    }
    handleGameEndCallback(currentPrizeSecured, 'walk_away');
  }, [currentQuestionIndex, prizeStructure, currentUser, handleScoreUpdateCallback, handleGameEndCallback]);

  // Handle leaderboard navigation with logging
  const handleLeaderboardClick = useCallback(() => {
    console.log('🏆 Navigating to leaderboard...');
    if (onNavigateToLeaderboard) {
      onNavigateToLeaderboard();
    } else {
      console.error('❌ onNavigateToLeaderboard function not provided');
      setModalMessage('Leaderboard navigation is not available.');
      setShowModal(true);
    }
  }, [onNavigateToLeaderboard]);

  // Memoized timer functions for dynamic styling
  const getTimerColor = useCallback(() => {
    if (timeRemaining > 30) return '#B0FF6F';
    if (timeRemaining > 15) return '#FF955E';
    return '#FF54D7';
  }, [timeRemaining]);

  const getTimerText = useCallback(() => {
    if (timeRemaining > 30) return '🟢';
    if (timeRemaining > 15) return '🟡';
    return '🔴';
  }, [timeRemaining]);

  // Early return for loading state or if questions aren't loaded yet
  if (gameQuestions.length === 0 || !gameQuestions[currentQuestionIndex]) {
    return (
      <div className="game-loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading questions...</div>
        </div>
      </div>
    );
  }

  const currentQuestionData = gameQuestions[currentQuestionIndex];
  const currentPrizePotential = prizeStructure[currentQuestionIndex];
  const timerColor = getTimerColor();
  const timerText = getTimerText();

  // Debug log for current state
  console.log('🎮 GamePage Render:', {
    questionNumber: currentQuestionIndex + 1,
    currentPrizePotential,
    timeRemaining,
    timerActive,
    isAnswerSubmitted,
    hasUpdatedScore: hasUpdatedScoreForCurrentQuestion,
    currentUser: currentUser?.username,
    currentTeam: currentUser?.team?.name,
  });

  return (
    <div className="game-page-container">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shapes">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`shape shape-${i % 4}`}></div>
          ))}
        </div>
      </div>

      <div className="game-content-wrapper">
        {/* Header */}
        <div className="game-header">
          <div className="user-info">
            <img
              src={currentUser?.pfpUrl || 'https://placehold.co/50x50/cccccc/000000?text=PFP'}
              alt="Profile"
              className="user-pfp"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/cccccc/000000?text=PFP'; }}
            />
            <span className="user-username">{currentUser?.username || 'User'}</span>
            <div
              className="user-team"
              style={{ backgroundColor: currentUser?.team?.color || '#000' }}
            >
              {currentUser?.team?.name || 'Team'}
            </div>
          </div>

          <div className="score-info">
            <div className="current-prize">
              {currentPrizePotential?.toLocaleString()} $PROVE
            </div>
            <div className="question-number">
              Question {currentQuestionIndex + 1} of 10
            </div>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Leaderboard Button */}
            <button
              className="leaderboard-button"
              onClick={handleLeaderboardClick}
              type="button"
              title="View Leaderboard"
            >
              <span className="leaderboard-icon">🏆</span>
              <span className="leaderboard-text">Leaderboard</span>
            </button>

            {/* Compact Lifelines and Timer Section */}
            <div className="lifelines-timer-section">
              {/* Timer Display */}
              <div
                className={`timer-display ${timeRemaining <= 10 ? 'timer-critical' : ''}`}
                style={{
                  color: timerColor,
                  borderColor: timerColor,
                  boxShadow: `0 0 10px ${timerColor}80`
                }}
              >
                {timerText} {timeRemaining}s
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Layout: Lifelines (Left) | Question (Center) | Prize Ladder (Right) */}
        <div className="main-game-layout">
          {/* Lifelines on the left */}
          <Lifeline
            lifelines={lifelines}
            onLifelineUse={handleLifelineUse}
            currentQuestion={currentQuestionData}
            isAnswerSubmitted={isAnswerSubmitted}
            onRemovedAnswers={setRemovedAnswers}
          />

          {/* Question in the center */}
          <div className="question-container">
            <div className="question-card">
              <h2 className="question-text">
                {currentQuestionData.question}
              </h2>

              <div className="answers-grid">
                {currentQuestionData.options.map((option, index) => (
                  <button
                    key={index}
                    className={`answer-button ${selectedAnswerIndex === index ? 'selected' : ''} ${removedAnswers.includes(index) ? 'removed' : ''} ${isAnswerSubmitted ? (index === currentQuestionData.correctAnswer ? 'correct' : (selectedAnswerIndex === index ? 'incorrect' : '')) : ''}`}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={removedAnswers.includes(index) || isAnswerSubmitted}
                    type="button"
                  >
                    <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="answer-text">{option}</span>
                  </button>
                ))}
              </div>

              <div className="action-buttons">
                <button
                  className="walk-away-button"
                  onClick={walkAway}
                  disabled={isAnswerSubmitted || currentQuestionIndex === 0}
                  type="button"
                >
                  Walk Away
                  {currentQuestionIndex > 0 && (
                    <span className="walk-away-amount">
                      ({prizeStructure[currentQuestionIndex - 1]?.toLocaleString()} $PROVE)
                    </span>
                  )}
                </button>

                <button
                  className="submit-button"
                  onClick={submitAnswer}
                  disabled={selectedAnswerIndex === null || isAnswerSubmitted}
                  type="button"
                >
                  {isAnswerSubmitted ? 'Processing...' : 'Final Answer'}
                </button>
              </div>
            </div>
          </div>

          {/* Prize Ladder on the right */}
          <div className="prize-ladder">
            <div className="prize-ladder-header">
              <h4 className="prize-ladder-title">💰 PRIZE LADDER</h4>
            </div>
            {[...prizeStructure].reverse().map((prize, reverseIndex) => {
              const actualIndex = prizeStructure.length - 1 - reverseIndex;
              return (
                <div
                  key={actualIndex}
                  className={`prize-item ${actualIndex === currentQuestionIndex ? 'current' : ''} ${actualIndex < currentQuestionIndex ? 'completed' : ''}`}
                >
                  <span className="prize-number">{actualIndex + 1}</span>
                  <span className="prize-amount">{prize.toLocaleString()} $PROVE</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Custom Modal for alerts */}
      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
    </div>
  );
};

export default GamePage;
