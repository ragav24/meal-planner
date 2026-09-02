import { useEffect, useMemo, useState } from 'react'
import { createItem, deleteItem, fetchItems, renameItem } from '../api/masterItemsApi'
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

  const addItem = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    createItem(trimmed)
      .then((created) => {
        setItems((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]))
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

  return { items, masterItemNames, isLoading, addItem, updateItem, removeItem }
}

export default useMasterItems
