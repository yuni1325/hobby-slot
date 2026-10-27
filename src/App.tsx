import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import RecordsProvider from './components/RecordsProvider'
import ScrollToTop from './components/ScrollToTop'
import CalendarPage from './pages/CalendarPage'
import DayPage from './pages/DayPage'
import RecordFormPage from './pages/RecordFormPage'
import YearPage from './pages/YearPage'
import './App.css'

export default function App() {
  return (
    <RecordsProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/month/:ym" element={<CalendarPage />} />
          <Route path="/year/:year" element={<YearPage />} />
          <Route path="/day/:date" element={<DayPage />} />
          <Route path="/day/:date/new" element={<RecordFormPage />} />
          <Route path="/day/:date/:id" element={<RecordFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </RecordsProvider>
  )
}
