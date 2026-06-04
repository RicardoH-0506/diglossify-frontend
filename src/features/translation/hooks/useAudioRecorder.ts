import { useState, useRef, useCallback } from 'react'

interface UseAudioRecorderProps {
  onResult: (text: string, translatedText: string) => void
}

export type AudioRecordingStatus = 'idle' | 'recording' | 'transcribing' | 'translating'

export function useAudioRecorder ({ onResult }: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<AudioRecordingStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close()
      }
    }
    setIsRecording(false)
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'stop' }))
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        setIsRecording(false)
      }
      mediaRecorderRef.current.stop()
    } else {
      cleanup()
    }
  }, [cleanup])

  const startRecording = useCallback(async (fromLang: string, toLang: string) => {
    try {
      setError(null)
      setIsRecording(true)
      setStatus('recording')

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Resolve the WebSocket URL from VITE_TRANSLATE_API_URL
      const apiUrl = import.meta.env.VITE_TRANSLATE_API_URL || 'http://localhost:1234/translate'
      const url = new URL(apiUrl)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${url.host}${url.pathname}`

      console.log(`Connecting to WebSocket translation server at: ${wsUrl}`)
      const socket = new WebSocket(wsUrl)
      socket.binaryType = 'arraybuffer'
      socketRef.current = socket

      socket.onopen = () => {
        console.log('WebSocket translation connection opened')
        socket.send(JSON.stringify({
          type: 'setup',
          fromLang,
          toLang
        }))
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket received:', data)
          if (data.type === 'status') {
            if (data.message === 'Transcribing...') {
              setStatus('transcribing')
            } else if (data.message === 'Translating...') {
              setStatus('translating')
            }
          } else if (data.type === 'result') {
            onResult(data.text, data.translatedText)
            setStatus('idle')
            socket.close()
          } else if (data.type === 'error') {
            setError(data.message)
            setStatus('idle')
            cleanup()
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err)
        setError('Failed to connect to the audio translation service')
        cleanup()
        setStatus('idle')
      }

      socket.onclose = () => {
        console.log('WebSocket translation connection closed')
        setIsRecording(false)
      }

      // Check supported MIME types for recording
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '' // browser default fallback
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          try {
            // Convertimos el Blob a ArrayBuffer explícitamente
            const arrayBuffer = await event.data.arrayBuffer()
            socket.send(arrayBuffer)
          } catch (err) {
            console.error('Error converting audio to ArrayBuffer:', err)
          }
        }
      }

      // Start recording with 500ms chunk intervals
      mediaRecorder.start(500)
    } catch (err: any) {
      console.error('Error initiating microphone recording:', err)
      setError(err.message || 'Permission denied or microphone unavailable')
      setIsRecording(false)
      setStatus('idle')
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [onResult, cleanup])

  return {
    isRecording,
    status,
    error,
    startRecording,
    stopRecording
  }
}
