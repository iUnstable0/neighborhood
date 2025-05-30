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
  const [games, setGames] = useState(["hacktendoWeek", "", "", "", "", "", "", "", ""]);
  const [fullscreenGame, setFullscreenGame] = useState(null);
  const [transitionRect, setTransitionRect] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const [showDiskBottomBar, setShowDiskBottomBar] = useState(false);
  const [showStartPage, setShowStartPage] = useState(false);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const clickSoundRef = useRef(null);
  const musicRef = useRef(null);

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

  if (showStartPage) {
    return <HacktendoStart onSignupComplete={() => {
      setShowStartPage(false);
      setGames(g => {
        const newGames = [...g];
        newGames[1] = 'disk';
        return newGames;
      });
    }} />;
  }

  if (showCreateGame) {
    return <CreateGameComponent />;
  }

  if (proceed) {
    return (
      <div
        className={styles.hacktendoRoot}
        onClick={handleClick}
        style={{ background: '#fff', color: '#000', cursor: 'none' }}
      >
        <HacktendoGrid
          games={games}
          handleGameSelect={handleGameSelect}
          selectedGame={fullscreenGame}
          isExiting={isExiting}
        />
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
            {fullscreenGame === 'disk' && (
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
                  onJoin={() => { /* TODO: handle join game */ }}
                />
              </div>
            )}
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