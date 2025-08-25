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

// Persona options for outbound calls
const PERSONA_OPTIONS = [
  { id: 1, value: 'existing_plumber_doing_business', label: 'Existing Plumber - Doing Business' },
  { id: 2, value: 'existing_plumber_infrequent_business', label: 'Existing Plumber - Infrequent Business' },
  { id: 3, value: 'existing_plumber_quit_business', label: 'Existing Plumber - Quit Business' },
  { id: 4, value: 'existing_plumber_not_doing_business', label: 'Existing Plumber - Not Doing Business' },
  { id: 5, value: 'new_plumber', label: 'New Plumber' },
  { id: 6, value: 'retailer', label: 'Retailer' },
];

// Scenario options for outbound calls
const SCENARIO_OPTIONS = [
  { value: 'engagement_awareness', label: 'Engagement & Awareness', persona: [1, 2, 3, 4, 5, 6] },
  { value: 'kyc_followups', label: 'KYC Follow-ups', persona: [2, 3, 4, 5, 6] },
  { value: 'rewards_and_redemption', label: 'Rewards & Redemption Encouragement', persona: [1, 2, 3, 4] },
  { value: 'referral_and_network_building', label: 'Referral & Network Building', persona: [1, 2, 3, 5, 6] },
  { value: 'feedback_and_satisfaction_checks', label: 'Feedback & Satisfaction Checks', persona: [1, 2, 3, 4, 6] },
  { value: 'service_followup', label: 'KYC Registration after plumber meet, plumber meet feedback', persona: [1, 2, 3, 4, 5] },
  { value: 'new_scheme_information', label: 'Point validity queries', persona: [1, 2, 3, 4, 5] },
  { value: 're_engage_the_inactive_plumbers', label: 'Re-engage Inactive Plumbers', persona: [2, 3, 4, 6] },
  { value: 'technical_assistance_and_pipe_configurator', label: 'Technical Assistance and Pipe Configurator', persona: [1, 6] },
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

// Tab Component
function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        border: 'none',
        background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
        color: active ? 'white' : '#b0bec5',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderRadius: active ? '12px 12px 0 0' : '12px 12px 0 0',
        borderBottom: active ? '3px solid #667eea' : 'none',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {children}
    </button>
  );
}

