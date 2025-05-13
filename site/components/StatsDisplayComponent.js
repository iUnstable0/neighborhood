import React, { useState, useEffect, useRef } from 'react';

export default function StatsDisplayComponent({ userData }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef(null);

  const handleMouseEnter = () => {
    setShowDetails(true);
    setTimeout(() => setIsVisible(true), 50);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setTimeout(() => setShowDetails(false), 300);
  };

  const formatHours = (hours) => {
    if (!hours) return '0h 0m';
    
    const totalHours = Math.floor(hours);
    const minutes = Math.round((hours - totalHours) * 60);
    
    if (minutes === 60) {
      return `${totalHours + 1}h 0m`;
    }
    
    return `${totalHours}h ${minutes}m`;
  };

  const formatPercentage = (part, total) => {
    if (!total) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  };

  // Draw the circular visualization
  useEffect(() => {
    if (showDetails && isVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set up high DPI rendering
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hackatimeHours = userData?.totalTimeHackatimeHours || 0;
      const stopwatchHours = userData?.totalTimeStopwatchHours || 0;
      const total = hackatimeHours + stopwatchHours;

      if (total === 0) {
        // Draw empty circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#eee';
        ctx.fill();
      } else {
        // Draw background circle first
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#8b6b4a';
        ctx.fill();

        // Draw Hackatime arc
        const hackatimeAngle = (hackatimeHours / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + hackatimeAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = '#007C74';
        ctx.fill();

        // Add percentage labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        
        // Function to draw text with better anti-aliasing
        const drawText = (text, x, y) => {
          ctx.font = 'bold 14px "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 3;
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        };

        // Calculate positions for percentage labels
        const hackatimeMidAngle = -Math.PI / 2 + (hackatimeAngle / 2);
        const stopwatchMidAngle = -Math.PI / 2 + hackatimeAngle + ((2 * Math.PI - hackatimeAngle) / 2);

        // Draw Hackatime percentage if it's significant enough
        if (hackatimeHours / total > 0.1) {
          const labelRadius = radius * 0.6;
          const hackatimeX = centerX + Math.cos(hackatimeMidAngle) * labelRadius;
          const hackatimeY = centerY + Math.sin(hackatimeMidAngle) * labelRadius;
          drawText(formatPercentage(hackatimeHours, total), hackatimeX, hackatimeY);
        }

        // Draw Stopwatch percentage if it's significant enough
        if (stopwatchHours / total > 0.1) {
          const labelRadius = radius * 0.6;
          const stopwatchX = centerX + Math.cos(stopwatchMidAngle) * labelRadius;
          const stopwatchY = centerY + Math.sin(stopwatchMidAngle) * labelRadius;
          drawText(formatPercentage(stopwatchHours, total), stopwatchX, stopwatchY);
        }
      }
    }
  }, [showDetails, isVisible, userData]);

  const hackatimeHours = userData?.totalTimeHackatimeHours || 0;
  const stopwatchHours = userData?.totalTimeStopwatchHours || 0;
  const total = hackatimeHours + stopwatchHours;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: 'auto',
        minWidth: 70,
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8b6b4a',
        borderRadius: 8,
        cursor: 'pointer',
        border: '1px solid #644c36',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: 'scale(1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        padding: '0 10px',
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
    >
      <div style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
        {formatHours(userData?.totalTimeCombinedHours)}
      </div>

      {showDetails && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #644c36',
            width: '280px',
            zIndex: 1000,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.95)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformOrigin: 'top right',
            fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '16px'
          }}>
            <canvas
              ref={canvasRef}
              width="160"
              height="160"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
              }}
            />
            
            <div style={{ 
              width: '100%',
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s',
                }}
              >
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: '#007C74',
                  flexShrink: 0,
                }} />
                <span style={{ color: '#007C74', flex: 1, fontWeight: '600', fontSize: '15px' }}>Hackatime:</span>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontWeight: '600', color: '#007C74', fontSize: '15px' }}>{formatHours(hackatimeHours)}</span>
                  <span style={{ color: '#007C74', fontSize: '13px', opacity: 0.9, fontWeight: '500' }}>
                    ({formatPercentage(hackatimeHours, total)})
                  </span>
                </div>
              </div>
              
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
                }}
              >
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: '#8b6b4a',
                  flexShrink: 0,
                }} />
                <span style={{ color: '#8b6b4a', flex: 1, fontWeight: '600', fontSize: '15px' }}>Stopwatch:</span>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontWeight: '600', color: '#8b6b4a', fontSize: '15px' }}>{formatHours(stopwatchHours)}</span>
                  <span style={{ color: '#8b6b4a', fontSize: '13px', opacity: 0.9, fontWeight: '500' }}>
                    ({formatPercentage(stopwatchHours, total)})
                  </span>
                </div>
              </div>

              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid #eee',
                  paddingTop: '12px',
                  marginTop: '4px',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s',
                }}
              >
                <div style={{ width: '12px', flexShrink: 0 }} />
                <span style={{ color: '#555', flex: 1, fontWeight: '600', fontSize: '15px' }}>Total:</span>
                <span style={{ fontWeight: '600', whiteSpace: 'nowrap', color: '#555', fontSize: '15px' }}>{formatHours(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 