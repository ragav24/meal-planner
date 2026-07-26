import { useRef } from 'react'
import html2canvas from 'html2canvas'
import MealBox from './MealBox'
import useLocalStorage from '../hooks/useLocalStorage'
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

function MealPlanner() {
  const [mealPlan, setMealPlan] = useLocalStorage('weeklyMealPlan', createEmptyPlan())
  const plannerRef = useRef(null)

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

  const handleDownload = () => {
    if (!plannerRef.current) return
    html2canvas(plannerRef.current, {
      onclone: (clonedDoc) => {
        // Empty inputs would otherwise paint their placeholder text
        // ("Breakfast", "+ Add item", etc.) into the exported image.
        clonedDoc.querySelectorAll('.no-print').forEach((el) => {
          el.style.display = 'none'
        })
      },
    }).then((canvas) => {
      const link = document.createElement('a')
      link.download = 'meal-planner.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    })
  }

  return (
    <div className="container app-content my-4">
      <div className="d-flex justify-content-end mb-3 gap-2 no-print">
        <button className="app-btn" title="Print" onClick={handlePrint}>
          <i className="fas fa-print"></i>
        </button>
        <button className="app-btn app-btn-danger" title="Reset" onClick={handleReset}>
          <i className="fas fa-trash"></i>
        </button>
        <button className="app-btn app-btn-primary" title="Download" onClick={handleDownload}>
          <i className="fas fa-download"></i>
        </button>
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