function App() {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('inbound'); // 'inbound' or 'outbound'
  const [activeAgent, setActiveAgent] = useState(null); // 'inbound' or 'outbound'
  const [language, setLanguage] = useState('Hi'); // Default to Hindi
  const [selectedScenario, setSelectedScenario] = useState(SCENARIO_OPTIONS[0].value);
  const [selectedPersona, setSelectedPersona] = useState(PERSONA_OPTIONS[0]);
  const [userName, setUserName] = useState('');

  // Get available scenarios for the selected persona
  const getAvailableScenarios = () => {
    return SCENARIO_OPTIONS.filter(scenario => 
      scenario.persona.includes(selectedPersona.id)
    );
  };

  // Handle persona change and update scenario if needed
  const handlePersonaChange = (personaValue) => {
    const newPersona = PERSONA_OPTIONS.find(p => p.value === personaValue);
    setSelectedPersona(newPersona);
    
    // Check if current scenario is valid for new persona
    const availableScenarios = SCENARIO_OPTIONS.filter(scenario => 
      scenario.persona.includes(newPersona.id)
    );
    
    // If current scenario is not available for new persona, select the first available one
    if (!availableScenarios.some(scenario => scenario.value === selectedScenario)) {
      setSelectedScenario(availableScenarios[0]?.value || SCENARIO_OPTIONS[0].value);
    }
  };

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
        urlParams += `&scenario=${selectedScenario}&persona=${selectedPersona.value}&user=${encodeURIComponent(userName)}`;
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

  // Call button styles
  const callButtonStyle = {
    width: '200px',
    padding: '8px 20px',
    borderRadius: '16px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    minHeight: '36px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    margin: '20px 0'
  };

  const inboundCallButtonStyle = {
    ...callButtonStyle,
    background: connected && activeAgent === 'inbound' 
      ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' 
      : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white'
  };

  const outboundCallButtonStyle = {
    ...callButtonStyle,
    background: connected && activeAgent === 'outbound' 
      ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' 
      : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    color: 'white'
  };

  const disabledButtonStyle = {
    ...callButtonStyle,
    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
    color: 'white',
    cursor: 'not-allowed',
    opacity: 0.6
  };

  const loadingSpinnerStyle = {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  // Dropdown styles
  const dropdownContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '280px',
    margin: '0 auto 20px',
    padding: '0 20px'
  };

  const dropdownStyle = {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '40px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    minHeight: '48px'
  };

  const dropdownLabelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#b0bec5',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div className="app-container">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .call-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }
        .call-button:active {
          transform: translateY(0);
        }
        .dropdown:hover, .dropdown:focus {
          border-color: #667eea !important;
          background: rgba(255, 255, 255, 0.15) !important;
        }
        .tab-content {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0 20px;
          margin-bottom: 20px;
          position: relative;
          z-index: 10;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-section img {
          width: 100px;
          height: auto;
        }
        .language-section {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 1000;
        }
        .language-dropdown {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-white);
          font-weight: 600;
          font-size: 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          outline: none;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          transition: background 0.2s;
          letter-spacing: 0.2px;
          min-width: 80px;
          z-index: 1001;
          position: relative;
          padding-right: 30px;
        }
        .language-dropdown:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .language-dropdown:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }
        .language-dropdown option {
          color: #000000;
          font-weight: 500;
          background: #ffffff;
          font-size: 14px;
        }
        /* Inbound tab specific logo styling */
        .inbound-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .inbound-logo-container img {
          width: 300px;
          height: auto;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
        }
        .inbound-logo-container .logo-subtitle {
          font-size: 18px;
          color: var(--text-gray);
          letter-spacing: 1px;
          font-weight: bold;
          text-align: center;
        }
        @media (max-width: 700px) {
          .header-container {
            padding: 0 16px;
            margin-bottom: 16px;
          }
          .logo-section img {
            width: 60px;
          }
          .logo-section .logo-subtitle {
            font-size: 14px;
          }
          .language-dropdown {
            font-size: 13px;
            padding: 6px 8px;
            min-width: 70px;
          }
          .inbound-logo-container img {
            width: 80px;
          }
          .inbound-logo-container .logo-subtitle {
            font-size: 16px;
          }
          .call-button {
            width: 180px !important;
            font-size: 14px !important;
            padding: 14px 16px !important;
            min-height: 48px !important;
          }
          .dropdown-container {
            max-width: 260px !important;
            padding: 0 16px !important;
          }
        }
      `}</style>
      
      {!authenticated && <MPINModal onAuthenticate={() => setAuthenticated(true)} />}
      
      <div className="phone-mockup" style={{
        filter: !authenticated ? 'blur(2px)' : 'none',
        pointerEvents: !authenticated ? 'none' : 'auto'
      }}>
        
        {/* Header with Logo and Language Dropdown */}
        <div className="header-container">
          <div className="logo-section">
            <img src={maisyLogo} alt="mAIsy Logo" />
          </div>
          
          <div className="language-section">
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
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 20 20" 
              fill="none" 
              style={{ 
                color: 'var(--text-white)', 
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 1002
              }}
            >
              <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* AI Call System Text */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '0 20px'
        }}>
          <div style={{
            fontSize: '18px',
            color: 'var(--text-gray)',
            letterSpacing: '1px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            AI Call System
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          width: '100%',
          marginBottom: '20px',
          gap: '4px',
          padding: '0 20px'
        }}>
          <TabButton 
            active={activeTab === 'inbound'} 
            onClick={() => setActiveTab('inbound')}
          >
            Inbound Agent
          </TabButton>
          <TabButton 
            active={activeTab === 'outbound'} 
            onClick={() => setActiveTab('outbound')}
          >
            Outbound Agent
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="tab-content" style={{ width: '100%', flex: 1 }}>
          {/* Inbound Tab */}
          {activeTab === 'inbound' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '20px'
            }}>
              {/* Loader: Show when connecting to inbound */}
              {connecting && activeAgent === 'inbound' && !isSpeaking && (
                <div className="connecting-loader">
                  <div className="loader-spinner"></div>
                  <div className="loader-text">Connecting to inbound agent...</div>
                </div>
              )}

              {/* Inbound Call Button - Fixed for single line text */}
              <button
                onClick={() => connected && activeAgent === 'inbound' ? disconnectFromRoom() : connectToRoom('inbound')}
                disabled={connecting || (connected && activeAgent === 'outbound')}
                style={{
                  ...(connecting || (connected && activeAgent === 'outbound') ? disabledButtonStyle : inboundCallButtonStyle),
                  whiteSpace: 'nowrap',
                  fontSize: '15px',
                  padding: '8px 24px',
                  minWidth: '220px'
                }}
                className="call-button"
              >
                {connecting && activeAgent === 'inbound' && <div style={loadingSpinnerStyle}></div>}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                {connected && activeAgent === 'inbound' ? 'End Inbound Call' : 'Start Inbound Call'}
              </button>

              {/* Connection Status for Inbound */}
              {connected && activeAgent === 'inbound' && (
                <div style={{ 
                  color: '#4CAF50', 
                  fontSize: '14px', 
                  textAlign: 'center',
                  marginTop: '16px',
                  fontWeight: '500'
                }}>
                  Connected to inbound agent
                </div>
              )}

              {/* Speaking Indicator for Inbound */}
              {connected && activeAgent === 'inbound' && isSpeaking && (
                <div className="speaking-indicator">
                  <div className="pulse-dot"></div>
                  Agent is speaking...
                </div>
              )}
            </div>
          )}

          {/* Outbound Tab */}
          {activeTab === 'outbound' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '20px'
            }}>
              {/* Loader: Show when connecting to outbound */}
              {connecting && activeAgent === 'outbound' && !isSpeaking && (
                <div className="connecting-loader">
                  <div className="loader-spinner"></div>
                  <div className="loader-text">Connecting to outbound agent...</div>
                </div>
              )}

              {/* Outbound Configuration Dropdowns */}
              <div style={dropdownContainerStyle} className="dropdown-container">
                {/* User Name Input */}
                <div style={{ position: 'relative' }}>
                  {/* <div style={dropdownLabelStyle}>User Name</div> */}
                  <input
                    type="text"
                    placeholder="Enter name..."
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    disabled={connected}
                    className="user-name-input"
                    style={{
                      ...dropdownStyle,
                      paddingRight: '16px', // Remove extra right padding since no dropdown arrow
                    }}
                  />
                </div>

                {/* Persona Dropdown */}
                <div style={{ position: 'relative' }}>
                  <div style={dropdownLabelStyle}>Persona</div>
                  <select
                    style={dropdownStyle}
                    value={selectedPersona.value}
                    onChange={e => handlePersonaChange(e.target.value)}
                    disabled={connected}
                  >
                    {PERSONA_OPTIONS.map(option => (
                      <option key={option.id} value={option.value} style={{ color: '#333', backgroundColor: 'white' }}>
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
                    color: 'white'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 8l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Scenario Dropdown */}
                <div style={{ position: 'relative' }}>
                  <div style={dropdownLabelStyle}>Scenario</div>
                  <select
                    style={dropdownStyle}
                    value={selectedScenario}
                    onChange={e => setSelectedScenario(e.target.value)}
                    disabled={connected}
                  >
                    {getAvailableScenarios().map(option => (
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
                    color: 'white'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 8l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Outbound Call Button - Improved for single line text */}
              <button
                onClick={() => connected && activeAgent === 'outbound' ? disconnectFromRoom() : connectToRoom('outbound')}
                disabled={connecting || (connected && activeAgent === 'inbound')}
                style={{
                  ...(connecting || (connected && activeAgent === 'inbound') ? disabledButtonStyle : outboundCallButtonStyle),
                  whiteSpace: 'nowrap',
                  fontSize: '15px',
                  padding: '8px 24px',
                  minWidth: '220px'
                }}
                className="call-button"
              >
                {connecting && activeAgent === 'outbound' && <div style={loadingSpinnerStyle}></div>}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                {connected && activeAgent === 'outbound' ? 'End Outbound Call' : 'Start Outbound Call'}
              </button>

              {/* Connection Status for Outbound */}
              {connected && activeAgent === 'outbound' && (
                <div style={{ 
                  color: '#4CAF50', 
                  fontSize: '14px', 
                  textAlign: 'center',
                  marginTop: '16px',
                  fontWeight: '500'
                }}>
                  Connected to outbound agent
                  <div style={{ fontSize: '12px', color: '#b0bec5', marginTop: '4px' }}>
                    User: {userName || 'Not specified'} | Scenario: {SCENARIO_OPTIONS.find(s => s.value === selectedScenario)?.label} | 
                    Persona: {PERSONA_OPTIONS.find(p => p.value === selectedPersona.value)?.label}
                  </div>
                </div>
              )}

              {/* Speaking Indicator for Outbound */}
              {connected && activeAgent === 'outbound' && isSpeaking && (
                <div className="speaking-indicator">
                  <div className="pulse-dot"></div>
                  Agent is speaking...
                </div>
              )}
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