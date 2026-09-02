import { useRef, useState } from 'react'
import AutocompleteDropdown from './AutocompleteDropdown'

function filterSuggestions(masterItems, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return masterItems
    .filter((item) => item.toLowerCase().startsWith(q) && item.toLowerCase() !== q)
    .slice(0, 6)
}

function MealBox({ items, placeholder, onChange, masterItems, onCommitItem }) {
  const [draft, setDraft] = useState('')
  const [openFieldKey, setOpenFieldKey] = useState(null) // 'draft' | number | null
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isDragOver, setIsDragOver] = useState(false)
  const draftInputRef = useRef(null)
  const itemInputRefs = useRef(new Map())

  const closeDropdown = () => {
    setOpenFieldKey(null)
    setHighlightedIndex(-1)
  }

  const activeQuery = openFieldKey === 'draft' ? draft : openFieldKey !== null ? (items[openFieldKey] ?? '') : ''
  const options = openFieldKey !== null ? filterSuggestions(masterItems, activeQuery) : []
  const anchorEl =
    openFieldKey === 'draft'
      ? draftInputRef.current
      : openFieldKey !== null
        ? (itemInputRefs.current.get(openFieldKey) ?? null)
        : null

  const updateItem = (index, value) => {
    const next = [...items]
    next[index] = value
    onChange(next)
    setOpenFieldKey(index)
    setHighlightedIndex(-1)
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const commitItemEdit = (index, value) => {
    const trimmed = value.trim()
    if (trimmed) onCommitItem(trimmed)
  }

  const applyItemSuggestion = (index, value) => {
    const next = [...items]
    next[index] = value
    onChange(next)
    onCommitItem(value)
    closeDropdown()
  }

  const commitText = (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    onCommitItem(trimmed)
    setDraft('')
  }

  const addDraftItem = () => commitText(draft)

  const applyDraftSuggestion = (value) => {
    commitText(value)
    closeDropdown()
  }

  const handleItemKeyDown = (e, index) => {
    if (openFieldKey === index && options.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((h) => Math.min(h + 1, options.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((h) => Math.max(h - 1, 0))
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDropdown()
        return
      }
      if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        applyItemSuggestion(index, options[highlightedIndex])
        return
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      commitItemEdit(index, items[index])
      closeDropdown()
      return
    }

    if (e.key === 'Backspace' && items[index] === '') {
      e.preventDefault()
      removeItem(index)
    }
  }

  const handleItemBlur = (index) => {
    commitItemEdit(index, items[index])
    closeDropdown()
  }

  const handleDraftKeyDown = (e) => {
    if (openFieldKey === 'draft' && options.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((h) => Math.min(h + 1, options.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((h) => Math.max(h - 1, 0))
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDropdown()
        return
      }
      if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        applyDraftSuggestion(options[highlightedIndex])
        return
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      addDraftItem()
      closeDropdown()
    }
  }

  const handleDraftBlur = () => {
    addDraftItem()
    closeDropdown()
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const text = e.dataTransfer.getData('text/plain').trim()
    if (!text) return
    onChange([...items, text])
    onCommitItem(text)
  }

  return (
    <div
      className={`meal-box${isDragOver ? ' meal-box-drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {items.map((item, index) => (
        <div className="meal-item" key={index}>
          <input
            ref={(el) => {
              if (el) itemInputRefs.current.set(index, el)
              else itemInputRefs.current.delete(index)
            }}
            className="meal-item-input"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            onKeyDown={(e) => handleItemKeyDown(e, index)}
            onBlur={() => handleItemBlur(index)}
          />
          <button
            type="button"
            className="meal-item-remove no-print"
            aria-label="Remove item"
            onClick={() => removeItem(index)}
          >
            &times;
          </button>
        </div>
      ))}
      <input
        ref={draftInputRef}
        className="meal-item-input meal-item-add no-print"
        value={draft}
        placeholder={items.length === 0 ? placeholder : '+ Add item'}
        onChange={(e) => {
          setDraft(e.target.value)
          setOpenFieldKey('draft')
          setHighlightedIndex(-1)
        }}
        onKeyDown={handleDraftKeyDown}
        onBlur={handleDraftBlur}
      />
      <AutocompleteDropdown
        anchorEl={anchorEl}
        options={options}
        highlightedIndex={highlightedIndex}
        onSelect={(value) => (openFieldKey === 'draft' ? applyDraftSuggestion(value) : applyItemSuggestion(openFieldKey, value))}
        onRequestClose={closeDropdown}
      />
    </div>
  )
}

export default MealBox
