import React, { useEffect, useState, useRef } from 'react';
import DiskBottomBar from './DiskBottomBar';
import PreviewGameBar from './PreviewGameBar';

export default function EditGameComponent({ initialGame, onSuccess, onCancel }) {
  const [slackInfo, setSlackInfo] = useState(null);
  const [hackatimeProjects, setHackatimeProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState(initialGame?.hackatimeProjects || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [gameName, setGameName] = useState(initialGame?.name || '');
  const [gameLink, setGameLink] = useState(initialGame?.appLink || '');
  const [githubLink, setGithubLink] = useState(initialGame?.githubLink || '');
  const [description, setDescription] = useState(initialGame?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef();

  // Fetch Slack info using hacktendoToken
  useEffect(() => {
    const token = localStorage.getItem('hacktendoToken');
    if (!token) return;
    fetch(`/api/getSlackUser?token=${token}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setSlackInfo(data))
      .catch(() => setSlackInfo(null));
  }, []);

  // Fetch Hackatime projects using Slack info
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError('');
      try {
        if (!slackInfo?.slackId || !slackInfo?.email) {
          setError('No Slack ID or email found.');
          setHackatimeProjects([]);
          setLoading(false);
          return;
        }
        // Use Slack ID and email to fetch projects
        const response = await fetch(`/api/getHackatimeProjects?slackId=${slackInfo.slackId}&userId=${slackInfo.userId}`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setHackatimeProjects(data.projects || []);
      } catch (err) {
        setError('Could not load Hackatime projects.');
        setHackatimeProjects([]);
      } finally {
        setLoading(false);
      }
    }
    if (slackInfo?.slackId && slackInfo?.userId) fetchProjects();
  }, [slackInfo]);

  const handleProjectToggle = (name) => {
    setSelectedProjects((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      color: '#000',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 10000
    }}>
      <div style={{ width: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, marginTop: 96 }}>
          <button onClick={() => onCancel && onCancel()} style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8, border: 'none', background: '#eee', cursor: 'pointer' }}>Cancel</button>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Edit Game</h2>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setSubmitError('');
            setSubmitSuccess(false);
            try {
              const token = localStorage.getItem('hacktendoToken');
              if (!token) throw new Error('No token found. Please sign in.');
              let imagesArr = initialGame?.images || [];
              if (selectedImage) {
                // Upload image to S3 or similar (replace with your upload endpoint)
                const formData = new FormData();
                formData.append('file', selectedImage);
                formData.append('token', token);
                const uploadRes = await fetch('https://express.neighborhood.hackclub.com/upload-icon', {
                  method: 'POST',
                  body: formData,
                });
                if (!uploadRes.ok) throw new Error('Failed to upload image');
                const uploadData = await uploadRes.json();
                imagesArr = [uploadData.url];
              }
              const res = await fetch('/api/updateApp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token,
                  appId: initialGame.id,
                  name: gameName,
                  appLink: gameLink,
                  githubLink,
                  description,
                  images: imagesArr,
                  hackatimeProjects: selectedProjects,
                })
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update game');
              }
              const updated = await res.json();
              setSubmitSuccess(true);
              if (onSuccess) onSuccess(updated.app);
            } catch (err) {
              setSubmitError(err.message || 'Failed to submit');
            } finally {
              setSubmitting(false);
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            width: 700,
            background: '#fff',
            padding: 32,
            borderRadius: 0,
            fontSize: 18,
            maxHeight: '100vh',
            overflowY: 'auto',
            paddingBottom: 48
          }}
        >
          {slackInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {slackInfo.pfp && <img src={slackInfo.pfp} alt="Slack avatar" style={{ width: 40, height: 40, borderRadius: "8px" }} />}
              <span style={{ fontWeight: 'bold' }}>{slackInfo.slackHandle || slackInfo.fullName}</span>
            </div>
          )}
          {/* Game Cover Upload (2:1 aspect ratio) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>Game Cover Image (2:1 Aspect Ratio):</div>
            <div
              style={{
                width: '100%',
                aspectRatio: '2/1',
                border: '2px dashed #ccc',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                background: '#f5f5f5'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Game cover preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
              ) : initialGame?.images && initialGame.images.length > 0 ? (
                <img
                  src={initialGame.images[0]}
                  alt="Current game cover"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
              ) : (
                <div style={{ color: '#666', textAlign: 'center' }}>
                  Click to upload image
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedImage(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>
          <label>
            Game Name:
            <input type="text" value={gameName} onChange={e => setGameName(e.target.value)} style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4 }} required />
          </label>
          <label>
            Game Link:
            <input type="text" value={gameLink} onChange={e => setGameLink(e.target.value)} style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4 }} />
          </label>
          <label>
            GitHub Link:
            <input type="text" value={githubLink} onChange={e => setGithubLink(e.target.value)} style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4 }} />
          </label>
          <label>
            Description:
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4, minHeight: 80 }} />
          </label>
          <div>
            <div style={{ marginBottom: 8 }}>Hackatime Projects:</div>
            {loading ? (
              <div>Loading projects...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : hackatimeProjects.length === 0 ? (
              <div>No projects found.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {hackatimeProjects.map((project) => (
                  <button
                    key={project.name}
                    type="button"
                    onClick={() => handleProjectToggle(project.name)}
                    style={{
                      padding: '6px 18px',
                      borderRadius: 8,
                      border: selectedProjects.includes(project.name) ? '2px solid #4a90e2' : '2px solid #ccc',
                      background: selectedProjects.includes(project.name) ? '#e3eefd' : '#f5f5f5',
                      color: selectedProjects.includes(project.name) ? '#4a90e2' : '#333',
                      fontWeight: selectedProjects.includes(project.name) ? 700 : 400,
                      cursor: 'pointer',
                      fontSize: 16
                    }}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {submitError && <div style={{ color: 'red', marginTop: 8 }}>{submitError}</div>}
          {submitSuccess && <div style={{ color: 'green', marginTop: 8, }}>Game updated!</div>}
          <button type="submit" disabled={submitting} style={{ fontSize: 22, padding: '12px 32px', borderRadius: 12, border: 'none', background: '#4a90e2', color: '#fff', cursor: submitting ? 'wait' : 'pointer', fontWeight: 700, marginTop: 16, marginBottom: 96, }}>{submitting ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
} 