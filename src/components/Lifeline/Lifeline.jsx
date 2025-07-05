// frontend/src/components/Lifeline/Lifeline.jsx
import React, { useState, useCallback } from 'react';
import './Lifeline.css'; // Import CSS for Lifeline component

/**
 * Lifeline Component
 * Displays and manages the usage of game lifelines, with a toggle for visibility.
 * @param {Object} lifelines - Object indicating availability of each lifeline (e.g., { fiftyFifty: true, ... }).
 * @param {function} onLifelineUse - Callback function when a lifeline is used.
 * @param {Object} currentQuestion - The current question object, needed for 50/50 and audience logic.
 * @param {boolean} isAnswerSubmitted - Indicates if an answer has been submitted (to disable lifelines).
 * @param {function} onRemovedAnswers - Callback to inform parent about answers removed by 50/50.
 */
const Lifeline = ({ lifelines, onLifelineUse, currentQuestion, isAnswerSubmitted, onRemovedAnswers }) => {
  const [showLifelinesPanel, setShowLifelinesPanel] = useState(false); // State to control panel visibility

  // Toggle lifeline panel visibility
  const toggleLifelinesPanel = useCallback(() => {
    setShowLifelinesPanel(prev => !prev);
  }, []);

  const handleUseLifeline = useCallback((type) => {
    if (!lifelines[type] || isAnswerSubmitted) {
      // Lifeline already used or answer submitted, do nothing
      return;
    }

    onLifelineUse(type); // Notify parent that lifeline is used

    // Implement lifeline specific logic here or let parent handle it
    if (type === 'fiftyFifty') {
      const incorrectAnswers = currentQuestion.options
        .map((_, i) => i)
        .filter(i => i !== currentQuestion.correctAnswer);

      // Randomly select two incorrect answers to remove
      const answersToRemove = [];
      // Ensure we don't try to remove more incorrect answers than available
      const numToRemove = Math.min(2, incorrectAnswers.length);
      while (answersToRemove.length < numToRemove) {
        const randomIndex = Math.floor(Math.random() * incorrectAnswers.length);
        answersToRemove.push(incorrectAnswers.splice(randomIndex, 1)[0]);
      }
      onRemovedAnswers(answersToRemove); // Pass removed answers back to parent
    }
    // For Phone Addy/Yinger and Ask Audience, the modal message is handled by GamePage
    // and shown via the `onLifelineUse` callback.
  }, [lifelines, isAnswerSubmitted, onLifelineUse, currentQuestion, onRemovedAnswers]);

  return (
    <div className="lifelines-wrapper"> {/* Wrapper for toggle button and panel */}
      <button
        className="lifelines-toggle-button"
        onClick={toggleLifelinesPanel}
        title="Toggle Lifelines"
      >
        {showLifelinesPanel ? 'Hide Lifelines ✖️' : 'Show Lifelines ✨'}
      </button>

      {showLifelinesPanel && (
        <div className="lifelines-container">
          <h4 className="lifelines-title">Lifelines</h4>
          <div className="lifeline-buttons-grid">
            <button
              className={`lifeline-button ${!lifelines.fiftyFifty ? 'used' : ''}`}
              onClick={() => handleUseLifeline('fiftyFifty')}
              disabled={!lifelines.fiftyFifty || isAnswerSubmitted}
              title="Removes 2 incorrect answers"
            >
              <span className="lifeline-icon">✂️</span>
              <span className="lifeline-text">50/50</span>
            </button>

            <button
              className={`lifeline-button ${!lifelines.phoneAddy ? 'used' : ''}`}
              onClick={() => handleUseLifeline('phoneAddy')}
              disabled={!lifelines.phoneAddy || isAnswerSubmitted}
              title="Call a friend for the answer"
            >
              <span className="lifeline-icon">📞</span>
              <span className="lifeline-text">Phone Addy</span>
            </button>

            <button
              className={`lifeline-button ${!lifelines.phoneYinger ? 'used' : ''}`}
              onClick={() => handleUseLifeline('phoneYinger')}
              disabled={!lifelines.phoneYinger || isAnswerSubmitted}
              title="Call another friend for the answer"
            >
              <span className="lifeline-icon">📱</span>
              <span className="lifeline-text">Phone Yinger</span>
            </button>

            <button
              className={`lifeline-button ${!lifelines.askAudience ? 'used' : ''}`}
              onClick={() => handleUseLifeline('askAudience')}
              disabled={!lifelines.askAudience || isAnswerSubmitted}
              title="Ask the audience for help"
            >
              <span className="lifeline-icon">👥</span>
              <span className="lifeline-text">Ask Audience</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lifeline;
