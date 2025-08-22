import { useState, useEffect } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './App.css';

// Import assets - you'll need to replace these with your actual imports
import maisyLogo from './assets/maisy-logo.png';
import maisyBot from './assets/maisy-image.png';

// Language options for dropdown (full names)
const LANGUAGE_OPTIONS = [
  { value: 'Hi', label: 'Hindi' },
  { value: 'En', label: 'English' },
  { value: 'Ta', label: 'Tamil' },
  { value: 'Ar', label: 'Arabic' },
  { value: 'Af', label: 'African' },
];

// Scenario options for outbound calls
const SCENARIO_OPTIONS = [
  { value: 'kyc_followups', label: 'KYC Follow-ups' },
  { value: 'engagement_awareness', label: 'Engagement & Awareness' },
  { value: 'rewards_and_redemption', label: 'Rewards & Redemption Encouragement' },
  { value: 'technical_assistance_and_pipe_configurator', label: 'Technical Assistance and Pipe Configurator' },
  { value: 're_engage_the_inactive_plumbers', label: 'Re-engage Inactive Plumbers' },
  { value: 'referral_and_network_building', label: 'Referral & Network Building' },
  { value: 'feedback_and_satisfaction_checks', label: 'Feedback & Satisfaction Checks' },
  { value: 'service_followup', label: 'Service Follow-up' },
  { value: 'new_scheme_information', label: 'New Scheme Information' },
];

// Persona options for outbound calls
const PERSONA_OPTIONS = [
  { value: 'existing_plumber_doing_business', label: 'Existing Plumber - Doing Business' },
  { value: 'existing_plumber_infrequent_business', label: 'Existing Plumber - Infrequent Business' },
  { value: 'existing_plumber_quit_business', label: 'Existing Plumber - Quit Business' },
  { value: 'existing_plumber_not_doing_business', label: 'Existing Plumber - Not Doing Business' },
  { value: 'new_plumber', label: 'New Plumber' },
  { value: 'retailer', label: 'Retailer' },
];

