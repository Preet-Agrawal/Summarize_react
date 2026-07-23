import { useState } from 'react'
import Navbar from '../components/Navbar'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [flash, setFlash] = useState(null)
  const [sending, setSending] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setFlash({ type: 'success', message: data.message })
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setFlash({ type: 'error', message: data.error })
      }
    } catch {
      setFlash({ type: 'error', message: 'Something went wrong.' })
    }
    setSending(false)
    setTimeout(() => setFlash(null), 5000)
  }

  return (
    <div className="contact-page">
      <Navbar />
      <div className="container">
        <div className="hero">
          <h1>Get in Touch</h1>
          <p>We'd love to hear from you! Whether you have questions, feedback, or just want to say hello, feel free to reach out.</p>
        </div>

        <div className="content-grid">
          <div className="card">
            <div className="card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h2>About Story Quiz</h2>
            <p>Story Quiz is an innovative educational platform that helps students improve their reading comprehension and summarization skills through interactive quizzes and AI-powered content generation.</p>
            <p>Built with cutting-edge technology including React, Node.js, MongoDB, and AI APIs.</p>
          </div>
          <div className="card">
            <div className="card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <h2>Our Mission</h2>
            <p>To make learning engaging and accessible for students worldwide. We believe in the power of storytelling and interactive learning to enhance educational outcomes.</p>
            <p>Developed by students at IIIT Surat as a 3rd Year project.</p>
          </div>
          <div className="card">
            <div className="card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h2>Features</h2>
            <p>
              • AI-powered quiz generation<br/>
              • Interactive story summarization<br/>
              • Progress tracking and analytics<br/>
              • User-friendly interface<br/>
              • Mobile responsive design
            </p>
          </div>
        </div>

        <div className="social-section">
          <h2>Connect With Us</h2>
          <div className="social-links">
            <a href="https://www.instagram.com/_enw.preet/" target="_blank" rel="noreferrer" className="social-link">
              <div className="social-icon instagram-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12c0-3.403 2.759-6.162 6.162-6.162s6.162 2.759 6.162 6.162-2.759 6.162-6.162 6.162-6.162-2.759-6.162-6.162zm1.621 0c0 2.507 2.034 4.541 4.541 4.541s4.541-2.034 4.541-4.541-2.034-4.541-4.541-4.541-4.541 2.034-4.541 4.541zm10.323-6.351c0 .796-.646 1.442-1.442 1.442s-1.442-.646-1.442-1.442.646-1.442 1.442-1.442 1.442.646 1.442 1.442z"/></svg>
              </div>
              <span className="social-label">Instagram</span>
            </a>
            <a href="https://www.linkedin.com/in/preet-agrawal-46684427b/" target="_blank" rel="noreferrer" className="social-link">
              <div className="social-icon linkedin-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </div>
              <span className="social-label">LinkedIn</span>
            </a>
            <a href="https://github.com/Preet-Agrawal" target="_blank" rel="noreferrer" className="social-link">
              <div className="social-icon github-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </div>
              <span className="social-label">GitHub</span>
            </a>
            <a href="mailto:preet81027@gmail.com" className="social-link">
              <div className="social-icon email-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z"/></svg>
              </div>
              <span className="social-label">Email</span>
            </a>
          </div>
        </div>

        <div className="contact-form">
          <h2>Send Us a Message</h2>
          {flash && (
            <div className={`flash-message ${flash.type}`}>
              <span className="flash-message-icon">{flash.type === 'success' ? '✓' : '✗'}</span>
              {flash.message}
              <button className="close-btn" onClick={() => setFlash(null)}>×</button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Your Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input type="text" name="subject" value={form.subject} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} required></textarea>
            </div>
            <button type="submit" className="submit-btn" disabled={sending}>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      <div className="footer">
        <p>Built by Preet Kumar · IIIT Surat</p>
      </div>
    </div>
  )
}
