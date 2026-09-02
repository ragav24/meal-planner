import { useMemo, useState } from 'react'

function ItemsSidebar({ items }) {
  const [filter, setFilter] = useState('')

  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter((name) => name.toLowerCase().includes(q))
  }, [items, filter])

  const handleDragStart = (e, name) => {
    e.dataTransfer.setData('text/plain', name)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="items-sidebar no-print">
      <div className="items-sidebar-header">
        <i className="fas fa-list me-2"></i>
        Items
      </div>
      <input
        className="items-sidebar-search"
        type="text"
        placeholder="Filter items..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="items-sidebar-list">
        {filteredItems.length === 0 ? (
          <div className="items-sidebar-empty">No items yet</div>
        ) : (
          filteredItems.map((name) => (
            <div
              key={name}
              className="items-sidebar-item"
              draggable
              onDragStart={(e) => handleDragStart(e, name)}
              title="Drag onto a meal cell"
            >
              {name}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

export default ItemsSidebar
