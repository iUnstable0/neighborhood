import React from 'react';

export default function PreviewGameBar({ onPlay, onAdventure }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(8px)',
        padding: '10px 0',
        position: 'relative',
      }}
    >
      <button
        onClick={onPlay}
        style={{
          fontSize: 20,
          fontWeight: 700,
          padding: '8px 28px',
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(180deg, #fafdff 60%, #e6f0ff 100%)',
          color: '#222',
          boxShadow: '0 1px 4px rgba(37,99,235,0.08)',
          outline: 'none',
          cursor: 'pointer',
          borderBottom: '2.5px solid #b3e0ff',
          borderTop: '2.5px solid #e0f7ff',
          borderLeft: '2.5px solid #e0f7ff',
          borderRight: '2.5px solid #e0f7ff',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
      >
        Play
      </button>
      <button
        onClick={onAdventure}
        style={{
          fontSize: 20,
          fontWeight: 700,
          padding: '8px 28px',
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(180deg, #fafdff 60%, #e6f0ff 100%)',
          color: '#222',
          boxShadow: '0 1px 4px rgba(37,99,235,0.08)',
          outline: 'none',
          cursor: 'pointer',
          borderBottom: '2.5px solid #b3e0ff',
          borderTop: '2.5px solid #e0f7ff',
          borderLeft: '2.5px solid #e0f7ff',
          borderRight: '2.5px solid #e0f7ff',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
      >
        See AdventureTime
      </button>
    </div>
  );
} 