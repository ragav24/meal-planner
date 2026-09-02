import { useRef } from 'react'
import html2canvas from 'html2canvas'
import MealBox from './MealBox'
import useLocalStorage from '../hooks/useLocalStorage'
import useMasterItems from '../hooks/useMasterItems'
import { DAYS, MEALS } from '../constants'

function createEmptyPlan() {
  const plan = {}
  DAYS.forEach((day) => {
    plan[day] = {}
    MEALS.forEach((meal) => {
      plan[day][meal] = []
    })
  })
  return plan
}

// ISO 8601 week number: the week containing the year's first Thursday is week 1.
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function getWeekInfo(date = new Date()) {
  const mondayOffset = (date.getDay() + 6) % 7
  const monday = new Date(date)
  monday.setDate(date.getDate() - mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const year = monday.getFullYear()
  const monthName = monday.toLocaleString('default', { month: 'long' })
  const weekNumber = getISOWeekNumber(monday)
  const formatDate = (d) => d.toLocaleDateString('default', { month: 'short', day: 'numeric' })

  return {
    label: `Week ${weekNumber} · ${formatDate(monday)} – ${formatDate(sunday)}, ${year}`,
    fileSuffix: `${year}_${monthName}_week${weekNumber}`,
  }
}

function isMobileDevice() {
  if (typeof navigator.userAgentData?.mobile === 'boolean') return navigator.userAgentData.mobile
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function buildPlanText(mealPlan, weekLabel) {
  const lines = [`Weekly Meal Plan — ${weekLabel}`, '']
  DAYS.forEach((day) => {
    lines.push(day)
    MEALS.forEach((meal) => {
      const items = mealPlan[day][meal]
      lines.push(`  ${meal}: ${items.length ? items.join(', ') : '-'}`)
    })
    lines.push('')
  })
  return lines.join('\n')
}

function MealPlanner() {
  const [mealPlan, setMealPlan] = useLocalStorage('weeklyMealPlan', createEmptyPlan())
  const { masterItemNames, addItem } = useMasterItems()
  const plannerRef = useRef(null)
  const weekInfo = getWeekInfo()

  const updateMeal = (day, meal, items) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: items },
    }))
  }

  const handlePrint = () => window.print()

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all meal entries?')) {
      setMealPlan(createEmptyPlan())
    }
  }

  const renderPlannerCanvas = () => {
    if (!plannerRef.current) return Promise.resolve(null)
    return html2canvas(plannerRef.current, {
      onclone: (clonedDoc) => {
        // Empty inputs would otherwise paint their placeholder text
        // ("Breakfast", "+ Add item", etc.) into the exported image.
        clonedDoc.querySelectorAll('.no-print').forEach((el) => {
          el.style.display = 'none'
        })
      },
    })
  }

  const handleDownload = () => {
    renderPlannerCanvas().then((canvas) => {
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `meal-planner_${weekInfo.fileSuffix}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    })
  }

  const handleShareWhatsApp = async () => {
    const text = buildPlanText(mealPlan, weekInfo.label)
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    const hasFileShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'

    // Desktop's navigator.share() opens the OS-wide share sheet (Mail, Messages,
    // Reminders, AirDrop, ...) instead of going to WhatsApp, so go straight to
    // the WhatsApp web link there. Only mobile routes Web Share to an installed
    // WhatsApp app and can attach the plan image alongside the text.
    if (!hasFileShare || !isMobileDevice()) {
      window.open(waUrl, '_blank', 'noopener,noreferrer')
      return
    }

    const canvas = await renderPlannerCanvas()
    const blob = canvas && (await new Promise((resolve) => canvas.toBlob(resolve, 'image/png')))
    const file = blob && new File([blob], `meal-planner_${weekInfo.fileSuffix}.png`, { type: 'image/png' })

    if (file && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, title: `Weekly Meal Plan — ${weekInfo.label}` })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="container app-content my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="week-label">
          <i className="fas fa-calendar-week me-2"></i>
          {weekInfo.label}
        </div>

        <div className="d-flex gap-2 no-print">
          <button className="app-btn" title="Print" onClick={handlePrint}>
            <i className="fas fa-print"></i>
          </button>
          <button className="app-btn app-btn-danger" title="Reset" onClick={handleReset}>
            <i className="fas fa-trash"></i>
          </button>
          <button className="app-btn app-btn-primary" title="Download" onClick={handleDownload}>
            <i className="fas fa-download"></i>
          </button>
          <button className="app-btn app-btn-primary" title="Share to WhatsApp" onClick={handleShareWhatsApp}>
            <i className="fab fa-whatsapp"></i>
          </button>
        </div>
      </div>

      <div className="meal-planner" ref={plannerRef}>
        <div className="row text-center day-header">
          {DAYS.map((day) => (
            <div className="col border" key={day}>
              {day}
            </div>
          ))}
        </div>

        {MEALS.map((meal) => (
          <div className="row text-center align-items-center" key={meal}>
            {DAYS.map((day) => (
              <div className="col border p-2" key={day}>
                <MealBox
                  items={mealPlan[day][meal]}
                  placeholder={meal}
                  onChange={(items) => updateMeal(day, meal, items)}
                  masterItems={masterItemNames}
                  onCommitItem={addItem}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MealPlanner
