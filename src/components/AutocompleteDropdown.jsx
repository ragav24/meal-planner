import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const MIN_WIDTH = 160
const FLIP_THRESHOLD = 220

function AutocompleteDropdown({ anchorEl, options, highlightedIndex, onSelect, onRequestClose }) {
  const [position, setPosition] = useState(null)

  useLayoutEffect(() => {
    if (!anchorEl) {
      setPosition(null)
      return
    }

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect()
      const width = Math.max(rect.width, MIN_WIDTH)
      const maxLeft = window.innerWidth - width - 8
      const left = Math.min(rect.left, Math.max(8, maxLeft))
      const spaceBelow = window.innerHeight - rect.bottom
      const dropUp = spaceBelow < FLIP_THRESHOLD && rect.top > FLIP_THRESHOLD
      const top = dropUp ? rect.top - 4 : rect.bottom + 4
      setPosition({ top, left, width, dropUp })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [anchorEl])

  useLayoutEffect(() => {
    if (!anchorEl) return
    // .meal-box scrolls internally without bubbling to window, so rather than
    // tracking that offset too, just dismiss - it reappears as typing continues.
    const handleScroll = () => onRequestClose()
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [anchorEl, onRequestClose])

  if (!anchorEl || options.length === 0 || !position) return null

  return createPortal(
    <div
      className="autocomplete-dropdown no-print"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        transform: position.dropUp ? 'translateY(-100%)' : undefined,
      }}
    >
      {options.map((option, index) => (
        <button
          type="button"
          key={option}
          className={`autocomplete-option${index === highlightedIndex ? ' active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(option)
          }}
        >
          {option}
        </button>
      ))}
    </div>,
    document.body,
  )
}

export default AutocompleteDropdown
