import React, { useState, useEffect } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './ObjectionHandling.css';

const LANGUAGE_OPTIONS = [
  { value: 'Hi', label: 'Hindi' },
  { value: 'En', label: 'English' },
  { value: 'Ta', label: 'Tamil' },
  { value: 'Ar', label: 'Arabic' },
  // { value: 'Af', label: 'African' },
];

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
      const server_url = process.env.REACT_APP_BACKEND_SERVER
      const resp = await fetch(`${server_url}/api/verify-mpin`, {
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

const ObjectionHandlingBackup = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [room, setRoom] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null); // Track which agent is being connected
  const [language, setLanguage] = useState('Hi');

  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track, publication, participant) => {
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

    const handleTrackUnsubscribed = (track, publication, participant) => {
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

  // agentType: one of the allowed agent types
  const connectToRoom = async (agentType) => {
    if (connecting || connected) return;
    setActiveAgent(agentType);
    setConnecting(true);
    try {
      // Different server URLs for each agent type
      let server_url;
      let ws_url;
      
      switch(agentType) {
        case 'persona_obj_handling':
          server_url = process.env.REACT_APP_TOKEN_SERVER_URL_OBJ_HANDLING;
          ws_url = process.env.REACT_APP_LIVEKIT_WS_URL_OBJ_HANDLING;
          break;
        case 'persona_manager_review':
          server_url = process.env.REACT_APP_TOKEN_SERVER_URL_MANAGER_REVIEW;
          ws_url = process.env.REACT_APP_LIVEKIT_WS_URL_MANAGER_REVIEW;
          break;
        case 'persona_manager_review_analytics':
          server_url = process.env.REACT_APP_TOKEN_SERVER_URL_MANAGER_REVIEW_ANALYRICS;
          ws_url = process.env.REACT_APP_LIVEKIT_WS_URL_MANAGER_REVIEW_ANALYRICS;
          break;
        case 'persona_role_play':
          server_url = process.env.REACT_APP_TOKEN_SERVER_URL_ROLE_PLAY;
          ws_url = process.env.REACT_APP_LIVEKIT_WS_URL_ROLE_PLAY;
          break;
        case 'persona_role_play_merchant':
          server_url = process.env.REACT_APP_TOKEN_SERVER_URL_MERCHANT;
          ws_url = process.env.REACT_APP_LIVEKIT_WS_URL_MERCHANT;
          break;
        default:
          server_url = process.env.REACT_APP_TOKEN_SERVER_URL_OBJECTION2;
          ws_url = process.env.REACT_APP_LIVEKIT_WS_URL_OBJECTION2;
      }

      const userId = `user-${Math.random().toString(36).substring(2, 8)}`;
      const roomId = `room-${Math.random().toString(36).substring(2, 8)}`;
      // Add language parameter in URL for backup version
      const fullUrl = `${server_url}room=${roomId}&user=${userId}&agent_type=${agentType}&language=${language}`;
      console.log("Backup Full URL:", fullUrl);
      
      const resp = await fetch(fullUrl);
      const data = await resp.json();
      const token = data.token;
      const newRoom = new Room();
      await newRoom.connect(ws_url, token);
      setRoom(newRoom);
      setConnected(true);
      const micTrack = await createLocalAudioTrack();
      await newRoom.localParticipant.publishTrack(micTrack);
    } catch (err) {
      console.error('Error connecting to Agent:', err);
      // Optionally show error UI
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromRoom = async () => {
    if (!room || connecting) return;
    setConnecting(true);
    setActiveAgent(null);
    try {
      await room.disconnect();
      setConnected(false);
      setRoom(null);
      setIsSpeaking(false);
    } catch (err) {
      console.error('Error disconnecting:', err);
      // Optionally show error UI
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="app-container">
      {!authenticated && <MPINModal onAuthenticate={() => setAuthenticated(true)} />}
      <div className="phone-mockup light-bg">
        {/* Logo and Language Dropdown Row */}
        <div className="logo-lang-row">
          <div className="logo-container" style={{ marginBottom: 0 }}>
            <img src={process.env.PUBLIC_URL + '/maisy-logo-grey.png'} alt="maisy logo" className="logo" />
            <div className="logo-subtitle">AI Agentic Shadow</div>
          </div>
          
          <div className="language-dropdown-container objection-language-dropdown-container">
            <select
              className="language-dropdown objection-language-dropdown"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              aria-label="Select Language"
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="language-dropdown-arrow objection-language-dropdown-arrow">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ verticalAlign: 'middle' }}>
                <path d="M5 8l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          
        </div>
        <div className="objection-content-row">
          <img 
            src={process.env.PUBLIC_URL + '/Cartoon.png'} 
            alt="Business Cartoon" 
            className="character-image-large"
            style={{marginLeft: 24, marginTop: -68}}
          />
          <div className="objection-buttons-col align-right" style={{marginTop: 40, marginBottom: 40, marginRight: 84, maxWidth: 260}}>
            <button
              className={`objection-btn qna ${connecting && activeAgent === 'persona_obj_handling' ? 'connecting' : ''} ${connected && activeAgent === 'persona_obj_handling' ? 'end-call' : 'start-call'}`}
              data-agent="persona_obj_handling"
              onClick={!connected ? () => connectToRoom('persona_obj_handling') : disconnectFromRoom}
              disabled={connecting || (connected && activeAgent !== 'persona_obj_handling')}
            >
              {connecting && activeAgent === 'persona_obj_handling' ? 'CONNECTING...' : (!connected || activeAgent !== 'persona_obj_handling' ? 'QnA' : 'END CALL')}
            </button>
            <button
              className={`objection-btn shadow ${connecting && activeAgent === 'persona_manager_review' ? 'connecting' : ''} ${connected && activeAgent === 'persona_manager_review' ? 'end-call' : ''}`}
              data-agent="persona_manager_review"
              onClick={!connected ? () => connectToRoom('persona_manager_review') : disconnectFromRoom}
              disabled={connecting || (connected && activeAgent !== 'persona_manager_review')}
            >
              {connecting && activeAgent === 'persona_manager_review' ? 'CONNECTING...' : (!connected || activeAgent !== 'persona_manager_review' ? 'Shadow Review General' : 'END CALL')}
            </button>
            <button
              className={`objection-btn shadow ${connecting && activeAgent === 'persona_manager_review_analytics' ? 'connecting' : ''} ${connected && activeAgent === 'persona_manager_review_analytics' ? 'end-call' : ''}`}
              data-agent="persona_manager_review_analytics"
              onClick={!connected ? () => connectToRoom('persona_manager_review_analytics') : disconnectFromRoom}
              disabled={connecting || (connected && activeAgent !== 'persona_manager_review_analytics')}
            >
              {connecting && activeAgent === 'persona_manager_review_analytics' ? 'CONNECTING...' : (!connected || activeAgent !== 'persona_manager_review_analytics' ? 'Shadow Review of Analytics' : 'END CALL')}
            </button>
            <button
              className={`objection-btn roleplay-so ${connecting && activeAgent === 'persona_role_play' ? 'connecting' : ''} ${connected && activeAgent === 'persona_role_play' ? 'end-call' : ''}`}
              data-agent="persona_role_play"
              onClick={!connected ? () => connectToRoom('persona_role_play') : disconnectFromRoom}
              disabled={connecting || (connected && activeAgent !== 'persona_role_play')}
            >
              {connecting && activeAgent === 'persona_role_play' ? 'CONNECTING...' : (!connected || activeAgent !== 'persona_role_play' ? 'Role-Play SO (OH)' : 'END CALL')}
            </button>
            <button
              className={`objection-btn roleplay-merchant ${connecting && activeAgent === 'persona_role_play_merchant' ? 'connecting' : ''} ${connected && activeAgent === 'persona_role_play_merchant' ? 'end-call' : ''}`}
              data-agent="persona_role_play_merchant"
              onClick={!connected ? () => connectToRoom('persona_role_play_merchant') : disconnectFromRoom}
              disabled={connecting || (connected && activeAgent !== 'persona_role_play_merchant')}
            >
              {connecting && activeAgent === 'persona_role_play_merchant' ? 'CONNECTING...' : (!connected || activeAgent !== 'persona_role_play_merchant' ? 'Role-Play Merchant (OH)' : 'END CALL')}
            </button>
          </div>
        </div>
        {connected && isSpeaking && (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <div className="speaking-indicator">
              <div className="pulse-dot" style={{ marginRight: 8 }}></div>
              Agent is speaking
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectionHandlingBackup; 
