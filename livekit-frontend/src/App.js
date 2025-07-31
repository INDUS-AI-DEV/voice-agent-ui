import { useState, useEffect } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './App.css';

// Import assets
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

  // Commented out backend verification for frontend testing only
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <form onSubmit={handleSubmit} style={{
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
        <button type="submit" disabled={loading || mpin.some(d => !d)} style={{
          width: '100%', padding: '10px 0', borderRadius: 8, background: '#1a73e8', color: '#fff', fontWeight: 'bold', fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 8
        }}>
          {loading ? 'Verifying...' : 'Login'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}

// Dabur2 Configuration Modal Component
function Dabur2ConfigModal({ isOpen, onClose, onSave, config, setConfig }) {
  // (showHierarchy, setShowHierarchy) removed as always true

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const clearForm = () => {
    setConfig({
      ...config,
      empId: '',
      employeeName: '',
      empPhone: '',
      rsmId: '',
      rsmName: '',
      rsmPhone: '',
      asmId: '',
      asmName: '',
      asmPhone: '',
      baSupervisorId: '',
      baSupervisorName: '',
      baSupervisorPhone: '',
      kamId: '',
      kamName: '',
      kamPhone: ''
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.7)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#333' }}>Additional Settings</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666'
          }}>×</button>
        </div>
        {/* Only advanced/hierarchy fields here! */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: 16 }}>Employee Information (Optional)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>Employee ID</label>
              <input
                type="text"
                placeholder="Employee ID"
                value={config.empId}
                onChange={e => setConfig({...config, empId: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>Employee Name</label>
              <input
                type="text"
                placeholder="Employee Name"
                value={config.employeeName}
                onChange={e => setConfig({...config, employeeName: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>Employee Phone</label>
              <input
                type="tel"
                placeholder="Employee Phone"
                value={config.empPhone}
                onChange={e => setConfig({...config, empPhone: e.target.value.replace(/[^0-9+]/g, '')})}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
          </div>

          {/* RSM */}
          <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: 14 }}>RSM - Regional Sales Manager</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>RSM ID</label>
                <input
                  type="text"
                  placeholder="RSM ID"
                  value={config.rsmId}
                  onChange={e => setConfig({...config, rsmId: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>RSM Name</label>
                <input
                  type="text"
                  placeholder="RSM Name"
                  value={config.rsmName}
                  onChange={e => setConfig({...config, rsmName: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>RSM Phone</label>
                <input
                  type="tel"
                  placeholder="RSM Phone"
                  value={config.rsmPhone}
                  onChange={e => setConfig({...config, rsmPhone: e.target.value.replace(/[^0-9+]/g, '')})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
            </div>
          </div>

          {/* ASM */}
          <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: 14 }}>ASM - Area Sales Manager</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>ASM ID</label>
                <input
                  type="text"
                  placeholder="ASM ID"
                  value={config.asmId}
                  onChange={e => setConfig({...config, asmId: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>ASM Name</label>
                <input
                  type="text"
                  placeholder="ASM Name"
                  value={config.asmName}
                  onChange={e => setConfig({...config, asmName: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>ASM Phone</label>
                <input
                  type="tel"
                  placeholder="ASM Phone"
                  value={config.asmPhone}
                  onChange={e => setConfig({...config, asmPhone: e.target.value.replace(/[^0-9+]/g, '')})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
            </div>
          </div>

          {/* BA Supervisor */}
          <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: 14 }}>BA Supervisor - Business Associate Supervisor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>BA Supervisor ID</label>
                <input
                  type="text"
                  placeholder="BA Supervisor ID"
                  value={config.baSupervisorId}
                  onChange={e => setConfig({...config, baSupervisorId: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>BA Supervisor Name</label>
                <input
                  type="text"
                  placeholder="BA Supervisor Name"
                  value={config.baSupervisorName}
                  onChange={e => setConfig({...config, baSupervisorName: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>BA Supervisor Phone</label>
                <input
                  type="tel"
                  placeholder="BA Supervisor Phone"
                  value={config.baSupervisorPhone}
                  onChange={e => setConfig({...config, baSupervisorPhone: e.target.value.replace(/[^0-9+]/g, '')})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
            </div>
          </div>

          {/* KAM */}
          <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: 14 }}>KAM - Key Account Manager</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>KAM ID</label>
                <input
                  type="text"
                  placeholder="KAM ID"
                  value={config.kamId}
                  onChange={e => setConfig({...config, kamId: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>KAM Name</label>
                <input
                  type="text"
                  placeholder="KAM Name"
                  value={config.kamName}
                  onChange={e => setConfig({...config, kamName: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, color: '#555' }}>KAM Phone</label>
                <input
                  type="tel"
                  placeholder="KAM Phone"
                  value={config.kamPhone}
                  onChange={e => setConfig({...config, kamPhone: e.target.value.replace(/[^0-9+]/g, '')})}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={clearForm}
            style={{
              background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px',
              borderRadius: 6, cursor: 'pointer', fontSize: 14
            }}
          >
            Clear Form
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: '#667eea', color: 'white', border: 'none', padding: '10px 20px',
              borderRadius: 6, cursor: 'pointer', fontSize: 14
            }}
          >
            Save
          </button>
        </div>
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
  const [callType, setCallType] = useState('web'); // 'web' or 'telephony'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [telephonyStatus, setTelephonyStatus] = useState('');
  const [language, setLanguage] = useState('Hi'); // Default to Hindi
  
  // Dabur2 configuration state
  const [showDabur2Config, setShowDabur2Config] = useState(false);
  const [dabur2Config, setDabur2Config] = useState({
    clientName: '',
    userPhone: '',
    empId: '',
    employeeName: '',
    empPhone: '',
    rsmId: '',
    rsmName: '',
    rsmPhone: '',
    asmId: '',
    asmName: '',
    asmPhone: '',
    baSupervisorId: '',
    baSupervisorName: '',
    baSupervisorPhone: '',
    kamId: '',
    kamName: '',
    kamPhone: ''
  });

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

  const connectToRoom = async () => {
    // Prevent multiple simultaneous connection attempts
    if (connecting || connected) return;
    setConnecting(true);
    try {
      const server_url = process.env.REACT_APP_TOKEN_SERVER_URL;
      console.log("Server url:", server_url);

      // 1. Dynamically generate a unique user ID
      const userId = `user-${Math.random().toString(36).substring(2, 8)}`;

      // 2. (Optional) Fixed room, or generate room dynamically if needed
      const roomId = `room-${Math.random().toString(36).substring(2, 8)}`;

      // 3. Build final URL dynamically, now with language param
      let fullUrl;
      if (callType === 'web') {
        // Use Dabur2 API endpoint for web calls
        const params = new URLSearchParams({
          room: roomId,
          user: userId,
          language: language,
          UserPhone: dabur2Config.userPhone
        });

        // Add optional hierarchical parameters if provided
        if (dabur2Config.empId) params.append('EmpId', dabur2Config.empId);
        if (dabur2Config.employeeName) params.append('EmployeeName', dabur2Config.employeeName);
        if (dabur2Config.empPhone) params.append('EmpPhone', dabur2Config.empPhone);
        if (dabur2Config.rsmId) params.append('RSMId', dabur2Config.rsmId);
        if (dabur2Config.rsmName) params.append('RSMName', dabur2Config.rsmName);
        if (dabur2Config.rsmPhone) params.append('RSMPhone', dabur2Config.rsmPhone);
        if (dabur2Config.asmId) params.append('ASMId', dabur2Config.asmId);
        if (dabur2Config.asmName) params.append('ASMName', dabur2Config.asmName);
        if (dabur2Config.asmPhone) params.append('ASMPhone', dabur2Config.asmPhone);
        if (dabur2Config.baSupervisorId) params.append('BASupervisorId', dabur2Config.baSupervisorId);
        if (dabur2Config.baSupervisorName) params.append('BASupervisorName', dabur2Config.baSupervisorName);
        if (dabur2Config.baSupervisorPhone) params.append('BASupervisorPhone', dabur2Config.baSupervisorPhone);
        if (dabur2Config.kamId) params.append('KAMId', dabur2Config.kamId);
        if (dabur2Config.kamName) params.append('KAMName', dabur2Config.kamName);
        if (dabur2Config.kamPhone) params.append('KAMPhone', dabur2Config.kamPhone);

        fullUrl = `${server_url}/dabur2?${params.toString()}`;
        console.log("Dabur2 API URL:", fullUrl);
      } else {
        // Use original API endpoint for telephony calls
        fullUrl = `${server_url}room=${roomId}&user=${userId}&language=${language}`;
        console.log("Original API URL:", fullUrl);
      }

      // 4. Fetch the token
      const resp = await fetch(fullUrl);
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to get token');
      }
      
      const data = await resp.json();
      const token = data.token;

      const newRoom = new Room();
      await newRoom.connect(process.env.REACT_APP_LIVEKIT_WS_URL, token);

      setRoom(newRoom);
      setConnected(true);

      const micTrack = await createLocalAudioTrack();
      await newRoom.localParticipant.publishTrack(micTrack);

      console.log('Connected and microphone publishing.');
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
      console.log('Disconnected.');
    } catch (err) {
      console.error('Error disconnecting:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleStartCall = async () => {
    if (callType === 'web') {
      if (!dabur2Config.clientName || !dabur2Config.userPhone) {
        alert('Please configure Dabur2 settings first');
        setShowDabur2Config(true);
        return;
      }
      connectToRoom();
    } else {
      // Telephony call logic
      setTelephonyStatus('');
      if (!phoneNumber || !clientName) {
        setTelephonyStatus('Please enter phone number and client name.');
        return;
      }
      setConnecting(true);
      try {
        const resp = await fetch('http://localhost:8000/api/start-telephony-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, clientName })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          setTelephonyStatus('Call Initiated');
        } else {
          setTelephonyStatus(data.error || 'Failed to initiate call');
        }
      } catch (err) {
        setTelephonyStatus('Network error');
      } finally {
        setConnecting(false);
      }
    }
  };

  const handleDabur2ConfigSave = (config) => {
    setDabur2Config(config);
    console.log('Dabur2 configuration saved:', config);
  };

  return (
    <div className="app-container">
      {!authenticated && <MPINModal onAuthenticate={() => setAuthenticated(true)} />}
      
      {/* Dabur2 Configuration Modal */}
      <Dabur2ConfigModal
        isOpen={showDabur2Config}
        onClose={() => setShowDabur2Config(false)}
        onSave={handleDabur2ConfigSave}
        config={dabur2Config}
        setConfig={setDabur2Config}
      />
      
      <div className="phone-mockup" style={{ filter: !authenticated ? 'blur(2px)' : 'none', pointerEvents: !authenticated ? 'none' : 'auto' }}>
        <div className="toggle-row">
          <span className="toggle-label" style={{ fontWeight: callType === 'web' ? 'bold' : 'normal' }}>Web Call</span>
          <label className="switch">
            <input type="checkbox" checked={callType === 'telephony'} onChange={e => setCallType(e.target.checked ? 'telephony' : 'web')} />
            <span className="slider round"></span>
          </label>
          <span className="toggle-label" style={{ fontWeight: callType === 'telephony' ? 'bold' : 'normal' }}>Telephony</span>
          
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
        </div>
        
        <div className="logo-container">
          <img src={maisyLogo} alt="mAIsy Logo" className="logo" />
          <div className="logo-subtitle">AI Ordering System</div>
        </div>
        
        {/* Web Call visible fields */}
        {callType === 'web' && (
          <div style={{ marginTop: 24, marginBottom: 16, width: '100%' }}>
            {/* Settings icon above the input boxes */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                onClick={() => setShowDabur2Config(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                  display: 'flex', alignItems: 'center', borderRadius: '50%', transition: 'background-color 0.2s',
                  color: '#667eea'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Advanced Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 5 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.25 1 1.51a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.66 0 1.25.39 1.51 1H21a2 2 0 0 1 0 4h-.09c-.26 0-.51.1-.7.29-.19.19-.29.44-.29.7z" />
                </svg>
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Client Name"
              value={dabur2Config.clientName}
              onChange={e => setDabur2Config({ ...dabur2Config, clientName: e.target.value })}
              style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
              required
            />
            <input
              type="text"
              placeholder="User Phone"
              value={dabur2Config.userPhone}
              onChange={e => setDabur2Config({ ...dabur2Config, userPhone: e.target.value.replace(/[^0-9+]/g, '') })}
              style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
              required
            />
          </div>
        )}
        
        {callType === 'telephony' && (
          <div style={{ marginTop: 24, marginBottom: 16, width: '100%' }}>
            <input
              type="text"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
              style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Client Name"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
            />
          </div>
        )}
        
        {callType === 'web' && dabur2Config.clientName && dabur2Config.userPhone && (
          <div style={{ marginTop: 24, marginBottom: 16, width: '100%', background: '#f0f8ff', padding: 15, borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>
              <strong>Configuration Ready:</strong>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Client: {dabur2Config.clientName} | Phone: {dabur2Config.userPhone}
            </div>
          </div>
        )}
        
        <div className="call-section">
          {/* Loader: Show when connecting and not isSpeaking */}
          {connecting && !isSpeaking && (
            <div className="connecting-loader">
              <div className="loader-spinner"></div>
              <div className="loader-text">Connecting to the agent...</div>
            </div>
          )}
          <div className="call-button-container">
            <button
              onClick={connected || connecting ? disconnectFromRoom : handleStartCall}
              className={`call-button ${connecting ? 'connecting' : ''} ${!connected && !connecting ? 'start-call' : 'end-call'}`}
              disabled={callType === 'telephony' && !connected && !connecting && (!phoneNumber || !clientName)}
            >
              <div className="call-icon">
                {!connected ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                  </svg>
                )}
              </div>
              {connecting && <div className="loading-ring"></div>}
            </button>
          </div>
          <div className="button-label">
            {connecting ? 'END CALL' : (!connected ? 'START CALL' : 'END CALL')}
          </div>
          {callType === 'telephony' && telephonyStatus && (
            <div style={{ color: telephonyStatus === 'Call Initiated' ? 'green' : 'red', marginTop: 8 }}>{telephonyStatus}</div>
          )}
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
        <div className="bot-container">
          <img src={maisyBot} alt="mAIsy Assistant" className="bot-image" />
        </div>
      </div>
    </div>
  );
}

export default App;
