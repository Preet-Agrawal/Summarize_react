import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Register.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [strengthClass, setStrengthClass] = useState('')
  const [strengthWidth, setStrengthWidth] = useState('0%')
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const handlePasswordChange = (val) => {
    setPassword(val)
    let strength = 0
    if (val.length >= 8) strength++
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) strength++
    if (/[0-9]/.test(val)) strength++
    if (/[^a-zA-Z0-9]/.test(val)) strength++

    if (val.length === 0) { setStrengthClass(''); setStrengthWidth('0%') }
    else if (strength <= 1) { setStrengthClass('password-strength-weak'); setStrengthWidth('33%') }
    else if (strength <= 3) { setStrengthClass('password-strength-medium'); setStrengthWidth('66%') }
    else { setStrengthClass('password-strength-strong'); setStrengthWidth('100%') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    try {
      await registerUser(username, password)
      navigate('/login')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left register-left">
          <h1>Join Story Quiz!</h1>
          <p>Create your account and start your learning adventure</p>
          <ul className="feature-list">
            <li>AI-powered story summaries</li>
            <li>Interactive quizzes</li>
            <li>Track your progress</li>
            <li>Compete with friends</li>
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
            <h2>Create Account</h2>
            <p className="auth-subtitle">Fill in your details to get started</p>

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
                  <input type="text" className="auth-input" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type="password" className="auth-input" placeholder="Create a strong password" value={password} onChange={e => handlePasswordChange(e.target.value)} required />
                </div>
                <div className="password-strength">
                  <div className={`password-strength-bar ${strengthClass}`} style={{ width: strengthWidth }}></div>
                </div>
              </div>

              <div className="auth-form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                  <input type="password" className="auth-input" placeholder="Confirm your password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
              </div>

              <div className="terms-checkbox">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className="auth-btn">Create Account</button>
            </form>

            <div className="divider"><span>OR</span></div>

            <div className="signin-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
