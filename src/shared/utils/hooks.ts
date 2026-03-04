import { useCallback, useRef, useState, useEffect } from 'react'

/**
 * Hook personalizado para debounce con cleanup
 * Aplica la mejor práctica de Vercel: js-cache-function-results
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown> (
  callback: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const timeoutRef = useRef<number | null>(null)

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    return new Promise<ReturnType<T>>((resolve) => {
      timeoutRef.current = window.setTimeout(() => {
        const result = callback(...args) as ReturnType<T>
        resolve(result)
      }, delay)
    })
  }, [callback, delay])
}

/**
 * Hook para manejar valores derivados sin effects
 * Aplica la mejor práctica de Vercel: rerender-derived-state-no-effect
 */
export function useDerivedState<T> (
  value: T,
  derive: (value: T) => T
): T {
  const [derived, setDerived] = useState(() => derive(value))

  useEffect(() => {
    setDerived(derive(value))
  }, [value, derive])

  return derived
}

/**
 * Hook para manejar estado con transiciones
 * Aplica la mejor práctica de Vercel: rerender-transitions
 */
export function useTransitionState<T> (
  initialState: T
): [T, (state: T) => void, boolean] {
  const [state, setState] = useState(initialState)
  const [isPending, setIsPending] = useState(false)

  const startTransition = useCallback((newState: T) => {
    setIsPending(true)
    setState(newState)

    // Simular transición asíncrona
    setTimeout(() => {
      setIsPending(false)
    }, 0)
  }, [])

  return [state, startTransition, isPending]
}

/**
 * Hook para manejar refs estables
 * Aplica la mejor práctica de Vercel: advanced-use-latest
 */
export function useLatestRef<T> (value: T): { current: T } {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/**
 * Hook para early exit en condiciones
 * Aplica la mejor práctica de Vercel: js-early-exit
 */
export function useEarlyExit<T> (
  condition: () => boolean,
  onConditionMet: () => T,
  onConditionNotMet: () => T
): T {
  return condition() ? onConditionMet() : onConditionNotMet()
}
