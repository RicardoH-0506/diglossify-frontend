import type { TranslationRequest, TranslationResponse, TranslationError, Language } from '../types'

const TRANSLATE_API_URL = import.meta.env.VITE_TRANSLATE_API_URL || 'http://localhost:1234/translate'

export async function translateText (
  request: TranslationRequest,
  signal?: AbortSignal
): Promise<TranslationResponse> {
  const response = await fetch(TRANSLATE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromLang: request.fromLang,
      toLang: request.toLang,
      text: request.text
    }),
    signal
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (!data.data?.translatedText) {
    throw new Error('Invalid response format from translation API')
  }

  return {
    translatedText: data.data.translatedText,
    fromLang: request.fromLang === 'auto' ? 'en' : request.fromLang as Language,
    toLang: request.toLang,
    originalText: request.text
  }
}

export function validateTranslationRequest (request: TranslationRequest): TranslationError | null {
  if (!request.text.trim()) {
    return { message: 'Text to translate cannot be empty', code: 'EMPTY_TEXT' }
  }

  if (request.fromLang === request.toLang) {
    return { message: 'Source and target languages must be different', code: 'SAME_LANGUAGES' }
  }

  return null
}
