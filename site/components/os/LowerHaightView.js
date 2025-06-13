import React from 'react';

export default function LowerHaightView({ onBack }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      padding: '20px'
    }}>
      <p>Hello World</p>
      <button 
        onClick={onBack}
        style={{
          padding: "6px 16px",
          border: "1px solid black",
          borderRadius: "4px",
          backgroundColor: "white",
          cursor: "pointer",
          marginTop: "20px",
          fontWeight: "500",
          fontSize: "14px"
        }}
      >
        Back
      </button>
    </div>
  );
} 