// frontend/src/pages/LeaderboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './LeaderboardPage.css'; // Import the CSS for this page
import { getLeaderboard } from '../api/api'; // NEW: Import the API function for leaderboard data

/**
 * LeaderboardPage Component
 * Displays global and team-specific player rankings and statistics.
 * Fetches data from a backend API and provides filtering and sorting options.
 *
 * @param {Array<Object>} leaderboardData - Optional initial or fallback leaderboard data (now primarily fetched).
 * @param {function} onBackToGame - Callback to navigate back to the game (e.g., PreviewPage).
 * @param {Object} currentUser - The current logged-in user's profile data { id, username, pfpUrl, team: { name, color } }.
 * @param {boolean} isVisible - Prop to indicate if the leaderboard is currently visible, used for optimizing data fetching.
 */
const LeaderboardPage = ({
  leaderboardData: initialLeaderboardData = [], // Renamed to avoid confusion with fetched data
  onBackToGame,
  currentUser,
  isVisible = true,
}) => {
  const [sortedData, setSortedData] = useState([]); // This will hold the fetched and processed data
  const [filterBy, setFilterBy] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Use refs to avoid dependency issues in useEffects related to intervals and component mount status
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const initialFetchDone = useRef(false);

  // Memoize static values to prevent unnecessary re-renders
  const colors = useMemo(() => ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'], []);

  // Function to get a valid image URL for player profiles
  // Falls back to ui-avatars.com if PFP is missing or invalid
  const getValidImageUrl = useCallback((pfpUrl, username) => {
    if (!pfpUrl || pfpUrl.startsWith('blob:') || pfpUrl.includes('placehold.co')) {
      const colorIndex = username ? username.charCodeAt(0) % colors.length : 0;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'U')}&background=${colors[colorIndex].slice(1)}&color=fff&size=50`;
    }
    return pfpUrl;
  }, [colors]);

  // Process and deduplicate leaderboard data
  // Sorts by score (desc) then timestamp (desc) to handle ties, and removes duplicates by username
  const processLeaderboardData = useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const uniqueDataMap = new Map(); // Map to store unique users by username, keeping the highest score/latest entry

    // Sort data first to ensure the highest score/latest entry for a user is processed last (and thus kept)
    const sorted = [...data].sort((a, b) => {
      // Primary sort: score descending
      if (b.score !== a.score) return b.score - a.score;
      // Secondary sort: timestamp descending (more recent entry wins ties)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Deduplicate: Iterate through sorted data and add to map.
    // Because it's sorted, the last entry for a username will be the best/most recent.
    sorted.forEach(player => {
      // Ensure player.username exists to avoid issues with undefined keys
      if (player.username) {
        uniqueDataMap.set(player.username, player);
      }
    });

    return Array.from(uniqueDataMap.values());
  }, []);

  // Function to fetch leaderboard data from the backend API
  const fetchLeaderboard = useCallback(async (isBackgroundRefresh = false) => {
    // Only proceed if the component is still mounted
    if (!mountedRef.current) return;

    try {
      if (!isBackgroundRefresh && !hasInitiallyLoaded) {
        setIsLoading(true); // Show full loading spinner on initial load
      } else if (isBackgroundRefresh) {
        setIsRefreshing(true); // Show refreshing indicator for background updates
      }

      setError(null); // Clear any previous errors

      console.log('📊 Fetching leaderboard data from backend...');
      const data = await getLeaderboard(); // Call the API function

      // Only update state if component is still mounted
      if (!mountedRef.current) return;

      const processedData = processLeaderboardData(data);
      setSortedData(processedData);
      setLastUpdated(new Date()); // Record the time of the last successful update

      if (!hasInitiallyLoaded) {
        setHasInitiallyLoaded(true); // Mark that initial data has been loaded
        initialFetchDone.current = true; // Mark initial fetch as complete
      }
    } catch (err) {
      console.error('❌ Error fetching leaderboard:', err);
      // Only update state if component is still mounted
      if (!mountedRef.current) return;

      setError(err.message); // Set the error message

      // If there's an error on initial load and fallback data is provided, use it
      if (!hasInitiallyLoaded && initialLeaderboardData && initialLeaderboardData.length > 0) {
        console.log('📋 Using fallback data from props:', initialLeaderboardData);
        const processedData = processLeaderboardData(initialLeaderboardData);
        setSortedData(processedData);
        setLastUpdated(new Date());
        setHasInitiallyLoaded(true);
        initialFetchDone.current = true;
      }
    } finally {
      // Always stop loading/refreshing indicators
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [processLeaderboardData, initialLeaderboardData, hasInitiallyLoaded]); // Dependencies for useCallback

  // Effect for initial data fetch and setting up auto-refresh
  useEffect(() => {
    // If the leaderboard is not visible, don't fetch or refresh in the background
    if (!isVisible) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only do initial fetch if we haven't loaded before or if data is empty
    if (!initialFetchDone.current || sortedData.length === 0) {
      fetchLeaderboard(false); // Perform initial fetch (not background refresh)
    }

    // Setup auto-refresh every 60 seconds (60000 ms)
    intervalRef.current = setInterval(() => {
      // Only refresh if component is mounted and currently visible
      if (mountedRef.current && isVisible) {
        fetchLeaderboard(true); // Perform a background refresh
      }
    }, 60000);

    // Cleanup function: clear interval when component unmounts or isVisible changes to false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, fetchLeaderboard, sortedData.length]); // Dependencies for this useEffect

  // Effect to handle cleanup on component unmount
  useEffect(() => {
    mountedRef.current = true; // Set to true on mount
    return () => {
      mountedRef.current = false; // Set to false on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Memoize filtered and sorted data to prevent unnecessary recalculations on re-renders
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...sortedData];

    switch (filterBy) {
      case 'team':
        // Filter by the current user's team if a team is selected
        filtered = filtered.filter(entry =>
          currentUser?.team && entry.team && entry.team.name === currentUser.team.name
        );
        break;
      case 'completed':
        // Filter for players who completed the game (reached max score)
        filtered = filtered.filter(entry => entry.completed && entry.score >= 1000000);
        break;
      default:
        // 'all' filter, no additional filtering needed
        break;
    }

    // Final sort by score descending, then by question number (for ties)
    filtered.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by questionNumber (higher question number means they progressed further)
      return (b.questionNumber || 0) - (a.questionNumber || 0);
    });

    return filtered;
  }, [sortedData, filterBy, currentUser]); // Dependencies for this useMemo

  // Memoize current user's data and rank within the filtered list
  const currentUserData = useMemo(() => {
    const currentUserEntry = filteredAndSortedData.find(entry =>
      entry.username === currentUser?.username
    );
    const currentUserRank = currentUserEntry ?
      filteredAndSortedData.findIndex(entry => entry.username === currentUser?.username) + 1 : null;

    return { currentUserEntry, currentUserRank };
  }, [filteredAndSortedData, currentUser?.username]);

  // Memoize team statistics to prevent recalculation
  const teamStats = useMemo(() => {
    const stats = {};
    sortedData.forEach(entry => {
      if (entry.team && entry.team.name) { // Ensure team and team name exist
        const teamName = entry.team.name;
        if (!stats[teamName]) {
          stats[teamName] = {
            name: teamName,
            color: entry.team.color,
            totalScore: 0,
            playerCount: 0,
            avgScore: 0,
            topScore: 0
          };
        }
        stats[teamName].totalScore += entry.score || 0;
        stats[teamName].playerCount += 1;
        stats[teamName].topScore = Math.max(stats[teamName].topScore, entry.score || 0);
      }
    });

    // Calculate average score and sort teams by total score
    Object.values(stats).forEach(team => {
      team.avgScore = team.playerCount > 0 ? Math.round(team.totalScore / team.playerCount) : 0;
    });

    return Object.values(stats).sort((a, b) => b.totalScore - a.totalScore);
  }, [sortedData]);

  // Helper function to get styling for different ranks (Top 3, Others)
  const getRankStyling = useCallback((index) => {
    switch (index) {
      case 0:
        return {
          icon: '👑',
          class: 'rank-first',
          gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', // Gold
          glow: '#FFD700'
        };
      case 1:
        return {
          icon: '🥈',
          class: 'rank-second',
          gradient: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', // Silver
          glow: '#C0C0C0'
        };
      case 2:
        return {
          icon: '🥉',
          class: 'rank-third',
          gradient: 'linear-gradient(135deg, #CD7F32, #B87333)', // Bronze
          glow: '#CD7F32'
        };
      default:
        return {
          icon: `#${index + 1}`,
          class: 'rank-other',
          gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))', // Subtle gradient for others
          glow: 'rgba(97, 195, 255, 0.2)' // Blueish glow
        };
    }
  }, []);

  // Helper function to get status badge for player entries
  const getStatusBadge = useCallback((entry) => {
    // Check for Provernaire status first (completed game with max score)
    if (entry.completed && entry.score >= 1000000) {
      return { text: 'PROVERNAIRE', class: 'status-provernaire', icon: '💎' };
    } else if (entry.failed) {
      return { text: 'ELIMINATED', class: 'status-failed', icon: '💥' };
    } else if (entry.walkedAway) {
      return { text: 'WALKED AWAY', class: 'status-walked', icon: '🚶' };
    } else if (entry.timeUp) {
      return { text: 'TIME UP', class: 'status-timeout', icon: '⏰' };
    } else if (entry.gameStatus === 'in_progress') {
      return { text: 'IN PROGRESS', class: 'status-progress', icon: '🎮' };
    } else {
      // Default or unknown status
      return { text: 'PLAYED', class: 'status-played', icon: '✅' };
    }
  }, []);


  // Memoize last updated text for display
  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now - lastUpdated) / 1000);

    if (diffInSeconds < 60) {
      return `Updated ${diffInSeconds} seconds ago`;
    } else {
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      return `Updated ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  }, [lastUpdated]);

  // Loading state - ONLY show on very first load if no data is present
  if (isLoading && !hasInitiallyLoaded) {
    return (
      <div className="leaderboard-screen">
        <div className="background-animation">
          <div className="floating-shapes">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`shape shape-${i % 4}`}></div>
            ))}
          </div>
        </div>
        <div className="loading-content">
          <div className="loading-spinner">🎮</div>
          <div className="loading-text">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  // Error state - only show if we have an error AND no data AND haven't loaded successfully before
  if (error && sortedData.length === 0 && !hasInitiallyLoaded) {
    return (
      <div className="leaderboard-screen">
        <div className="background-animation">
          <div className="floating-shapes">
            {[...Array(15)].map((_, i) => (
              <div key={i} className={`shape shape-${i % 3}`}></div>
            ))}
          </div>
        </div>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Failed to load leaderboard</h3>
          <p>{error}</p>
          <button onClick={() => fetchLeaderboard(false)}>Retry</button>
          {onBackToGame && (
            <button onClick={onBackToGame} style={{ marginLeft: '10px' }}>
              Back to Game
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-screen">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shapes">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`shape shape-${i % 4}`}></div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="leaderboard-header">
        <button
          className="back-button"
          onClick={onBackToGame} // Use onBackToGame directly
          type="button"
        >
          <span className="back-icon">←</span>
          <span className="back-text">Back to Game</span>
        </button>

        <div className="header-title">
          <h1 className="leaderboard-title">🏆 LEADERBOARD</h1>
          <p className="leaderboard-subtitle">Who Wants to Be a Provernaire</p>
          {currentUser && (
            <p className="current-user">Playing as: @{currentUser.username}</p>
          )}

          <div className="refresh-info">
            {isRefreshing && (
              <span className="refresh-indicator">
                🔄 Updating...
              </span>
            )}
            {lastUpdated && !isRefreshing && (
              <span className="last-updated">
                {lastUpdatedText}
              </span>
            )}
          </div>
        </div>

        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{sortedData.length}</span>
            <span className="stat-label">Total Players</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {sortedData.filter(e => e.completed && e.score >= 1000000).length}
            </span>
            <span className="stat-label">PROVERNAIRES</span>
          </div>
        </div>
      </div>

      {/* User Performance Card */}
      {currentUserData.currentUserEntry && (
        <div className="user-performance-card">
          <div className="performance-header">
            <h3>Your Performance</h3>
            <div className="user-rank">
              Rank #{currentUserData.currentUserRank}
            </div>
          </div>
          <div className="performance-content">
            <img
              src={getValidImageUrl(currentUserData.currentUserEntry.pfpUrl, currentUserData.currentUserEntry.username)}
              alt="Your profile"
              className="performance-pfp"
              onError={(e) => {
                e.target.src = getValidImageUrl(null, currentUserData.currentUserEntry.username);
              }}
            />
            <div className="performance-details">
              <div className="performance-score">
                {(currentUserData.currentUserEntry.score || 0).toLocaleString()} $PROVE
              </div>
              <div className="performance-info">
                <span
                  className="performance-team"
                  style={{ color: currentUserData.currentUserEntry.team?.color }}
                >
                  {currentUserData.currentUserEntry.team?.name || 'No Team'}
                </span>
              </div>
            </div>
            <div className="performance-status">
              {(() => {
                const status = getStatusBadge(currentUserData.currentUserEntry);
                return (
                  <span className={`status-badge ${status.class}`}>
                    {status.icon} {status.text}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="leaderboard-filters">
        <button
          className={`filter-button ${filterBy === 'all' ? 'active' : ''}`}
          onClick={() => setFilterBy('all')}
          type="button"
        >
          🌍 All Players ({sortedData.length})
        </button>
        <button
          className={`filter-button ${filterBy === 'team' ? 'active' : ''}`}
          onClick={() => setFilterBy('team')}
          type="button"
          disabled={!currentUser?.team}
        >
          👥 My Team ({sortedData.filter(p => p.team && currentUser?.team && p.team.name === currentUser.team.name).length})
        </button>
        <button
          className={`filter-button ${filterBy === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterBy('completed')}
          type="button"
        >
          💎 PROVERNAIRES ({sortedData.filter(p => p.completed && p.score >= 1000000).length})
        </button>
      </div>

      {/* Main Content */}
      <div className="leaderboard-content">
        {/* Top 3 Podium */}
        {filteredAndSortedData.length >= 3 && (
          <div className="podium-section">
            <h3 className="section-title">🥇 Hall of Fame</h3>
            <div className="podium">
              {/* Second Place */}
              {filteredAndSortedData[1] && (
                <div className="podium-position second">
                  <div className="podium-player">
                    <img
                      src={getValidImageUrl(filteredAndSortedData[1].pfpUrl, filteredAndSortedData[1].username)}
                      alt={filteredAndSortedData[1].username}
                      className="podium-pfp"
                      onError={(e) => {
                        e.target.src = getValidImageUrl(null, filteredAndSortedData[1].username);
                      }}
                    />
                    <div className="podium-info">
                      <div className="podium-username">@{filteredAndSortedData[1].username}</div>
                      <div className="podium-score">
                        {(filteredAndSortedData[1].score || 0).toLocaleString()} $PROVE
                      </div>
                      <div
                        className="podium-team"
                        style={{ backgroundColor: filteredAndSortedData[1].team?.color }}
                      >
                        {filteredAndSortedData[1].team?.name || 'No Team'}
                      </div>
                    </div>
                  </div>
                  <div className="podium-rank">🥈</div>
                  <div className="podium-height second-height"></div>
                </div>
              )}

              {/* First Place */}
              <div className="podium-position first">
                <div className="crown-animation">👑</div>
                <div className="podium-player">
                  <img
                    src={getValidImageUrl(filteredAndSortedData[0].pfpUrl, filteredAndSortedData[0].username)}
                    alt={filteredAndSortedData[0].username}
                    className="podium-pfp"
                    onError={(e) => {
                      e.target.src = getValidImageUrl(null, filteredAndSortedData[0].username);
                    }}
                  />
                  <div className="podium-info">
                    <div className="podium-username">@{filteredAndSortedData[0].username}</div>
                    <div className="podium-score">
                      {(filteredAndSortedData[0].score || 0).toLocaleString()} $PROVE
                    </div>
                    <div
                      className="podium-team"
                      style={{ backgroundColor: filteredAndSortedData[0].team?.color }}
                    >
                      {filteredAndSortedData[0].team?.name || 'No Team'}
                    </div>
                  </div>
                </div>
                <div className="podium-rank">🥇</div>
                <div className="podium-height first-height"></div>
              </div>

              {/* Third Place */}
              {filteredAndSortedData[2] && (
                <div className="podium-position third">
                  <div className="podium-player">
                    <img
                      src={getValidImageUrl(filteredAndSortedData[2].pfpUrl, filteredAndSortedData[2].username)}
                      alt={filteredAndSortedData[2].username}
                      className="podium-pfp"
                      onError={(e) => {
                        e.target.src = getValidImageUrl(null, filteredAndSortedData[2].username);
                      }}
                    />
                    <div className="podium-info">
                      <div className="podium-username">@{filteredAndSortedData[2].username}</div>
                      <div className="podium-score">
                        {(filteredAndSortedData[2].score || 0).toLocaleString()} $PROVE
                      </div>
                      <div
                        className="podium-team"
                        style={{ backgroundColor: filteredAndSortedData[2].team?.color }}
                      >
                        {filteredAndSortedData[2].team?.name || 'No Team'}
                      </div>
                    </div>
                  </div>
                  <div className="podium-rank">🥉</div>
                  <div className="podium-height third-height"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="rankings-section">
          <h3 className="section-title">📊 Full Rankings</h3>
          <div className="rankings-list">
            {filteredAndSortedData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎮</div>
                <div className="empty-title">
                  {sortedData.length === 0
                    ? "No players have joined yet!"
                    : "No players in this category!"}
                </div>
                <div className="empty-subtitle">
                  {sortedData.length === 0
                    ? "Be the first to play and claim the top spot"
                    : "Switch to 'All Players' to see everyone."}
                </div>
                {error && (
                  <p className="error-hint">
                    Connection error: {error}
                  </p>
                )}
              </div>
            ) : (
              filteredAndSortedData.map((entry, index) => {
                const rankStyle = getRankStyling(index);
                const status = getStatusBadge(entry);
                const isCurrentUser = entry.username === currentUser?.username;

                return (
                  <div
                    key={`${entry.userId || entry.username}-${entry.score}-${index}`} // Use userId for key if available, fallback to username
                    className={`ranking-item ${rankStyle.class} ${isCurrentUser ? 'current-user' : ''}`}
                    style={{
                      // Apply gradient background only for top 3, others use default item background
                      background: index < 3 ? rankStyle.gradient : 'rgba(255, 255, 255, 0.05)',
                      boxShadow: `0 4px 20px ${rankStyle.glow}33`
                    }}
                  >
                    <div className="ranking-rank">
                      {rankStyle.icon}
                    </div>

                    <img
                      src={getValidImageUrl(entry.pfpUrl, entry.username)} // Use pfpUrl from entry
                      alt={entry.username}
                      className="ranking-pfp"
                      onError={(e) => {
                        e.target.src = getValidImageUrl(null, entry.username);
                      }}
                    />

                    <div className="ranking-info">
                      <div className="ranking-username">
                        @{entry.username}
                        {isCurrentUser && <span className="you-badge">YOU</span>}
                      </div>
                      <div className="ranking-details">
                        <span
                          className="ranking-team"
                          style={{ color: entry.team?.color }}
                        >
                          {entry.team?.name || 'No Team'}
                        </span>
                      </div>
                    </div>

                    <div className="ranking-score">
                      <div className="score-amount">
                        {(entry.score || 0).toLocaleString()}
                      </div>
                      <div className="score-currency">$PROVE</div>
                    </div>

                    <div className="ranking-status">
                      <span className={`status-badge ${status.class}`}>
                        {status.icon} {status.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Team Statistics */}
        {teamStats.length > 0 && (
          <div className="team-stats-section">
            <h3 className="section-title">Team Performance</h3>
            <div className="team-stats-grid">
              {teamStats.map((team, index) => (
                <div
                  key={team.name}
                  className="team-stat-card"
                  style={{
                    borderColor: team.color,
                    boxShadow: `0 4px 20px ${team.color}33`
                  }}
                >
                  <div className="team-stat-header">
                    <div
                      className="team-stat-color"
                      style={{ backgroundColor: team.color }}
                    ></div>
                    <h4 className="team-stat-name">{team.name}</h4>
                    <div className="team-stat-rank">#{index + 1}</div>
                  </div>
                  <div className="team-stat-metrics">
                    <div className="team-metric">
                      <span className="metric-value">{team.totalScore.toLocaleString()}</span>
                      <span className="metric-label">Total Score</span>
                    </div>
                    <div className="team-metric">
                      <span className="metric-value">{team.avgScore.toLocaleString()}</span>
                      <span className="metric-label">Avg Score</span>
                    </div>
                    <div className="team-metric">
                      <span className="metric-value">{team.playerCount}</span>
                      <span className="metric-label">Players</span>
                    </div>
                    <div className="team-metric">
                      <span className="metric-value">{team.topScore.toLocaleString()}</span>
                      <span className="metric-label">Best Score</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="stats-footer">
        <div className="stat-item">
          <span className="stat-number">{sortedData.length}</span>
          <span className="stat-label">Total Players</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{sortedData.filter(p => p.completed && p.score >= 1000000).length}</span>
          <span className="stat-label">PROVERNAIRES</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {sortedData.length > 0 ? Math.max(...sortedData.map(p => p.score || 0)).toLocaleString() : '0'}
          </span>
          <span className="stat-label">Highest Score</span>
        </div>
      </div>
    </div>
  );
};
export default LeaderboardPage;
