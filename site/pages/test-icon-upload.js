import { useState, useRef } from 'react';
import Head from 'next/head';

export default function TestIconUpload() {
  const [appId, setAppId] = useState('');
  const [status, setStatus] = useState('');
  const [icon, setIcon] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usePlaceholder, setUsePlaceholder] = useState(false);
  const [iconType, setIconType] = useState('placeholder');
  const [iconUrl, setIconUrl] = useState('');
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcon(reader.result);
        setStatus(`File loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!appId) {
      setStatus('Error: App ID is required');
      return;
    }
    
    if (iconType === 'url' && !iconUrl) {
      setStatus('Error: Icon URL is required');
      return;
    }
    
    setLoading(true);
    setStatus('Testing...');
    
    try {
      const response = await fetch('/api/testIconUpload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          icon: iconType === 'url' ? iconUrl : iconType === 'file' ? icon : 'placeholder',
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        setStatus('Success! Icon uploaded.');
      } else {
        setStatus(`Error: ${data.message || 'Failed to upload icon'}`);
      }
    } catch (error) {
      console.error('Error uploading icon:', error);
      setStatus(`Error: ${error.message || 'Failed to upload icon'}`);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testPlaceholderOnly = async () => {
    if (!appId) {
      setStatus('Error: App ID is required');
      return;
    }
    
    setLoading(true);
    setStatus('Testing with placeholder image only...');
    
    try {
      const response = await fetch('/api/testIconUpload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          icon: 'placeholder',
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        setStatus('Success! Placeholder icon uploaded.');
      } else {
        setStatus(`Error: ${data.message || 'Failed to upload placeholder icon'}`);
      }
    } catch (error) {
      console.error('Error uploading placeholder icon:', error);
      setStatus(`Error: ${error.message || 'Failed to upload placeholder icon'}`);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Head>
        <title>Test Icon Upload</title>
      </Head>
      
      <h1>Test Icon Upload for Airtable</h1>
      <p>Use this tool to test uploading an icon to an existing app in Airtable.</p>
      <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
        Important: Airtable requires icons to be hosted online URLs. 
        Direct file uploads are not supported by Airtable's API.
      </p>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="appId" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            App ID (from Airtable):
          </label>
          <input
            id="appId"
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
            placeholder="recXXXXXXXXXXXX"
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="iconType" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Icon Type:
          </label>
          <select
            id="iconType"
            value={iconType}
            onChange={(e) => setIconType(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          >
            <option value="placeholder">Use Placeholder Icon</option>
            <option value="url">Enter Icon URL</option>
            <option value="file">Upload Icon File (not recommended)</option>
          </select>
        </div>
        
        {iconType === 'url' && (
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="iconUrl" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Icon URL:
            </label>
            <input
              id="iconUrl"
              type="url"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
              placeholder="https://example.com/icon.png"
              required={iconType === 'url'}
            />
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
              Enter a direct URL to an image hosted online (must start with http:// or https://)
            </p>
          </div>
        )}
        
        {iconType === 'file' && (
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="iconFile" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Upload Icon:
            </label>
            <input
              id="iconFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
              required={iconType === 'file'}
            />
            <p style={{ fontSize: '0.8rem', color: '#e74c3c', marginTop: '5px' }}>
              Note: Airtable doesn't support direct file uploads. 
              This will be converted to a placeholder icon.
            </p>
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Testing...' : 'Test Icon Upload'}
          </button>
        </div>
      </form>
      
      {result && (
        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          border: '1px solid #ddd' 
        }}>
          <h2>Test Result</h2>
          <pre style={{ 
            backgroundColor: '#f1f1f1', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.iconUrl && (
            <div style={{ marginTop: '15px' }}>
              <p><strong>Icon Preview:</strong></p>
              <img 
                src={result.iconUrl}
                alt="Uploaded Icon"
                style={{ 
                  maxWidth: '100px',
                  maxHeight: '100px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 