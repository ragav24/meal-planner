import { useState } from 'react'

function MealBox({ items, placeholder, onChange }) {
  const [draft, setDraft] = useState('')

  const updateItem = (index, value) => {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const addDraftItem = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    setDraft('')
  }

  const handleItemKeyDown = (e, index) => {
    if (e.key === 'Backspace' && items[index] === '') {
      e.preventDefault()
      removeItem(index)
    }
  }

  const handleDraftKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addDraftItem()
    }
  }

  return (
    <div className="meal-box">
      {items.map((item, index) => (
        <div className="meal-item" key={index}>
          <input
            className="meal-item-input"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            onKeyDown={(e) => handleItemKeyDown(e, index)}
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
        className="meal-item-input meal-item-add no-print"
        value={draft}
        placeholder={items.length === 0 ? placeholder : '+ Add item'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleDraftKeyDown}
        onBlur={addDraftItem}
      />
    </div>
  )
}

export default MealBox
