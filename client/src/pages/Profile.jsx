import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import './Profile.css'

export default function Profile() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return // wait for the /me check to resolve before deciding to redirect
    if (!user) { navigate('/login'); return }
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(data => { setProfileData(data); setLoading(false) })
      .catch(() => { navigate('/login') })
  }, [user, authLoading, navigate])

  if (loading) return <div className="profile-page"><Navbar /><p style={{textAlign:'center',padding:'3rem'}}>Loading...</p></div>
  if (!profileData) return null

  const { user: userData, quizResults } = profileData
  const completedQuizzes = quizResults.filter(r => r.score != null)
  const avgScore = completedQuizzes.length > 0
    ? (completedQuizzes.reduce((sum, r) => sum + r.score, 0) / completedQuizzes.length).toFixed(1)
    : 0
  const bestScore = completedQuizzes.length > 0
    ? Math.max(...completedQuizzes.map(r => r.score))
    : 0

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date not available'
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' IST'
  }

  const getBadge = (score) => {
    if (score >= 4) return <span className="score-badge badge-excellent">Excellent!</span>
    if (score >= 3) return <span className="score-badge badge-good">Good Job!</span>
    return <span className="score-badge badge-practice">Keep Practicing</span>
  }

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-info">
            <div className="avatar">{userData.username[0].toUpperCase()}</div>
            <div className="user-details">
              <h1>{userData.username}</h1>
              <div className="user-meta">
                Member since {userData.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2024'}
              </div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{quizResults.length}</div>
            <div className="stat-label">Quizzes Taken</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgScore}</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{bestScore}</div>
            <div className="stat-label">Best Score</div>
          </div>
        </div>

        <div className="history-section">
          <h2 className="section-title">Quiz History</h2>
          {quizResults.length > 0 ? (
            <ul className="quiz-list">
              {quizResults.map((result, i) => (
                <li key={i} className="quiz-item">
                  <div className="quiz-date">{formatDate(result.date)}</div>
                  <div className="quiz-score">
                    Score: {result.score != null ? <>{result.score}/5 {getBadge(result.score)}</> : <span style={{color:'#999'}}>Not completed</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No quiz history yet. Start taking quizzes to track your progress!</p>
            </div>
          )}
        </div>

        <div className="actions">
          <Link to="/" className="btn btn-primary">Back to Home</Link>
          <Link to="/" className="btn btn-secondary">Take a Quiz</Link>
        </div>
      </div>
    </div>
  )
}
