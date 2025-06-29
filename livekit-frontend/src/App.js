import { useState, useEffect } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './App.css';

// Import assets
import maisyLogo from './assets/maisy-logo.png';
import greenCallButton from './assets/MakeCallButton.jpg';
import redCallButton from './assets/EndCallButton.jpg';
import maisyBot from './assets/maisy-image.png';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const mpinValue = mpin.join('');
    try {
      // Stubbed API call - replace with your backend endpoint
      const resp = await fetch('http://localhost:8000/api/verify-mpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpin: mpinValue })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        onAuthenticate();
      } else {
        setError(data.error || 'Invalid MPIN');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
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

      // 3. Build final URL dynamically
      const fullUrl = `${server_url}room=${roomId}&user=${userId}`;
      console.log("Final URL:", fullUrl);

      // 4. Fetch the token
      const resp = await fetch(fullUrl);
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

  return (
    <div className="app-container">
      {!authenticated && <MPINModal onAuthenticate={() => setAuthenticated(true)} />}
      <div className="phone-mockup" style={{ filter: !authenticated ? 'blur(2px)' : 'none', pointerEvents: !authenticated ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: 12 }}>
          <span style={{ marginRight: 8, fontWeight: callType === 'web' ? 'bold' : 'normal' }}>Web Call</span>
          <label className="switch">
            <input type="checkbox" checked={callType === 'telephony'} onChange={e => setCallType(e.target.checked ? 'telephony' : 'web')} />
            <span className="slider round"></span>
          </label>
          <span style={{ marginLeft: 8, fontWeight: callType === 'telephony' ? 'bold' : 'normal' }}>Telephony</span>
        </div>
        <div className="logo-container">
          <img src={maisyLogo} alt="mAIsy Logo" className="logo" />
          <div className="logo-subtitle">AI Ordering System</div>
        </div>

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

        <div className="call-section">
          <div className="call-button-container">
          <button
  onClick={!connected ? handleStartCall : disconnectFromRoom}
  className={`call-button ${connecting ? 'connecting' : ''} ${!connected ? 'start-call' : 'end-call'}`}
  disabled={connecting || (callType === 'telephony' && !connected && (!phoneNumber || !clientName))}
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
            {connecting ? 'CONNECTING...' : (!connected ? 'START CALL' : 'END CALL')}
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