// OTP/MPIN Modal Component
function MPINModal({ onAuthenticate }) {
  const [mpin, setMpin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length > 1) return;
    const newMpin = [...mpin];
    newMpin[idx] = val;
    setMpin(newMpin);
    // Move to next input if filled
    if (val && idx < 3) {
      document.getElementById(`mpin-input-${idx + 1}`).focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !mpin[idx] && idx > 0) {
      document.getElementById(`mpin-input-${idx - 1}`).focus();
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    // Directly authenticate for frontend testing
    setTimeout(() => {
      onAuthenticate();
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 320
      }}>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Enter 4-digit MPIN</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {mpin.map((digit, idx) => (
            <input
              key={idx}
              id={`mpin-input-${idx}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(e, idx)}
              onKeyDown={e => handleKeyDown(e, idx)}
              style={{ width: 40, height: 40, fontSize: 24, textAlign: 'center', borderRadius: 8, border: '1px solid #ccc' }}
              autoFocus={idx === 0}
            />
          ))}
        </div>
        <button onClick={handleSubmit} disabled={loading || mpin.some(d => !d)} style={{
          width: '100%', padding: '10px 0', borderRadius: 8, background: '#1a73e8', color: '#fff', fontWeight: 'bold', fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 8
        }}>
          {loading ? 'Verifying...' : 'Login'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}

function App() {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null); // 'inbound' or 'outbound'
  const [language, setLanguage] = useState('Hi'); // Default to Hindi
  const [selectedScenario, setSelectedScenario] = useState(SCENARIO_OPTIONS[0].value);
  const [selectedPersona, setSelectedPersona] = useState(PERSONA_OPTIONS[0].value);

  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track, publication, participant) => {
      console.log(`Track subscribed: ${track.kind}`);
  
      if (track.kind === Track.Kind.Audio) {
        setIsSpeaking(true);
  
        const audioElement = track.attach();
        document.body.appendChild(audioElement);
  
        // Simulate a chat message from agent
        setChatMessages(prev => [...prev, { sender: participant.identity, text: "Agent is responding..." }]);
  
        audioElement.onended = () => {
          setIsSpeaking(false);
          audioElement.remove();
        };
      }
    };
  
    const handleTrackUnsubscribed = (track, publication, participant) => {
      console.log(`Track unsubscribed: ${track.kind}`);
  
      if (track.kind === Track.Kind.Audio) {
        track.detach().forEach((element) => element.remove());
        setIsSpeaking(false);
      }
    };
  
    const handleDataReceived = (payload, participant, kind) => {
      const message = new TextDecoder().decode(payload);
      console.log(`Data message received from ${participant.identity}: ${message}`);
  
      setChatMessages(prev => [...prev, { sender: participant.identity, text: message }]);
    };

    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);
    room.on('dataReceived', handleDataReceived);

    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
      room.off('dataReceived', handleDataReceived);
    };
  }, [room]);

  const connectToRoom = async (agentType) => {
    // Prevent multiple simultaneous connection attempts
    if (connecting || connected) return;
    setConnecting(true);
    setActiveAgent(agentType);
    
    try {
      const server_url = process.env.REACT_APP_TOKEN_SERVER_URL_PLUMBER;
      console.log("Server url:", server_url);

      // Dynamically generate a unique user ID and room ID
      const userId = `user-${Math.random().toString(36).substring(2, 8)}`;
      const roomId = `room-${Math.random().toString(36).substring(2, 8)}`;

      // Build URL parameters
      let urlParams = `room=${roomId}&user=${userId}&agent_type=${agentType}&language=${language}`;
      
      // Add scenario and persona parameters for outbound calls
      if (agentType === 'outbound') {
        urlParams += `&scenario=${selectedScenario}&persona=${selectedPersona}`;
      }

      const fullUrl = `${server_url}/api/token/plumber?${urlParams}`;
      console.log("API URL:", fullUrl);

      // Fetch the token
      const resp = await fetch(fullUrl);
      console.log("Response status:", resp.status);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${resp.status}: ${errorText}`);
      }
      
      const data = await resp.json();
      console.log("Token data:", data);
      const token = data.token;

      console.log("Connecting to:", process.env.REACT_APP_LIVEKIT_WS_URL_PLUMBER);
      const newRoom = new Room();
      await newRoom.connect(process.env.REACT_APP_LIVEKIT_WS_URL_PLUMBER, token);

      setRoom(newRoom);
      setConnected(true);

      const micTrack = await createLocalAudioTrack();
      await newRoom.localParticipant.publishTrack(micTrack);

      console.log(`Connected to ${agentType} agent and microphone publishing.`);
    } catch (err) {
      console.error('Error connecting to Agent:', err);
      alert(`Connection failed: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromRoom = async () => {
    if (!room || connecting) return;
    
    setConnecting(true);
    
    try {
      await room.disconnect();
      setConnected(false);
      setRoom(null);
      setChatMessages([]);
      setIsSpeaking(false);
      setActiveAgent(null);
      console.log('Disconnected.');
    } catch (err) {
      console.error('Error disconnecting:', err);
    } finally {
      setConnecting(false);
    }
  };

  // Inline styles for the two call buttons
  const callButtonsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    alignItems: 'center',
    marginBottom: '20px'
  };

  const agentButtonStyle = {
    width: '200px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '48px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  };

  const inboundButtonStyle = {
    ...agentButtonStyle,
    background: connected && activeAgent === 'inbound' 
      ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' 
      : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white'
  };

  const outboundButtonStyle = {
    ...agentButtonStyle,
    background: connected && activeAgent === 'outbound' 
      ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' 
      : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    color: 'white'
  };

  const disabledButtonStyle = {
    ...agentButtonStyle,
    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
    color: 'white',
    cursor: 'not-allowed',
    opacity: 0.6
  };

  const loadingSpinnerStyle = {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const dropdownContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '300px',
    margin: '0 auto 20px',
    padding: '0 20px'
  };

  const dropdownStyle = {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease',
    outline: 'none'
  };

  const dropdownLabelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '4px'
  };

  return (
    <div className="app-container">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .agent-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        .agent-button:active {
          transform: translateY(0);
        }
        .dropdown:hover, .dropdown:focus {
          border-color: #2196F3 !important;
        }
        @media (max-width: 700px) {
          .agent-buttons-container {
            gap: 12px !important;
          }
          .agent-button {
            width: 180px !important;
            font-size: 14px !important;
            padding: 10px 12px !important;
            min-height: 40px !important;
          }
        }
      `}</style>
      
      {!authenticated && <MPINModal onAuthenticate={() => setAuthenticated(true)} />}
      
      <div className="phone-mockup" style={{
        filter: !authenticated ? 'blur(2px)' : 'none',
        pointerEvents: !authenticated ? 'none' : 'auto'
      }}>
        
        {/* Language Dropdown - positioned in top right */}
        <div className="language-dropdown-container">
          <select
            className="language-dropdown"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            aria-label="Select Language"
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="language-dropdown-arrow">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ verticalAlign: 'middle' }}>
              <path d="M5 8l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        
        {/* Logo Section */}
        <div className="logo-container">
          <img src={maisyLogo} alt="mAIsy Logo" className="logo" />
          <div className="logo-subtitle">AI Call System</div>
        </div>

        {/* Call Section */}
        <div className="call-section">
          {/* Loader: Show when connecting and not isSpeaking */}
          {connecting && !isSpeaking && (
            <div className="connecting-loader">
              <div className="loader-spinner"></div>
              <div className="loader-text">Connecting to {activeAgent} agent...</div>
            </div>
          )}

          {/* Two Call Buttons */}
          <div style={callButtonsContainerStyle} className="agent-buttons-container">
            <button
              onClick={() => connected && activeAgent === 'inbound' ? disconnectFromRoom() : connectToRoom('inbound')}
              disabled={connecting || (connected && activeAgent === 'outbound')}
              style={connecting || (connected && activeAgent === 'outbound') ? disabledButtonStyle : inboundButtonStyle}
              className="agent-button"
            >
              {connecting && activeAgent === 'inbound' && <div style={loadingSpinnerStyle}></div>}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
              {connected && activeAgent === 'inbound' ? 'End Inbound Call' : 'Inbound Agent'}
            </button>
            
            <button
              onClick={() => connected && activeAgent === 'outbound' ? disconnectFromRoom() : connectToRoom('outbound')}
              disabled={connecting || (connected && activeAgent === 'inbound')}
              style={connecting || (connected && activeAgent === 'inbound') ? disabledButtonStyle : outboundButtonStyle}
              className="agent-button"
            >
              {connecting && activeAgent === 'outbound' && <div style={loadingSpinnerStyle}></div>}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
              {connected && activeAgent === 'outbound' ? 'End Outbound Call' : 'Outbound Agent'}
            </button>
          </div>

          {/* Outbound Call Configuration Dropdowns - Beautiful Design */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            alignItems: 'center',
            marginTop: '20px',
            marginBottom: '20px'
          }}>
            {/* Scenario Dropdown */}
            <div style={{
              position: 'relative',
              width: '200px',
            }}>
              <select
                className="dropdown beautiful-dropdown"
                value={selectedScenario}
                onChange={e => setSelectedScenario(e.target.value)}
                disabled={connected}
                style={{
                  width: '200px',
                  padding: '12px 16px',
                  paddingRight: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  cursor: connected ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  background: connected 
                    ? 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: connected ? '#999' : 'white',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {SCENARIO_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} style={{ color: '#333', backgroundColor: 'white' }}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: connected ? '#999' : 'white'
              }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 8l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '12px',
                fontSize: '11px',
                fontWeight: '600',
                color: connected ? '#999' : '#667eea',
                backgroundColor: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                SCENARIO
              </div>
            </div>

            {/* Persona Dropdown */}
            <div style={{
              position: 'relative',
              width: '200px',
            }}>
              <select
                className="dropdown beautiful-dropdown"
                value={selectedPersona}
                onChange={e => setSelectedPersona(e.target.value)}
                disabled={connected}
                style={{
                  width: '200px',
                  padding: '12px 16px',
                  paddingRight: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: connected ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  background: connected 
                    ? 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)'
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: connected ? '#999' : 'white',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {PERSONA_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} style={{ color: '#333', backgroundColor: 'white' }}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: connected ? '#999' : 'white'
              }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 8l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '12px',
                fontSize: '11px',
                fontWeight: '600',
                color: connected ? '#999' : '#f093fb',
                backgroundColor: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                PERSONA
              </div>
            </div>
          </div>

          {/* Connection Status */}
          {connected && (
            <div style={{ 
              color: '#4CAF50', 
              fontSize: '14px', 
              textAlign: 'center',
              marginBottom: '16px',
              fontWeight: '500'
            }}>
              Connected to {activeAgent} agent
              {activeAgent === 'outbound' && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Scenario: {SCENARIO_OPTIONS.find(s => s.value === selectedScenario)?.label} | 
                  Persona: {PERSONA_OPTIONS.find(p => p.value === selectedPersona)?.label}
                </div>
              )}
            </div>
          )}

          {/* Speaking Indicator */}
          {connected && isSpeaking && (
            <div className="speaking-indicator">
              <div className="pulse-dot"></div>
              Agent is speaking...
            </div>
          )}
        </div>

        {/* Fixed height container to prevent layout shift */}
        <div className="chat-placeholder">
          {connected && (
            <div className="chat-container">
              <div className="chat-header">Live Chat</div>
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="no-messages">Call connected. Start speaking!</div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className="chat-message">
                      <span className="sender">{msg.sender}:</span> {msg.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bot Container */}
        <div className="bot-container">
          <img src={maisyBot} alt="mAIsy Assistant" className="bot-image" />
        </div>
      </div>
    </div>
  );
}

export default App;