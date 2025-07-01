import React, { useState, useEffect, useCallback } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './CallDashboard.css';
import maisyLogo from './assets/maisy-logo.png';

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
  const [showComment, setShowComment] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState({});
  const [overallFeedback, setOverallFeedback] = useState(null);
  const [comments, setComments] = useState({});
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

  // New state variable for call transcript
  const [callTranscript, setCallTranscript] = useState([]);

  // Add state for chat input
  const [chatInput, setChatInput] = useState('');

  // Utility functions for localStorage
  const LOCAL_CALLS_KEY = 'maisy_calls';
  const LOCAL_TRANSCRIPTS_KEY = 'maisy_transcripts';
  function getLocalCalls() {
    const stored = localStorage.getItem(LOCAL_CALLS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  function addLocalCall(call) {
    const calls = getLocalCalls();
    calls.unshift(call); // add to top
    localStorage.setItem(LOCAL_CALLS_KEY, JSON.stringify(calls));
  }
  function getLocalTranscript(callId) {
    const transcripts = JSON.parse(localStorage.getItem(LOCAL_TRANSCRIPTS_KEY) || '{}');
    return transcripts[callId] || [];
  }
  function setLocalTranscript(callId, transcript) {
    const transcripts = JSON.parse(localStorage.getItem(LOCAL_TRANSCRIPTS_KEY) || '{}');
    transcripts[callId] = transcript;
    localStorage.setItem(LOCAL_TRANSCRIPTS_KEY, JSON.stringify(transcripts));
  }

  const fetchCalls = useCallback(async () => {
    setCalls(getLocalCalls().map(c => [c.callId, c.clientName]));
  }, []);

  const fetchTranscript = async (callId) => {
    setLoading(true);
    setTimeout(() => {
      setTranscript(getLocalTranscript(callId));
      const call = getLocalCalls().find(c => c.callId === callId);
      setAnalytics(call ? {
        userName: call.clientName,
        phoneNumber: call.phoneNumber,
        duration: call.duration || 'Unknown',
        type: call.type,
        time: call.time
      } : null);
      setLoading(false);
    }, 200);
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

  // Helper to add a message to the current call transcript
  function addTranscriptMessage(role, content) {
    setCallTranscript(prev => [
      ...prev,
      { id: prev.length + 1, role, content: [content] }
    ]);
  }

  // When starting a new call, reset the transcript
  const startWebCall = () => {
    setCallTranscript([]);
    setConnected(true);
  };

  const connectToRoom = async () => {
    try {
      setCallTranscript([]); // Reset transcript for new call
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
      // Add call to localStorage
      const callId = `web-${Date.now()}`;
      addLocalCall({
        callId,
        clientName: clientDetails.clientName || 'Web Test User',
        phoneNumber: clientDetails.phoneNumber || '',
        type: 'web',
        time: new Date().toISOString(),
        duration: '1 min',
      });
      setLocalTranscript(callId, callTranscript.length ? callTranscript : [
        { id: 1, role: 'user', content: ['Hello, this is a web test call.'] },
        { id: 2, role: 'assistant', content: ['Hi! This is mAIsy. How can I help you?'] }
      ]);
      await fetchCalls();
    }
  };

  const handleFeedback = (messageId, type, feedbackType) => {
    if (type === 'message') {
      setMessageFeedback(prev => ({ ...prev, [messageId]: feedbackType }));
    } else if (type === 'overall') {
      setOverallFeedback(feedbackType);
    }
  };

  const handleComment = (messageId) => {
    setShowComment(true);
    setCommentTarget(messageId);
  };

  const handleCommentSubmit = (text) => {
    setComments(prev => ({ ...prev, [commentTarget]: text }));
    setShowComment(false);
    setCommentTarget(null);
  };

  const handleInputChange = (field, value) => {
    setClientDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (field, value) => {
    setProductDetails((prev) => ({ ...prev, [field]: value }));
  };

  const submitFeedback = async (callId) => {
    try {
      const feedbackData = {
        callId: callId,
        messageFeedback: messageFeedback,
        overallFeedback: overallFeedback,
        comments: comments
      };

      const response = await fetch('http://localhost:8000/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Clear feedback states after successful submission
      setMessageFeedback({});
      setOverallFeedback(null);
      setComments({});
      
      // Optionally show success message
      alert('Feedback submitted successfully');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    }
  };

  const makeTestCall = async () => {
    setTestCallConnecting(true);
    setTimeout(() => {
      setTestCallConnected(true);
      setCallTranscript([]); // Reset transcript for new call
      setTestCallConnecting(false);
    }, 1500);
  };

  const endTestCall = () => {
    setTestCallConnected(false);
    // Add call to localStorage
    const callId = `phone-${Date.now()}`;
    addLocalCall({
      callId,
      clientName: clientDetails.clientName || 'Phone Test User',
      phoneNumber: clientDetails.phoneNumber || '',
      type: 'phone',
      time: new Date().toISOString(),
      duration: '1 min',
    });
    setLocalTranscript(callId, callTranscript.length ? callTranscript : [
      { id: 1, role: 'user', content: ['Hello, this is a phone test call.'] },
      { id: 2, role: 'assistant', content: ['Hi! This is mAIsy. How can I help you?'] }
    ]);
    fetchCalls();
  };

  // --- UI Sections ---
  const renderTopBar = () => (
    <header className="dashboard-topbar">
      <img src={maisyLogo} alt="Logo" className="dashboard-logo" />
      <span className="dashboard-title">mAIsy</span>
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
    <div className="dashboard-transcript">
      {loading ? <div className="loading">Loading transcript...</div> : (
        transcript && transcript.length > 0 ? (
          <div className="transcript-chat">
            {transcript.map((item) => (
              <div key={item.id} className={`message-bubble ${item.role === 'assistant' ? 'assistant' : 'user'}`}>
                <span className="bubble-content">{item.content.join(' ')}</span>
                {item.role === 'assistant' && (
                  <div className="feedback-buttons">
                    <button className={messageFeedback[item.id] === 'like' ? 'active' : ''} onClick={() => handleFeedback(item.id, 'message', 'like')} title="Like"><img src="/thumbs-up.svg" alt="Like" /></button>
                    <button className={messageFeedback[item.id] === 'dislike' ? 'active' : ''} onClick={() => handleFeedback(item.id, 'message', 'dislike')} title="Dislike"><img src="/thumbs-down.svg" alt="Dislike" /></button>
                    <button onClick={() => handleComment(item.id)} title="Add Comment">💬</button>
                  </div>
                )}
              </div>
            ))}
            <div className="feedback-footer">
              <span>Overall Feedback:</span>
              <button className={overallFeedback === 'like' ? 'active' : ''} onClick={() => handleFeedback(null, 'overall', 'like')}><img src="/thumbs-up.svg" alt="Like" /></button>
              <button className={overallFeedback === 'dislike' ? 'active' : ''} onClick={() => handleFeedback(null, 'overall', 'dislike')}><img src="/thumbs-down.svg" alt="Dislike" /></button>
              <button className="submit-feedback-button" onClick={() => submitFeedback(selectedCallId)} disabled={!overallFeedback}>Submit Feedback</button>
            </div>
          </div>
        ) : <div className="no-transcript">Select a call to view its transcript</div>
      )}
      {showComment && (
        <div className="comment-modal">
          <textarea autoFocus placeholder="Add your comment..." onBlur={(e) => handleCommentSubmit(e.target.value)} />
        </div>
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
          {/* Chat UI for transcript */}
          {connected && (
            <div className="chat-ui">
              <div className="chat-messages">
                {callTranscript.map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.role}`}>
                    <b>{msg.role === 'user' ? 'You' : 'mAIsy'}:</b> {msg.content.join(' ')}
                  </div>
                ))}
              </div>
              <form onSubmit={e => {
                e.preventDefault();
                if (chatInput.trim()) {
                  addTranscriptMessage('user', chatInput.trim());
                  // Simulate assistant reply
                  setTimeout(() => {
                    addTranscriptMessage('assistant', `Echo: ${chatInput.trim()}`);
                  }, 500);
                  setChatInput('');
                }
              }} className="chat-input-form">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type your message..." />
                <button type="submit">Send</button>
              </form>
            </div>
          )}
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