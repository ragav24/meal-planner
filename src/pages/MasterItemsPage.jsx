import { useState } from 'react'
import useMasterItems from '../hooks/useMasterItems'

function MasterItemRow({ id, name, onRename, onRemove }) {
  const [draftValue, setDraftValue] = useState(name)

  const commit = async () => {
    const trimmed = draftValue.trim()
    if (!trimmed) {
      onRemove(id)
      return
    }
    if (trimmed === name) return
    const result = await onRename(id, trimmed)
    if (!result.ok) setDraftValue(name)
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
      <button type="button" className="meal-item-remove" aria-label="Remove item" onClick={() => onRemove(id)}>
        &times;
      </button>
    </div>
  )
}

function MasterItemsPage() {
  const { items, isLoading, addItem, updateItem, removeItem } = useMasterItems()
  const [draft, setDraft] = useState('')

  const addDraftItem = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    addItem(trimmed)
    setDraft('')
  }

  return (
    <div className="container app-content my-4">
      <div className="manage-items-modal mx-auto">
        <div className="manage-items-header">
          <span>Manage Items</span>
        </div>
        <div className="manage-items-body">
          {isLoading && <div className="manage-items-empty">Loading…</div>}
          {!isLoading && items.length === 0 && (
            <div className="manage-items-empty">No items yet — add one below.</div>
          )}
          {!isLoading &&
            items.map((item) => (
              <MasterItemRow key={item.id} id={item.id} name={item.name} onRename={updateItem} onRemove={removeItem} />
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
    </div>
  )
}

export default MasterItemsPage
