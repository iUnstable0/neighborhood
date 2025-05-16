import React, { useState, useEffect, useRef } from 'react';
import { M_PLUS_Rounded_1c } from "next/font/google";
import { getToken } from "@/utils/storage";
import Soundfont from 'soundfont-player';

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});

const BOARD_BAR_HEIGHT = 145;

const HomesComponent = ({ isExiting, onClose, userData }) => {
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHome, setSelectedHome] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState({});
  const [showPhotoGrid, setShowPhotoGrid] = useState(true);
  const detailViewRef = useRef(null);
  const pianoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const photoRefs = useRef({});
  const [allPhotosLoaded, setAllPhotosLoaded] = useState(false);

  // Preload images for faster navigation
  const preloadImages = (imageUrls) => {
    const newPreloadedImages = { ...preloadedImages };
    
    imageUrls.forEach(url => {
      // Skip if already preloaded
      if (newPreloadedImages[url]) return;
      
      // Create a new image object to preload
      const img = new Image();
      img.src = url;
      newPreloadedImages[url] = img;
    });
    
    setPreloadedImages(newPreloadedImages);
  };

  // Preload all images when a home is selected
  useEffect(() => {
    if (selectedHome && selectedHome.photos && selectedHome.photos.length > 0) {
      // Preload all photos of the selected home
      preloadImages(selectedHome.photos);
      
      // Reset photo grid state when a new home is selected
      setShowPhotoGrid(true);
      
      // Schedule transition to stack view
      const timer = setTimeout(() => {
        setShowPhotoGrid(false);
        if (pianoRef.current) {
          // Play a stacking sound
          playStackingSound();
        }
      }, 900);
      
      return () => clearTimeout(timer);
    }
  }, [selectedHome]);

  // Preload thumbnails when homes data is loaded
  useEffect(() => {
    if (homes.length > 0) {
      // Collect all thumbnail URLs
      const thumbnailUrls = homes
        .map(home => home.thumbnail)
        .filter(Boolean);
      
      // Preload thumbnails
      preloadImages(thumbnailUrls);
    }
  }, [homes]);

  // Initialize piano sounds
  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    Soundfont.instrument(audioCtxRef.current, 'marimba')
      .then(piano => {
        pianoRef.current = piano;
        // Play a "ready" sound when component loads
        playJazzChord(['D4', 'F#4', 'A4', 'C5'], [0, 0.1, 0.2, 0.3], 0.4);
      })
      .catch(err => console.error('Failed to load marimba instrument:', err));

    return () => {
      // Play exit sound when component unmounts
      if (pianoRef.current) {
        playJazzChord(['C5', 'A4', 'F#4', 'D4'], [0, 0.1, 0.2, 0.3], 0.4);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Piano sound functions
  const playNote = (note, duration = 0.3, velocity = 0.7, delay = 0) => {
    if (pianoRef.current && audioCtxRef.current) {
      const time = audioCtxRef.current.currentTime + delay;
      pianoRef.current.play(note, time, { duration, gain: velocity });
    }
  };

  const playScale = (notes, velocities = [], intervals = [], baseVelocity = 0.7, baseInterval = 0.1) => {
    if (!pianoRef.current) return;
    
    notes.forEach((note, i) => {
      const velocity = velocities[i] || baseVelocity;
      const delay = intervals.reduce((sum, val, idx) => idx < i ? sum + (val || baseInterval) : sum, 0);
      playNote(note, 0.3, velocity, delay);
    });
  };

  const playJazzChord = (notes, delays = [], velocity = 0.7) => {
    if (!pianoRef.current) return;
    
    notes.forEach((note, i) => {
      const delay = delays[i] || i * 0.05;
      playNote(note, 0.6, velocity, delay);
    });
  };

  // Sound for stacking animation
  const playStackingSound = () => {
    const notes = ['G5', 'F5', 'E5', 'D5', 'C5'];
    notes.forEach((note, i) => {
      playNote(note, 0.3, 0.5, i * 0.08);
    });
  };

  // Home hover/select sound effects - inspired by jazz chords
  const playHomeHoverSound = (index) => {
    // Create different sounds based on index for variety
    const baseNotes = [
      ['D4', 'F#4', 'A4'], // D major
      ['E4', 'G4', 'B4'],  // E minor
      ['F4', 'A4', 'C5'],  // F major
      ['G4', 'B4', 'D5'],  // G major
      ['A4', 'C5', 'E5'],  // A minor
    ];
    
    const chordIndex = index % baseNotes.length;
    playScale(baseNotes[chordIndex], [0.5, 0.6, 0.7], [0.03, 0.03]);
  };

  const playHomeSelectSound = () => {
    // Play a jazzy 7th chord when selecting a home
    playJazzChord(['D4', 'F#4', 'A4', 'C5'], [0, 0.05, 0.1, 0.15], 0.7);
  };

  // Arrow navigation sounds
  const playNextSound = () => {
    playScale(['E5', 'G5', 'B5'], [0.5, 0.6, 0.7], [0.03, 0.03]);
  };

  const playPrevSound = () => {
    playScale(['B5', 'G5', 'E5'], [0.5, 0.6, 0.7], [0.03, 0.03]);
  };

  // Back button sound
  const playBackSound = () => {
    playScale(['A4', 'F#4', 'D4'], [0.6, 0.5, 0.4], [0.05, 0.05]);
  };

  // Close button sound
  const playCloseSound = () => {
    playJazzChord(['C5', 'A4', 'F#4', 'D4'], [0, 0.05, 0.1, 0.15], 0.6);
  };

  // Photo grid thumbnail click
  const playThumbnailSound = (index) => {
    const note = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'][index % 7];
    playNote(note, 0.2, 0.6);
  };

  useEffect(() => {
    const fetchHomes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/getHomes');
        if (!response.ok) {
          throw new Error(`Failed to fetch homes: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched homes:', data.homes);
        
        // Process homes to add thumbnail to photos array
        const processedHomes = data.homes.map(home => {
          const photos = [...(home.photos || [])];
          
          // If thumbnail exists and is not already in photos, add it at the beginning
          if (home.thumbnail && !photos.includes(home.thumbnail)) {
            photos.unshift(home.thumbnail);
          }
          
          return {
            ...home,
            photos: photos
          };
        });
        
        setHomes(processedHomes || []);
      } catch (err) {
        console.error('Error fetching homes:', err);
        setError(err.message || 'Failed to fetch homes');
      } finally {
        setLoading(false);
      }
    };

    fetchHomes();
  }, []);

  // Add keyboard navigation for arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedHome) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevPhoto();
        playPrevSound();
      } else if (e.key === 'ArrowRight') {
        goToNextPhoto();
        playNextSound();
      } else if (e.key === 'Escape') {
        handleBackToList();
        playBackSound();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedHome]);

  const handleHomeClick = (home) => {
    playHomeSelectSound();
    setSelectedHome(home);
    setCurrentPhotoIndex(0); // Reset to first photo when selecting a new home
  };

  const handleBackToList = () => {
    playBackSound();
    setSelectedHome(null);
    setCurrentPhotoIndex(0);
  };

  const goToNextPhoto = () => {
    if (selectedHome) {
      const photos = selectedHome.photos || [];
      if (photos.length > 0) {
        playNextSound();
        setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length);
      }
    }
  };

  const goToPrevPhoto = () => {
    if (selectedHome) {
      const photos = selectedHome.photos || [];
      if (photos.length > 0) {
        playPrevSound();
        setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
      }
    }
  };

  const setPhotoByIndex = (index) => {
    if (index >= 0 && selectedHome?.photos && index < selectedHome.photos.length) {
      playThumbnailSound(index);
      setCurrentPhotoIndex(index);
    }
  };

  const getPhotoUrl = () => {
    if (!selectedHome) return '';
    
    // Get photo from the current index
    if (selectedHome.photos && selectedHome.photos.length > 0) {
      return selectedHome.photos[currentPhotoIndex];
    }
    
    // Fallback to thumbnail
    return selectedHome.thumbnail;
  };

  const hasMultiplePhotos = selectedHome?.photos?.length > 1;

  // Track loaded images for selectedHome
  useEffect(() => {
    if (!selectedHome || !selectedHome.photos || selectedHome.photos.length === 0) {
      setAllPhotosLoaded(false);
      return;
    }
    let isCancelled = false;
    let loadedCount = 0;
    const total = selectedHome.photos.length;

    const handleLoad = () => {
      loadedCount++;
      if (!isCancelled && loadedCount === total) {
        setAllPhotosLoaded(true);
      }
    };

    setAllPhotosLoaded(false);
    selectedHome.photos.forEach((url) => {
      const img = new window.Image();
      img.onload = handleLoad;
      img.onerror = handleLoad;
      img.src = url;
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedHome]);

  return (
    <div className={`pop-in ${isExiting ? "hidden" : ""} ${mPlusRounded.variable}`} 
      style={{
        position: "absolute", 
        zIndex: 2, 
        width: "calc(100% - 16px)", 
        height: "calc(100% - 16px)", 
        borderRadius: 25, 
        marginLeft: 8, 
        marginTop: 8, 
        backgroundColor: "#ffe5c7",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(123, 91, 63, 0.1)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Photo preloader - Hidden elements to preload all images */}
      <div style={{ display: 'none', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        {selectedHome?.photos?.map((url, index) => (
          <img key={`preload-${index}`} src={url} alt="preload" />
        ))}
      </div>

      {/* Top bar */}
      <div style={{
        display: "flex", 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center",
        padding: "8px 16px",
        borderBottom: "2px solid #B9A88F",
        backgroundColor: "#e8c9a5",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 2,
        height: "60px",
        minHeight: "60px",
        maxHeight: "60px",
        position: "relative"
      }}>
        <div 
          onClick={() => {
            playCloseSound();
            onClose();
          }}
          style={{
            width: 16, 
            cursor: "pointer", 
            height: 16, 
            borderRadius: '50%', 
            backgroundColor: "#FF5F56",
            border: '2px solid #E64940',
            transition: 'transform 0.2s',
            ':hover': {
              transform: 'scale(1.1)'
            }
          }} 
        />
        <div style={{
          fontFamily: "var(--font-m-plus-rounded)",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#644c36",
          textShadow: "none",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)"
        }}>
          {selectedHome ? selectedHome.name : "Neighborhood Homes"}
        </div>
        {selectedHome && (
          <div
            onClick={handleBackToList}
            style={{
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "#8b6b4a",
              color: "white",
              fontSize: "14px",
              fontFamily: "var(--font-m-plus-rounded)",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to All
          </div>
        )}
      </div>

      {/* Content area */}
      <div 
        ref={detailViewRef}
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#ffead1",
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {loading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px"
          }}>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "18px",
              color: "#6c4a24"
            }}>Loading neighborhood homes...</p>
          </div>
        ) : error ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px"
          }}>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "18px",
              color: "#e74c3c"
            }}>{error}</p>
          </div>
        ) : selectedHome ? (
          // Selected home detail view
          <div style={{
            width: "100%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            {/* Photo stack/animation */}
            <div style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
              minHeight: "60vh"
            }}>
              {/* Wait for all images to load before showing stack */}
              {!allPhotosLoaded && (
                <div style={{
                  width: "100%",
                  height: "60vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <p style={{ fontFamily: "var(--font-m-plus-rounded)", fontSize: 18, color: "#6c4a24" }}>Loading photos...</p>
                </div>
              )}
              {/* Stack view: show when all loaded and showPhotoGrid is true */}
              {allPhotosLoaded && showPhotoGrid && (
                <div style={{
                  width: "100%",
                  height: "60vh",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <div style={{
                    position: "relative",
                    width: "420px",
                    height: "347px",
                    maxWidth: "90vw",
                    maxHeight: "60vh"
                  }}>
                    {selectedHome.photos.map((photo, i) => {
                      // Top photo is first (i=0)
                      const z = selectedHome.photos.length - i;
                      const offset = i * 8;
                      const rotate = (i - 1) * 2.5;
                      return (
                        <img
                          key={`stack-${i}`}
                          src={photo}
                          alt={`stack-${i}`}
                          style={{
                            position: "absolute",
                            left: offset,
                            top: offset,
                            width: "400px",
                            height: "331px",
                            maxWidth: "80vw",
                            maxHeight: "55vh",
                            objectFit: "cover",
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
                            zIndex: z,
                            transform: `rotate(${i === 0 ? 0 : rotate}deg) scale(${i === 0 ? 1 : 0.96 - i * 0.02})`,
                            transition: "transform 0.7s cubic-bezier(.77,0,.18,1), box-shadow 0.7s cubic-bezier(.77,0,.18,1)",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            MozUserSelect: "none",
                            msUserSelect: "none",
                            pointerEvents: "none"
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Main photo view: fade in and scale up the top image */}
              {allPhotosLoaded && !showPhotoGrid && (
                <div style={{
                  width: "100%",
                  opacity: showPhotoGrid ? 0 : 1,
                  transition: "opacity 0.5s ease-in",
                  transitionDelay: showPhotoGrid ? "0s" : "0.3s",
                  position: "relative",
                  zIndex: 1
                }}>
                  <div style={{
                    width: "100%",
                    maxHeight: "80vh",
                    aspectRatio: "1316/1088",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#f0e0c6",
                    position: "relative"
                  }}>
                    <img
                      src={getPhotoUrl()}
                      alt={selectedHome.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                        pointerEvents: "none"
                      }}
                    />
                    {/* Navigation arrows and counter as before */}
                    {hasMultiplePhotos && (
                      <>
                        <div 
                          onClick={goToPrevPhoto}
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "20px",
                            transform: "translateY(-50%)",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            zIndex: 2
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="#6c4a24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div 
                          onClick={goToNextPhoto}
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: "20px",
                            transform: "translateY(-50%)",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            zIndex: 2
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 6L15 12L9 18" stroke="#6c4a24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </>
                    )}
                    {hasMultiplePhotos && (
                      <div style={{
                        position: "absolute",
                        bottom: "16px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        padding: "4px 12px",
                        fontSize: "14px",
                        color: "#6c4a24",
                        fontFamily: "var(--font-m-plus-rounded)"
                      }}>
                        {currentPhotoIndex + 1} / {selectedHome.photos.length}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Home details - simplified without white background */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <h2 style={{
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "28px",
                fontWeight: "bold",
                color: "#6c4a24",
                margin: 0
              }}>
                {selectedHome.name}
              </h2>
              
              {selectedHome.address && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#8b6b4a",
                  fontSize: "16px"
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#8b6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="#8b6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{selectedHome.address}</span>
                </div>
              )}
              
              {selectedHome.description && (
                <p style={{
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontSize: "16px",
                  color: "#6c4a24",
                  lineHeight: "1.6",
                  margin: 0,
                  whiteSpace: "pre-line"
                }}>
                  {selectedHome.description}
                </p>
              )}
              
              {/* Rooms - simplified */}
              {selectedHome.rooms && selectedHome.rooms.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <h3 style={{
                    fontFamily: "var(--font-m-plus-rounded)",
                    fontSize: "18px",
                    color: "#6c4a24",
                    margin: "0 0 12px 0"
                  }}>
                    Rooms
                  </h3>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px"
                  }}>
                    {selectedHome.rooms.map((room, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#f0e0c6",
                          borderRadius: "16px",
                          fontSize: "14px",
                          color: "#8b6b4a"
                        }}
                      >
                        {room}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : homes.length === 0 ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px"
          }}>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "18px",
              color: "#6c4a24"
            }}>No homes available in the neighborhood yet.</p>
          </div>
        ) : (
          // Grid of homes - SIMPLIFIED VERSION
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "24px",
            width: "100%"
          }}>
            {homes.map((home, index) => (
              <div
                key={home.id}
                onClick={() => handleHomeClick(home)}
                onMouseEnter={() => playHomeHoverSound(index)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "transform 0.2s",
                  ':hover': {
                    transform: "translateY(-4px)"
                  }
                }}
              >
                <div style={{
                  width: "100%",
                  aspectRatio: "1316/1088",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#f0e0c6"
                }}>
                  {home.thumbnail ? (
                    <img
                      src={home.thumbnail}
                      alt={home.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                        pointerEvents: "none"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f0e0c6",
                      color: "#8b6b4a",
                      fontSize: "16px"
                    }}>
                      No Image
                    </div>
                  )}
                </div>
                
                <h3 style={{
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "#6c4a24",
                  margin: "12px 0 0 0",
                  padding: 0
                }}>
                  {home.name}
                </h3>
              </div>
            ))}

            {/* More coming soon message */}
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              margin: "24px 0 8px 0",
              padding: "16px",
              fontSize: "20px",
              fontFamily: "var(--font-m-plus-rounded)",
              fontWeight: "bold",
              color: "#8b6b4a",
              fontStyle: "italic"
            }}>
              More Coming Soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomesComponent; 