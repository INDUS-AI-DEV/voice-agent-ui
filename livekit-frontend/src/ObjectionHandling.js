import React, { useState, useEffect } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './ObjectionHandling.css';

const ObjectionHandling = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null); // Track which agent is being connected

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
      const server_url = process.env.REACT_APP_TOKEN_SERVER_URL;
      const userId = `user-${Math.random().toString(36).substring(2, 8)}`;
      const roomId = `room-${Math.random().toString(36).substring(2, 8)}`;
      // Add agent_type to the URL
      const fullUrl = `${server_url}room=${roomId}&user=${userId}&agent_type=${agentType}`;
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
      // Optionally show error UI
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="phone-mockup light-bg">
        <div className="logo-container">
          <img src={process.env.PUBLIC_URL + '/maisy-logo-grey.png'} alt="maisy logo" className="logo" />
          <div className="logo-subtitle">AI Agentic Shadow</div>
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

export default ObjectionHandling;