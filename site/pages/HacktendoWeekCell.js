import React from 'react';

export default function HacktendoWeekCell({ onClick }) {
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
        cursor: 'none',
        position: 'relative'
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
} 