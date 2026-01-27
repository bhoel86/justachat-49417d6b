# VPS Private Calling Setup

The private calling feature (voice & video calls) works on both Lovable Cloud and the VPS deployment using WebRTC with Supabase Realtime for signaling.

## How It Works

1. **Signaling**: Uses Supabase Realtime broadcast channels to exchange WebRTC offers/answers
2. **ICE Servers**: Uses Google STUN servers + OpenRelay TURN servers for NAT traversal  
3. **Peer-to-Peer**: Audio/video flows directly between browsers after connection

## VPS Requirements

### 1. Supabase Realtime Must Be Enabled

Ensure the `realtime` container is running in your Docker stack:
```bash
cd ~/supabase/docker
docker compose ps | grep realtime
```

If not running:
```bash
docker compose up -d realtime
```

### 2. Firewall Rules

Ensure these ports are open for WebRTC:
- **UDP 3478** (STUN)
- **UDP 49152-65535** (RTP media, recommended range)
- **TCP 443** (TURN over TLS fallback)

On VPS with UFW:
```bash
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp
```

### 3. TURN Server (Optional but Recommended)

The default config uses free OpenRelay TURN servers. For production, consider:

**Option A: Coturn (Self-hosted)**
```bash
sudo apt install coturn
```

Edit `/etc/turnserver.conf`:
```
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
user=justachat:yourpassword
realm=justachat.net
```

Then update `src/lib/environment.ts` with your TURN server credentials.

**Option B: Paid TURN Service**
- Twilio Network Traversal Service
- Metered.ca (paid tier)
- Xirsys

## Testing Calls on VPS

1. Log in with two different accounts in different browsers
2. Open a PM window with the other user
3. Click the phone (voice) or camera (video) icon in the PM header
4. The other user should see an incoming call modal

## Troubleshooting

### "Call failed to connect"
- Check browser console for ICE connection errors
- Ensure both users have camera/mic permissions
- Try on a different network (some corporate firewalls block WebRTC)

### "No audio/video"
- Check browser permissions (camera/microphone)
- Ensure the track isn't muted (`track.enabled = true`)
- Check if remote stream has tracks: `remoteStream.getTracks()`

### Signaling Issues
- Check Realtime is running: `docker compose logs realtime`
- Verify Supabase Realtime subscription in browser DevTools Network tab

## Bot Voice Calls

Bot voice calls use browser-native Web Speech APIs:

### On Lovable Cloud (Preview)
- Uses AI chat-bot edge function for intelligent responses
- Browser SpeechRecognition for user input
- Browser SpeechSynthesis for bot voice output

### On VPS (Production)
- Falls back to canned responses (no AI API required)
- Browser SpeechRecognition for user input  
- Browser SpeechSynthesis for bot voice output

This ensures the feature works without external AI API keys on VPS.
