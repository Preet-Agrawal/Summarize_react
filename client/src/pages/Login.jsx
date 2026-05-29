import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <h1>Welcome Back!</h1>
          <p>Log in to continue your learning journey with Story Quiz</p>
          <ul className="feature-list">
            <li>Access your quiz history</li>
            <li>Track your progress</li>
            <li>Resume where you left off</li>
          </ul>
        </div>

        <div className="auth-right">
          <Link to="/" className="back-home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>

          <div className="auth-card">
            <h2>Sign In</h2>
            <p className="auth-subtitle">Enter your credentials to access your account</p>

            {error && (
              <ul className="auth-messages">
                <li>{error}</li>
              </ul>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label>Username</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input type="text" className="auth-input" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type="password" className="auth-input" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>

              <div className="remember-forgot">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="auth-btn">Sign In</button>
            </form>

            <div className="divider"><span>OR</span></div>

            <div className="signup-link">
              Don't have an account? <Link to="/register">Sign up now</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
