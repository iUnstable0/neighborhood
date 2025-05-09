import React, { useState, useEffect, useRef } from 'react';
import { getToken } from "@/utils/storage";

const BOARD_BAR_HEIGHT = 60;

const BrownStopwatchComponent = ({ isExiting, onClose, userData }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [commitVideo, setCommitVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [alertModal, setAlertModal] = useState({
    show: false,
    message: "",
    title: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirm: false,
  });

  const timeLimitSound = useRef(null);
  const successSound = useRef(null);

  // Initialize audio elements on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      timeLimitSound.current = new Audio("/among.mp3");
      successSound.current = new Audio("/beep.mp3");
    }
  }, []);

  const playTimeLimitSound = () => {
    if (timeLimitSound.current) {
      timeLimitSound.current.currentTime = 0;
      timeLimitSound.current.play().catch((error) => {
        console.error("Error playing time limit sound:", error);
      });
    }
  };

  const playSuccessSound = () => {
    if (successSound.current) {
      successSound.current.currentTime = 0;
      successSound.current.play().catch((error) => {
        console.error("Error playing success sound:", error);
      });
    }
  };

  // Fetch user's apps
  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) {
          throw new Error("No token found");
        }

        const response = await fetch(`/api/getUserApps?token=${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch apps");
        }
        
        const sortedApps = [...(data.apps || [])].sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setApps(sortedApps);
      } catch (err) {
        console.error("Error fetching apps:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const newElapsedTime = elapsedTime + (now - startTime);
        setElapsedTime(newElapsedTime);
        setStartTime(now);
        setTime(newElapsedTime);

        // Check if elapsed time exceeds 1.5 hours (90 minutes)
        if (newElapsedTime > 5400000) {
          setIsRunning(false);
          playTimeLimitSound();
          showAlert(
            "Your stretch has exceeded the maximum limit of 1.5 hours and has been automatically stopped.",
            "Time Limit Reached",
            () => setShowModal(true)
          );
        }
      }, 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, startTime, elapsedTime]);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const showAlert = (message, title = "Notice", onConfirm = () => {}) => {
    setAlertModal({
      show: true,
      message,
      title,
      onConfirm,
      onCancel: () => {},
      isConfirm: false,
    });
  };

  const showConfirm = (message, title = "Confirm", onConfirm = () => {}, onCancel = () => {}) => {
    setAlertModal({
      show: true,
      message,
      title,
      onConfirm,
      onCancel,
      isConfirm: true,
    });
  };

  const handleFinishStretch = async () => {
    if (!commitMessage.trim()) {
      showAlert("Please enter a commit message before submitting");
      return;
    }

    if (!selectedApp) {
      showAlert("Please select an app before submitting");
      return;
    }

    if (isUploading) {
      return;
    }

    try {
      setIsUploading(true);

      let videoUrl = null;
      if (commitVideo) {
        const formData = new FormData();
        formData.append("token", getToken());
        formData.append("file", commitVideo);

        const uploadResponse = await fetch(
          `https://express.spectralo.hackclub.app/video/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload video");
        }

        const responseData = await uploadResponse.json();
        videoUrl = responseData.url;
      }

      const sessionResponse = await fetch("/api/createSession", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: getToken(),
          startTime: new Date(Date.now() - elapsedTime).toISOString(),
          endTime: new Date().toISOString(),
          videoUrl: videoUrl || "none",
          projectName: selectedApp.name.trim(),
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.message || "Failed to create session");
      }

      const sessionData = await sessionResponse.json();

      const commitResponse = await fetch("/api/createCommit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: getToken(),
          commitMessage: commitMessage,
          videoUrl: videoUrl || "none",
          projectName: selectedApp.name,
          session: sessionData[0].id,
        }),
      });

      if (!commitResponse.ok) {
        throw new Error("Failed to create commit");
      }

      setShowModal(false);
      setCommitMessage("");
      setCommitVideo(null);
      setElapsedTime(0);
      setTime(0);
      setSelectedApp(null);
      playSuccessSound();
      showAlert("Commit successfully submitted!");
      onClose();
    } catch (error) {
      console.error("Error during submission:", error);
      showAlert("Failed to submit the commit");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStart = () => {
    if (!selectedApp) {
      showAlert("Please select an app before starting the timer");
      return;
    }
    setStartTime(Date.now());
    setIsRunning(true);
  };

  const handleStop = () => {
    if (isRunning) {
      setIsRunning(false);
      const currentTime = formatTime(elapsedTime);
      showConfirm(
        `Are you ready to end the time at ${currentTime}?`,
        "Confirm End",
        () => {
          setShowModal(true);
        },
        () => {
          setIsRunning(false);
        }
      );
    }
  };

  const CustomModal = () => {
    if (!alertModal.show) return null;

    const handleConfirm = () => {
      const confirmCallback = alertModal.onConfirm;
      setAlertModal((prev) => ({ ...prev, show: false }));
      if (confirmCallback) confirmCallback();
    };

    const handleCancel = () => {
      const cancelCallback = alertModal.onCancel;
      setAlertModal((prev) => ({ ...prev, show: false }));
      if (cancelCallback) cancelCallback();
    };

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        handleCancel();
      }
    };

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1500,
        }}
        onClick={handleBackdropClick}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            width: "400px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            style={{
              margin: "0 0 8px 0",
              color: "#8b6b4a",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "20px" }}>
              {alertModal.isConfirm ? "❓" : "ℹ️"}
            </span>
            {alertModal.title || "Notice"}
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              color: "#666",
              fontSize: "14px",
            }}
          >
            {alertModal.message}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            {alertModal.isConfirm && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#ffead1",
                  color: "#8b6b4a",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConfirm}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#8b6b4a",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {alertModal.isConfirm ? "Confirm" : "OK"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`pop-in ${isExiting ? "hidden" : ""}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        zIndex: 2,
        width: "calc(100% - 16px)",
        height: "calc(100% - 16px)",
        borderRadius: 25,
        marginLeft: 8,
        marginTop: 8,
        backgroundColor: "#ffead1",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(123, 91, 63, 0.1)",
      }}
    >
      {/* Top bar */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 16px",
        borderBottom: "2px solid #8b6b4a",
        backgroundColor: "#e8c9a5",
        height: BOARD_BAR_HEIGHT,
        minHeight: BOARD_BAR_HEIGHT,
        maxHeight: BOARD_BAR_HEIGHT,
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
          Stopwatch
        </div>
        <div style={{ width: 16, height: 16 }} />
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px"
      }}>
        {/* Time display */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(139, 107, 74, 0.1)",
          border: "2px solid #8b6b4a"
        }}>
          <div style={{
            fontFamily: "monospace",
            fontSize: "48px",
            color: "#644c36",
            fontWeight: "bold",
            marginBottom: "24px"
          }}>
            {formatTime(time)}
          </div>
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center"
          }}>
            <button
              onClick={isRunning ? handleStop : handleStart}
              style={{
                backgroundColor: isRunning ? "#ff6b6b" : "#8b6b4a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
                minWidth: "100px"
              }}
            >
              {isRunning ? "Stop" : "Start"}
            </button>
            <button
              onClick={() => {
                setTime(0);
                setElapsedTime(0);
                setIsRunning(false);
              }}
              style={{
                backgroundColor: "#fff",
                color: "#8b6b4a",
                border: "2px solid #8b6b4a",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
                minWidth: "100px"
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* App selection */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 4px 12px rgba(139, 107, 74, 0.1)",
          border: "2px solid #8b6b4a"
        }}>
          <div style={{
            marginBottom: "16px",
            color: "#644c36",
            fontSize: "16px",
            fontWeight: "500"
          }}>
            Select an App
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: "12px"
          }}>
            {apps.map(app => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "12px",
                  backgroundColor: selectedApp?.id === app.id ? "#8b6b4a" : "#fff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: "1px solid #8b6b4a",
                  transition: "all 0.2s"
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  marginBottom: "8px"
                }}>
                  {app.icon ? (
                    <img
                      src={app.icon}
                      alt={app.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: selectedApp?.id === app.id ? "#fff" : "#8b6b4a",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: selectedApp?.id === app.id ? "#8b6b4a" : "#fff",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}>
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: "12px",
                  color: selectedApp?.id === app.id ? "#fff" : "#644c36",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%"
                }}>
                  {app.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commit Message Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                color: "#8b6b4a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "20px" }}>✅</span>
              Finish Stretch
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                color: "#666",
                fontSize: "14px",
              }}
            >
              You completed {formatTime(elapsedTime)} of work on {selectedApp?.name}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#333",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                What did you accomplish?
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="I implemented the login functionality..."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#333",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                Upload a video here:
              </label>
              <input
                type="file"
                onChange={(e) => setCommitVideo(e.target.files[0])}
                accept="video/*"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setTime(0);
                  setElapsedTime(0);
                }}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#ffead1",
                  color: "#8b6b4a",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                CANCEL FOREVER
              </button>
              <button
                onClick={handleFinishStretch}
                disabled={isUploading}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: isUploading ? "#d4b595" : "#8b6b4a",
                  color: "white",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isUploading ? (
                  <>
                    <span
                      className="loading-spinner"
                      style={{
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        border: "2px solid #ffffff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        marginRight: "8px",
                      }}
                    ></span>
                    Uploading...
                  </>
                ) : (
                  "Save Stretch"
                )}
              </button>
            </div>
            {isUploading && (
              <>
                <p style={{ marginTop: 10, color: "#8b6b4a" }}>
                  This might freeze, please wait...
                </p>
                <p style={{ color: "#8b6b4a" }}>Take this time to check the slack :D</p>
              </>
            )}
          </div>
        </div>
      )}

      <CustomModal />

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        .pop-in {
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .pop-in.hidden {
          animation: popOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          opacity: 0;
          transform: scale(0.95);
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes popOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default BrownStopwatchComponent; 