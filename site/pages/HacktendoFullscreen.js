import React, { useRef, useEffect } from 'react';
import HacktendoBottomBar from './HacktendoBottomBar';
import styles from '../styles/Hacktendo.module.css';

export default function HacktendoFullscreen({
  transitionRect,
  isExiting,
  showBottomBar,
  handleGameExit,
  children
}) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
    }
  }, []);

  return (
    <div
      onClick={handleGameExit}
      style={{
        position: 'fixed',
        top: transitionRect.top,
        left: transitionRect.left,
        width: transitionRect.width,
        height: transitionRect.height,
        background: 'transparent',
        borderRadius: '48px',
        overflow: 'hidden',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: isExiting
          ? 'shrinkFromFullscreen 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'expandToFullscreen 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        cursor: 'none',
        transition: 'none'
      }}
    >
      <style jsx>{`
        @keyframes expandToFullscreen {
          0% {
            top: ${transitionRect.top}px;
            left: ${transitionRect.left}px;
            width: ${transitionRect.width}px;
            height: ${transitionRect.height}px;
            border-radius: 48px;
          }
          70% {
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border-radius: 48px;
          }
          100% {
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border-radius: 0;
          }
        }
        @keyframes shrinkFromFullscreen {
          0% {
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border-radius: 0;
          }
          30% {
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border-radius: 48px;
          }
          100% {
            top: ${transitionRect.top}px;
            left: ${transitionRect.left}px;
            width: ${transitionRect.width}px;
            height: ${transitionRect.height}px;
            border-radius: 48px;
          }
        }
        @keyframes scaleImageDown {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(0.5);
          }
        }
        @keyframes scaleImageUp {
          0% {
            transform: scale(0.5);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'url("/background.png") no-repeat center center',
          backgroundSize: 'cover',
          zIndex: 0,
          opacity: isExiting ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: 'transparent'
        }}
      />
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
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'none',
          backgroundColor: 'transparent'
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
          animation: isExiting
            ? 'scaleImageUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            : 'scaleImageDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          backgroundColor: 'transparent',
          paddingBottom: showBottomBar ? 96 : 0,
          transition: 'padding-bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      <HacktendoBottomBar show={showBottomBar} onStart={() => {}} showStartButton={showBottomBar} />
      {children}
    </div>
  );
} 