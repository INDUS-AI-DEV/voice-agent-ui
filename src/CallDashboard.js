import React, { useState, useEffect, useCallback } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './CallDashboard.css';
import maisyLogo from './assets/maisy-logo.png';
import favicon from './assets/favicon.ico';
import indusaiLogo from './assets/indusai-logo.png';
import maleUser from './assets/male-user.jpg';

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
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [page, setPage] = useState(0);
  const [clientDetails, setClientDetails] = useState({ clientName: '', phoneNumber: '' });
  const [productDetails, setProductDetails] = useState({ productList1: '', productList2: '' });
  const [testCallConnecting, setTestCallConnecting] = useState(false);
  const [testCallConnected, setTestCallConnected] = useState(false);

  // State for Test Web Call
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // New state variables for feedback
  const [testCallType, setTestCallType] = useState(null); // 'web' or 'phone'

  const fetchCalls = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/get-call-ids?skip=${page * 10}&limit=10`);
      const data = await response.json();
      setCalls(Object.entries(data));
    } catch (error) {
      setCalls([]);
    }
  }, [page]);

  const fetchTranscript = async (callId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/get-conversation/${callId}`);
      const rawData = await response.json();
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      // Assume transcript is in data.session_history.items
      setTranscript(data.session_history?.items || []);
      setAnalytics({
        userName: data.user_details?.name || 'Unknown',
        phoneNumber: data.user_details?.phone_number || 'Unknown',
        duration: 'Unknown',
      });
    } catch (error) {
      setTranscript([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  // Test Web Call Logic
  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track) => {
      if (track.kind === Track.Kind.Audio) {
        setIsSpeaking(true);

        const audioElement = track.attach();
        document.body.appendChild(audioElement);

        audioElement.onended = () => {
          setIsSpeaking(false);
          audioElement.remove();
        };
      }
    };

    const handleTrackUnsubscribed = (track) => {
      if (track.kind === Track.Kind.Audio) {
        track.detach().forEach((element) => element.remove());
        setIsSpeaking(false);
      }
    };

    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);

    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [room]);

  const connectToRoom = async () => {
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

      setRoom(newRoom);
      setConnected(true);

      const micTrack = await createLocalAudioTrack();
      await newRoom.localParticipant.publishTrack(micTrack);
    } catch (err) {
      console.error('Error connecting to Agent:', err);
    }
  };

  const disconnectFromRoom = async () => {
    if (room) {
      await room.disconnect();
      setConnected(false);
      setRoom(null);
      await fetchCalls();
    }
  };

  const handleInputChange = (field, value) => {
    setClientDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (field, value) => {
    setProductDetails((prev) => ({ ...prev, [field]: value }));
  };

  const makeTestCall = async () => {
    setTestCallConnecting(true);
    setTimeout(() => {
      setTestCallConnected(true);
      setTestCallConnecting(false);
    }, 1500);
  };

  const endTestCall = async () => {
    setTestCallConnected(false);
    await fetchCalls();
  };

  // --- UI Sections ---
  const renderTopBar = () => (
    <header className="dashboard-topbar">
      <img src={maisyLogo} alt="Logo" className="dashboard-logo" />
      <span className="dashboard-title">AI Ordering System</span>
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
      <img src={maisyLogo} alt="Welcome" className="welcome-logo" />
      <h2>Welcome to your AI Agent Dashboard</h2>
      <p>Select a call from the sidebar or start a test call to begin.</p>
    </div>
  );

  const renderTranscript = () => (
    <div className="transcript-container-modern">
      <h3 style={{marginBottom: '1.5rem', color: '#222', fontWeight: 700}}>Call Transcript</h3>
      {loading ? <div className="loading">Loading transcript...</div> : (
        transcript && transcript.length > 0 ? (
          <div className="transcript-chat-modern">
            {transcript.map((item, idx) => (
              <div key={item.id || idx} className={`transcript-bubble ${item.role}`}>
                <div className="transcript-meta">
                  {item.role === 'assistant' ? (
                    <img src={indusaiLogo} alt="IndusAI" className="transcript-avatar assistant" style={{width: 32, height: 32, objectFit: 'cover'}} />
                  ) : (
                    <img src={maleUser} alt="User" className="transcript-avatar user" style={{width: 32, height: 32, objectFit: 'cover'}} />
                  )}
                  <span className="transcript-sender">{item.role === 'user' ? analytics?.userName || 'You' : 'IndusAI'}</span>
                  {item.time && <span className="transcript-time">{item.time}</span>}
                </div>
                <div>{item.content.join(' ')}</div>
              </div>
            ))}
          </div>
        ) : <div className="no-transcript">Select a call to view its transcript</div>
      )}
    </div>
  );

  const renderTestCall = () => (
    <div className="dashboard-testcall">
      <h2>Test Call with AI Agent</h2>
      <div className="testcall-tabs">
        <button className={testCallType === 'web' ? 'active' : ''} onClick={() => setTestCallType('web')}>Test Web Call</button>
        <button className={testCallType === 'phone' ? 'active' : ''} onClick={() => setTestCallType('phone')}>Test Phone Call</button>
      </div>
      {testCallType === 'web' && (
        <div className="testcall-form">
          <input type="text" placeholder="Client Name" value={clientDetails.clientName} onChange={e => handleInputChange('clientName', e.target.value)} disabled={connected} />
          <button className={`call-button${connected ? ' active' : ''}${testCallConnecting ? ' connecting' : ''}`} onClick={!connected ? connectToRoom : disconnectFromRoom} disabled={testCallConnecting || (!connected && !clientDetails.clientName)}>
            {!connected ? (testCallConnecting ? 'Connecting...' : 'Start Web Call') : 'End Web Call'}
          </button>
          {connected && isSpeaking && <div className="speaking-indicator">🔊 Agent is speaking...</div>}
        </div>
      )}
      {testCallType === 'phone' && (
        <div className="testcall-form">
          <input type="text" placeholder="Client Name" value={clientDetails.clientName} onChange={e => handleInputChange('clientName', e.target.value)} disabled={testCallConnected} />
          <input type="tel" placeholder="Client Phone Number" value={clientDetails.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} disabled={testCallConnected} />
          <textarea placeholder="Product List 1" value={productDetails.productList1} onChange={e => handleProductChange('productList1', e.target.value)} disabled={testCallConnected} />
          <textarea placeholder="Product List 2" value={productDetails.productList2} onChange={e => handleProductChange('productList2', e.target.value)} disabled={testCallConnected} />
          <button className={`call-button${testCallConnected ? ' active' : ''}${testCallConnecting ? ' connecting' : ''}`} onClick={!testCallConnected ? makeTestCall : endTestCall} disabled={testCallConnecting || (!testCallConnected && (!clientDetails.clientName || !clientDetails.phoneNumber))}>
            {!testCallConnected ? (testCallConnecting ? 'Connecting...' : 'Start Phone Call') : 'End Phone Call'}
          </button>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="dashboard-analytics">
      <h2>Analytics</h2>
      {analytics ? (
        <div className="analytics-cards">
          <div className="analytics-card"><span>👤</span><div><div>User Name</div><div>{analytics.userName}</div></div></div>
          <div className="analytics-card"><span>📱</span><div><div>Phone Number</div><div>{analytics.phoneNumber}</div></div></div>
          <div className="analytics-card"><span>⏱️</span><div><div>Call Duration</div><div>{analytics.duration}</div></div></div>
        </div>
      ) : <div className="no-analytics">Select a call to view analytics</div>}
    </div>
  );

  return (
    <div className="dashboard-root">
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