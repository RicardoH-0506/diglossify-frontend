import { SUPPORTED_LANGUAGES, AUTO_LANGUAGE } from './constants'

export type Language = keyof typeof SUPPORTED_LANGUAGES
export type AutoLanguage = typeof AUTO_LANGUAGE
export type FromLanguage = Language | AutoLanguage
export type fromLanguage = FromLanguage

export interface State {
  readonly fromLang: FromLanguage
  readonly toLang: Language
  readonly fromText: string
  readonly result: string
  readonly loading: boolean
}

export type Action =
  | { readonly type: 'INTERCHANGE_LANGUAGES' }
  | { readonly type: 'SET_FROM_LANG'; readonly payload: FromLanguage }
  | { readonly type: 'SET_TO_LANG'; readonly payload: Language }
  | { readonly type: 'SET_FROM_TEXT'; readonly payload: string }
  | { readonly type: 'SET_RESULT'; readonly payload: string }

export const SectionTypeConst = {
  FROM: 'from' as const,
  TO: 'to' as const
} as const

export type SectionType = typeof SectionTypeConst[keyof typeof SectionTypeConst]

export interface TranslationRequest {
  readonly fromLang: FromLanguage
  readonly toLang: Language
  readonly text: string
}

export interface TranslationResponse {
  readonly translatedText: string
  readonly fromLang: Language
  readonly toLang: Language
  readonly originalText: string
}

export interface TranslationError {
  readonly message: string
  readonly code?: string
}
