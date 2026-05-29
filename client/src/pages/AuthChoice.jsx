import { Link } from 'react-router-dom'
import './AuthChoice.css'

export default function AuthChoice() {
  return (
    <div className="auth-choice-page">
      <Link to="/" className="back-home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </Link>

      <div className="welcome-container">
        <div className="welcome-header">
          <h1>Welcome to Story Quiz!</h1>
          <p>Transform your stories into interactive learning experiences with AI-powered summaries and quizzes</p>
        </div>

        <div className="auth-options">
          <div className="auth-card-choice">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <h2>Sign In</h2>
            <p>Already have an account? Access your dashboard, view your quiz history, and continue learning.</p>
            <Link to="/login" className="auth-btn-choice">Login Now</Link>
          </div>

          <div className="auth-card-choice">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h2>Create Account</h2>
            <p>New to Story Quiz? Join our community and start your personalized learning journey today.</p>
            <Link to="/register" className="auth-btn-choice register-btn-choice">Sign Up Free</Link>
          </div>
        </div>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">📚</div>
            <h3>Smart Summaries</h3>
            <p>AI analyzes your stories instantly</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Interactive Quizzes</h3>
            <p>Test comprehension with custom questions</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor your learning journey</p>
          </div>
        </div>
      </div>
    </div>
  )
}
