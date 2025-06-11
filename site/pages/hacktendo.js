import React, { useEffect, useState, useRef } from 'react';
import styles from '../styles/Hacktendo.module.css';
import HacktendoGrid from './HacktendoGrid';
import HacktendoFullscreen from './HacktendoFullscreen';
import HacktendoStart from './HacktendoStart';
import HacktendoBottomBar from './HacktendoBottomBar';
import DiskScene from '../components/DiskScene';
import FullscreenTransition from '../components/FullscreenTransition';
import DiskPreview from '../components/DiskPreview';
import DiskBottomBar from '../components/DiskBottomBar';
import CreateGameComponent from '../components/CreateGameComponent';
import EditGameComponent from '../components/EditGameComponent';

const HacktendoWeekCell = ({ isFullscreen, onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '48px',
        overflow: 'hidden',
        cursor: 'none'
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          cursor: 'none'
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <img 
        src="/HacktendoWeek.png" 
        alt="Hacktendo Week"
        style={{
          maxWidth: '80%',
          maxHeight: '80%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 1,
          cursor: 'none'
        }}
      />
    </div>
  );
};

export default function Hacktendo() {
  const [proceed, setProceed] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [cursorRotation, setCursorRotation] = useState(15);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [moveTimeout, setMoveTimeout] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [apps, setApps] = useState([]); // All dynamic apps from API
  const [pages, setPages] = useState([[]]); // Paginated grid
  const gamesPerPage = 9;
  const [games, setGames] = useState([
    // Page 1
    ["hacktendoWeek", "", "", "", "", "", "", "", ""],
    // Page 2
    ["", "", "", "", "", "", "", "", ""]
  ]);
  const [fullscreenGame, setFullscreenGame] = useState(null);
  const [transitionRect, setTransitionRect] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const [showDiskBottomBar, setShowDiskBottomBar] = useState(false);
  const [showStartPage, setShowStartPage] = useState(false);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [showJoinGame, setShowJoinGame] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinSuccessName, setJoinSuccessName] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const clickSoundRef = useRef(null);
  const musicRef = useRef(null);
  const [hacktendoGame, setHacktendoGame] = useState(null);
  const [editingGame, setEditingGame] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [abandonSuccess, setAbandonSuccess] = useState(false);
  const [abandonError, setAbandonError] = useState('');

  // Add screen width check
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth < 1024); // 1024px is typical tablet breakpoint
    };

    // Check on mount
    checkScreenWidth();

    // Add resize listener
    window.addEventListener('resize', checkScreenWidth);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenWidth);
  }, []);

  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play();
    }
  };

  const handleClick = () => {
    if (!proceed) {
      setProceed(true);
    } else if (!fullscreenGame) {
      playClickSound();
    }
  };

  const handleGameSelect = (game, event) => {
    playClickSound();
    const rect = event.currentTarget.getBoundingClientRect();
    setTransitionRect(rect);
    setFullscreenGame(game);
    setIsExiting(false);
    if (game === 'hacktendoWeek' && musicRef.current) {
      musicRef.current.src = '/RanAway.mp3';
      musicRef.current.play();
    }
  };

  const handleGameExit = () => {
    playClickSound();
    setIsExiting(true);
    setTimeout(() => {
      setFullscreenGame(null);
      setIsExiting(false);
      if (musicRef.current) {
        musicRef.current.src = '/wiiMusic.mp3';
        musicRef.current.play();
      }
    }, 400);
  };

  useEffect(() => {
    if (proceed && !audioPlayed) {
      playClickSound();
      setTimeout(() => {
        if (musicRef.current) {
          musicRef.current.play();
        }
      }, 500);
      setAudioPlayed(true);
    }
  }, [proceed, audioPlayed]);

  useEffect(() => {
    if (proceed) return;
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'a') {
        setProceed(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [proceed]);

  useEffect(() => {
    if (!proceed) return;

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      
      // Set moving state
      setIsMoving(true);
      if (moveTimeout) clearTimeout(moveTimeout);
      setMoveTimeout(setTimeout(() => setIsMoving(false), 1000)); // 1 second

      // Only rotate if there's significant movement
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        // Calculate base angle
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Constrain angle to be more horizontal and subtle
        // Map the angle to a range of -15 to 15 degrees, then add base rotation
        angle = Math.max(-15, Math.min(15, angle)) + 15;
        
        setCursorRotation(angle);
      } else {
        // Return to base rotation when movement is minimal
        setCursorRotation(15);
      }

      lastX = e.clientX;
      lastY = e.clientY;
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (moveTimeout) clearTimeout(moveTimeout);
    };
  }, [proceed, moveTimeout]);

  // Add preload container
  useEffect(() => {
    // Create preload container
    const preloadContainer = document.createElement('div');
    preloadContainer.style.position = 'absolute';
    preloadContainer.style.visibility = 'hidden';
    preloadContainer.style.zIndex = '-1';
    document.body.appendChild(preloadContainer);

    // Preload video
    const video = document.createElement('video');
    video.src = '/background.mp4';
    video.preload = 'auto';
    preloadContainer.appendChild(video);

    // Preload image
    const img = new Image();
    img.src = '/HacktendoWeek.png';
    preloadContainer.appendChild(img);

    // Check for hacktendoToken and set 'disk' in second cell if present
    if (typeof window !== 'undefined' && localStorage.getItem('hacktendoToken')) {
      setGames(g => {
        const newGames = [...g];
        newGames[1] = 'disk';
        return newGames;
      });
    }

    return () => {
      document.body.removeChild(preloadContainer);
    };
  }, []);

  // Show bottom bar 500ms after fullscreen transition
  useEffect(() => {
    let timeout;
    if (fullscreenGame === 'hacktendoWeek' && !isExiting) {
      timeout = setTimeout(() => setShowBottomBar(true), 500);
    } else {
      setShowBottomBar(false);
    }
    return () => clearTimeout(timeout);
  }, [fullscreenGame, isExiting]);

  // Show disk bottom bar 500ms after disk fullscreen transition
  useEffect(() => {
    let timeout;
    if (fullscreenGame === 'disk' && !isExiting) {
      timeout = setTimeout(() => setShowDiskBottomBar(true), 500);
    } else {
      setShowDiskBottomBar(false);
    }
    return () => clearTimeout(timeout);
  }, [fullscreenGame, isExiting]);

  // Fetch available games when showJoinGame is true
  useEffect(() => {
    if (!showJoinGame) return;
    const fetchGames = async () => {
      setLoadingGames(true);
      setJoinError('');
      try {
        const token = localStorage.getItem('hacktendoToken');
        if (!token) throw new Error('No token found');
        const res = await fetch(`/api/getAvailableGames?token=${token}`);
        if (!res.ok) throw new Error('Failed to fetch games');
        const data = await res.json();
        setAvailableGames(data.games || []);
      } catch (err) {
        setJoinError(err.message || 'Failed to load games');
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGames();
  }, [showJoinGame]);

  // Utility to fetch and set the user's Hacktendo game
  const fetchAndSetHacktendoGame = async () => {
    const token = localStorage.getItem('hacktendoToken');
    if (!token) return;
    try {
      const res = await fetch(`/api/getUserApps?token=${token}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.apps && Array.isArray(data.apps)) {
        const hacktendo = data.apps.find(app => app.isHacktendo);
        if (hacktendo) {
          const images = Array.isArray(hacktendo.Images) ? hacktendo.Images : [];
          setHacktendoGame({ ...hacktendo, images });
        } else {
          setHacktendoGame(null);
        }
      }
    } catch (err) {
      setHacktendoGame(null);
    }
  };

  // On mount, fetch user's Hacktendo game if token exists
  useEffect(() => {
    fetchAndSetHacktendoGame();
  }, []);

  // Fetch apps from API and paginate, do NOT add hacktendoWeek
  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch('/api/getHacktendoApps');
        const data = await res.json();
        const apiApps = Array.isArray(data.apps) ? data.apps : [];
        const paginated = [];
        for (let i = 0; i < apiApps.length; i += gamesPerPage) {
          paginated.push(apiApps.slice(i, i + gamesPerPage));
        }
        setApps(apiApps);
        setPages(paginated);
        setCurrentPage(0); // Reset to first page on reload
      } catch (e) {
        setApps([]);
        setPages([[]]);
      }
    }
    fetchApps();
  }, []);

  const handlePageChange = (direction) => {
    playClickSound();
    if (direction === 'next' && currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (showStartPage) {
    return <HacktendoStart onSignupComplete={() => {
      setShowStartPage(false);
      setGames(g => {
        const newGames = [...g];
        newGames[1] = 'disk';
        return newGames;
      });
      fetchAndSetHacktendoGame();
    }} />;
  }

  if (showCreateGame) {
    return <CreateGameComponent onSuccess={async () => {
      setShowCreateGame(false);
      setFullscreenGame('disk');
      await fetchAndSetHacktendoGame();
    }} onCancel={() => {
      setShowCreateGame(false);
      setFullscreenGame('disk');
    }} />;
  }

  if (editingGame && hacktendoGame) {
    return <EditGameComponent initialGame={hacktendoGame} onSuccess={updatedGame => {
      setEditingGame(false);
      setFullscreenGame('disk');
      setHacktendoGame({ ...updatedGame, images: updatedGame.images || [] });
    }} onCancel={() => {
      setEditingGame(false);
      setFullscreenGame('disk');
    }} />;
  }

  if (showJoinGame) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 10000,
        padding: '48px 32px 48px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={() => setShowJoinGame(false)} style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8, border: 'none', background: '#eee', cursor: 'pointer' }}>Back</button>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Join a Game</h2>
        </div>
        {joinSuccess ? (
          <div style={{ color: 'green', fontSize: 22, marginTop: 32 }}>Successfully joined {joinSuccessName}! Returning...</div>
        ) : loadingGames ? (
          <div>Loading games...</div>
        ) : joinError ? (
          <div style={{ color: 'red' }}>{joinError}</div>
        ) : availableGames.length === 0 ? (
          <div>No games available to join right now.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
            width: '100%',
            maxWidth: 1200,
          }}>
            {availableGames.map(game => (
              <div key={game.id} style={{
                background: '#f8f8ff',
                border: '2px solid #4a90e2',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(74,144,226,0.08)',
                transition: 'transform 0.2s',
                cursor: joiningId === game.id ? 'wait' : 'pointer',
                minHeight: 220,
                opacity: joiningId && joiningId !== game.id ? 0.5 : 1,
              }}
                onClick={async () => {
                  if (joiningId) return;
                  setJoiningId(game.id);
                  setJoinError('');
                  try {
                    const token = localStorage.getItem('hacktendoToken');
                    if (!token) throw new Error('No token found');
                    const res = await fetch('/api/joinApp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token, appId: game.id }),
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.message || 'Failed to join game');
                    }
                    const data = await res.json();
                    console.log('joinApp API response:', data);
                    setJoinSuccess(true);
                    setJoinSuccessName(game.name);
                    // Refresh the whole page after joining
                    window.location.reload();
                    // (The rest of this code will not run after reload)
                  } catch (err) {
                    setJoinError(err.message || 'Failed to join game');
                  } finally {
                    setJoiningId(null);
                  }
                }}
              >
                <div style={{
                  width: 72,
                  height: 72,
                  background: '#e3eefd',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  overflow: 'hidden',
                }}>
                  {game.icon ? (
                    <img src={game.icon} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 40,
                      height: 40,
                      background: '#4a90e2',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 24,
                      fontWeight: 'bold',
                    }}>{game.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, textAlign: 'center' }}>{game.name}</div>
                <div style={{ color: '#555', fontSize: 15, marginBottom: 8, textAlign: 'center', minHeight: 40 }}>{game.description}</div>
                <div style={{ color: '#4a90e2', fontWeight: 500, fontSize: 14 }}>{game.memberCount} member{game.memberCount === 1 ? '' : 's'}</div>
                <button style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#4a90e2', color: '#fff', fontWeight: 600, fontSize: 16, cursor: joiningId === game.id ? 'wait' : 'pointer', opacity: joiningId && joiningId !== game.id ? 0.5 : 1 }} onClick={async e => { e.stopPropagation(); if (joiningId) return; setJoiningId(game.id); setJoinError(''); try { const token = localStorage.getItem('hacktendoToken'); if (!token) throw new Error('No token found'); const res = await fetch('/api/joinApp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, appId: game.id }), }); if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Failed to join game'); } setJoinSuccess(true); setJoinSuccessName(game.name); setTimeout(() => { setShowJoinGame(false); setFullscreenGame('disk'); }, 1200); } catch (err) { setJoinError(err.message || 'Failed to join game'); } finally { setJoiningId(null); } }}>Join</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (proceed) {
    return (
      <div
        className={styles.hacktendoRoot}
        onClick={handleClick}
        style={{ background: '#fff', color: '#000', cursor: 'none' }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <HacktendoGrid
            games={(() => {
              // Always fill to 9 slots for the grid
              const page = pages[currentPage] || [];
              const filled = [...page];
              while (filled.length < gamesPerPage) filled.push("");
              return filled;
            })()}
            handleGameSelect={handleGameSelect}
            selectedGame={fullscreenGame}
            isExiting={isExiting}
            userHacktendoGame={hacktendoGame && hacktendoGame.images && hacktendoGame.images.length > 0 ? hacktendoGame : null}
          />
          {/* Left Arrow */}
          {currentPage > 0 && (
            <button
              onClick={() => handlePageChange('prev')}
              style={{
                position: 'absolute',
                left: '2%',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'none',
                zIndex: 10,
                padding: '20px',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: '#f8f8f8',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
                border: '1.5px solid #e0e0e0',
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" style={{ display: 'block', animation: 'wiiPulse 2s infinite' }}>
                  <polygon points="22,6 10,16 22,26" fill="#444" rx="3" ry="3" style={{ filter: 'drop-shadow(0 1px 1px #bbb)' }} />
                </svg>
              </div>
            </button>
          )}
          {/* Right Arrow */}
          {currentPage < pages.length - 1 && (
            <button
              onClick={() => handlePageChange('next')}
              style={{
                position: 'absolute',
                right: '2%',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'none',
                zIndex: 10,
                padding: '20px',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: '#f8f8f8',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
                border: '1.5px solid #e0e0e0',
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" style={{ display: 'block', animation: 'wiiPulse 2s infinite' }}>
                  <polygon points="10,6 22,16 10,26" fill="#444" rx="3" ry="3" style={{ filter: 'drop-shadow(0 1px 1px #bbb)' }} />
                </svg>
              </div>
            </button>
          )}
          <style>{`
            @keyframes wiiPulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.08); opacity: 0.85; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
        {fullscreenGame && transitionRect && (
          <FullscreenTransition
            transitionRect={transitionRect}
            isExiting={isExiting}
            onExit={handleGameExit}
          >
            {fullscreenGame === 'hacktendoWeek' && (
              <>
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    cursor: 'none',
                  }}
                >
                  <source src="/background.mp4" type="video/mp4" />
                </video>
                <img
                  src="/HacktendoWeek.png"
                  alt="Hacktendo Week"
                  style={{
                    maxWidth: '80%',
                    maxHeight: '80%',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 1,
                    cursor: 'none',
                    transform: showBottomBar ? 'scale(0.7)' : 'scale(1)',
                    paddingBottom: showBottomBar ? '96px' : '0',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <HacktendoBottomBar
                  show={showBottomBar}
                  onStart={() => setShowStartPage(true)}
                  showStartButton={showBottomBar}
                />
              </>
            )}
            {fullscreenGame === 'disk' && hacktendoGame && hacktendoGame.images && hacktendoGame.images.length > 0 ? (
              <>
                <img
                  src={hacktendoGame.images[0]}
                  alt={hacktendoGame.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    objectFit: 'cover',
                    zIndex: 0,
                    borderRadius: 0,
                    pointerEvents: 'none',
                    opacity: 1,
                    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                <div
                  className={styles.hacktendoBottomBar + (showDiskBottomBar ? ' ' + styles.hacktendoBottomBarVisible : '')}
                  style={{
                    borderTopLeftRadius: showDiskBottomBar ? 0 : 32,
                    borderTopRightRadius: showDiskBottomBar ? 0 : 32,
                    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-top-left-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-top-right-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 110,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 32,
                    background: 'rgba(255,255,255,0.55)',
                    borderTop: '2.5px solid #b2eaff',
                    boxShadow: '0 0 24px 0 rgba(111,211,255,0.18)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    zIndex: 2,
                    opacity: showDiskBottomBar ? 1 : 0,
                    pointerEvents: showDiskBottomBar ? 'auto' : 'none',
                  }}
                >
                  <button
                    onClick={() => setEditingGame(true)}
                    className={styles.hacktendoStartButton + (showDiskBottomBar ? ' ' + styles.hacktendoStartButtonVisible : '')}
                    style={{ fontSize: 42, minWidth: 270, minHeight: 72, padding: '0 54px', borderRadius: 48, fontWeight: 'bold', opacity: showDiskBottomBar ? 1 : 0, transform: showDiskBottomBar ? 'scale(1, 1)' : 'scale(0, 0.7)', transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >Edit Game</button>
                  <button
                    disabled={abandoning}
                    onClick={async () => {
                      setAbandoning(true);
                      setAbandonError('');
                      setAbandonSuccess(false);
                      try {
                        const token = localStorage.getItem('hacktendoToken');
                        if (!token) throw new Error('No token found');
                        const res = await fetch('/api/abandonGame', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ token, appId: hacktendoGame.id }),
                        });
                        if (!res.ok) {
                          const data = await res.json();
                          throw new Error(data.message || 'Failed to abandon game');
                        }
                        setAbandonSuccess(true);
                        setHacktendoGame(null);
                      } catch (err) {
                        setAbandonError(err.message || 'Failed to abandon game');
                      } finally {
                        setAbandoning(false);
                      }
                    }}
                    className={styles.hacktendoStartButton + (showDiskBottomBar ? ' ' + styles.hacktendoStartButtonVisible : '')}
                    style={{ fontSize: 42, minWidth: 270, minHeight: 72, padding: '0 54px', borderRadius: 48, fontWeight: 'bold', background: '#eee', color: '#333', border: '3px solid #6fd3ff', boxShadow: '0 3px 18px 0 rgba(111,211,255,0.25), 0 0 0 6px #e6faff inset', opacity: showDiskBottomBar ? 1 : 0, transform: showDiskBottomBar ? 'scale(1, 1)' : 'scale(0, 0.7)', transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)', cursor: abandoning ? 'wait' : 'pointer', opacity: abandoning ? 0.6 : 1 }}
                  >{abandoning ? 'Abandoning...' : 'Abandon Game'}</button>
                </div>
                {/* {abandonError && <div style={{ color: 'red', marginTop: 8, textAlign: 'center', width: '100%', position: 'absolute', zIndex: 3, left: 0, right: 0 }}>{abandonError}</div>} */}
                {/* {abandonSuccess && <div style={{ color: 'green', marginTop: 8, textAlign: 'center', width: '100%', position: 'absolute', zIndex: 3, left: 0, right: 0 }}>Game abandoned!</div>} */}
              </>
            ) : fullscreenGame === 'disk' ? (
              <div
                style={{
                  width: '100vw',
                  height: '100vh',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    transform: isExiting ? 'scale(0.2)' : 'scale(1)',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: 'min(60vw, 60vh)',
                    height: 'min(60vw, 60vh)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DiskPreview />
                </div>
                <DiskBottomBar
                  show={showDiskBottomBar}
                  onCreate={() => setShowCreateGame(true)}
                  onJoin={() => setShowJoinGame(true)}
                />
              </div>
            ) : null}
          </FullscreenTransition>
        )}
        <div
          style={{
            position: 'fixed',
            left: mousePos.x - 16,
            top: mousePos.y - 16,
            pointerEvents: 'none',
            transform: `rotate(${cursorRotation}deg) scale(${isMoving ? 2.5 : 1.25})`,
            width: '32px',
            height: '32px',
            background: 'url("/wiiCursor/wii-pointer.png") no-repeat center center',
            backgroundSize: 'contain',
            transition: 'transform 0.3s ease-out',
            zIndex: 9999,
            cursor: 'none'
          }}
        />
        <audio ref={clickSoundRef} src="/wiiClick.mp3" />
        <audio ref={musicRef} src="/wiiMusic.mp3" loop />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '24px',
          lineHeight: '1.5',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Please use this part of Neighborhood on your desktop or laptop screen!
        </p>
      </div>
    );
  }

  return (
    <div className={styles.hacktendoRoot} style={{ backgroundColor: '#000', cursor: 'none' }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 64,
        animation: "fadeIn 0.9s ease-in",
        cursor: 'none'
      }}>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes blink {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: scale(1); }
            10% { opacity: 1; transform: scale(1.08); }
            50% { opacity: 1; transform: scale(1.12); }
            90% { opacity: 1; transform: scale(1.08); }
            100% { opacity: 0; transform: scale(1); }
          }
          .press-a {
            display: block;
            color: #fff;
            font-size: 54px;
            text-align: center;
            margin-top: 40px;
            font-weight: bold;
            letter-spacing: 1px;
            opacity: 0;
            animation: fadeIn 0.9s ease-in 0.9s forwards, blink 2s ease-in-out infinite 1.8s;
            will-change: opacity;
          }
          .circle-a {
            font-family: inherit;
            font-size: 1.2em;
            vertical-align: middle;
          }
          .shiny-link {
            color: #849EC8;
            font-size: 45px;
            font-weight: bold;
            position: relative;
            display: inline-block;
          }
          .shiny-link::after {
            content: '';
            position: absolute;
            top: 0;
            left: -40%;
            width: 40%;
            height: 100%;
            background: rgba(26, 39, 64, 0.22);
            -webkit-background-clip: text;
            background-clip: text;
            pointer-events: none;
            z-index: 2;
            animation: solid-shine 5.5s cubic-bezier(0.4,0,0.2,1) infinite;
          }
          @keyframes solid-shine {
            0% { left: -40%; }
            70% { left: 100%; }
            100% { left: 100%; }
          }
        `}</style>
        <p style={{color: "#fff", fontSize: "45px", textAlign: "center", fontWeight: "bold"}}>⚠️ WARNING-HEALTH AND SANITY</p>
        <p style={{color: "#fff", fontSize: "30px", textAlign: "center", fontWeight: "bold"}}>Before playing, make sure you're part of the Hack Club Neighborhood<br/> physically located in San Francisco, California, USA, and virtually<br/>located in the dreams of teen hackers <i>everywhere</i>.</p>
        <div style={{display: 'flex', alignItems: "center", flexDirection: "column"}}>
          <p style={{color: "#fff", fontSize: "30px"}}>also online at</p>
          <a className="shiny-link" href="http://neighborhood.hackclub.com/">neighborhood.hackclub.com</a>
        </div>
        <span className="press-a">Press <span className="circle-a">Ⓐ</span> to continue.</span>
      </div>
    </div>
  );
} 