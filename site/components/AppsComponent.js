import React, { useState, useEffect } from 'react';
import { M_PLUS_Rounded_1c } from "next/font/google";
import { getToken } from "@/utils/storage";

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});

const BOARD_BAR_HEIGHT = 145;

const AppsComponent = ({ isExiting, onClose, userData }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hackatimeProjects, setHackatimeProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        let token = localStorage.getItem('neighborhoodToken');
        if (!token) {
          token = getToken();
        }
        
        if (!token) {
          throw new Error("No token found");
        }

        const response = await fetch(`/api/getUserApps?token=${token}`);
        if (!response.ok) {
          throw new Error("Failed to fetch apps");
        }
        
        const data = await response.json();
        
        // Sort apps by createdAt date (most recent first)
        const sortedApps = [...(data.apps || [])].sort((a, b) => {
          // If createdAt is missing, put at the end
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          // Otherwise sort by date, newest first
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setApps(sortedApps);
        
        // If user has no apps, try to fetch their hackatime projects
        if (sortedApps.length === 0 && userData?.slackId) {
          fetchHackatimeProjects(userData.slackId);
        }
      } catch (err) {
        console.error("Error fetching apps:", err);
        setError(err.message || "Failed to fetch apps");
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [userData]);
  
  const fetchHackatimeProjects = async (slackId) => {
    try {
      setLoadingProjects(true);
      const response = await fetch(`/api/getHackatimeProjects?slackId=${slackId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch hackatime projects");
      }
      
      const data = await response.json();
      
      // Parse the comma-separated string of project names
      if (data.projects) {
        const projectList = data.projects.split(',').map(p => p.trim()).filter(p => p);
        setHackatimeProjects(projectList);
      }
    } catch (err) {
      console.error("Error fetching hackatime projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };
  
  const getSuggestedAppIcon = (projectName) => {
    // Generate a consistent color based on the project name
    const hash = projectName.split('').reduce((hash, char) => {
      return char.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);
    
    const hue = Math.abs(hash % 360);
    const color = `hsl(${hue}, 70%, 60%)`;
    
    return color;
  };

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
        backgroundColor: "#e6f7ff",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(63, 99, 123, 0.1)",
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
        padding: "12px 20px",
        borderBottom: "2px solid #a7c7e7",
        backgroundImage: "linear-gradient(to right, #90c6f7, #6da9ef)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 2,
        height: BOARD_BAR_HEIGHT,
        minHeight: BOARD_BAR_HEIGHT,
        maxHeight: BOARD_BAR_HEIGHT
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
          color: "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,0.1)"
        }}>
          My Apps
        </div>
        <div style={{width: 16, height: 16}} />
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        backgroundColor: "#f0f8ff",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {loading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            width: "100%"
          }}>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "18px",
              color: "#5a8ebe"
            }}>Loading your apps...</p>
          </div>
        ) : error ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            width: "100%"
          }}>
            <p style={{
              fontFamily: "var(--font-m-plus-rounded)",
              fontSize: "18px",
              color: "#e74c3c"
            }}>{error}</p>
          </div>
        ) : apps.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: "24px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              padding: "24px",
              marginBottom: "16px"
            }}>
              <p style={{
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "18px",
                color: "#5a8ebe",
                textAlign: "center",
                margin: 0
              }}>You don't have any apps yet.<br />Build something amazing!</p>
            </div>
            
            {loadingProjects ? (
              <div style={{
                display: "flex",
                justifyContent: "center",
                padding: "20px"
              }}>
                <p style={{
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontSize: "16px",
                  color: "#5a8ebe"
                }}>Looking for your Hackatime projects...</p>
              </div>
            ) : hackatimeProjects.length > 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                width: "100%"
              }}>
                <h3 style={{
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontSize: "18px",
                  color: "#4a7faa",
                  marginBottom: "16px",
                  marginTop: 0
                }}>Suggested Apps from your Hackatime Projects:</h3>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gridGap: "24px",
                  width: "100%"
                }}>
                  {hackatimeProjects.map((project, index) => (
                    <div 
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        opacity: 0.8,
                        transition: "all 0.2s ease"
                      }}
                      onClick={() => {
                        alert(`You could create an app from your "${project}" project!`);
                      }}
                    >
                      <div style={{
                        width: "72px",
                        height: "72px",
                        backgroundColor: getSuggestedAppIcon(project),
                        borderRadius: "12px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: "16px",
                        color: "#fff",
                        fontSize: "24px",
                        fontWeight: "bold"
                      }}>
                        {project.charAt(0).toUpperCase()}
                      </div>
                      <p style={{
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontSize: "14px",
                        fontWeight: "500",
                        margin: 0,
                        textAlign: "center",
                        color: "#333",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {project}
                      </p>
                      <span style={{
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontSize: "12px",
                        color: "#6da9ef",
                        marginTop: "4px"
                      }}>
                        Add to Apps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : userData?.slackId ? (
              <p style={{
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "16px",
                color: "#5a8ebe",
                textAlign: "center"
              }}>
                We couldn't find any Hackatime projects to suggest. Start tracking your coding time to get suggestions!
              </p>
            ) : (
              <p style={{
                fontFamily: "var(--font-m-plus-rounded)",
                fontSize: "16px",
                color: "#5a8ebe",
                textAlign: "center"
              }}>
                Connect your Slack account to see suggested apps based on your Hackatime projects!
              </p>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gridGap: "24px",
            width: "100%"
          }}>
            {apps.map(app => (
              <div key={app.id} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                ":hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }
              }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "12px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "16px",
                  overflow: "hidden"
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
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#90c6f7",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#fff",
                      fontSize: "20px",
                      fontWeight: "bold"
                    }}>
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p style={{
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontSize: "14px",
                  fontWeight: "500",
                  margin: 0,
                  textAlign: "center",
                  color: "#333",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {app.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppsComponent; 