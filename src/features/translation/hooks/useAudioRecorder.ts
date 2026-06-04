import { useState, useRef, useCallback } from 'react'

interface UseAudioRecorderProps {
  onResult: (text: string, translatedText: string) => void
}

export type AudioRecordingStatus = 'idle' | 'recording' | 'transcribing' | 'translating'

export function useAudioRecorder ({ onResult }: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<AudioRecordingStatus>('idle')
  const [error, setError] = useState<string | null>(null)

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
      audioBufferRef.current = [] // Inicializamos el búfer vacío

      // 1. Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 2. Configurar el MediaRecorder y su evento primero (para tenerlo listo en memoria)
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
            if (socketRef.current?.readyState === WebSocket.OPEN && isWsReadyRef.current) {
              socketRef.current.send(arrayBuffer)
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

      // 3. Resolver la URL y abrir el WebSocket
      const apiUrl = import.meta.env.VITE_TRANSLATE_API_URL || 'http://localhost:1234/translate'
      const url = new URL(apiUrl)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${url.host}${url.pathname}`

      console.log(`Connecting to WebSocket: ${wsUrl}`)
      const socket = new WebSocket(wsUrl)
      socket.binaryType = 'arraybuffer'
      socketRef.current = socket

      // 4. Configurar los eventos del WebSocket
      socket.onopen = () => {
        console.log('WebSocket opened, sending setup...')
        socket.send(JSON.stringify({
          type: 'setup',
          fromLang,
          toLang
        }))

        isWsReadyRef.current = true

        // Vaciamos el búfer acumulado de inmediato si ya hay audio guardado
        if (audioBufferRef.current.length > 0) {
          console.log(`Sending ${audioBufferRef.current.length} buffered chunks`)
          audioBufferRef.current.forEach(chunk => socket.send(chunk))
          audioBufferRef.current = []
        }

        // 🔥 El único inicio de grabación válido: Solo cuando el WebSocket está abierto y seguro
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
          console.log('Starting MediaRecorder AFTER handshake secure.')
          mediaRecorderRef.current.start(500)
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
      }

      // 🛑 NOTA: Quitamos el mediaRecorder.start(500) que estaba aquí al final duplicado
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error initiating recording:', err)
      setError(errorMessage || 'Permission denied')
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
