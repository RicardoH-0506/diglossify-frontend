import { AUTO_LANGUAGE } from '../constants'
import type { Action, fromLanguage, Language, State } from '../types'
import { useReducer, useCallback } from 'react'

const initialState: State = {
  fromLang: 'auto',
  toLang: 'en',
  fromText: '',
  result: '',
  loading: false
}

function reducer (state: State, action: Action) {
  const { type } = action

  if (type === 'INTERCHANGE_LANGUAGES') {
    if (state.fromLang === AUTO_LANGUAGE) return state

    return {
      ...state,
      fromLang: state.toLang,
      toLang: state.fromLang,
      fromText: state.result,
      result: state.fromText
    }
  }

  if (type === 'SET_FROM_LANG') {
    return {
      ...state,
      fromLang: action.payload
    }
  }

  if (type === 'SET_TO_LANG') {
    return {
      ...state,
      toLang: action.payload
    }
  }

  if (type === 'SET_FROM_TEXT') {
    return {
      ...state,
      fromText: action.payload,
      loading: true,
      result: ''
    }
  }

  if (type === 'SET_RESULT') {
    return {
      ...state,
      result: action.payload,
      loading: false
    }
  }

  return state
}

export function useStore () {
  const [{
    fromLang,
    toLang,
    fromText,
    result,
    loading
  }, dispatch] = useReducer(reducer, initialState)

  const setFromLang = useCallback((payload: fromLanguage) => {
    dispatch({ type: 'SET_FROM_LANG', payload })
  }, [])

  const setToLang = useCallback((payload: Language) => {
    dispatch({ type: 'SET_TO_LANG', payload })
  }, [])

  const interchangeLanguages = useCallback(() => {
    dispatch({ type: 'INTERCHANGE_LANGUAGES' })
  }, [])

  const setFromText = useCallback((payload: string) => {
    dispatch({ type: 'SET_FROM_TEXT', payload })
  }, [])

  const setResult = useCallback((payload: string) => {
    dispatch({ type: 'SET_RESULT', payload })
  }, [])

  return {
    fromLang,
    toLang,
    fromText,
    result,
    loading,
    setFromLang,
    setToLang,
    interchangeLanguages,
    setFromText,
    setResult
  }
}
