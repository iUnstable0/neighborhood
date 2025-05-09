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
  const [visibleApps, setVisibleApps] = useState(5); // Number of apps to show initially
  const [showCreateForm, setShowCreateForm] = useState(false); // Whether to show the create app form
  const [showJoinForm, setShowJoinForm] = useState(false); // Whether to show the join app form
  const [availableApps, setAvailableApps] = useState([]); // Apps available to join
  const [joiningApp, setJoiningApp] = useState(false); // Loading state for joining an app
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering available apps
  const [isEditing, setIsEditing] = useState(false); // Whether form is in edit mode
  const [currentAppId, setCurrentAppId] = useState(null); // ID of the app being edited
  const [hackatimeProjects, setHackatimeProjects] = useState([]); // Add state for Hackatime projects
  const [loadingHackatime, setLoadingHackatime] = useState(false); // Add loading state for Hackatime
  const [hackatimeSearch, setHackatimeSearch] = useState(''); // Add search state
  const [showAllProjects, setShowAllProjects] = useState(false); // Add state for showing all projects
  const [projectLoadingStates, setProjectLoadingStates] = useState({}); // Add loading state for individual projects
  const [projectErrors, setProjectErrors] = useState({}); // Add error state for individual projects
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    icon: null,
    appLink: '',
    githubLink: '',
    description: '',
    images: [],
    hackatimeProjects: [] // Add hackatime projects array
  });

  // Add a state for form submission loading
  const [submitting, setSubmitting] = useState(false);

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle icon upload
  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setSubmitting(true); // Show loading state
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('token', localStorage.getItem('neighborhoodToken') || getToken());
        
        // Upload to S3 via neighborhood-express
        const response = await fetch('https://vgso8kg840ss8cok4s4cwwgk.a.selfhosted.hackclub.com/upload-icon', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload icon');
        }
        
        const data = await response.json();
        
        // Update form with the S3 URL
        setFormData(prev => ({
          ...prev,
          icon: data.url
        }));
      } catch (error) {
        console.error('Error uploading icon:', error);
        alert('Failed to upload icon: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Function to handle image uploads
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        setSubmitting(true); // Show loading state
        
        // Create form data with multiple files
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file); // Use 'files' to match the backend expectation
        });
        formData.append('token', localStorage.getItem('neighborhoodToken') || getToken());
        
        // Upload to S3 via neighborhood-express
        const response = await fetch('https://vgso8kg840ss8cok4s4cwwgk.a.selfhosted.hackclub.com/upload-images', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload images');
        }
        
        const data = await response.json();
        
        // Update form with the comma-separated S3 URLs
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...data.urls]
        }));
      } catch (error) {
        console.error('Error uploading images:', error);
        alert('Failed to upload images: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Function to remove an uploaded image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Function to reset form state
  const resetForm = () => {
    setFormData({
      name: '',
      icon: null,
      appLink: '',
      githubLink: '',
      description: '',
      images: [],
      hackatimeProjects: [] // Reset hackatime projects array
    });
    setIsEditing(false);
    setCurrentAppId(null);
  };

  // Function to load an app into the form for editing
  const editApp = (app) => {
    console.log("Editing app:", app.name);
    console.log("App's hackatime projects:", app.hackatimeProjects);
    console.log("Available hackatime projects:", hackatimeProjects.map(p => p.name));

    // Set form data from app details
    const selectedProjects = app.hackatimeProjects || [];
    console.log("Selected projects:", selectedProjects);

    setFormData({
      name: app.name || '',
      icon: app.icon || null,
      appLink: app.appLink || '',
      githubLink: app.githubLink || '',
      description: app.description || '',
      images: app.images || [],
      hackatimeProjects: selectedProjects
    });
    
    setIsEditing(true);
    setCurrentAppId(app.id);
    setShowCreateForm(true);
  };

  // Function to submit the form (create or update)
  const submitForm = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert("App name is required");
      return;
    }
    
    setSubmitting(true);
    
    try {
      let token = localStorage.getItem('neighborhoodToken');
      if (!token) {
        token = getToken();
      }
      
      if (!token) {
        throw new Error("No token found");
      }
      
      if (isEditing && currentAppId) {
        const response = await fetch('/api/updateApp', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            appId: currentAppId,
            name: formData.name,
            icon: formData.icon,
            appLink: formData.appLink,
            githubLink: formData.githubLink,
            description: formData.description,
            images: formData.images,
            hackatimeProjects: formData.hackatimeProjects
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Check if the error is related to hackatime project attribution
          if (data.type === "project_already_attributed") {
            alert(`Cannot update app: The project "${data.projectName}" is already attributed to another app.`);
            // Remove the project from selection
            setFormData(prev => ({
              ...prev,
              hackatimeProjects: prev.hackatimeProjects.filter(name => name !== data.projectName)
            }));
            return;
          }
          throw new Error(data.message || "Failed to update app");
        }
        
        // Update the app in the apps state
        setApps(prevApps => 
          prevApps.map(app => 
            app.id === currentAppId ? data.app : app
          )
        );
        
        // Show success message
        alert("App updated successfully!");
      } else {
        // Create new app
        const response = await fetch('/api/createApp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            name: formData.name,
            icon: formData.icon,
            appLink: formData.appLink,
            githubLink: formData.githubLink,
            description: formData.description,
            images: formData.images,
            hackatimeProjects: formData.hackatimeProjects
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Check if the error is related to hackatime project attribution
          if (data.type === "project_already_attributed") {
            alert(`Cannot create app: The project "${data.projectName}" is already attributed to another app.`);
            // Remove the project from selection
            setFormData(prev => ({
              ...prev,
              hackatimeProjects: prev.hackatimeProjects.filter(name => name !== data.projectName)
            }));
            return;
          }
          throw new Error(data.message || "Failed to create app");
        }
        
        // Add the new app to the apps state
        setApps(prevApps => [data.app, ...prevApps]);
        
        // Show success message
        alert("App created successfully!");
      }
      
      // Reset form
      resetForm();
      
      // Return to apps list view
      setShowCreateForm(false);
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} app:`, err);
      alert(err.message || `Failed to ${isEditing ? 'update' : 'create'} app`);
    } finally {
      setSubmitting(false);
    }
  };

  // Function to fetch full app details for editing
  const fetchAppDetails = async (appId) => {
    try {
      setLoading(true);
      let token = localStorage.getItem('neighborhoodToken');
      if (!token) {
        token = getToken();
      }
      
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`/api/getAppDetails?token=${token}&appId=${appId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch app details");
      }
      
      const data = await response.json();
      return data.app;
    } catch (err) {
      console.error("Error fetching app details:", err);
      alert(err.message || "Failed to fetch app details");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to handle clicking on an app
  const handleAppClick = async (app) => {
    try {
      // First fetch full app details since the list view might not have all the data
      const appDetails = await fetchAppDetails(app.id);
      if (appDetails) {
        editApp(appDetails);
      }
    } catch (err) {
      console.error("Error preparing app for edit:", err);
      alert("Could not load app details for editing");
    }
  };

  // Function to show more apps
  const loadMoreApps = () => {
    setVisibleApps(prev => prev + 5);
  };

  // Function to fetch available apps for joining
  const fetchAvailableApps = async () => {
    try {
      setLoading(true);
      let token = localStorage.getItem('neighborhoodToken');
      if (!token) {
        token = getToken();
      }
      
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`/api/getAvailableApps?token=${token}`);
      if (!response.ok) {
        throw new Error("Failed to fetch available apps");
      }
      
      const data = await response.json();
      setAvailableApps(data.apps || []);
    } catch (err) {
      console.error("Error fetching available apps:", err);
      setError(err.message || "Failed to fetch available apps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let token = localStorage.getItem('neighborhoodToken');
        if (!token) {
          token = getToken();
        }
        
        if (!token) {
          throw new Error("No token found");
        }

        console.log("Fetching apps using token:", token.substring(0, 5) + "..." + token.substring(token.length - 5));
        
        const response = await fetch(`/api/getUserApps?token=${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch apps");
        }
        
        console.log(`Fetched ${data.apps ? data.apps.length : 0} apps`);
        
        // Sort apps by createdAt date (most recent first)
        const sortedApps = [...(data.apps || [])].sort((a, b) => {
          // If createdAt is missing, put at the end
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          // Otherwise sort by date, newest first
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        if (sortedApps.length === 0) {
          console.log("No apps found for user");
        } else {
          console.log("Apps found:", sortedApps.map(app => app.name).join(", "));
        }
        
        setApps(sortedApps);
      } catch (err) {
        console.error("Error fetching apps:", err);
        setError(err.message || "Failed to fetch apps");
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [userData]);

  useEffect(() => {
    const fetchHackatimeProjects = async () => {
      try {
        setLoadingHackatime(true);
        
        if (!userData?.slackId) {
          console.log('No Slack ID available');
          return;
        }

        const response = await fetch(`/api/getHackatimeProjects?slackId=${userData.slackId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch Hackatime projects");
        }
        
        const data = await response.json();
        setHackatimeProjects(data.projects || []);
      } catch (err) {
        console.error("Error fetching Hackatime projects:", err);
      } finally {
        setLoadingHackatime(false);
      }
    };

    if (userData?.slackId) {
      fetchHackatimeProjects();
    }
  }, [userData?.slackId]);

  // Function to handle creating a new app
  const handleCreateApp = () => {
    resetForm(); // Ensure the form is clean for new app
    setShowCreateForm(true);
  };

  // Function to handle joining an existing app
  const handleJoinApp = () => {
    setShowJoinForm(true);
    fetchAvailableApps();
  };
  
  // Function to join a specific app
  const joinApp = async (appId) => {
    try {
      setJoiningApp(true);
      let token = localStorage.getItem('neighborhoodToken');
      if (!token) {
        token = getToken();
      }
      
      if (!token) {
        throw new Error("No token found");
      }
      
      const response = await fetch('/api/joinApp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          appId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join app");
      }
      
      const data = await response.json();
      
      // Add the joined app to the user's apps
      // The app data from the response now includes all necessary fields
      setApps(prevApps => [data.app, ...prevApps]);
      
      // Return to apps list view
      setShowJoinForm(false);
      
      // Show success message
      alert("Successfully joined app!");
    } catch (err) {
      console.error("Error joining app:", err);
      alert(err.message || "Failed to join app");
    } finally {
      setJoiningApp(false);
    }
  };

  const getSuggestedAppIcon = (projectName) => {
    // Generate a consistent variation based on the project name
    const hash = projectName.split('').reduce((hash, char) => {
      return char.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);
    
    // Use varying shades of brown
    const lightness = 25 + (Math.abs(hash) % 20); // Between 25-45% lightness for darker browns
    const saturation = 40 + (Math.abs(hash) % 30); // Between 40-70% saturation
    const color = `hsl(30, ${saturation}%, ${lightness}%)`;
    
    return color;
  };
  
  // Function to filter available apps based on search query
  const getFilteredApps = () => {
    if (!searchQuery.trim()) return availableApps;
    
    return availableApps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Function to handle Hackatime project selection
  const handleHackatimeProjectSelect = async (project) => {
    // If project is attributed to another app (not the current one), don't allow selection
    if (project.isAttributed && project.attributedToAppId !== currentAppId) {
      alert(`The project "${project.name}" is already attributed to another app.`);
      return;
    }

    console.log('Selected project:', project);
    console.log('Current hackatimeProjects:', formData.hackatimeProjects);

    // If we're deselecting the project
    if (formData.hackatimeProjects.includes(project.name)) {
      console.log('Deselecting project:', project.name);
      // Remove project from form data
      setFormData(prev => ({
        ...prev,
        hackatimeProjects: prev.hackatimeProjects.filter(name => name !== project.name)
      }));
    } else {
      console.log('Selecting project:', project.name);
      // Add project to form data
      setFormData(prev => ({
        ...prev,
        hackatimeProjects: [...prev.hackatimeProjects, project.name]
      }));
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
            onClick={showCreateForm ? () => {
              setShowCreateForm(false);
              resetForm();
            } : showJoinForm ? () => setShowJoinForm(false) : onClose}
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
            {showCreateForm ? (isEditing ? "Edit App" : "Create New App") : showJoinForm ? "Join App" : "My Apps"}
          </div>
          {!showCreateForm && !showJoinForm && (
            <div style={{
              display: "flex",
              gap: "10px",
              marginLeft: "auto"
            }}>
              <button
                onClick={handleCreateApp}
                style={{
                  backgroundColor: "#8b6b4a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Create App
              </button>
              <button
                onClick={handleJoinApp}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#8b6b4a",
                  border: "2px solid #8b6b4a",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#8b6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Join App
              </button>
            </div>
          )}
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#ffead1",
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
                color: "#6c4a24"
              }}>Loading...</p>
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
          ) : showCreateForm ? (
            <div style={{
              width: "100%",
              maxWidth: "1200px",
              marginTop: "10px"
            }}>
              <form onSubmit={submitForm}>
                {/* Form container with 3-part layout */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  width: "100%"
                }}>
                  {/* Top section: Split into left and right */}
                  <div style={{
                    display: "flex",
                    gap: "24px",
                    width: "100%",
                    minHeight: "300px"
                  }}>
                    {/* Top Left: Image Upload Area */}
                    <div style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      padding: "20px",
                      border: "2px solid #8b6b4a",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px"
                    }}>
                      <h3 style={{
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontSize: "18px",
                        color: "#6c4a24",
                        margin: 0
                      }}>
                        App Images
                      </h3>
                      <p style={{
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontSize: "14px",
                        color: "#8b6b4a",
                        margin: 0
                      }}>
                        Drop screenshots or images of your app here
                      </p>
                      
                      <div style={{
                        flex: 1,
                        border: "2px dashed #8b6b4a",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                        <input 
                          type="file" 
                          id="images" 
                          name="images"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{
                            opacity: 0,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            cursor: "pointer"
                          }}
                        />
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z" stroke="#8b6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p style={{
                          fontFamily: "var(--font-m-plus-rounded)",
                          fontSize: "14px",
                          color: "#8b6b4a",
                          marginTop: "10px"
                        }}>
                          Click or drag images here
                        </p>
                      </div>
                      
                      {formData.images.length > 0 && (
                        <div style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px"
                        }}>
                          {formData.images.map((img, index) => (
                            <div 
                              key={index}
                              style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                position: "relative"
                              }}
                            >
                              <img 
                                src={img} 
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover"
                                }}
                                alt={`App image ${index + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                style={{
                                  position: "absolute",
                                  top: "2px",
                                  right: "2px",
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  backgroundColor: "rgba(255, 0, 0, 0.7)",
                                  border: "none",
                                  color: "white",
                                  fontSize: "12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer"
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Top Right: App Details Form */}
                    <div style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      padding: "20px",
                      border: "2px solid #8b6b4a",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px"
                    }}>
                      <h3 style={{
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontSize: "18px",
                        color: "#6c4a24",
                        margin: 0
                      }}>
                        App Details
                      </h3>
                      
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px"
                      }}>
                        {/* Icon upload */}
                        <div>
                          <label 
                            style={{
                              display: "block",
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "14px",
                              color: "#6c4a24",
                              marginBottom: "5px"
                            }}
                          >
                            App Icon
                          </label>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                          }}>
                            <div style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "8px",
                              border: "2px dashed #8b6b4a",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              backgroundColor: formData.icon ? "transparent" : "#f8f2e9"
                            }}>
                              {formData.icon ? (
                                <img 
                                  src={formData.icon} 
                                  alt="App Icon" 
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"
                                  }}
                                />
                              ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 5V19M5 12H19" stroke="#8b6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              <input 
                                type="file" 
                                id="icon" 
                                name="icon"
                                accept="image/*"
                                onChange={handleIconUpload}
                                style={{
                                  opacity: 0,
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  cursor: "pointer"
                                }}
                              />
                            </div>
                            <span style={{
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "13px",
                              color: "#8b6b4a"
                            }}>
                              Click to upload icon
                            </span>
                          </div>
                        </div>
                        
                        {/* App Name */}
                        <div>
                          <label 
                            htmlFor="name"
                            style={{
                              display: "block",
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "14px",
                              color: "#6c4a24",
                              marginBottom: "5px"
                            }}
                          >
                            App Name *
                          </label>
                          <input 
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "6px",
                              border: "1px solid #8b6b4a",
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "14px",
                              color: "#6c4a24",
                              backgroundColor: "#fff"
                            }}
                            placeholder="Enter your app name"
                          />
                        </div>
                        
                        {/* App Link */}
                        <div>
                          <label 
                            htmlFor="appLink"
                            style={{
                              display: "block",
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "14px",
                              color: "#6c4a24",
                              marginBottom: "5px"
                            }}
                          >
                            Link to App
                          </label>
                          <input 
                            type="url"
                            id="appLink"
                            name="appLink"
                            value={formData.appLink}
                            onChange={handleInputChange}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "6px",
                              border: "1px solid #8b6b4a",
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "14px",
                              color: "#6c4a24",
                              backgroundColor: "#fff"
                            }}
                            placeholder="https://yourapp.com"
                          />
                        </div>
                        
                        {/* GitHub Link */}
                        <div>
                          <label 
                            htmlFor="githubLink"
                            style={{
                              display: "block",
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "14px",
                              color: "#6c4a24",
                              marginBottom: "5px"
                            }}
                          >
                            Link to GitHub Repo
                          </label>
                          <input 
                            type="url"
                            id="githubLink"
                            name="githubLink"
                            value={formData.githubLink}
                            onChange={handleInputChange}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "6px",
                              border: "1px solid #8b6b4a",
                              fontFamily: "var(--font-m-plus-rounded)",
                              fontSize: "14px",
                              color: "#6c4a24",
                              backgroundColor: "#fff"
                            }}
                            placeholder="https://github.com/username/repo"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Hackatime section before the description */}
                  <div style={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "2px solid #8b6b4a",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <h3 style={{
                      fontFamily: "var(--font-m-plus-rounded)",
                      fontSize: "18px",
                      color: "#6c4a24",
                      margin: 0,
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#6c4a24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Hackatime Projects
                    </h3>
                    
                    <p style={{
                      fontFamily: "var(--font-m-plus-rounded)",
                      fontSize: "14px",
                      color: "#8b6b4a",
                      marginBottom: "16px"
                    }}>
                      Select the Hackatime projects that contributed to this app
                    </p>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}>
                      {loadingHackatime ? (
                        <div style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "#8b6b4a",
                          fontFamily: "var(--font-m-plus-rounded)"
                        }}>
                          Loading Hackatime projects...
                        </div>
                      ) : !userData?.slackId ? (
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          alignItems: "center",
                          padding: "20px",
                          backgroundColor: "#f8f2e9",
                          borderRadius: "8px",
                          textAlign: "center"
                        }}>
                          <p style={{
                            fontFamily: "var(--font-m-plus-rounded)",
                            fontSize: "14px",
                            color: "#8b6b4a",
                            margin: 0
                          }}>
                            Please connect your Slack account first to see your Hackatime projects
                          </p>
                        </div>
                      ) : hackatimeProjects.length > 0 ? (
                        <>
                          <div style={{
                            position: "relative",
                            marginBottom: "8px"
                          }}>
                            <input
                              type="text"
                              value={hackatimeSearch}
                              onChange={(e) => setHackatimeSearch(e.target.value)}
                              placeholder="Search projects..."
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                paddingLeft: "32px", // Space for the search icon
                                borderRadius: "6px",
                                border: "1px solid #8b6b4a",
                                fontFamily: "var(--font-m-plus-rounded)",
                                fontSize: "14px",
                                color: "#6c4a24",
                                backgroundColor: "#fff"
                              }}
                            />
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              xmlns="http://www.w3.org/2000/svg"
                              style={{
                                position: "absolute",
                                left: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#8b6b4a"
                              }}
                            >
                              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          
                          {hackatimeProjects
                            .filter(project => 
                              project.name.toLowerCase().includes(hackatimeSearch.toLowerCase())
                            )
                            .slice(0, showAllProjects ? undefined : 5)
                            .map(project => {
                              const isSelected = formData.hackatimeProjects.includes(project.name);
                              console.log(`Project ${project.name} selected:`, isSelected, 
                                "Current selections:", formData.hackatimeProjects);
                              return (
                                <div
                                  key={project.name}
                                  onClick={() => handleHackatimeProjectSelect(project)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "12px",
                                    backgroundColor: formData.hackatimeProjects.includes(project.name)
                                      ? "#f8f2e9"
                                      : project.isAttributed && project.attributedToAppId !== currentAppId
                                      ? "#f5f5f5"
                                      : "white",
                                    borderRadius: "8px",
                                    marginBottom: "8px",
                                    cursor: project.isAttributed && project.attributedToAppId !== currentAppId
                                      ? "not-allowed"
                                      : "pointer",
                                    opacity: project.isAttributed && project.attributedToAppId !== currentAppId
                                      ? 0.7
                                      : 1,
                                    border: formData.hackatimeProjects.includes(project.name)
                                      ? "1px solid #8b6b4a"
                                      : "1px solid #e0e0e0",
                                    transition: "all 0.2s",
                                    gap: "12px"
                                  }}
                                >
                                  <div style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: "2px solid #8b6b4a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: isSelected ? "#8b6b4a" : "#fff",
                                    opacity: project.isAttributed && project.attributedToAppId !== currentAppId ? 0.5 : 1,
                                    flexShrink: 0
                                  }}>
                                    {isSelected && (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </div>
                                  <div style={{
                                    flex: 1,
                                    overflow: "hidden"
                                  }}>
                                    <p style={{
                                      fontFamily: "var(--font-m-plus-rounded)",
                                      fontSize: "14px",
                                      color: project.isAttributed && project.attributedToAppId !== currentAppId ? "#8b6b4a" : "#6c4a24",
                                      margin: 0,
                                      fontWeight: "500",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px"
                                    }}>
                                      <span style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                      }}>
                                        {project.name}
                                      </span>
                                      <span style={{
                                        fontSize: "14px",
                                        color: "#8b6b4a",
                                        fontWeight: "normal"
                                      }}>
                                        ({Math.floor(project.total_seconds / 3600)} hours {Math.round((project.total_seconds % 3600) / 60)} minutes)
                                      </span>
                                      {project.isAttributed && project.attributedToAppId !== currentAppId && (
                                        <span style={{
                                          fontSize: "12px",
                                          color: "#8b6b4a",
                                          fontStyle: "italic"
                                        }}>
                                          (Already attributed)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            
                          {hackatimeProjects.filter(project => 
                            project.name.toLowerCase().includes(hackatimeSearch.toLowerCase())
                          ).length > 5 && !showAllProjects && (
                            <button
                              onClick={() => setShowAllProjects(true)}
                              style={{
                                backgroundColor: "transparent",
                                color: "#8b6b4a",
                                border: "1px solid #8b6b4a",
                                borderRadius: "6px",
                                padding: "8px 16px",
                                fontSize: "14px",
                                fontFamily: "var(--font-m-plus-rounded)",
                                cursor: "pointer",
                                marginTop: "8px",
                                transition: "all 0.2s",
                                alignSelf: "center"
                              }}
                            >
                              Show All Projects ({hackatimeProjects.filter(project => 
                                project.name.toLowerCase().includes(hackatimeSearch.toLowerCase())
                              ).length - 5} more)
                            </button>
                          )}
                          
                          {showAllProjects && hackatimeProjects.length > 5 && (
                            <button
                              onClick={() => setShowAllProjects(false)}
                              style={{
                                backgroundColor: "transparent",
                                color: "#8b6b4a",
                                border: "1px solid #8b6b4a",
                                borderRadius: "6px",
                                padding: "8px 16px",
                                fontSize: "14px",
                                fontFamily: "var(--font-m-plus-rounded)",
                                cursor: "pointer",
                                marginTop: "8px",
                                transition: "all 0.2s",
                                alignSelf: "center"
                              }}
                            >
                              Show Less
                            </button>
                          )}
                        </>
                      ) : (
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          alignItems: "center",
                          padding: "20px",
                          backgroundColor: "#f8f2e9",
                          borderRadius: "8px",
                          textAlign: "center"
                        }}>
                          <p style={{
                            fontFamily: "var(--font-m-plus-rounded)",
                            fontSize: "14px",
                            color: "#8b6b4a",
                            margin: 0
                          }}>
                            No Hackatime projects found
                          </p>
                          <p style={{
                            fontFamily: "var(--font-m-plus-rounded)",
                            fontSize: "12px",
                            color: "#8b6b4a",
                            margin: 0
                          }}>
                            Start tracking your time to see projects here!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom section: Description */}
                  <div style={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "2px solid #8b6b4a",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <h3 style={{
                      fontFamily: "var(--font-m-plus-rounded)",
                      fontSize: "18px",
                      color: "#6c4a24",
                      margin: 0,
                      marginBottom: "16px"
                    }}>
                      App Description
                    </h3>
                    
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        minHeight: "200px",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #8b6b4a",
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontSize: "14px",
                        color: "#6c4a24",
                        backgroundColor: "#fff",
                        resize: "vertical"
                      }}
                      placeholder="Describe your app, what it does, who it's for, and any other relevant details..."
                    />
                  </div>
                  
                  {/* Submit button with loading state */}
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "10px"
                  }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        backgroundColor: submitting ? "#b0987d" : "#8b6b4a",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 24px",
                        fontSize: "16px",
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontWeight: "bold",
                        cursor: submitting ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s",
                        minWidth: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      {submitting ? (
                        <>
                          <span style={{ 
                            display: "inline-block", 
                            width: "18px", 
                            height: "18px", 
                            borderRadius: "50%", 
                            border: "3px solid #fff", 
                            borderTopColor: "transparent", 
                            animation: "spin 1s linear infinite" 
                          }}></span>
                          <span>{isEditing ? "Updating..." : "Creating..."}</span>
                        </>
                      ) : (
                        isEditing ? "Update App" : "Create App"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : showJoinForm ? (
            <div style={{
              width: "100%",
              maxWidth: "1000px"
            }}>
              <div style={{
                marginBottom: "20px"
              }}>
                <input 
                  type="text"
                  placeholder="Search for apps by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "2px solid #8b6b4a",
                    fontFamily: "var(--font-m-plus-rounded)",
                    fontSize: "16px",
                    color: "#6c4a24",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                  }}
                />
              </div>
              
              {getFilteredApps().length === 0 ? (
                <div style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "30px",
                  border: "2px solid #8b6b4a",
                  textAlign: "center",
                  marginTop: "20px"
                }}>
                  <p style={{
                    fontFamily: "var(--font-m-plus-rounded)",
                    fontSize: "18px",
                    color: "#6c4a24"
                  }}>
                    {availableApps.length === 0 
                      ? "No apps available to join right now." 
                      : "No apps match your search."}
                  </p>
                  {availableApps.length === 0 && (
                    <button
                      onClick={() => {
                        setShowJoinForm(false);
                        setShowCreateForm(true);
                      }}
                      style={{
                        backgroundColor: "#8b6b4a",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "16px",
                        fontFamily: "var(--font-m-plus-rounded)",
                        fontWeight: "bold",
                        cursor: "pointer",
                        marginTop: "15px"
                      }}
                    >
                      Create Your Own App
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px"
                }}>
                  {getFilteredApps().map(app => (
                    <div 
                      key={app.id} 
                      onClick={() => joinApp(app.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        padding: "20px",
                        border: "2px solid #8b6b4a",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: joiningApp ? "not-allowed" : "pointer",
                        opacity: joiningApp ? 0.7 : 1,
                        pointerEvents: joiningApp ? "none" : "auto",
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
                            backgroundColor: getSuggestedAppIcon(app.name),
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
                        color: "#6c4a24",
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
          ) : apps.length === 0 ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "400px",
              gap: "40px"
            }}>
              <div style={{
                textAlign: "center",
                marginBottom: "20px"
              }}>
                <h2 style={{
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontSize: "28px",
                  color: "#6c4a24",
                  marginBottom: "16px"
                }}>You don't have any apps yet</h2>
                <p style={{
                  fontFamily: "var(--font-m-plus-rounded)",
                  fontSize: "18px",
                  color: "#8b6b4a"
                }}>Get started by creating a new app or joining an existing one</p>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  gap: "10px", 
                  marginTop: "20px" 
                }}>
                  <button
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      // Force refresh the apps
                      const fetchApps = async () => {
                        try {
                          let token = localStorage.getItem('neighborhoodToken');
                          if (!token) {
                            token = getToken();
                          }
                          
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
                          console.error("Error refreshing apps:", err);
                          setError(err.message || "Failed to refresh apps");
                        } finally {
                          setLoading(false);
                        }
                      };
                      
                      fetchApps();
                    }}
                    style={{
                      backgroundColor: "#fff",
                      color: "#8b6b4a",
                      border: "2px solid #8b6b4a",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontFamily: "var(--font-m-plus-rounded)",
                      cursor: "pointer"
                    }}
                  >
                    Refresh Apps List
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        let token = localStorage.getItem('neighborhoodToken');
                        if (!token) {
                          token = getToken();
                        }
                        
                        if (!token) {
                          throw new Error("No token found");
                        }
                        
                        // Attempt to fix app assignments
                        const fixResponse = await fetch('/api/fixUserApps', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ token }),
                        });
                        
                        const fixData = await fixResponse.json();
                        
                        if (!fixResponse.ok) {
                          throw new Error(fixData.message || "Failed to fix app assignments");
                        }
                        
                        // If apps were fixed, show success message and refresh
                        if (fixData.apps && fixData.apps.length > 0) {
                          alert(`Successfully recovered ${fixData.apps.length} app(s). Refreshing list...`);
                          
                          // Refresh the apps list
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
                        } else {
                          alert(fixData.message || "No unassigned apps found");
                        }
                      } catch (err) {
                        console.error("Error fixing apps:", err);
                        alert(err.message || "Failed to fix app assignments");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{
                      backgroundColor: "#8b6b4a",
                      color: "#fff",
                      border: "2px solid #8b6b4a",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontFamily: "var(--font-m-plus-rounded)",
                      cursor: "pointer"
                    }}
                  >
                    Recover Missing Apps
                  </button>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                gap: "30px",
                justifyContent: "center"
              }}>
                <button
                  onClick={handleCreateApp}
                  style={{
                    backgroundColor: "#8b6b4a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "16px 24px",
                    fontSize: "18px",
                    fontFamily: "var(--font-m-plus-rounded)",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "transform 0.2s, background-color 0.2s",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Create New App
                </button>
                
                <button
                  onClick={handleJoinApp}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#8b6b4a",
                    border: "2px solid #8b6b4a",
                    borderRadius: "12px",
                    padding: "16px 24px",
                    fontSize: "18px",
                    fontFamily: "var(--font-m-plus-rounded)",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "transform 0.2s, background-color 0.2s",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#8b6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Join Existing App
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              width: "100%"
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gridGap: "24px",
                width: "100%"
              }}>
                {apps.slice(0, visibleApps).map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => handleAppClick(app)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      padding: "20px",
                      border: "2px solid #8b6b4a",
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
                          backgroundColor: getSuggestedAppIcon(app.name),
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
                      color: "#6c4a24",
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
              
              {visibleApps < apps.length && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                  <button 
                    onClick={loadMoreApps}
                    style={{
                      backgroundColor: "#8b6b4a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontSize: "16px",
                      fontFamily: "var(--font-m-plus-rounded)",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      ":hover": {
                        backgroundColor: "#75593e"
                      }
                    }}
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AppsComponent; 