import { HashRouter, Routes, Route, Navigate } from 'react-router'
import { AppShell } from './routes/AppShell'
import { LoginPage } from './routes/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import { MarketMapPage } from './components/market-map/MarketMapPage'
import { BookingPage } from './routes/BookingPage'
import { DashboardPage } from './routes/DashboardPage'
import { PublicMarketMapPage } from './components/market-map/PublicMarketMapPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/view/:shareId" element={<PublicMarketMapPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/market-map" replace />} />
            <Route path="/market-map" element={<MarketMapPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
