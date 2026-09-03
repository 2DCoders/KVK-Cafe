import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/login"
import SettingsPage from "./pages/settings"
import AdminLayout from "./layouts/admin-layout"
import Dayend from "./pages/dayend"
import Payments from "./pages/payments"
import MenuPage from "./pages/menu"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Dashboard Routes */}
      <Route element={<AdminLayout><MenuPage /></AdminLayout>} path="/menu" />
      <Route element={<AdminLayout><Payments /></AdminLayout>} path="/payments" />
      <Route element={<AdminLayout><Dayend /></AdminLayout>} path="/dayend" />
      <Route element={<AdminLayout><SettingsPage /></AdminLayout>} path="/settings" />
      
      {/* Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/services" />} />
    </Routes>
  )
}

export default App
