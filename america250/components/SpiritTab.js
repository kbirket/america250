import { useState, useEffect } from 'react'
import { SPIRIT_WEEK } from '../lib/content'

export default function SpiritTab({ member, onToast }) {
  const [submittedDates, setSubmittedDates] = useState([])
  const [showForm, setShowForm] = useState(null) // date string
  const [loading, setLoading] = useState(true)

  const today = new Date().toLocaleDateString('en-CA')

  useEffect(() => {
    // Check which days the member has already submitted
    fetch('/api/spirit/status')
      .then(r => r.json())
      .then(d => {
        setSubmittedDates(d.submittedDates || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function getDayStatus(date) {
    const d = new Date(date + 'T00:00:00')
    const t = new Date(today + 'T00:00:00')
    if (d > t) return 'future'
    if (d < t) return 'past'
    return 'today'
  }

  const JOTFORM_SPIRIT_ID = process.env.NEXT_PUBLIC_JOTFORM_SPIRIT_ID || 'YOUR_JOTFORM_ID'

  if (loading) return <div className="loading">Loading spirit week...</div>

  return (
    <>
      <div className="section-label">Spirit Week · June 29 – July 3</div>

      {SPIRIT_WEEK.map(day => {
        const status = getDayStatus(day.date)
        const submitted = submittedDates.includes(day.date)
        const isToday = status === 'today'
        const isPast = status === 'past'
        const isFuture = status === 'future'

        return (
          <div key={day.date} className={`spirit-day${isToday ? ' today' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              <div className="spirit-icon">
                <i className={`ti ${day.icon}`} aria-hidden="true" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#9a9a9a', marginBottom: 2 }}>
                  {day.day}, {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  {isToday && <span className="today-badge">TODAY</span>}
                  {isPast && <span className="past-badge">Past</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#002868' }}>{day.theme}</div>
              </div>
              {submitted && (
                <span style={{ fontSize: 11, color: '#2d7a3a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <i className="ti ti-check" style={{ fontSize: 14 }} aria-hidden="true" />
                  +1
                </span>
              )}
            </div>

            <p style={{ fontSize: 12, color: '#5a5a5a', lineHeight: 1.4, margin: '8px 0 0 52px' }}>
              {day.description}
            </p>

            {(isToday || isPast) && !submitted && !isFuture && (
              <div style={{ margin: '10px 0 0 52px' }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 13, padding: '9px 16px', width: 'auto' }}
                  onClick={() => setShowForm(showForm === day.date ? null : day.date)}
                >
                  <i className="ti ti-camera" style={{ verticalAlign: -2, marginRight: 5 }} aria-hidden="true" />
                  Submit outfit photo (+1 entry)
                </button>
              </div>
            )}

            {showForm === day.date && (
              <div style={{ margin: '10px 0 0', width: '100%' }}>
                <div className="info-box" style={{ marginBottom: 8 }}>
                  <i className="ti ti-shield" style={{ verticalAlign: -2, marginRight: 4 }} aria-hidden="true" />
                  Your +1 entry is awarded after submitting the form below.
                </div>
               href={`https://form.jotform.com/${JOTFORM_SPIRIT_ID}?email=${encodeURIComponent(member?.Email || '')}&date=${day.date}&theme=${encodeURIComponent(day.theme)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', padding: '13px 20px',
                    background: '#B22234', color: 'white', borderRadius: 10,
                    fontSize: 14, fontWeight: 600, marginBottom: 10,
                  }}
                >
                  Open photo submission form ↗
                </a>
                <p style={{ fontSize: 12, color: '#5a5a5a', textAlign: 'center', marginTop: 8 }}>
                  Your entry is awarded automatically when you hit Submit above!
                </p>
              </div>
            )}
          </div>
        )
      })}

      <div className="info-box" style={{ marginTop: 12 }}>
        <i className="ti ti-star" style={{ verticalAlign: -2, marginRight: 4 }} aria-hidden="true" />
        Submit a photo each day for up to +5 bonus entries across the week!
      </div>
    </>
  )
}
