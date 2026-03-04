import type { SUPPORTED_LANGUAGES, AUTO_LANGUAGE } from '../constants/constants'

export type Language = keyof typeof SUPPORTED_LANGUAGES
export type AutoLanguage = typeof AUTO_LANGUAGE
export type FromLanguage = Language | AutoLanguage
export type fromLanguage = FromLanguage // Backward compatibility

export interface TranslationState {
  readonly fromLang: FromLanguage
  readonly toLang: Language
  readonly fromText: string
  readonly result: string
  readonly loading: boolean
}

export interface State {
  readonly fromLang: fromLanguage
  readonly toLang: Language
  readonly fromText: string
  readonly result: string
  readonly loading: boolean
}

export type TranslationAction =
  | { readonly type: 'INTERCHANGE_LANGUAGES' }
  | { readonly type: 'SET_FROM_LANG'; readonly payload: FromLanguage }
  | { readonly type: 'SET_TO_LANG'; readonly payload: Language }
  | { readonly type: 'SET_FROM_TEXT'; readonly payload: string }
  | { readonly type: 'SET_RESULT'; readonly payload: string }

export type Action =
  | { readonly type: 'INTERCHANGE_LANGUAGES' }
  | { readonly type: 'SET_FROM_LANG'; readonly payload: fromLanguage }
  | { readonly type: 'SET_TO_LANG'; readonly payload: Language }
  | { readonly type: 'SET_FROM_TEXT'; readonly payload: string }
  | { readonly type: 'SET_RESULT'; readonly payload: string }

export const SectionTypeConst = {
  FROM: 'from' as const,
  TO: 'to' as const
} as const

export type SectionType = typeof SectionTypeConst[keyof typeof SectionTypeConst]

// Interface para requests de traducción
export interface TranslationRequest {
  readonly fromLang: FromLanguage
  readonly toLang: Language
  readonly text: string
}

// Interface para respuestas de traducción
export interface TranslationResponse {
  readonly translatedText: string
}

// Interface para errores de validación
export interface ValidationError {
  readonly message: string
  readonly field?: string
}
