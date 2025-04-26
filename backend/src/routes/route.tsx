import DashboardPage from "@/app/dashboard/page"
import { LandingHero } from "@/components/landing-hero"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route index element={<LandingHero />} />
        <Route path="/board" element={<DashboardPage />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes
