import { useEffect, useMemo, useState } from 'react'
import { createItem, deleteItem, fetchItems, renameItem, updateItemTags } from '../api/masterItemsApi'
import { DAYS, MEALS } from '../constants'

const SEEDED_FLAG = 'masterItemsSeeded'

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

async function seedIfNeeded() {
  try {
    if (window.localStorage.getItem(SEEDED_FLAG) === '1') return
    const names = seedFromExistingPlan()
    await Promise.all(names.map((name) => createItem(name).catch(() => {})))
  } catch {
    // best-effort migration - fail silently, source data stays in weeklyMealPlan
  } finally {
    try {
      window.localStorage.setItem(SEEDED_FLAG, '1')
    } catch {
      // localStorage unavailable - fail silently
    }
  }
}

function useMasterItems() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    seedIfNeeded()
      .then(() => fetchItems())
      .then((fetched) => {
        if (!cancelled) setItems(fetched ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const masterItemNames = useMemo(() => items.map((item) => item.name), [items])

  // `mealType`, when given, is the category the item was just added under (e.g. typed or
  // dropped into a Breakfast cell) - it gets tagged onto the item so future Surprise Me
  // runs and the Manage Items page pick it up, unless the item is already tagged with it.
  const addItem = (name, mealType) => {
    const trimmed = name.trim()
    if (!trimmed) return
    createItem(trimmed)
      .then((created) => {
        setItems((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]))

        if (mealType && !created.mealTypes?.includes(mealType)) {
          updateItemTags(created.id, [...(created.mealTypes ?? []), mealType])
            .then((updated) => {
              setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }

  const updateItem = async (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false }
    try {
      const updated = await renameItem(id, trimmed)
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
      return { ok: true, item: updated }
    } catch {
      return { ok: false }
    }
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    deleteItem(id).catch(() => {})
  }

  const updateTags = async (id, mealTypes) => {
    try {
      const updated = await updateItemTags(id, mealTypes)
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
      return { ok: true, item: updated }
    } catch {
      return { ok: false }
    }
  }

  return { items, masterItemNames, isLoading, addItem, updateItem, removeItem, updateTags }
}

export default useMasterItems
