import { NavLink, Route, Routes } from 'react-router-dom'
import MealPlanner from './components/MealPlanner'
import MasterItemsPage from './pages/MasterItemsPage'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header d-flex justify-content-between align-items-center">
        <h1 className="app-title">Weekly Meal Planner</h1>
        <nav className="d-flex gap-2 no-print">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'app-btn app-btn-primary' : 'app-btn')}>
            Planner
          </NavLink>
          <NavLink to="/items" className={({ isActive }) => (isActive ? 'app-btn app-btn-primary' : 'app-btn')}>
            Manage Items
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<MealPlanner />} />
        <Route path="/items" element={<MasterItemsPage />} />
      </Routes>
    </div>
  )
}

export default App
