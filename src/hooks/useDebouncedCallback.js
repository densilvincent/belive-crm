import { useCallback, useEffect, useRef } from 'react'

export function useDebouncedCallback(fn, delay = 200) {
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  return useCallback(
    (...args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  )
}
