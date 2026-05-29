import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function Users() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch('/api/users', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(() => navigate('/login'))
  }, [user, navigate])

  return (
    <>
      <Navbar />
      <div className="main">
        <h2>Registered Users</h2>
        <ul>
          {users.map((u, i) => <li key={i}>{u.username}</li>)}
        </ul>
        <Link to="/">Back to Home</Link>
      </div>
    </>
  )
}
