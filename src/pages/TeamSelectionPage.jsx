// frontend/src/pages/TeamSelectionPage.jsx
import React, { useState, useEffect } from 'react';
import './TeamSelectionPage.css'; // Import the CSS for this page
import Modal from '../components/Modal/Modal'; // Import the custom Modal component
import { selectUserTeam } from '../api/api'; // Import the API function for team selection
import Team1 from '../assets/Yinger2.png'; // Import team leader images
import Team2 from '../assets/Advaith3.jpg'; // Import team leader images
import Team3 from '../assets/zkdan.jpg'; // Import team leader images
import Team4 from '../assets/fake.jpg'; // Import team leader images 
import Team5 from '../assets/lsquare.jpg'; // Import team leader images            
// Mock team data (In a real application, this might come from the backend)
const MOCK_TEAMS = [
  { name: 'Yinger', color: '#FF54D7', leaderImage: Team1, leaderName: 'Captain Yinger' },
  { name: 'Addy', color: '#61C3FF', leaderImage: Team2, leaderName: 'Captain Addy' },
  { name: 'zkDan', color: '#B753FF', leaderImage: Team3, leaderName: 'Captain zkDan' },
  { name: 'Fakedev9999', color: '#B0FF6F', leaderImage: Team4, leaderName: 'Captain Fakedev9999' },
  { name: 'Lsquared²', color: '#FF955E', leaderImage: Team5, leaderName: 'Captain Lsquared²' },
];

/**
 * TeamSelectionPage Component
 * Allows users to select a team or re-select their previously chosen team.
 * @param {Object} currentUser - The current logged-in user object { id, username, pfpUrl, team }.
 * @param {function} onTeamSelected - Callback function to execute after a team is successfully selected.
 */
const TeamSelectionPage = ({ currentUser, onTeamSelected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(currentUser?.team || null); // Initialize with user's existing team

  // Effect to update selectedTeam if currentUser changes (e.g., after initial login)
  useEffect(() => {
    if (currentUser && currentUser.team) {
      setSelectedTeam(currentUser.team);
    }
  }, [currentUser]);

  /**
   * Handles the team selection logic.
   * Validates if a username exists and enforces re-selection of the same team if already chosen.
   * Calls the backend API to save the selected team.
   * @param {Object} team - The selected team object.
   */
  const handleTeamSelect = async (team) => {
    if (!currentUser || !currentUser.username) {
      setModalMessage('User not logged in. Please go back to the login screen.');
      setShowModal(true);
      return;
    }

    // Logic: If user has a team and tries to select a different one, prevent it.
    if (selectedTeam && selectedTeam.name !== team.name) {
      setModalMessage(`You have already selected the ${selectedTeam.name} team. Please re-select that team to continue.`);
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);
      // Call the backend API to save the user's team
      const response = await selectUserTeam(currentUser.id, team.name); // Pass user ID and team name

      if (response.success) {
        setModalMessage(`Successfully selected the ${team.name} team!`);
        setShowModal(true);
        setSelectedTeam(team); // Update local state with the newly selected team
        onTeamSelected({ ...currentUser, team: team }); // Update parent state with the new team
      } else {
        setModalMessage(response.message || 'Failed to select team. Please try again.');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error selecting team:', error);
      setModalMessage('An error occurred while saving your team selection. Please try again.');
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="team-selection-page-container">
      <div className="team-selection-content">
        <h2 className="team-selection-title">Choose Your Team</h2>
        {currentUser && currentUser.team && (
          <p className="current-team-message">
            You are currently on the <span className="highlight-team-name">{currentUser.team.name}</span> team.
            Please re-select it to proceed.
          </p>
        )}

        {isLoading && (
          <div className="loading-indicator">
            <p>Processing team selection...</p>
          </div>
        )}

        <div className="teams-grid">
          {MOCK_TEAMS.map((team, index) => (
            <button
              key={index}
              className={`team-button ${selectedTeam?.name === team.name ? 'current-selected-team' : ''}`}
              style={{ '--team-color': team.color }} /* Use CSS variable for background */
              onClick={() => handleTeamSelect(team)}
              disabled={isLoading}
            >
              <div className="team-leader-image">
                <img
                  src={team.leaderImage}
                  alt={`${team.leaderName || team.name} leader`}
                  className="leader-pfp"
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100/${team.color.substring(1)}/ffffff?text=${team.name.charAt(0)}`; }}
                />
              </div>
              <div className="team-info">
                <span className="team-name">{team.name}</span>
                {team.leaderName && (
                  <span className="leader-name">{team.leaderName}</span>
                )}
              </div>
              {selectedTeam?.name === team.name && (
                <div className="current-indicator">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>
      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
    </div>
  );
};

export default TeamSelectionPage;
