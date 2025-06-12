import { useState, useEffect, useRef } from "react";
import { LoginComponentOS } from "/components/os/loginComponentOS"
import { AppSelectionDropup } from "/components/os/AppSelectionDropup"
import { BottomBar } from "/components/os/BottomBar"

export default function PostView() {

  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [weatherTexture, setWeatherTexture] = useState("sunny.svg");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [isAppDropupOpen, setIsAppDropupOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [lineCoords, setLineCoords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  const [stonePath, setStonePath] = useState([]);
  const [visibleStones, setVisibleStones] = useState(0);
  const availableApps = ["Devlog", "Calendar", "Messages", "Settings"];
  
  const sunsetRef = useRef(null);
  const missionRef = useRef(null);
  const lowerHaightRef = useRef(null);
  const bottomBarRef = useRef(null);
  const animationRef = useRef(null);

  const handleHouseClick = (house) => {
    setSelectedHouse(house);
    // Reset visible stones when a new house is selected
    setVisibleStones(0);
  };

  // Generate random stones along the path
  const generateStonePath = (x1, y1, x2, y2) => {
    const stones = [];
    const numStones = Math.floor(Math.random() * 10) + 35; // 35-45 stones
    
    for (let i = 0; i < numStones; i++) {
      // Calculate position along the line
      const ratio = i / (numStones - 1);
      const x = x1 + (x2 - x1) * ratio;
      const y = y1 + (y2 - y1) * ratio;
      
      // Add some randomness to position
      const jitterX = (Math.random() - 0.5) * 7;
      const jitterY = (Math.random() - 0.5) * 5;
      
      // Random stone size
      const size = Math.random() * 0.2 + 0.1;
      
      stones.push({
        x: x + jitterX,
        y: y + jitterY,
        size: size
      });
    }
    
    // Sort stones by y position (bottom to top)
    return stones.sort((a, b) => b.y - a.y);
  };

  // Animate stones appearing
  useEffect(() => {
    if (stonePath.length > 0 && visibleStones < stonePath.length) {
      // Clear any existing animation
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      
      // Set timeout for next stone
      animationRef.current = setTimeout(() => {
        setVisibleStones(prev => prev + 1);
      }, 8);
      
      // Cleanup
      return () => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    }
  }, [visibleStones, stonePath]);

  useEffect(() => {
    if (!selectedHouse) return;
    
    // Function to calculate line coordinates
    const calculateLineCoordinates = () => {
      let sourceElement;
      
      // Get the source element based on selected house
      if (selectedHouse === "sunset") {
        sourceElement = sunsetRef.current;
      } else if (selectedHouse === "mission") {
        sourceElement = missionRef.current;
      } else if (selectedHouse === "lowerhaight") {
        sourceElement = lowerHaightRef.current;
      }
      
      const targetElement = bottomBarRef.current;
      
      if (!sourceElement || !targetElement) return;
      
      // Get bounding rectangles
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      // Calculate positions
      const x1 = sourceRect.left + sourceRect.width / 2;
      const y1 = sourceRect.bottom + 10; // 10px below the text
      const x2 = targetRect.left + targetRect.width / 2;
      const y2 = targetRect.top;
      
      // Convert to percentages relative to the container
      const container = document.documentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      const coords = {
        x1: (x1 / containerWidth) * 100,
        y1: (y1 / containerHeight) * 100,
        x2: (x2 / containerWidth) * 100,
        y2: (y2 / containerHeight) * 100
      };
      
      setLineCoords(coords);
      
      // Generate new stone path
      setStonePath(generateStonePath(coords.x1, coords.y1, coords.x2, coords.y2));
      // Reset visible stones
      setVisibleStones(0);
    };
    
    // Calculate initially
    calculateLineCoordinates();
    
    // Add resize event listener
    window.addEventListener('resize', calculateLineCoordinates);
    
    // Cleanup
    return () => window.removeEventListener('resize', calculateLineCoordinates);
  }, [selectedHouse]);

  return (
    <div>
      <div style={{display: 'flex', flexDirection: "column", justifyContent: "space-between", paddingTop: 32, paddingBottom: 32, height: "100vh", position: "relative"}}>
        {selectedHouse && (
          <svg 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              pointerEvents: "none"
            }}
          >
            {/* Stone path */}
            {stonePath.slice(0, visibleStones).map((stone, index) => (
              <circle 
                key={index}
                cx={`${stone.x}%`}
                cy={`${stone.y}%`}
                r={`${stone.size}%`}
                fill="black"
                opacity={0.8}
              />
            ))}
          </svg>
        )}
        
        <div
          style={{
            display: "flex",
            width: "calc(100vw)",
            justifyContent: "center",
            flexDirection: "row",
            gap: 96,
            paddingLeft: 32, 
            paddingRight: 32,
            position: "relative",
            zIndex: 1
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "33%" }}>
            <div
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 4,
                backgroundImage: "url('/sunset.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                cursor: "pointer",
              }}
              id="sunsetHouse"
              onClick={() => handleHouseClick("sunset")}
            />
            <p ref={sunsetRef} style={{ marginTop: 8, fontWeight: "500" }}>Sunset</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "33%" }}>
            <div
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 4,
                backgroundImage: "url('/mission.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                cursor: "pointer",
              }}
              id="missionHouse"
              onClick={() => handleHouseClick("mission")}
            />
            <p ref={missionRef} style={{ marginTop: 8, fontWeight: "500" }}>Mission</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "33%" }}>
            <div
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 4,
                backgroundImage: "url('/lowerhaight.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                cursor: "pointer",
              }}
              id="lowerHaight"
              onClick={() => handleHouseClick("lowerhaight")}
            />
            <p ref={lowerHaightRef} style={{ marginTop: 8, fontWeight: "500" }}>Lower Haight</p>
          </div>
        </div>
        <div
          ref={bottomBarRef}
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "row",
            position: "relative",
            zIndex: 1,
          }}
        >
          <BottomBar
            availableApps={availableApps}
            selectedApp={selectedApp}
            setSelectedApp={setSelectedApp}
            isAppDropupOpen={isAppDropupOpen}
            setIsAppDropupOpen={setIsAppDropupOpen}
          />
        </div>
      </div>

      {isLoginPopupOpen && (

          <LoginComponentOS
          setIsLoginPopupOpen={setIsLoginPopupOpen}
          setIsSignedIn={setIsSignedIn}
          setUserData={setUserData}
        />      )}
    </div>
  );
}


