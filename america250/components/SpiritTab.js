import { useState, useEffect, useRef } from 'react'
import { SPIRIT_WEEK } from '../lib/content'
import SpiritGallery from './SpiritGallery'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export default function SpiritTab({ member, onToast }) {
  const [submittedDates, setSubmittedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)
  const fileInputRefs = useRef({})

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })

  useEffect(() => {
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

  async function handleFileSelect(date, file) {
    if (!file) return
    setUploading(date)

    try {
      // Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', 'america250/spirit')

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const cloudData = await cloudRes.json()

      if (!cloudData.secure_url) {
        onToast('Upload failed — please try again')
        setUploading(null)
        return
      }

      // Save to app
      const r = await fetch('/api/spirit/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, photoUrl: cloudData.secure_url }),
      })

      if (r.ok) {
        setSubmittedDates(d => [...d, date])
        onToast('🎉 Photo uploaded! +1 entry earned')
      } else {
        onToast('Something went wrong — please try again')
      }
    } catch {
      onToast('Upload failed — please try again')
    }

    setUploading(null)
  }

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
        const isUploading = uploading === day.date

        // Friday July 3 — open through Sunday July 5
        const isFridayExtended = day.date === '2026-07-03' && today <= '2026-07-05'
        const canSubmit = (isToday || isPast || isFridayExtended) && !isFuture && !submitted

        return (
          <div key={day.date} className={`spirit-day${isToday ? ' today' : ''}`}
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
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

            {canSubmit && (
              <div style={{ margin: '10px 0 0 52px' }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={el => fileInputRefs.current[day.date] = el}
                  style={{ display: 'none' }}
                  onChange={e => handleFileSelect(day.date, e.target.files[0])}
                />
                <button
                  className="btn-primary"
                  style={{ fontSize: 13, padding: '9px 16px', width: 'auto' }}
                  onClick={() => fileInputRefs.current[day.date]?.click()}
                  disabled={isUploading}
                >
                  <i className="ti ti-camera" style={{ verticalAlign: -2, marginRight: 5 }} aria-hidden="true" />
                  {isUploading ? 'Uploading...' : 'Submit outfit photo (+1 entry)'}
                </button>
                <p style={{ fontSize: 11, color: '#9a9a9a', marginTop: 6 }}>
                  No patients or patient spaces in the photo please.
                </p>
              </div>
            )}

            {submitted && (
              <div style={{ margin: '8px 0 0 52px', fontSize: 12, color: '#2d7a3a' }}>
                <i className="ti ti-check" style={{ verticalAlign: -2, marginRight: 4 }} aria-hidden="true" />
                Photo submitted! Pending admin review for the gallery.
              </div>
            )}
          </div>
        )
      })}

      <div className="info-box" style={{ marginTop: 12 }}>
        <i className="ti ti-star" style={{ verticalAlign: -2, marginRight: 4 }} aria-hidden="true" />
        Submit a photo each day for up to +5 bonus entries across the week!
      </div>

      <SpiritGallery email={member?.Email} />
    </>
  )
}
