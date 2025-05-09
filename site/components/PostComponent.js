import React, { useEffect, useRef, useCallback, useState } from 'react';
import { M_PLUS_Rounded_1c } from "next/font/google";

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});

const BOARD_BAR_HEIGHT = 145;

const PostComponent = ({ isExiting, onClose }) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [demoVideoUrl, setDemoVideoUrl] = useState(null);
  const demoVideoRef = useRef(null);
  const [photoboothVideoUrl, setPhotoboothVideoUrl] = useState(null);
  const photoboothInputRef = useRef(null);
  const photoboothVideoRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        // Handle error (e.g., user denied access)
        console.error('Camera access denied:', err);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle file selection or drop for demo video
  const onFileChange = useCallback((event) => {
    let file;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      file = event.dataTransfer.files[0];
    } else if (event.target && event.target.files.length > 0) {
      file = event.target.files[0];
    }
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setDemoVideoUrl(url);
    }
  }, []);

  // Handle file selection or drop for photobooth video
  const onPhotoboothFileChange = useCallback((event) => {
    let file;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      file = event.dataTransfer.files[0];
    } else if (event.target && event.target.files.length > 0) {
      file = event.target.files[0];
    }
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPhotoboothVideoUrl(url);
    }
  }, []);

  // Drag and drop events for photobooth
  const onPhotoboothDrop = useCallback((e) => {
    e.preventDefault();
    onPhotoboothFileChange(e);
  }, [onPhotoboothFileChange]);
  const onPhotoboothDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Click to open file picker for photobooth
  const onPhotoboothClick = useCallback(() => {
    if (photoboothInputRef.current) photoboothInputRef.current.click();
  }, []);

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
        backgroundColor: "#FFF9E6",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(123, 91, 63, 0.1)",
        display: "flex",
        flexDirection: "column"
      }}
    >
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
          margin: "16px",
          ':hover': {
            transform: 'scale(1.1)'
          }
        }} 
      />
      <div style={{width: "100%", height: "100%", flexDirection: "column", display: "flex", justifyContent: "center", alignItems: "center"}}>
      <div
      style={{maxWidth: 700, height: "100%", width: "100%"}}>
          <div style={{ width: "100%", height: "100%", display: "flex", flex: 1, justifyContent: "center", alignItems: "center", gap: 32 }}>
            {/* Left: Photobooth Video */}
            <div style={{ flex: 1, maxWidth: 600, aspectRatio: '16/9', border: "2px dashed #786A50", borderRadius: 20, background: "#fff7e6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", cursor: 'pointer', position: 'relative' }}
              onClick={onPhotoboothClick}
              onDrop={onPhotoboothDrop}
              onDragOver={onPhotoboothDragOver}
            >
              {photoboothVideoUrl ? (
                <video
                  ref={photoboothVideoRef}
                  src={photoboothVideoUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 20, background: '#000', cursor: 'pointer' }}
                  onMouseEnter={() => { photoboothVideoRef.current && photoboothVideoRef.current.play(); }}
                  onMouseLeave={() => { photoboothVideoRef.current && photoboothVideoRef.current.pause(); photoboothVideoRef.current.currentTime = 0; }}
                  tabIndex={0}
                  playsInline
                  muted
                />
              ) : (
                <span style={{ color: "#786A50", fontSize: 18, fontWeight: 500, marginBottom: 0}}>Photobooth Video</span>
              )}
              <input
                ref={photoboothInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={onPhotoboothFileChange}
              />
            </div>
            {/* Right: Dropzone */}
            <div style={{ flex: 1, maxWidth: 600, aspectRatio: '16/9', border: "2px dashed #786A50", borderRadius: 20, background: "#fff7e6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", cursor: 'pointer', position: 'relative' }}
              onClick={onPhotoboothClick}
              onDrop={onPhotoboothDrop}
              onDragOver={onPhotoboothDragOver}
            >
              {demoVideoUrl ? (
                <video
                  ref={demoVideoRef}
                  src={demoVideoUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 20, background: '#000', cursor: 'pointer' }}
                  onMouseEnter={() => { demoVideoRef.current && demoVideoRef.current.play(); }}
                  onMouseLeave={() => { demoVideoRef.current && demoVideoRef.current.pause(); demoVideoRef.current.currentTime = 0; }}
                  tabIndex={0}
                  playsInline
                  muted
                />
              ) : (
                <>
                  <span style={{ color: "#786A50", fontSize: 18, fontWeight: 500, marginBottom: 0}}>Demo Video</span>
                  <span style={{ color: "#786A50", fontSize: 14, opacity: 0.7 }}>select video</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
            </div>
          </div>
      </div>
      <div>
        
      </div>
      </div>
    </div>
  );
};

export default PostComponent; 