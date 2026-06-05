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

  // Apply debounce to input text
  const debouncedText = useDebounce(fromText, 300)

  // Ref to avoid race conditions
  const requestIdRef = useRef<number>(0)

  const translate = useCallback(async (request: TranslationRequest, currentRequestId: number, signal: AbortSignal): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await translateText(request, signal)

      // Only update if it's the most recent request
      if (currentRequestId === requestIdRef.current) {
        setTranslatedText(response.translatedText)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Ignore if it was aborted
        return
      }
      // Only update if it's the most recent request
      if (currentRequestId === requestIdRef.current) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
      }
    } finally {
      // Only update if it's the most recent request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // Increment request ID and create new controller
    const currentRequestId = ++requestIdRef.current
    const controller = new AbortController()

    // Don't call the API or validate if the text is empty (silent cleanup)
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

    // Validate the request (for example, if the languages are the same)
    const validationError = validateTranslationRequest(requestPayload)

    if (validationError) {
      setError(validationError.message)
      setTranslatedText('')
      setLoading(false)
      return
    }

    // Execute the translation passing the controller's signal
    translate(requestPayload, currentRequestId, controller.signal)

    // Cleanup function: abort the current request when changing parameters or unmounting
    return () => {
      controller.abort()
    }
  }, [debouncedText, fromLang, toLang, translate])

  return { translatedText, error, loading }
}
