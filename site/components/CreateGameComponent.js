import React, { useEffect, useState, useRef } from 'react';
import DiskBottomBar from './DiskBottomBar';
import PreviewGameBar from './PreviewGameBar';

export default function CreateGameComponent() {
  const [slackInfo, setSlackInfo] = useState(null);
  const [hackatimeProjects, setHackatimeProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
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
      <form style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        width: 700,
        background: '#fff',
        padding: 32,
        borderRadius: 0,
        fontSize: 18,
        maxHeight: '100vh',
        overflowY: 'auto'
      }}>
        {slackInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {slackInfo.pfp && <img src={slackInfo.pfp} alt="Slack avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />}
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
          <input type="text" style={{ width: '100%', marginTop: 8 }} />
        </label>
        <label>
          Game Link:
          <input type="text" style={{ width: '100%', marginTop: 8 }} />
        </label>
        <label>
          GitHub Link:
          <input type="text" style={{ width: '100%', marginTop: 8 }} />
        </label>
        <label>
          Game Description:
          <textarea rows={4} style={{ width: '100%', marginTop: 8, resize: 'vertical' }} />
        </label>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Hackatime Projects:</div>
          {loading && <div>Loading projects...</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {!loading && !error && hackatimeProjects.length === 0 && <div>No projects found.</div>}
          {!loading && !error && hackatimeProjects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hackatimeProjects.map((project) => (
                <label key={project.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.name)}
                    onChange={() => handleProjectToggle(project.name)}
                  />
                  <span>{project.name}</span>
                  <span style={{ color: '#888', fontSize: 14 }}>({Math.floor(project.total_seconds / 3600)}h {Math.round((project.total_seconds % 3600) / 60)}m)</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button type="submit" style={{ marginTop: 16, padding: '12px 0', fontSize: 18, fontWeight: 'bold', background: '#eee', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>Submit</button>
      </form>
    </div>
  );
} 