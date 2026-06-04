import { useState, useRef, useCallback } from 'react'

interface UseAudioRecorderProps {
  onResult: (text: string, translatedText: string) => void
}

export type AudioRecordingStatus = 'idle' | 'recording' | 'transcribing' | 'translating'

export function useAudioRecorder ({ onResult }: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<AudioRecordingStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Estado para bloquear la interfaz mientras el WebSocket conecta
  const [isInitializing, setIsInitializing] = useState(false)

  const isWsReadyRef = useRef(false)
  // Búfer para guardar el audio mientras el servidor se conecta
  const audioBufferRef = useRef<ArrayBuffer[]>([])

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
    isWsReadyRef.current = false
    audioBufferRef.current = [] // Limpiamos el búfer
    setIsRecording(false)
    setIsInitializing(false) // Limpiamos el estado de inicialización
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
      isWsReadyRef.current = false
      setIsInitializing(true) // Activamos la inicialización en cuanto inicia el proceso
      audioBufferRef.current = [] // Inicializamos el búfer vacío

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const apiUrl = import.meta.env.VITE_TRANSLATE_API_URL || 'http://localhost:1234/translate'
      const url = new URL(apiUrl)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${url.host}${url.pathname}`

      console.log(`Connecting to WebSocket: ${wsUrl}`)
      const socket = new WebSocket(wsUrl)
      socket.binaryType = 'arraybuffer'
      socketRef.current = socket

      socket.onopen = () => {
        console.log('WebSocket opened, sending setup...')
        socket.send(JSON.stringify({
          type: 'setup',
          fromLang,
          toLang
        }))

        isWsReadyRef.current = true
        setIsInitializing(false) // Conectado con éxito ya se puede liberar el botón

        // Vaciamos el búfer acumulado de inmediato si ya hay audio guardado
        if (audioBufferRef.current.length > 0) {
          console.log(`Sending ${audioBufferRef.current.length} buffered chunks`)
          audioBufferRef.current.forEach(chunk => socket.send(chunk))
          audioBufferRef.current = []
        }
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
        console.error('WebSocket error:', err)
        setError('Failed to connect to the audio translation service')
        cleanup()
        setStatus('idle')
      }

      socket.onclose = () => {
        console.log('WebSocket closed')
        setIsRecording(false)
        setIsInitializing(false)
      }

      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/ogg'
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = ''

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            const arrayBuffer = await event.data.arrayBuffer()

            // ¿El canal está listo y abierto? Envíalo en vivo
            if (socket.readyState === WebSocket.OPEN && isWsReadyRef.current) {
              socket.send(arrayBuffer)
            } else {
              // ¿No está listo el servidor aún? Lo guardamos en la sala de espera
              console.log('Server not ready, buffering audio chunk...')
              audioBufferRef.current.push(arrayBuffer)
            }
          } catch (err) {
            console.error('Error handling audio chunk:', err)
          }
        }
      }

      mediaRecorder.start(500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error initiating recording:', err)
      setError(errorMessage || 'Permission denied')
      setIsRecording(false)
      setIsInitializing(false)
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
    isInitializing, //  Retornamos la nueva bandera para que TranslationContainer la use
    startRecording,
    stopRecording
  }
}
