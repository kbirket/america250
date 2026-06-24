import { useState } from 'react'

const LOCATIONS = [
  'Patterson Health Center',
  'Harper Wellness Center',
  'Anthony Wellness Center',
  'Heritage Estates',
  'DME',
  'Conway Springs',
]

const DEPARTMENTS = [
  'Administration',
  'Behavioral Health',
  'Business Office',
  'Clinic',
  'Dietary',
  'Emergency',
  'Environmental Services',
  'Finance',
  'HR',
  'IT',
  'Laboratory',
  'Marketing & Communications',
  'Medical Records',
  'Nursing',
  'Pharmacy',
  'Physical Therapy',
  'Radiology',
  'Rehabilitation',
  'Senior Life Solutions',
  'Surgery',
  'Other',
]

export default function ProfileSetup({ email, onComplete }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !location || !department) return
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), location, department }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error); return }
      onComplete(data.member)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <div style={{ color: '#dba51f', fontSize: 16, marginBottom: 4, letterSpacing: 6 }}>★ ★ ★</div>
        <h1>PHC America 250</h1>
        <div className="subtitle">One-time setup</div>
      </div>
      <div className="header-stars">★ ★ ★ ★ ★ ★ ★ ★</div>

      <div className="tab-content">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#002868', marginBottom: 6 }}>
            Welcome! Quick setup
          </h2>
          <p style={{ fontSize: 13, color: '#5a5a5a', lineHeight: 1.5 }}>
            Tell us a bit about yourself. This only takes a moment and you won't have to do it again.
          </p>
          <p style={{ fontSize: 12, color: '#9a9a9a', marginTop: 4 }}>{email}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-12">
            <label className="input-label">Your name</label>
            <input
              className="input-field"
              type="text"
              placeholder="First and last name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="mb-12">
            <label className="input-label">Location</label>
            <select
              className="select-field"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            >
              <option value="">Select your location...</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="mb-16">
            <label className="input-label">Department</label>
            <select
              className="select-field"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              required
            >
              <option value="">Select your department...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {error && <div className="error-box mb-12">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !name.trim() || !location || !department}
          >
            {loading ? 'Setting up...' : "Let's celebrate! 🎉"}
          </button>
        </form>
      </div>
    </div>
  )
}
