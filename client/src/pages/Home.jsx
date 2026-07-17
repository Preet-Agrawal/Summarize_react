import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import confetti from 'canvas-confetti'
import './Home.css'

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard']

export default function Home() {
  const navigate = useNavigate()
  const [storyInput, setStoryInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [quizData, setQuizData] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [currentQuizId, setCurrentQuizId] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [notification, setNotification] = useState('')
  const [difficulty, setDifficulty] = useState(null)

  const submitStory = async () => {
    if (!storyInput.trim()) { alert('Please enter a story first!'); return }
    setLoading(true)
    setShowResult(false)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: storyInput })
      })

      if (res.status === 401) { setLoading(false); setShowLoginPopup(true); return }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz')

      setLoading(false)
      setShowResult(true)
      if (data.quiz_id) setCurrentQuizId(data.quiz_id)
      if (data.difficulty) setDifficulty(data.difficulty)
      parseAndDisplayResult(data.result)
      showSuccessNotification(data)
    } catch (error) {
      setLoading(false)
      if (error.message.includes('JSON') || error.message.includes('Failed to fetch')) {
        setShowLoginPopup(true)
      } else {
        alert('Error: ' + error.message)
      }
    }
  }

  const parseAndDisplayResult = (result) => {
    const lines = result.split('\n')
    let currentSection = ''
    let summaryText = ''
    const questions = []
    let currentQuestion = null

    for (let line of lines) {
      line = line.trim()
      if (!line) continue
      if (line.startsWith('SUMMARY:')) { currentSection = 'summary'; continue }
      if (line.startsWith('QUIZ:')) { currentSection = 'quiz'; continue }

      if (currentSection === 'summary') {
        summaryText += line + '\n'
      } else if (currentSection === 'quiz') {
        if (/^\d+\./.test(line)) {
          if (currentQuestion) questions.push(currentQuestion)
          currentQuestion = { question: line.replace(/^\d+\.\s*/, ''), options: [], correct: '' }
        } else if (line.match(/^[A-D]\)/)) {
          const option = line.replace(/^[A-D]\)\s*/, '')
          const letter = line.charAt(0)
          currentQuestion?.options.push({ letter, text: option })
        } else if (line.startsWith('Correct:')) {
          if (currentQuestion) currentQuestion.correct = line.replace('Correct:', '').trim()
        }
      }
    }
    if (currentQuestion) questions.push(currentQuestion)

    setSummary(summaryText.trim())
    setQuizData(questions)
    setUserAnswers(new Array(questions.length).fill(null))
    setScore(0)
    setQuizCompleted(false)
  }

  const selectOption = (questionIndex, selectedOption) => {
    if (quizCompleted || userAnswers[questionIndex] !== null) return

    const newAnswers = [...userAnswers]
    newAnswers[questionIndex] = selectedOption
    setUserAnswers(newAnswers)

    const isCorrect = selectedOption === quizData[questionIndex].correct
    const newScore = isCorrect ? score + 1 : score
    if (isCorrect) setScore(newScore)

    // Check if all answered
    if (newAnswers.every(a => a !== null)) {
      showFinalResults(newScore)
    }
  }

  const showFinalResults = async (finalScore) => {
    setQuizCompleted(true)
    if (finalScore === 5) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, zIndex: 9999 })
    }
    if (currentQuizId) {
      try {
        await fetch('/api/save_score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ score: finalScore, quiz_id: currentQuizId })
        })
      } catch (e) { console.error('Error saving score:', e) }
    }
  }

  const resetQuiz = () => {
    setScore(0)
    setUserAnswers(new Array(quizData.length).fill(null))
    setQuizCompleted(false)
  }

  const showSuccessNotification = (data) => {
    let message = 'Quiz generated successfully!'
    if (data?.difficultyChanged) {
      const wentUp = DIFFICULTY_LEVELS.indexOf(data.difficulty) > DIFFICULTY_LEVELS.indexOf(data.previousDifficulty)
      message += wentUp ? ' Level up — harder questions ahead.' : ' Difficulty lowered — easier questions ahead.'
    }
    setNotification(message)
    setTimeout(() => setNotification(''), 4000)
  }

  const getPerformanceMessage = () => {
    if (score === 5) return "Perfect! You're a master of this story!"
    if (score >= 4) return "Excellent! You really understood the story well!"
    if (score >= 3) return "Good job! You have a solid understanding of the story."
    if (score >= 2) return "Not bad! A bit more attention to detail would help."
    return "Keep reading! Review the story and try again."
  }

  return (
    <div className="home-page">
      <div className="floating-shape shape1"></div>
      <div className="floating-shape shape2"></div>
      <div className="floating-shape shape3"></div>
      <div className="floating-shape shape4"></div>

      <Navbar />

      <main className="main">
        <div className="center-content">
          <h1 className="main-heading">Turn Stories Into Smart Quizzes</h1>
          <p className="description">
            Welcome to Story Quiz! Paste your story or link, and let our AI summarize and quiz you instantly. Perfect for students, readers, and educators who want to learn smarter.
          </p>
        </div>

        <div className="text-input-section">
          <div className="text-area-container">
            <textarea
              value={storyInput}
              onChange={e => setStoryInput(e.target.value)}
              placeholder="Paste your story here..."
            />
          </div>
          <button className="get-started" onClick={submitStory}>Summarize & Quiz</button>
        </div>

        {loading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Generating your summary and quiz...</p>
          </div>
        )}

        {showResult && (
          <div className="result-section">
            <div className="summary-container">
              <h2 className="section-title">Story Summary</h2>
              <div className="summary-content">{summary}</div>
            </div>

            <div className="quiz-container">
              <div className="quiz-header">
                <h2 className="section-title">Quiz Time!</h2>
                <div className="score-display">
                  {difficulty && (
                    <span className={`difficulty-badge difficulty-${difficulty}`}>
                      Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                  )}
                  <span className="score-text">Score: {score}/5</span>
                  <button className="reset-btn" onClick={resetQuiz}>Reset Quiz</button>
                </div>
              </div>

              <div className="quiz-content">
                {quizData.map((q, qIdx) => (
                  <div key={qIdx} className="question-container">
                    <h3 className="question-title">Question {qIdx + 1}</h3>
                    <p className="question-text">{q.question}</p>
                    <div className="options-container">
                      {q.options.map(opt => {
                        let btnClass = 'option-btn'
                        if (userAnswers[qIdx] !== null) {
                          if (opt.letter === q.correct) btnClass += ' correct'
                          else if (opt.letter === userAnswers[qIdx] && opt.letter !== q.correct) btnClass += ' incorrect'
                          if (opt.letter === userAnswers[qIdx]) btnClass += ' selected'
                        }
                        return (
                          <button
                            key={opt.letter}
                            className={btnClass}
                            disabled={userAnswers[qIdx] !== null}
                            onClick={() => selectOption(qIdx, opt.letter)}
                          >
                            <span className="option-letter">{opt.letter})</span>
                            <span className="option-text">{opt.text}</span>
                          </button>
                        )
                      })}
                    </div>
                    {userAnswers[qIdx] !== null && (
                      <div className="feedback">
                        {userAnswers[qIdx] === q.correct
                          ? <span className="correct-feedback">Correct!</span>
                          : <span className="incorrect-feedback">Incorrect. The correct answer is {q.correct})</span>
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {quizCompleted && (
                <div className="quiz-results">
                  <h3>Quiz Complete!</h3>
                  <p className="final-score">Final Score: {score}/5</p>
                  <p className="performance-message">{getPerformanceMessage()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showLoginPopup && (
        <div className="login-popup-overlay show" onClick={e => { if (e.target === e.currentTarget) setShowLoginPopup(false) }}>
          <div className="login-popup">
            <div className="login-popup-header">
              <h3>Login Required</h3>
              <button className="close-popup" onClick={() => setShowLoginPopup(false)}>×</button>
            </div>
            <div className="login-popup-content">
              <p>You need to log in first to use the Summarize & Quiz feature!</p>
              <div className="login-popup-buttons">
                <button className="login-btn" onClick={() => navigate('/login')}>Login Now</button>
                <button className="register-btn" onClick={() => navigate('/register')}>Register</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="success-notification show">
          <div className="success-content">
            <span className="success-text">{notification}</span>
          </div>
        </div>
      )}
    </div>
  )
}
