import React from 'react';
import HacktendoWeekCell from './HacktendoWeekCell';
import DiskPreview from '../components/DiskPreview';

export default function HacktendoGrid({ games, handleGameSelect, selectedGame, isExiting }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '80%',
      maxWidth: '1200px',
      position: 'relative',
      zIndex: selectedGame ? 0 : 1,
      opacity: isExiting ? 1 : (selectedGame ? 0 : 1),
      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {[0, 1, 2].map((row) => (
        <div key={row} style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center'
        }}>
          {[0, 1, 2].map((col) => {
            const index = row * 3 + col;
            return (
              <div key={col} style={{
                border: '2px solid',
                borderColor: "#d1d1d1",
                background: games[index] !== "" ? "#fff" : 'linear-gradient(145deg, #e6e6e6, #ffffff)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
                borderRadius: 48,
                aspectRatio: '2/1',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {games[index] === 'hacktendoWeek' ? (
                  <HacktendoWeekCell 
                    onClick={(e) => handleGameSelect(games[index], e)}
                  />
                ) : games[index] === 'disk' ? (
                  <div style={{width: '80%', height: '80%', cursor: 'pointer'}} onClick={(e) => handleGameSelect('disk', e)}>
                    <DiskPreview />
                  </div>
                ) : (
                  games[index]
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
} 