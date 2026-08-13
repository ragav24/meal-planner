import { useEffect, useState } from 'react'

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) return JSON.parse(stored)
      return typeof initialValue === 'function' ? initialValue() : initialValue
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage unavailable (e.g. private browsing) - fail silently
    }
  }, [key, value])

  return [value, setValue]
}

export default useLocalStorage
