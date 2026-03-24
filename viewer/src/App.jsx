import { useState, useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const socket = io(SERVER_URL, {
  transports: ['polling', 'websocket'],
  extraHeaders: {
    "ngrok-skip-browser-warning": "69420"
  }
})

function App() {
  const [view, setView] = useState('landing') // 'landing' | 'session'
  const [status, setStatus] = useState('Waiting for host...')
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const [hostStatus, setHostStatus] = useState(null) // null | 'checking' | 'online' | 'offline'
  const [signalingStatus, setSignalingStatus] = useState('disconnected')
  
  const videoRef = useRef(null)
  const peerRef = useRef(null)
  const lastMoveRef = useRef(0)

  useEffect(() => {
    socket.on('connect', () => {
        setSignalingStatus('connected');
        setError('');
    });
    socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err);
        setSignalingStatus('error');
        setError('Connection to signaling server failed. Check ngrok URL.');
    });
    socket.on('disconnect', () => setSignalingStatus('disconnected'));
    
    return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
    };
  }, []);

  const checkHostStatus = (code) => {
    if (!code.trim()) return;
    setHostStatus('checking');
    socket.emit('check-room-status', code.trim(), (response) => {
      setHostStatus(response.online ? 'online' : 'offline');
    });
  };

  const handleJoin = (e) => {
    e?.preventDefault();
    const code = roomId.trim();
    if (!code) return setError('Please enter a valid Room ID');
    setError('');
    setHostStatus('checking');
    socket.emit('check-room-status', code, (response) => {
      if (response.online) {
        setHostStatus('online');
        setView('session');
        setStatus('Negotiating connection...');
      } else {
        setHostStatus('offline');
        setError('Host is offline. Make sure the Agent is running.');
      }
    });
  };

  const handleStopSession = () => {
    if (peerRef.current) {
      peerRef.current.destroy()
    }
    socket.emit('manual-disconnect')
    setView('landing')
    setStatus('Ready to connect')
    setHostStatus(null)
  }

  useEffect(() => {
    socket.on('remote-disconnected', () => {
      console.log('Host disconnected manually');
      if (peerRef.current) peerRef.current.destroy();
      setView('landing');
      setStatus('Host terminated the session');
      setHostStatus(null);
    });

    return () => {
      socket.off('remote-disconnected');
    }
  }, []);

  useEffect(() => {
    if (view !== 'session') return;

    socket.emit('join-room', roomId)
    
    // Explicitly notify the agent that we are ready to receive an offer
    const readyTimer = setTimeout(() => {
      socket.emit('viewer-ready')
    }, 1000)

    socket.on('signal', (data) => {
      if (!peerRef.current || peerRef.current.destroyed) {
        setStatus('Initializing stream...')
        const peer = new SimplePeer({
          initiator: false,
          trickle: true,
          config: { 
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
          }
        })

        peer.on('signal', signalData => {
          socket.emit('signal', signalData)
        })

        peer.on('connect', () => {
          setStatus('Connected to Host!')
        })

        peer.on('stream', stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(e => console.error("Auto-play prevented", e))
          }
        })

        peer.on('error', err => {
          console.error("Peer error:", err)
          setStatus('Connection failure. Retrying...')
          peer.destroy()
        })

        peer.on('close', () => {
          peerRef.current = null
        })

        peerRef.current = peer
      }
      
      try {
        peerRef.current.signal(data)
      } catch (e) {
        console.error("Signal error:", e)
      }
    })

    const handleKeyDown = (e) => socket.emit('key-event', { key: e.key, action: 'down' })
    const handleKeyUp = (e) => socket.emit('key-event', { key: e.key, action: 'up' })

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      clearTimeout(readyTimer)
      socket.off('signal')
      if (peerRef.current) peerRef.current.destroy()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [view, roomId])

  // Coordinate Mapping logic (same as before)
  const getNormalizedCoords = (e) => {
    if (!videoRef.current) return null;
    const rect = videoRef.current.getBoundingClientRect();
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    if (!videoWidth || !videoHeight) return null;
    const containerRatio = rect.width / rect.height;
    const videoRatio = videoWidth / videoHeight;
    let actualWidth, actualHeight, offsetX, offsetY;
    if (containerRatio > videoRatio) {
      actualHeight = rect.height;
      actualWidth = rect.height * videoRatio;
      offsetX = (rect.width - actualWidth) / 2;
      offsetY = 0;
    } else {
      actualWidth = rect.width;
      actualHeight = rect.height / videoRatio;
      offsetX = 0;
      offsetY = (rect.height - actualHeight) / 2;
    }
    const relativeX = e.clientX - rect.left - offsetX;
    const relativeY = e.clientY - rect.top - offsetY;
    const x = Math.max(0, Math.min(1, relativeX / actualWidth));
    const y = Math.max(0, Math.min(1, relativeY / actualHeight));
    return { x, y };
  };

  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastMoveRef.current < 16) return;
    lastMoveRef.current = now;
    const coords = getNormalizedCoords(e);
    if (coords) socket.emit('mouse-move', coords);
  };

  const handleMouseDown = (e) => {
    const coords = getNormalizedCoords(e);
    if (coords) socket.emit('mouse-click', { ...coords, button: e.button === 2 ? 'right' : 'left', action: 'down' });
  };

  const handleMouseUp = (e) => {
    const coords = getNormalizedCoords(e);
    if (coords) socket.emit('mouse-click', { ...coords, button: e.button === 2 ? 'right' : 'left', action: 'up' });
  };

  if (view === 'landing') {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 font-sans selection:bg-blue-500/30 overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(2,6,23,1)_100%)]" />
        
        <main className="relative z-10 w-full max-w-5xl space-y-16 py-12">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${signalingStatus === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${signalingStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              {signalingStatus === 'connected' ? 'Server Connected' : signalingStatus === 'checking' ? 'Connecting...' : 'Server Offline'}
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-4 leading-none">
              CONTROL<span className="text-blue-500">.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
              Ultra-low latency remote desktop for the modern web. Direct peer-to-peer streaming with native speed.
            </p>
          </div>

          {/* How It Works */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Download Agent', desc: 'Install and run the Host Agent on the computer you want to share.' },
              { step: '02', title: 'Share Code', desc: 'Copy the permanent Access Code displayed on the Agent dashboard.' },
              { step: '03', title: 'Connect', desc: 'Enter the code here and get instant, secure access to the remote screen.' },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-3">
                <div className="text-blue-500 text-3xl font-black opacity-40">{item.step}</div>
                <h4 className="text-white font-bold text-sm">{item.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Two Column: Download + Join */}
          <div className="grid md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
            {/* Left: Download */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest">Share this computer</h3>
              <div className="group relative p-6 bg-slate-900/40 backdrop-blur-3xl rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                  <svg className="w-24 h-24" fill="white" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                </div>
                <p className="text-slate-400 text-sm mb-6 relative z-10">Download the Host Agent, run it, and share your permanent Access Code with the viewer.</p>
                <a href="https://github.com/boorayash/Control/releases/latest/download/ControlAgentInstaller.exe" download className="relative z-10 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-[0_10px_40px_-10px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] block text-center">
                  Download Host Agent (.exe)
                </a>
              </div>
            </div>

            {/* Right: Join Session */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest">Access remote screen</h3>
              <div className="p-8 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-colors" />
                
                <form onSubmit={handleJoin} className="space-y-6 relative z-10">
                  <div className="space-y-3">
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Access Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CTL-A7X9K2"
                      value={roomId}
                      onChange={(e) => {
                        setRoomId(e.target.value.toUpperCase());
                        setError('');
                        setHostStatus(null);
                      }}
                      onBlur={() => checkHostStatus(roomId)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-lg font-mono tracking-wider"
                    />
                    {/* Host Status Indicator */}
                    {hostStatus && (
                      <div className={`flex items-center gap-2 px-1 text-xs font-semibold ${
                        hostStatus === 'online' ? 'text-emerald-400' :
                        hostStatus === 'offline' ? 'text-rose-400' :
                        'text-slate-400'
                      }`}>
                        {hostStatus === 'checking' && 'Checking host...'}
                        {hostStatus === 'online' && 'Host is online'}
                        {hostStatus === 'offline' && 'Host is offline'}
                      </div>
                    )}
                    {error && <p className="text-rose-500 text-xs font-medium pl-1">{error}</p>}
                  </div>

                  <div className="space-y-4">
                    <button type="submit" className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed" disabled={hostStatus === 'checking'}>
                      {hostStatus === 'checking' ? 'Checking...' : 'Join Session'}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
                      Direct P2P • Encrypted • 60 FPS
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>

        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020617] overflow-hidden flex items-center justify-center select-none touch-none font-sans antialiased text-slate-200">
      <video 
        ref={videoRef} 
        className={`w-full h-full object-contain cursor-none transition-opacity duration-1000 ${status === 'Connected to Host!' ? 'opacity-100' : 'opacity-0'}`}
        autoPlay 
        playsInline 
        muted 
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {status !== 'Connected to Host!' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/95 backdrop-blur-xl z-50">
          <div className="text-center space-y-8 max-w-sm px-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-lg opacity-20"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white uppercase tracking-wider">{status === 'Initializing stream...' ? 'Establishing Bridge' : 'Connecting...'}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">{status}</p>
            </div>
            <button 
              onClick={() => {
                if (peerRef.current) peerRef.current.destroy();
                setView('landing');
              }}
              className="px-6 py-2 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel Attempt
            </button>
          </div>
        </div>
      )}

      {/* Connection Indicator Dot */}
      <div className="absolute top-6 right-6 flex items-center gap-3 px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-full border border-white/10 text-[11px] font-bold uppercase tracking-widest z-40 shadow-2xl">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${status === 'Connected to Host!' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'}`}></div>
        <span className={status === 'Connected to Host!' ? 'text-emerald-400' : 'text-rose-400'}>
          {status === 'Connected to Host!' ? 'Session Live' : 'Disconnected'}
        </span>
        {status === 'Connected to Host!' && (
          <>
            <div className="w-px h-3 bg-white/10 mx-1"></div>
            <button 
              onClick={handleStopSession}
              className="text-rose-400 hover:text-rose-300 transition-colors uppercase font-black"
            >
              Stop
            </button>
          </>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-extrabold flex gap-6 pointer-events-none opacity-40 hover:opacity-100 transition-all duration-300 z-40 group">
        <span className="group-hover:text-blue-400 transition-colors">Room: {roomId}</span>
        <span className="w-px h-3 bg-white/10 self-center"></span>
        <span className="group-hover:text-indigo-400 transition-colors">60 FPS Ultra Low Latency</span>
      </div>
    </div>
  )
}

export default App
