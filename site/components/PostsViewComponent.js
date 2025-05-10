import React from 'react';
import { M_PLUS_Rounded_1c } from "next/font/google";

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});

const PostsViewComponent = ({ isExiting, onClose, posts }) => {
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
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px"
      }}>
        {posts.map((post, index) => (
          <div 
            key={post.ID}
            style={{
              width: "100%",
              maxWidth: "800px",
              backgroundColor: "#FFF9E6",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
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
                  objectFit: "fit"
                }}
                onMouseEnter={(e) => {
                  e.target.play();
                }}
                onMouseLeave={(e) => {
                  e.target.pause();
                  e.target.currentTime = 0;
                }}
                src={post.photoboothVideo}
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
                  {post.description}
                </p>
                <div style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap"
                }}>
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
                  {post.neighbor && (
                    <span style={{
                      backgroundColor: "#007A72",
                      color: "#FFF9E6",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      fontSize: "14px",
                      fontFamily: "var(--font-m-plus-rounded)"
                    }}>
                      {post.neighbor}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {post.demoVideo && (
              <video 
                 
                playsInline
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  aspectRatio: "16/9",
                  objectFit: "fit"
                }}
                onMouseEnter={(e) => {
                  e.target.play();
                }}
                onMouseLeave={(e) => {
                  e.target.pause();
                  e.target.currentTime = 0;
                }}
                src={post.demoVideo}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsViewComponent; 