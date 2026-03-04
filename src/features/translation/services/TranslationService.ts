import type { fromLanguage, Language } from '../../../shared/types/types'

const TRANSLATE_API_URL = import.meta.env.VITE_TRANSLATE_API_URL || 'http://localhost:1234/translate'

export interface TranslationRequest {
  fromLang: fromLanguage
  toLang: Language
  text: string
}

export interface TranslationResponse {
  translatedText: string
  fromLang: Language
  toLang: Language
  originalText: string
}

export interface TranslationError {
  message: string
  code?: string
}

export class TranslationService {
  private static abortController: AbortController | null = null

  static async translate (request: TranslationRequest): Promise<TranslationResponse> {
    // Cancelar petición anterior
    if (this.abortController) {
      this.abortController.abort()
    }

    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
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
        fromLang: request.fromLang === 'auto' ? 'en' : request.fromLang,
        toLang: request.toLang,
        originalText: request.text
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Translation request was cancelled')
      }

      throw new Error(
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during translation'
      )
    }
  }

  static cancelCurrentRequest (): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  static validateRequest (request: TranslationRequest): TranslationError | null {
    if (!request.text.trim()) {
      return { message: 'El texto a traducir no puede estar vacío', code: 'EMPTY_TEXT' }
    }

    if (request.fromLang === request.toLang) {
      return { message: 'Los idiomas de origen y destino deben ser diferentes', code: 'SAME_LANGUAGES' }
    }

    return null
  }
}
