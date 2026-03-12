import { useState, useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'

const socket = io('http://localhost:3000')

function App() {
  const [status, setStatus] = useState('Waiting for connection...')
  const videoRef = useRef(null)
  const peerRef = useRef(null)
  const lastMoveRef = useRef(0)

  useEffect(() => {
    socket.emit('join')

    socket.on('signal', (data) => {
      if (!peerRef.current) {
        setStatus('Incoming signal. Creating peer...')
        const peer = new SimplePeer({
          initiator: false,
          trickle: true,
          config: { iceServers: [] }
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
          setStatus('Connection error.')
        })

        peerRef.current = peer
      }
      
      peerRef.current.signal(data)
    })

    const handleMouseMove = (e) => {
      const now = Date.now()
      if (now - lastMoveRef.current < 16) return // ~60fps throttling
      lastMoveRef.current = now

      if (!videoRef.current) return
      const rect = videoRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      
      socket.emit('mouse-move', { x, y })
    }

    const handleMouseDown = (e) => {
      if (!videoRef.current) return
      const rect = videoRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      socket.emit('mouse-click', { x, y, button: e.button === 2 ? 'right' : 'left', action: 'down' })
    }

    const handleMouseUp = (e) => {
      if (!videoRef.current) return
      const rect = videoRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      socket.emit('mouse-click', { x, y, button: e.button === 2 ? 'right' : 'left', action: 'up' })
    }

    const handleKeyDown = (e) => {
      // Prevent default behavior for potential conflicting hotkeys only when focused
      socket.emit('key-event', { key: e.key, action: 'down', shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
    }

    const handleKeyUp = (e) => {
      socket.emit('key-event', { key: e.key, action: 'up', shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      socket.off('signal')
      if (peerRef.current) peerRef.current.destroy()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-[#020617] overflow-hidden flex items-center justify-center select-none touch-none font-sans antialiased text-slate-200">
      <video 
        ref={videoRef} 
        className={`w-full h-full object-contain cursor-none transition-opacity duration-1000 ${status === 'Connected to Host!' ? 'opacity-100' : 'opacity-0'}`}
        autoPlay 
        playsInline 
        muted 
        onMouseMove={(e) => {
          const now = Date.now()
          if (now - lastMoveRef.current < 16) return 
          lastMoveRef.current = now
          const rect = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width
          const y = (e.clientY - rect.top) / rect.height
          socket.emit('mouse-move', { x, y })
        }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width
          const y = (e.clientY - rect.top) / rect.height
          socket.emit('mouse-click', { x, y, button: e.button === 2 ? 'right' : 'left', action: 'down' })
        }}
        onMouseUp={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width
          const y = (e.clientY - rect.top) / rect.height
          socket.emit('mouse-click', { x, y, button: e.button === 2 ? 'right' : 'left', action: 'up' })
        }}
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
              <h2 className="text-2xl font-bold tracking-tight text-white">Connecting...</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Indicator Dot */}
      <div className="absolute top-6 right-6 flex items-center gap-3 px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-full border border-white/10 text-[11px] font-bold uppercase tracking-widest z-40 shadow-2xl">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${status === 'Connected to Host!' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'}`}></div>
        <span className={status === 'Connected to Host!' ? 'text-emerald-400' : 'text-rose-400'}>
          {status === 'Connected to Host!' ? 'Session Live' : 'Disconnected'}
        </span>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-extrabold flex gap-6 pointer-events-none opacity-40 hover:opacity-100 transition-all duration-300 z-40 group">
        <span className="group-hover:text-blue-400 transition-colors">Remote Interaction Enabled</span>
        <span className="w-px h-3 bg-white/10 self-center"></span>
        <span className="group-hover:text-indigo-400 transition-colors">60 FPS Ultra Low Latency</span>
      </div>
    </div>
  )
}

export default App
