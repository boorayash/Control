import { useState, useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'

const socket = io('http://localhost:3000')

function App() {
  const [status, setStatus] = useState('Waiting for connection...')
  const videoRef = useRef(null)
  const peerRef = useRef(null)

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

    return () => {
      socket.off('signal')
      if (peerRef.current) peerRef.current.destroy()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-50 p-4">
      <div className="w-full max-w-5xl aspect-video bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative shadow-2xl">
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain"
          autoPlay 
          playsInline 
          muted 
        />
        {status !== 'Connected to Host!' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 transition-opacity duration-300">
            <p className="text-lg font-medium text-slate-300 animate-pulse">{status}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
