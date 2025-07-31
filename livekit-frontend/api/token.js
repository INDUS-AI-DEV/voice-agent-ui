import { AccessToken, VideoGrant } from 'livekit-server-sdk';

export default async function handler(req, res) {
  const { room, user, language, UserPhone, EmpId, EmployeeName, EmpPhone, RSMId, RSMName, RSMPhone, ASMId, ASMName, ASMPhone, BASupervisorId, BASupervisorName, BASupervisorPhone, KAMId, KAMName, KAMPhone } = req.query;

  // Check if this is a Dabur2 request
  if (req.url.includes('/dabur2')) {
    // Validate required parameters for Dabur2
    if (!room || !user || !language || !UserPhone) {
      return res.status(400).json({ 
        error: 'Missing required parameters for Dabur2. Required: room, user, language, UserPhone' 
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user,
    });

    at.addGrant(
      new VideoGrant({
        roomJoin: true,
        room: room,
        canPublish: true,
        canSubscribe: true,
      })
    );

    // Add metadata with all Dabur2 parameters
    const metadata = {
      language,
      user,
      UserPhone,
      EmpId: EmpId ? parseInt(EmpId) : null,
      EmployeeName: EmployeeName || null,
      EmpPhone: EmpPhone || null,
      RSMId: RSMId || null,
      RSMName: RSMName || null,
      RSMPhone: RSMPhone || null,
      ASMId: ASMId || null,
      ASMName: ASMName || null,
      ASMPhone: ASMPhone || null,
      BASupervisorId: BASupervisorId || null,
      BASupervisorName: BASupervisorName || null,
      BASupervisorPhone: BASupervisorPhone || null,
      KAMId: KAMId || null,
      KAMName: KAMName || null,
      KAMPhone: KAMPhone || null
    };

    at.metadata = JSON.stringify(metadata);

    const token = at.toJwt();

    res.status(200).json({ token });
    return;
  }

  // Original token logic for backward compatibility
  if (!room || !user) {
    return res.status(400).json({ error: 'Missing room or user parameter' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user,
  });

  at.addGrant(
    new VideoGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
    })
  );

  const token = at.toJwt();

  res.status(200).json({ token });
}
