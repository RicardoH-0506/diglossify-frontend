import { useEffect, useState, useCallback, useRef } from 'react'
import { useDebounce } from './useDebounce'
import type { fromLanguage, Language } from '../../../shared/types/types'
import { TranslationService, type TranslationRequest } from '../services/TranslationService'

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

  const translate = useCallback(async (request: TranslationRequest, currentRequestId: number): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await TranslationService.translate(request)

      // Solo actualizar si es la petición más reciente
      if (currentRequestId === requestIdRef.current) {
        setTranslatedText(response.translatedText)
      }
    } catch (err) {
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
    // Incrementar el ID de la petición
    const currentRequestId = ++requestIdRef.current

    // Validar la petición
    const validationError = TranslationService.validateRequest({
      fromLang,
      toLang,
      text: debouncedText
    })

    if (validationError) {
      setError(validationError.message)
      setTranslatedText('')
      setLoading(false)
      return
    }

    // No llamar a la API si el texto está vacío o los idiomas son iguales
    if (!debouncedText.trim() || fromLang === toLang) {
      setTranslatedText('')
      setError(null)
      setLoading(false)
      return
    }

    // Ejecutar la traducción
    translate({
      fromLang,
      toLang,
      text: debouncedText
    }, currentRequestId)

    // Cleanup function
    return () => {
      TranslationService.cancelCurrentRequest()
    }
  }, [debouncedText, fromLang, toLang, translate])

  return { translatedText, error, loading }
}
