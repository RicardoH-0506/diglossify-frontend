import { useEffect, useState, useCallback, useRef } from 'react'
import { useDebounce } from './useDebounce'
import type { fromLanguage, Language, TranslationRequest } from '../types'
import { translateText, validateTranslationRequest } from '../api/translation.api'

interface UseTranslationParams {
  readonly fromLang: fromLanguage
  readonly toLang: Language
  readonly fromText: string
}

interface UseTranslationReturn {
  readonly translatedText: string
  readonly error: string | null
  readonly loading: boolean
}

export function useTranslation ({
  fromLang,
  toLang,
  fromText
}: UseTranslationParams): UseTranslationReturn {
  const [translatedText, setTranslatedText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Aplica debounce al texto de entrada
  const debouncedText = useDebounce(fromText, 300)

  // Ref para evitar race conditions
  const requestIdRef = useRef<number>(0)

  const translate = useCallback(async (request: TranslationRequest, currentRequestId: number, signal: AbortSignal): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await translateText(request, signal)

      // Solo actualizar si es la petición más reciente
      if (currentRequestId === requestIdRef.current) {
        setTranslatedText(response.translatedText)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Ignorar si fue abortado
        return
      }
      // Solo actualizar si es la petición más reciente
      if (currentRequestId === requestIdRef.current) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
      }
    } finally {
      // Solo actualizar si es la petición más reciente
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // Incrementar el ID de la petición y crear un nuevo controller
    const currentRequestId = ++requestIdRef.current
    const controller = new AbortController()

    // No llamar a la API ni validar si el texto está vacío (limpieza silenciosa)
    if (!debouncedText.trim()) {
      setTranslatedText('')
      setError(null)
      setLoading(false)
      return
    }

    const requestPayload = {
      fromLang,
      toLang,
      text: debouncedText
    }

    // Validar la petición (por ejemplo, si los idiomas son iguales)
    const validationError = validateTranslationRequest(requestPayload)

    if (validationError) {
      setError(validationError.message)
      setTranslatedText('')
      setLoading(false)
      return
    }

    // Ejecutar la traducción pasando el signal del controller
    translate(requestPayload, currentRequestId, controller.signal)

    // Cleanup function: abortar la petición actual al cambiar los parámetros o desmontar
    return () => {
      controller.abort()
    }
  }, [debouncedText, fromLang, toLang, translate])

  return { translatedText, error, loading }
}
