import React, { useState, useEffect, useRef } from 'react';
import Soundfont from 'soundfont-player';
import { ResponsiveFunnel } from '@nivo/funnel';

export default function StatsDisplayComponent({ userData }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [piano, setPiano] = useState(null);
  const dropdownRef = useRef(null);

  // Prepare funnel data using actual values only (no minimums)
  const logged = userData?.totalTimeCombinedHours || 0;
  const checked = userData?.totalCheckedTime || 0;
  const shipped = userData?.GrantedHours || 0;
  const funnelData = [
    {
      id: 'Logged Hours',
      label: 'Logged Hours',
      value: logged,
      color: '#007C74'
    },
    {
      id: 'Checked Hours',
      label: 'Checked Hours',
      value: checked,
      color: '#8b6b4a'
    },
    {
      id: 'Shipped Hours',
      label: 'Shipped Hours',
      value: shipped,
      color: '#EF758A'
    }
  ];

  useEffect(() => {
    const ac = new AudioContext();
    Soundfont.instrument(ac, 'acoustic_grand_piano', {
      gain: 0.3
    }).then((piano) => {
      setPiano(piano);
    });
  }, []);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsVisible(false);
        setTimeout(() => setShowDetails(false), 300);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const playStatsSequence = () => {
    if (!piano) return;
    const hackatimeHours = userData?.totalTimeHackatimeHours || 0;
    const stopwatchHours = userData?.totalTimeStopwatchHours || 0;
    const total = hackatimeHours + stopwatchHours;
    const baseNotes = ['C5', 'E5', 'G5'];
    const progress = Math.min(total / 100, 1);
    const additionalNotes = [];
    if (progress > 0.25) additionalNotes.push('A5');
    if (progress > 0.5) additionalNotes.push('C6');
    if (progress > 0.75) additionalNotes.push('E6');
    const sequence = [...baseNotes, ...additionalNotes];
    const ac = new AudioContext();
    sequence.forEach((note, index) => {
      setTimeout(() => {
        piano.play(note, ac.currentTime, {
          duration: 0.5,
          gain: 0.08
        });
      }, index * 150);
    });
  };

  const handleClick = () => {
    if (!showDetails) {
      setShowDetails(true);
      setTimeout(() => {
        setIsVisible(true);
        playStatsSequence();
      }, 50);
    } else {
      setIsVisible(false);
      setTimeout(() => setShowDetails(false), 300);
    }
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

  const hackatimeHours = userData?.totalTimeHackatimeHours || 0;
  const stopwatchHours = userData?.totalTimeStopwatchHours || 0;
  const total = hackatimeHours + stopwatchHours;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
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
      <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>
        {formatHours(userData?.totalTimeCombinedHours)} | {(userData?.GrantedHours || 0) / 10}wg
      </div>

      {showDetails && (
        <div
          ref={dropdownRef}
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
            <div style={{ height: '200px', width: '100%', marginBottom: '4px' }}>
              <ResponsiveFunnel
                data={funnelData}
                valueFormat=">-.1f"
                colors={{ datum: 'color' }}
                borderWidth={20}
                labelColor={{
                  from: 'color',
                  modifiers: [['darker', 3]],
                }}
                beforeSeparatorLength={80}
                beforeSeparatorOffset={0}
                afterSeparatorLength={80}
                afterSeparatorOffset={0}
                currentPartSizeExtension={1}
                currentBorderWidth={80}
                shapeBlending={0.5}
                motionConfig="gentle"
              />
            </div>
            {/* 3-column time summary below funnel, with less vertical gap and bolder, smaller labels */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              margin: '0 0 0 0',
              gap: '0',
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#007C74', fontWeight: 800, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>LOGGED TIME</span><br />
                <span style={{ fontSize: '14px', color: '#222', fontWeight: 600 }}>
                  {formatHours(userData?.totalTimeCombinedHours || 0)}
                </span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#8b6b4a', fontWeight: 800, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>CHECKED TIME</span><br />
                <span style={{ fontSize: '14px', color: '#222', fontWeight: 600 }}>
                  {formatHours(userData?.totalCheckedTime || 0)}
                </span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#EF758A', fontWeight: 800, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>SHIPPED TIME</span><br />
                <span style={{ fontSize: '14px', color: '#222', fontWeight: 600 }}>
                  {formatHours(userData?.GrantedHours || 0)}
                </span>
              </div>
            </div>
            {/* Descriptions for each column, with less vertical gap */}
            <div style={{ width: '100%', margin: '2px 0 0 0' }}>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 0 }}>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#007C74', fontWeight: 500, padding: '0 2px', lineHeight: 1.25 }}>
                  Logged Time<br />
                  <span style={{ color: '#444', fontWeight: 400, lineHeight: 1.25 }}>
                    time you've logged in Hackatime + Stopwatch.
                  </span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#8b6b4a', fontWeight: 500, padding: '0 2px', lineHeight: 1.25 }}>
                  Checked Time<br />
                  <span style={{ color: '#444', fontWeight: 400, lineHeight: 1.25 }}>
                    sum of the checked time of your posts (we'll do a manual review)
                  </span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#EF758A', fontWeight: 500, padding: '0 2px', lineHeight: 1.25 }}>
                  Shipped Time<br />
                  <span style={{ color: '#444', fontWeight: 400, lineHeight: 1.25 }}>
                    time that made it into YSWS database (the final review)
                  </span>
                </div>
              </div>
            </div>
            {/* --- Everything below this is commented out as requested --- */}
            {/**
            <div style={{ 
              width: '100%',
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px',
            }}>
              ...
            </div>

            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: '4px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.29s',
            }}>
              1 wg = 10 hours that were accepted into the YSWS database
            </div>

            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              textAlign: 'center',
              marginTop: '4px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.31s',
            }}>
              Total Weighted Grants: {(userData?.GrantedHours || 0) / 10}wg
            </div>
            **/}
          </div>
        </div>
      )}
    </div>
  );
} 