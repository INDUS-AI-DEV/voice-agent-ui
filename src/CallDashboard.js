import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './CallDashboard.css';
import { getCallIds, getConversation } from "./api";
import PhoneCallPage from './PhoneCallPage';

const NAV = {
  DASHBOARD: 'dashboard',
  TEST_CALL: 'testCall',
  ANALYTICS: 'analytics',
};

const CallDashboard = () => {
  const [activeNav, setActiveNav] = useState(NAV.DASHBOARD);
  const [calls, setCalls] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [transcript, setTranscript] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");

  // State for Test Web Call
  // eslint-disable-next-line no-unused-vars
  const [room, setRoom] = useState(null);

  // Add state for test call type and web call connection
  const [testCallType, setTestCallType] = useState('web');
  const [webRoom, setWebRoom] = useState(null);
  const [webConnected, setWebConnected] = useState(false);
  const [webConnecting, setWebConnecting] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const fetchCalls = useCallback(async () => {
    setError("");
    try {
      const data = await getCallIds();
      setCalls(Object.entries(data));
    } catch (err) {
      setError("Failed to fetch calls: " + err.message);
      setCalls([]);
    }
  }, []);

  const fetchTranscript = async (callId) => {
    setError("");
    try {
      const data = await getConversation(callId);
      setTranscript(data);
    } catch (err) {
      setError("Failed to fetch transcript: " + err.message);
      setTranscript(null);
    }
  };

  const connectToRoom = async () => {
    setWebConnecting(true);
    try {
      const server_url = process.env.REACT_APP_TOKEN_SERVER_URL;
      const userId = `user-${Math.random().toString(36).substring(2, 8)}`;
      const roomId = `room-${Math.random().toString(36).substring(2, 8)}`;
      const fullUrl = `${server_url}room=${roomId}&user=${userId}`;
      const resp = await fetch(fullUrl);
      const data = await resp.json();
      const token = data.token;
      const newRoom = new Room();
      await newRoom.connect(process.env.REACT_APP_LIVEKIT_WS_URL, token);
      setWebRoom(newRoom);
      setWebConnected(true);
      const micTrack = await createLocalAudioTrack();
      await newRoom.localParticipant.publishTrack(micTrack);
    } catch (err) {
      alert('Failed to connect: ' + err.message);
    } finally {
      setWebConnecting(false);
    }
  };

  const disconnectFromRoom = async () => {
    if (!webRoom) return;
    setWebConnecting(true);
    try {
      await webRoom.disconnect();
      setWebConnected(false);
      setWebRoom(null);
    } catch (err) {
      alert('Error disconnecting: ' + err.message);
    } finally {
      setWebConnecting(false);
    }
  };

  // Test Web Call Logic
  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track) => {
      if (track.kind === Track.Kind.Audio) {
        // setIsSpeaking(true); // This line was removed as per the edit hint

        const audioElement = track.attach();
        document.body.appendChild(audioElement);

        audioElement.onended = () => {
          // setIsSpeaking(false); // This line was removed as per the edit hint
          audioElement.remove();
        };
      }
    };

    const handleTrackUnsubscribed = (track) => {
      if (track.kind === Track.Kind.Audio) {
        track.detach().forEach((element) => element.remove());
        // setIsSpeaking(false); // This line was removed as per the edit hint
      }
    };

    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);

    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [room]);

  // The connectToRoom and disconnectFromRoom functions were removed as per the edit hint

  // The handleInputChange and handleProductChange functions were removed as per the edit hint

  // The makeTestCall and endTestCall functions were removed as per the edit hint

  // --- UI Sections ---
  const renderTopBar = () => (
    <header className="dashboard-topbar">
      <div className="dashboard-header-left">
        <img src={process.env.PUBLIC_URL + '/IndusAI logo.png'} alt="Medibot Logo" className="dashboard-logo" />
        <span className="dashboard-title">AI Medicare System</span>
      </div>
      <nav className="dashboard-nav">
        <button className={activeNav === NAV.DASHBOARD ? 'active' : ''} onClick={() => setActiveNav(NAV.DASHBOARD)}>Dashboard</button>
        <button className={activeNav === NAV.TEST_CALL ? 'active' : ''} onClick={() => setActiveNav(NAV.TEST_CALL)}>Test Call</button>
        <button className={activeNav === NAV.ANALYTICS ? 'active' : ''} onClick={() => setActiveNav(NAV.ANALYTICS)}>Analytics</button>
      </nav>
    </header>
  );

  const renderSidebar = () => (
    <aside className="dashboard-sidebar">
      <div className="sidebar-section">
        <h3>Call List</h3>
        {calls.length === 0 && <div className="sidebar-empty">No calls found.</div>}
        {calls.map(([callId, name]) => (
          <div
            key={callId}
            className={`sidebar-call-item${selectedCallId === callId ? ' active' : ''}`}
            onClick={() => {
              setSelectedCallId(callId);
              fetchTranscript(callId);
              setActiveNav(NAV.DASHBOARD);
            }}
          >
            <span className="call-avatar">📞</span>
            <span>{name}</span>
          </div>
        ))}
        <div className="sidebar-pagination">
          <button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>Prev</button>
          <button onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </aside>
  );

  const renderWelcome = () => (
    <div className="dashboard-welcome">
      <img src={process.env.PUBLIC_URL + '/IndusAI logo.png'} alt="Medibot Logo" className="welcome-logo" />
      <h2 className="welcome-title">Welcome to your AI Agent Dashboard</h2>
      <p className="welcome-subtext">Select a call from the sidebar or start a test call to begin.</p>
    </div>
  );

  const renderTranscript = () => (
    <div className="transcript-container-modern">
      <h3 style={{marginBottom: '1.5rem', color: '#222', fontWeight: 700}}>Call Transcript</h3>
      {loading ? <div className="loading">Loading transcript...</div> : (
        transcript && transcript.length > 0 ? (
          <div>{/* Render transcript here */}</div>
        ) : <div>No transcript available.</div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="dashboard-analytics">
      <h2>Analytics</h2>
      {/* analytics state was removed, so this section will always show "Select a call to view analytics" */}
      <div className="no-analytics">Select a call to view analytics</div>
    </div>
  );

  const renderTestCall = () => (
    <div className="test-call-section">
      <div className="test-call-tabs">
        <button className={testCallType === 'web' ? 'active' : ''} onClick={() => setTestCallType('web')}>Web Call</button>
        <button className={testCallType === 'phone' ? 'active' : ''} onClick={() => setTestCallType('phone')}>Phone Call</button>
      </div>
      <div className="test-call-content">
        {testCallType === 'web' ? (
          <div className="web-call-ui">
            <h3>Test Web Call</h3>
            <button onClick={webConnected ? disconnectFromRoom : connectToRoom} disabled={webConnecting}>
              {webConnected ? 'End Web Call' : (webConnecting ? 'Connecting...' : 'Start Web Call')}
            </button>
            <div style={{ marginTop: '1rem', color: webConnected ? 'green' : '#888' }}>
              {webConnected ? 'Web call is active.' : 'No active web call.'}
            </div>
          </div>
        ) : (
          <PhoneCallPage />
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-root">
      {error && <div className="error">{error}</div>}
      {renderTopBar()}
      <div className="dashboard-main">
        {renderSidebar()}
        <main className="dashboard-content">
          {activeNav === NAV.DASHBOARD && (selectedCallId ? renderTranscript() : renderWelcome())}
          {activeNav === NAV.TEST_CALL && renderTestCall()}
          {activeNav === NAV.ANALYTICS && renderAnalytics()}
        </main>
      </div>
    </div>
  );
};

export default CallDashboard; 