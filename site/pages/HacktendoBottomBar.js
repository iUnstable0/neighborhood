import React from 'react';
import styles from '../styles/Hacktendo.module.css';

export default function HacktendoBottomBar({ show, onStart, showStartButton }) {
  return (
    <div
      className={
        styles.hacktendoBottomBar + (show ? ' ' + styles.hacktendoBottomBarVisible : '')
      }
      style={{
        borderTopLeftRadius: show ? 0 : 32,
        borderTopRightRadius: show ? 0 : 32,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-top-left-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-top-right-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <button
        onClick={onStart}
        className={
          styles.hacktendoStartButton + (showStartButton ? ' ' + styles.hacktendoStartButtonVisible : '')
        }
        style={{
          opacity: showStartButton ? 1 : 0,
          transform: showStartButton ? 'scale(1, 1)' : 'scale(0, 0.7)',
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        Start
      </button>
    </div>
  );
} 