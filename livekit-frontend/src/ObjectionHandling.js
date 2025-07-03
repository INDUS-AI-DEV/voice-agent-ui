import React, { useState, useEffect } from 'react';
import { Room, createLocalAudioTrack, Track } from 'livekit-client';
import './ObjectionHandling.css';

const ObjectionHandling = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  const connectToRoom = async () => {
    if (connecting || connected) return;
    setConnecting(true);
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
      // Optionally show error UI
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
            src={process.env.PUBLIC_URL + '/character.png'} 
            alt="Business Character" 
            className="character-image-large"
            style={{marginLeft: 24}}
          />
          <div className="objection-buttons-col align-right" style={{marginTop: 40, marginBottom: 40, marginRight: 84, maxWidth: 260}}>
            <button
              className={`objection-btn qna ${connecting ? 'connecting' : ''} ${connected ? 'end-call' : 'start-call'}`}
              data-agent="persona_obj_handling"
              onClick={!connected ? connectToRoom : disconnectFromRoom}
              disabled={connecting}
            >
              {connecting ? 'CONNECTING...' : (!connected ? 'QnA' : 'END CALL')}
            </button>
            <button className="objection-btn shadow" data-agent="persona_manager_review" disabled={connecting || connected}>
              Shadow Review General
            </button>
            <button className="objection-btn shadow" data-agent="persona_manager_review_analytics" disabled={connecting || connected}>
              Shadow Review of Analytics
            </button>
            <button className="objection-btn roleplay-so" data-agent="persona_role_play" disabled={connecting || connected}>
              Role-Play SO (OH)
            </button>
            <button className="objection-btn roleplay-merchant" data-agent="persona_role_play_merchant" disabled={connecting || connected}>
              Role-Play Merchant (OH)
            </button>
          </div>
        </div>
        {connected && isSpeaking && (
          <div className="speaking-indicator">
            <div className="pulse-dot"></div>
            Agent is speaking...
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectionHandling;