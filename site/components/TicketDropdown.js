import React, { useState, useEffect, useRef } from 'react';
import { M_PLUS_Rounded_1c } from "next/font/google";
import Soundfont from 'soundfont-player';

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});

const TicketDropdown = ({ isVisible, onClose, userData, setUserData }) => {
  const [moveInDate, setMoveInDate] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');
  const [lastSavedMoveIn, setLastSavedMoveIn] = useState('');
  const [lastSavedMoveOut, setLastSavedMoveOut] = useState('');
  const [gender, setGender] = useState('');
  const [house, setHouse] = useState('');
  const [isHouseLoading, setIsHouseLoading] = useState(false);
  const [availableMoveOutDates, setAvailableMoveOutDates] = useState([]);
  const [isSpecialDates, setIsSpecialDates] = useState(false);
  const pianoRef = useRef(null);
  const audioCtxRef = useRef(null);
  
  // Hardcoded dates for 2025
  const moveInDates = [
    '2025-06-01',
    '2025-06-16',
    '2025-06-30',
    '2025-07-14',
    '2025-07-28',
    '2025-08-11'
  ];

  const moveOutDates = [
    '2025-06-16',
    '2025-06-30',
    '2025-07-14',
    '2025-07-28',
    '2025-08-11',
    '2025-08-30'
  ];

  // Available houses
  const availableHouses = [
    { value: 'Sunset', label: 'Sunset' },
    { value: 'Mission', label: 'Mission' },
    { value: 'Lower Haight', label: 'Lower Haight' }
  ];

  // Generate all dates between June 1 and September 1
  const generateAllDates = () => {
    const dates = [];
    const start = new Date('2025-06-01');
    const end = new Date('2025-09-01');
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const allDates = generateAllDates();

  // Initialize piano
  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    Soundfont.instrument(audioCtxRef.current, 'acoustic_grand_piano').then((piano) => {
      pianoRef.current = piano;
    });
  }, []);

  // Playful piano sounds
  const playMoveInSound = () => {
    const piano = pianoRef.current;
    if (!piano) return;
    // Rising arpeggio: C5, E5, G5
    [0, 1, 2].forEach((i) => {
      setTimeout(() => piano.play(['C5', 'E5', 'G5'][i], 0.25, { gain: 0.7 }), i * 80);
    });
  };
  const playMoveOutSound = () => {
    const piano = pianoRef.current;
    if (!piano) return;
    // Falling arpeggio: G4, E4, C4
    [0, 1, 2].forEach((i) => {
      setTimeout(() => piano.play(['G4', 'E4', 'C4'][i], 0.25, { gain: 0.7 }), i * 80);
    });
  };
  const playGenderSound = () => {
    const piano = pianoRef.current;
    if (!piano) return;
    // Twinkle: C6, G5, E6
    [0, 1, 2].forEach((i) => {
      setTimeout(() => piano.play(['C6', 'G5', 'E6'][i], 0.18, { gain: 0.7 }), i * 60);
    });
  };
  const playHouseSound = () => {
    const piano = pianoRef.current;
    if (!piano) return;
    // Playful chord: C5, E5, A5
    [0, 1, 2].forEach((i) => {
      setTimeout(() => piano.play(['C5', 'E5', 'A5'][i], 0.22, { gain: 0.7 }), i * 70);
    });
  };

  // Prefill from userData
  useEffect(() => {
    if (userData) {
      if (userData.moveInDate) {
        setMoveInDate(userData.moveInDate);
        setLastSavedMoveIn(userData.moveInDate);
      }
      if (userData.moveOutDate) {
        setMoveOutDate(userData.moveOutDate);
        setLastSavedMoveOut(userData.moveOutDate);
      }
      if (userData.gender) {
        setGender(userData.gender);
      }
      if (userData.house) {
        setHouse(userData.house);
      } else {
        // Fetch house if not in userData
        fetchHouse();
      }
    }
  }, [userData]);

  // Fetch user's house
  const fetchHouse = async () => {
    const token = localStorage.getItem('neighborhoodToken');
    if (!token) return;
    
    try {
      const response = await fetch(`/api/getHouse?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        if (data.house) {
          setHouse(data.house);
          if (setUserData) {
            setUserData(prev => ({ ...prev, house: data.house }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching house information:', error);
    }
  };

  // Calculate coding hours based on selected dates
  const calculateCodingHours = () => {
    if (!moveInDate || !moveOutDate) return null;

    const start = new Date(moveInDate);
    const end = new Date(moveOutDate);
    
    // Calculate weeks (rounded down)
    const weeks = Math.floor((end - start) / (7 * 24 * 60 * 60 * 1000));
    
    // Calculate hours (40 hours per week)
    const summerHours = weeks * 40;
    const totalHours = summerHours + 100; // Adding 100 hours before arrival

    return { summerHours, totalHours };
  };

  // Format date for display
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Update available move-out dates when move-in date changes
  useEffect(() => {
    if (!moveInDate) {
      setAvailableMoveOutDates([]);
      return;
    }

    if (isSpecialDates) {
      // For special dates, allow any date after the selected move-in date
      const availableDates = allDates.filter(date => date > moveInDate);
      setAvailableMoveOutDates(availableDates);
      if (availableDates.length > 0) {
        setMoveOutDate(availableDates[availableDates.length - 1]);
      }
    } else {
      // Original logic for regular dates
      const moveInIndex = moveInDates.indexOf(moveInDate);
      const availableDates = moveOutDates.slice(moveInIndex);
      setAvailableMoveOutDates(availableDates);
      if (availableDates.length > 0) {
        setMoveOutDate(availableDates[availableDates.length - 1]);
      }
    }
  }, [moveInDate, isSpecialDates]);

  // Handle move-in date change
  const handleMoveInChange = (e) => {
    const selectedDate = e.target.value;
    setMoveInDate(selectedDate);
    playMoveInSound();
  };

  // Handle move-out date change
  const handleMoveOutChange = (e) => {
    setMoveOutDate(e.target.value);
    playMoveOutSound();
  };

  // Handle special dates checkbox change
  const handleSpecialDatesChange = (e) => {
    setIsSpecialDates(e.target.checked);
    // Reset dates when toggling special dates
    setMoveInDate('');
    setMoveOutDate('');
    setAvailableMoveOutDates([]);
  };

  // Save move-in and move-out dates to API and update userData
  useEffect(() => {
    // Only call if both are set and changed
    if (
      moveInDate &&
      moveOutDate &&
      (moveInDate !== lastSavedMoveIn || moveOutDate !== lastSavedMoveOut)
    ) {
      const token = localStorage.getItem('neighborhoodToken');
      if (!token) return;
      fetch('/api/setMoveInMoveOutDates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, moveInDate, moveOutDate })
      })
        .then(() => {
          setLastSavedMoveIn(moveInDate);
          setLastSavedMoveOut(moveOutDate);
          if (setUserData) {
            setUserData(prev => ({ ...prev, moveInDate, moveOutDate }));
          }
        })
        .catch(() => {
          // Optionally handle error
        });
    }
  }, [moveInDate, moveOutDate]);

  // Handle gender change
  const handleGenderChange = async (e) => {
    const selectedGender = e.target.value;
    setGender(selectedGender);
    playGenderSound();
    const token = localStorage.getItem('neighborhoodToken');
    if (!token) return;
    try {
      await fetch('/api/setGender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, gender: selectedGender })
      });
      if (setUserData) {
        setUserData(prev => ({ ...prev, gender: selectedGender }));
      }
    } catch (e) {
      // Optionally handle error
    }
  };

  // Handle house change
  const handleHouseChange = async (e) => {
    const selectedHouse = e.target.value;
    setHouse(selectedHouse);
    playHouseSound();
    
    const token = localStorage.getItem('neighborhoodToken');
    if (!token) return;
    
    setIsHouseLoading(true);
    
    try {
      // If user selects "None", unselect house
      if (selectedHouse === '') {
        await fetch('/api/unselectHouse', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Otherwise select the house
        await fetch('/api/selectHouse', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ house: selectedHouse })
        });
      }
      
      if (setUserData) {
        setUserData(prev => ({ ...prev, house: selectedHouse }));
      }
    } catch (error) {
      console.error('Error updating house:', error);
    } finally {
      setIsHouseLoading(false);
    }
  };

  if (!isVisible) return null;

  const codingHours = calculateCodingHours();

  return (
    <div
      id="ticket-dropdown"
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: 300,
        top: "100%",
        right: 0,
        marginTop: 8,
        padding: 16,
        borderRadius: 8,
        backgroundColor: "#fff",
        zIndex: 2000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        border: "1px solid #B5B5B5",
        maxHeight: "80vh",
        overflowY: "auto"
      }}
    >
      {/* Special Dates Checkbox */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          id="specialDates"
          checked={isSpecialDates}
          onChange={handleSpecialDatesChange}
          style={{
            width: 16,
            height: 16,
            cursor: "pointer"
          }}
        />
        <label
          htmlFor="specialDates"
          style={{
            fontFamily: "var(--font-m-plus-rounded)",
            fontSize: "14px",
            color: "#644c36",
            cursor: "pointer"
          }}
        >
          Approved for special move-in / move-out dates
        </label>
      </div>

      {isSpecialDates && (
        <>
          {/* Move-in Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "14px",
              color: "#644c36",
              fontWeight: "bold"
            }}>
              Move-in Date
            </label>
            <select
              value={moveInDate}
              onChange={handleMoveInChange}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #B5B5B5",
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "14px",
                color: "#644c36"
              }}
            >
              <option value="">Select Move-in Date</option>
              {allDates.map((date, index) => (
                <option key={index} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "12px",
              color: "#666",
              margin: 0,
              marginTop: 4
            }}>
              Select any date between June 1st and September 1st, 2025
            </p>
          </div>

          {/* Move-out Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "14px",
              color: "#644c36",
              fontWeight: "bold"
            }}>
              Move-out Date
            </label>
            <select
              value={moveOutDate}
              onChange={handleMoveOutChange}
              disabled={!moveInDate}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #B5B5B5",
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "14px",
                color: moveInDate ? "#644c36" : "#B5B5B5",
                backgroundColor: moveInDate ? "#fff" : "#f5f5f5",
                cursor: moveInDate ? "pointer" : "not-allowed"
              }}
            >
              <option value="">Select Move-out Date</option>
              {availableMoveOutDates.map((date, index) => (
                <option key={index} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "12px",
              color: "#666",
              margin: 0,
              marginTop: 4
            }}>
              {moveInDate ? "Select any date after your move-in date" : "Select move-in date first"}
            </p>
          </div>
        </>
      )}

      {!isSpecialDates && (
        <>
          {/* Move-in Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "14px",
              color: "#644c36",
              fontWeight: "bold"
            }}>
              Move-in Date
            </label>
            <select
              value={moveInDate}
              onChange={handleMoveInChange}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #B5B5B5",
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "14px",
                color: "#644c36"
              }}
            >
              <option value="">Select Move-in Date</option>
              {moveInDates.map((date, index) => (
                <option key={index} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "12px",
              color: "#666",
              margin: 0,
              marginTop: 4
            }}>
              Two-week minimum stay from June 1st to August 30th, 2025
            </p>
          </div>

          {/* Move-out Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "14px",
              color: "#644c36",
              fontWeight: "bold"
            }}>
              Move-out Date
            </label>
            <select
              value={moveOutDate}
              onChange={handleMoveOutChange}
              disabled={!moveInDate}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #B5B5B5",
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "14px",
                color: moveInDate ? "#644c36" : "#B5B5B5",
                backgroundColor: moveInDate ? "#fff" : "#f5f5f5",
                cursor: moveInDate ? "pointer" : "not-allowed"
              }}
            >
              <option value="">Select Move-out Date</option>
              {availableMoveOutDates.map((date, index) => (
                <option key={index} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "12px",
              color: "#666",
              margin: 0,
              marginTop: 4
            }}>
              {moveInDate ? "Select any available move-out date" : "Select move-in date first"}
            </p>
          </div>
        </>
      )}

      {codingHours && (
        <>
          <p style={{fontSize: 14}}>Wow, you would be coding for {codingHours.summerHours} hours this summer in SF! ({codingHours.totalHours} hours if you include the 100 before you move)</p>
          <p style={{fontSize: 14}}>Imagine the things you'll build, the people you'll meet, the person you'll become. Wow. </p>
        </>
      )}
      <div style={{width: "100%", backgroundColor: "#000", height: 1}}></div>

      {/* Gender Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{
          fontFamily: "var(--font-m-plus-rounded)",
          fontSize: "14px",
          color: "#644c36",
          fontWeight: "bold"
        }}>
          Gender
        </label>
        <select
          value={gender}
          onChange={handleGenderChange}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #B5B5B5",
            fontFamily: "var(--font-m-plus-rounded)",
            fontSize: "14px",
            color: "#644c36"
          }}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>

      {/* House Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{
          fontFamily: "var(--font-m-plus-rounded)",
          fontSize: "14px",
          color: "#644c36",
          fontWeight: "bold"
        }}>
          House
        </label>
        <select
          value={house}
          onChange={handleHouseChange}
          disabled={isHouseLoading}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #B5B5B5",
            fontFamily: "var(--font-m-plus-rounded)",
            fontSize: "14px",
            color: "#644c36",
            cursor: isHouseLoading ? "wait" : "pointer"
          }}
        >
          <option value="">None</option>
          {availableHouses.map((house, index) => (
            <option key={index} value={house.value}>
              {house.label}
            </option>
          ))}
        </select>
        <p style={{
          fontFamily: "var(--font-m-plus-rounded)",
          fontSize: "12px",
          color: "#666",
          margin: 0,
          marginTop: 4
        }}>
          Select which house you'd like to join
        </p>
      </div>
    </div>
  );
};

export default TicketDropdown; 