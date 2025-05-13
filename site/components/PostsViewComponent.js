import React, { useState, useEffect } from 'react';
import { M_PLUS_Rounded_1c } from "next/font/google";
import Soundfont from 'soundfont-player';

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});

const PostsViewComponent = ({ isExiting, onClose, posts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [piano, setPiano] = useState(null);

  // Initialize piano sounds
  useEffect(() => {
    const ac = new AudioContext();
    Soundfont.instrument(ac, 'acoustic_grand_piano').then((piano) => {
      setPiano(piano);
    });
  }, []);

  const playNavigationSound = (direction) => {
    if (piano) {
      // Use softer, shorter sequences for navigation
      const baseNotes = direction === 'next' 
        ? ['E4', 'G4']  // Simple ascending interval
        : ['G4', 'E4']; // Simple descending interval

      // Shorter delays for a quicker sound
      const delays = [0, 100];

      // Play notes with reduced volume
      notes.forEach((note, index) => {
        setTimeout(() => {
          piano.play(note, ac.currentTime, {
            gain: 0.3 // Reduce volume to 30%
          });
        }, delays[index]);
      });
    }
  };

  const handlePrevious = () => {
    playNavigationSound('prev');
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
  };

  const handleNext = () => {
    playNavigationSound('next');
    setCurrentIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
  };

  const currentPost = posts[currentIndex];

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
          onClick={onClose}
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
          Latest Posts
        </div>
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        backgroundColor: "#ffead1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        position: "relative"
      }}>
        {/* Current post */}
        <div 
          style={{
            width: "100%",
            maxWidth: "800px",
            backgroundColor: "#FFF9E6",
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            animation: "fadeIn 0.3s ease-in-out",
            marginTop: "30px"
          }}
        >
          <div style={{
            display: "flex",
            gap: "16px",
            alignItems: "flex-start"
          }}>
            <video 
              controls
              playsInline
              style={{
                width: "300px",
                borderRadius: "12px",
                aspectRatio: "16/9",
                objectFit: "fit",
                backgroundColor: "#000"
              }}
              onMouseEnter={(e) => {
                e.target.play();
              }}
              onMouseLeave={(e) => {
                e.target.pause();
                e.target.currentTime = 0;
              }}
              src={currentPost.photoboothVideo}
            />
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <p style={{
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "16px",
                color: "#644c36",
                margin: 0,
                lineHeight: "1.5"
              }}>
                {currentPost.description}
              </p>
              <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap"
              }}>
                {/*
                {post.app && (
                  <span style={{
                    backgroundColor: "#8b6b4a",
                    color: "#FFF9E6",
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "14px",
                    fontFamily: "var(--font-m-plus-rounded)"
                  }}>
                    {post.app}
                  </span>
                )}
                */}
                {currentPost.neighbor && (
                  <span style={{
                    color: "#000",
                    fontSize: "14px",
                    fontFamily: "var(--font-m-plus-rounded)"
                  }}>
                    {currentPost.neighbor}
                  </span>
                )}
              </div>
            </div>
          </div>
          {currentPost.demoVideo && (
            <video 
              controls
              playsInline
              style={{
                width: "100%",
                borderRadius: "12px",
                aspectRatio: "16/9",
                objectFit: "fit",
                backgroundColor: "#000"
              }}
              onMouseEnter={(e) => {
                e.target.play();
              }}
              onMouseLeave={(e) => {
                e.target.pause();
                e.target.currentTime = 0;
              }}
              src={currentPost.demoVideo}
            />
          )}
        </div>

        {/* Navigation and pagination */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          marginTop: "20px",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          borderRadius: "12px",
          backdropFilter: "blur(4px)",
          width: "fit-content"
        }}>
          <div 
            onClick={handlePrevious}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              border: "2px solid #B9A88F"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#644c36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{
            fontFamily: "var(--font-m-plus-rounded)",
            fontSize: "18px",
            color: "#644c36",
            fontWeight: "bold"
          }}>
            {currentIndex + 1} / {posts.length}
          </div>

          <div 
            onClick={handleNext}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              border: "2px solid #B9A88F"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="#644c36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PostsViewComponent; 