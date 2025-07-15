import React, { useState } from 'react';
import { Room, createLocalAudioTrack } from 'livekit-client';
import './PhoneCallPage.css';
import { makeSingleCall } from "./api";

const PhoneCallPage = () => {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [clientDetails, setClientDetails] = useState({ phoneNumber: '', clientName: '' });
  const [productDetails, setProductDetails] = useState({ productList1: '', productList2: '' });

  // eslint-disable-next-line no-unused-vars
  const handleInputChange = (category, field, value) => {
    if (category === 'client') {
      setClientDetails(prev => ({ ...prev, [field]: value }));
    } else if (category === 'product') {
      setProductDetails(prev => ({ ...prev, [field]: value }));
    }
  };

  // eslint-disable-next-line no-unused-vars
  const makePhoneCall = async () => {
    if (connecting || connected) return;
    setConnecting(true);
    try {
      await makeSingleCall({ clientDetails, productDetails });
      // Continue with LiveKit room connection
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
      alert('Failed to initiate call: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const disconnectFromRoom = async () => {
    if (!room || connecting) return;
    setConnecting(true);
    try {
      await room.disconnect();
      setConnected(false);
      setRoom(null);
      setClientDetails({ phoneNumber: '', clientName: '' });
      setProductDetails({ productList1: '', productList2: '' });
    } catch (err) {
      alert('Error disconnecting: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="phone-call-page">
      <div className="phone-mockup">
        <div className="logo-container">
          <img src={process.env.PUBLIC_URL + '/IndusAI logo.png'} alt="Medibot Logo" className="logo" />
          <div className="logo-subtitle">AI Medicare System</div>
        </div>
        {/* ...rest of the UI for phone call... */}
      </div>
    </div>
  );
};

export default PhoneCallPage; 