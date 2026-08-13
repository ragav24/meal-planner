import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

function ManageItemRow({ text, otherItems, onCommit, onRemove }) {
  const [draftValue, setDraftValue] = useState(text)

  const commit = () => {
    const trimmed = draftValue.trim()
    if (!trimmed) {
      onRemove()
      return
    }
    const collides = otherItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())
    if (collides) {
      setDraftValue(text)
      return
    }
    if (trimmed !== text) onCommit(trimmed)
  }

  return (
    <div className="meal-item">
      <input
        className="meal-item-input"
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
      />
      <button type="button" className="meal-item-remove" aria-label="Remove item" onClick={onRemove}>
        &times;
      </button>
    </div>
  )
}

function ManageItemsModal({ items, onAdd, onUpdate, onRemove, onClose }) {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const addDraftItem = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft('')
  }

  const sortedRows = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.localeCompare(b.item))

  return createPortal(
    <div
      className="modal-backdrop no-print"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="manage-items-modal">
        <div className="manage-items-header">
          <span>Manage Items</span>
          <button type="button" className="manage-items-close" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="manage-items-body">
          {sortedRows.length === 0 && <div className="manage-items-empty">No items yet — add one below.</div>}
          {sortedRows.map(({ item, index }) => (
            <ManageItemRow
              key={item}
              text={item}
              otherItems={items.filter((_, i) => i !== index)}
              onCommit={(text) => onUpdate(index, text)}
              onRemove={() => onRemove(index)}
            />
          ))}
          <div className="meal-item">
            <input
              className="meal-item-input meal-item-add"
              value={draft}
              placeholder="+ Add item"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDraftItem()
                }
              }}
              onBlur={addDraftItem}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ManageItemsModal
