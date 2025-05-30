import React from 'react';

export default function FullscreenTransition({
  transitionRect,
  isExiting,
  onExit,
  children
}) {
  if (!transitionRect) return null;
  return (
    <div
      onClick={onExit}
      style={{
        position: 'fixed',
        top: transitionRect.top,
        left: transitionRect.left,
        width: transitionRect.width,
        height: transitionRect.height,
        background: 'transparent',
        borderRadius: '48px',
        overflow: 'hidden',
        zIndex: 9999,
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
      `}</style>
      {children}
    </div>
  );
} 