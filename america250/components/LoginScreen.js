import { useState } from 'react'

export default function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error); setLoading(false); return }
      onSuccess({ email: email.trim().toLowerCase(), isNewUser: data.isNewUser, member: data.member })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const validEmail = /^[^\s@]+@pattersonhc\.org$/i.test(email)

  return (
    <div className="app-shell">
      <div className="app-header">
        <div style={{ color: '#dba51f', fontSize: 18, marginBottom: 6, letterSpacing: 6 }}>★ ★ ★</div>
        <h1>PHC America 250</h1>
        <div className="subtitle">Spirit Week · June 29 – July 3, 2026</div>
      </div>
      <div className="header-stars">★ ★ ★ ★ ★ ★ ★ ★</div>

      <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🇺🇸</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#002868', marginBottom: 8 }}>
            Welcome to America 250!
          </h2>
          <p style={{ fontSize: 14, color: '#5a5a5a', lineHeight: 1.6 }}>
            Trivia, spirit week, bingo, photo contests, and prizes — all week long. Enter your PHC email to join.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="input-label">Your PHC email address</label>
          <input
            className="input-field"
            type="email"
            placeholder="yourname@pattersonhc.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            required
          />
          {error && <div className="error-box" style={{ marginTop: 8 }}>{error}</div>}
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: 14 }}
            disabled={loading || !validEmail}
          >
            {loading ? 'Signing in...' : "Let's celebrate! 🎉"}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9a9a9a', marginTop: 16 }}>
          Only @pattersonhc.org addresses can participate.
        </p>
      </div>
    </div>
  )
}
