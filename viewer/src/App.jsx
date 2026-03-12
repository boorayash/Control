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
    socket.on('signal', (data) => {
      if (!peerRef.current) {
        setStatus('Incoming signal. Creating peer...')
        const peer = new SimplePeer({
          initiator: false,
          trickle: true
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-50 p-4">
      <div className="w-full max-w-5xl aspect-video bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative shadow-2xl">
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain cursor-crosshair"
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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 transition-opacity duration-300">
            <p className="text-lg font-medium text-slate-300 animate-pulse">{status}</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-slate-500 uppercase tracking-widest font-medium">
        <span>Click video to control</span>
        <span className="w-px h-3 bg-slate-800 self-center"></span>
        <span>Keyboard active when window focused</span>
      </div>
    </div>
  )
}

export default App
