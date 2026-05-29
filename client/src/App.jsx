import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Contact from './pages/Contact'
import AuthChoice from './pages/AuthChoice'
import Users from './pages/Users'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/auth" element={<AuthChoice />} />
      <Route path="/users" element={<Users />} />
    </Routes>
  )
}
