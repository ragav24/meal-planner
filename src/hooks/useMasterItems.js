import useLocalStorage from './useLocalStorage'
import { DAYS, MEALS } from '../constants'

function seedFromExistingPlan() {
  try {
    const stored = window.localStorage.getItem('weeklyMealPlan')
    if (!stored) return []
    const plan = JSON.parse(stored)
    const seen = new Set()
    const items = []
    DAYS.forEach((day) => {
      MEALS.forEach((meal) => {
        ;(plan?.[day]?.[meal] ?? []).forEach((item) => {
          const trimmed = typeof item === 'string' ? item.trim() : ''
          const key = trimmed.toLowerCase()
          if (trimmed && !seen.has(key)) {
            seen.add(key)
            items.push(trimmed)
          }
        })
      })
    })
    return items
  } catch {
    return []
  }
}

function useMasterItems() {
  const [masterItems, setMasterItems] = useLocalStorage('masterItemList', seedFromExistingPlan)

  const addItem = (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMasterItems((prev) =>
      prev.some((item) => item.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed],
    )
  }

  const updateItemAt = (index, text) => {
    setMasterItems((prev) => prev.map((item, i) => (i === index ? text : item)))
  }

  const removeItemAt = (index) => {
    setMasterItems((prev) => prev.filter((_, i) => i !== index))
  }

  return { masterItems, addItem, updateItemAt, removeItemAt }
}

export default useMasterItems
