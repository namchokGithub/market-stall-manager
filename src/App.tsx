import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppShell } from './routes/AppShell'
import { MarketMapPage } from './components/market-map/MarketMapPage'
import { BookingPage } from './routes/BookingPage'
import { DashboardPage } from './routes/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/market-map" replace />} />
          <Route path="/market-map" element={<MarketMapPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
