import { useState, useEffect } from 'react';
import { getToken } from '@/utils/storage';
import { updateSlackUserData } from '@/utils/slack';

export default function SlackConnectionComponent({ userData, setUserData }) {
  const [inputtedSlackId, setInputtedSlackId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize input value when userData changes
  useEffect(() => {
    console.log('SlackConnectionComponent: userData changed:', {
      slackId: userData?.slackId,
      currentInputValue: inputtedSlackId
    });
    if (userData?.slackId) {
      setInputtedSlackId(userData.slackId);
    }
  }, [userData?.slackId]);

  const handleSlackConnection = async () => {
    if (!inputtedSlackId) return;

    try {
      setIsConnecting(true);
      console.log('SlackConnectionComponent: Starting connection flow', {
        newSlackId: inputtedSlackId,
        currentUserData: userData
      });

      const token = localStorage.getItem('neighborhoodToken') || getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First delete any existing Slack connection
      if (userData?.slackId) {
        console.log('SlackConnectionComponent: Deleting existing connection', {
          existingSlackId: userData.slackId
        });
        const deleteResponse = await fetch('/api/deleteSlackMember', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const deleteData = await deleteResponse.json();
        console.log('SlackConnectionComponent: Delete response:', {
          ok: deleteResponse.ok,
          status: deleteResponse.status,
          data: deleteData
        });

        if (!deleteResponse.ok) {
          throw new Error(deleteData.error || 'Failed to disconnect existing Slack account');
        }
      }

      // Connect the new Slack ID
      console.log('SlackConnectionComponent: Sending connect request', {
        slackId: inputtedSlackId,
        slackHandle: userData?.slackHandle,
        fullName: userData?.fullName
      });

      const connectPayload = {
        token,
        slackId: inputtedSlackId,
        slackHandle: userData?.slackHandle || '',
        fullName: userData?.fullName || '',
        pfp: userData?.profilePicture || '',
      };
      console.log('SlackConnectionComponent: Connect payload:', connectPayload);

      const response = await fetch('/api/connectSlack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectPayload),
      });

      const responseData = await response.json();
      console.log('SlackConnectionComponent: Connect response:', {
        ok: response.ok,
        status: response.status,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update Slack ID');
      }

      // Refresh user data
      console.log('SlackConnectionComponent: Refreshing user data');
      const refreshResponse = await updateSlackUserData(token);
      console.log('SlackConnectionComponent: Refresh response:', refreshResponse);

      if (!refreshResponse) {
        throw new Error('Failed to refresh user data');
      }

      console.log('SlackConnectionComponent: Updating UI with new data:', {
        newData: refreshResponse,
        oldData: userData
      });
      
      // Update the userData state with the refreshed data
      setUserData({
        ...refreshResponse,
        slackSuccess: true,
        isConnectingSlack: false,
      });

      // Clear success message after delay
      setTimeout(() => {
        setUserData(prev => {
          console.log('SlackConnectionComponent: Clearing success message', {
            prevData: prev
          });
          return {
            ...prev,
            slackSuccess: false,
          };
        });
      }, 2000);

    } catch (error) {
      console.error('SlackConnectionComponent: Error:', {
        message: error.message,
        error
      });
      alert(error.message || 'Failed to update Slack ID');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      border: '1px solid #B5B5B5',
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'column',
      gap: 8,
      padding: 8,
      minHeight: 40,
    }}>
      <input
        type="text"
        placeholder="Slack ID"
        value={inputtedSlackId}
        onChange={(e) => {
          console.log('SlackConnectionComponent: Input changed:', {
            newValue: e.target.value,
            prevValue: inputtedSlackId
          });
          setInputtedSlackId(e.target.value);
        }}
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 6,
          border: '1px solid #ccc',
          fontSize: 14,
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSlackConnection();
          }
        }}
      />
      {userData?.slackSuccess && (
        <div style={{
          color: '#4CAF50',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span role="img" aria-label="check">✓</span>
          Successfully connected!
        </div>
      )}
      <button
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 6,
          border: '1px solid #000',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          opacity: isConnecting ? 0.7 : 1,
          pointerEvents: isConnecting ? 'none' : 'auto',
        }}
        onClick={handleSlackConnection}
      >
        {isConnecting
          ? 'Connecting...'
          : userData?.slackId
            ? 'Update Slack Account'
            : 'Connect Slack Account'}
      </button>
    </div>
  );
} 