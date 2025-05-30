import React from 'react';
import styles from '../styles/Hacktendo.module.css';

export default function DiskBottomBar({ show, onCreate, onJoin }) {
  return (
    <div
      className={
        styles.hacktendoBottomBar + (show ? ' ' + styles.hacktendoBottomBarVisible : '')
      }
      style={{
        borderTopLeftRadius: show ? 0 : 32,
        borderTopRightRadius: show ? 0 : 32,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-top-left-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-top-right-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
      }}
    >
      <button
        onClick={onCreate}
        className={
          styles.hacktendoStartButton + (show ? ' ' + styles.hacktendoStartButtonVisible : '')
        }
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'scale(1, 1)' : 'scale(0, 0.7)',
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        Create Game
      </button>
      <button
        onClick={onJoin}
        className={
          styles.hacktendoStartButton + (show ? ' ' + styles.hacktendoStartButtonVisible : '')
        }
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'scale(1, 1)' : 'scale(0, 0.7)',
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        Join Game
      </button>
    </div>
  );
} 