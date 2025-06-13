import React from 'react';

export default function SunsetView({ onBack }) {
  return (
    <div>
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      paddingLeft: '32px',
      paddingRight: '32px',
      borderBottom: "1px solid black",
      paddingBottom: 16
    }}>
      <button 
        onClick={onBack}
        style={{
          padding: "6px 16px",
          border: "1px solid black",
          borderRadius: "4px",
          backgroundColor: "white",
          cursor: "pointer",
          fontWeight: "500",
          fontSize: "14px",
          width: 65
        }}
      >
        Back
      </button>
      <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
      <p style={{margin: 0, fontSize: 32}}>Sunset Home</p>
      <p>0 neighbors</p>
      </div>
     <div style={{width: 65, display: 'flex', justifyContent: 'end'}}>
     <button 
        style={{
          padding: "6px 12px",
          border: "1px solid black",
          borderRadius: "4px",
          backgroundColor: "white",
          cursor: "pointer",
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        ?
      </button>
     </div>
    </div>
    </div>
  );
} 