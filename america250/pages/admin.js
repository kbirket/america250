import { useState, useEffect } from 'react'
import Head from 'next/head'
import { CAPTION_CONTESTS } from '../lib/content'

export default function AdminPage() {
  const [view, setView] = useState('pending')
  const [photos, setPhotos] = useState([])
  const [entries, setEntries] = useState([])
  const [captions, setCaptions] = useState([])
  const [captionDate, setCaptionDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [authError, setAuthError] = useState(false)

  useEffect(() => { loadData() }, [view, captionDate])

  async function loadData() {
    setLoading(true)
    try {
      if (view === 'pending' || view === 'approved') {
        const r = await fetch(`/api/admin?view=photos-${view}`)
        if (r.status === 403) { setAuthError(true); return }
        const d = await r.json()
        setPhotos(d.photos || [])
      } else if (view === 'entries') {
        const r = await fetch('/api/admin?view=entries')
        if (r.status === 403) { setAuthError(true); return }
        const d = await r.json()
        setEntries(d.entries || [])
      } else if (view === 'captions') {
        const r = await fetch(`/api/admin/captions?date=${captionDate}`)
        if (r.status === 403) { setAuthError(true); return }
        const d = await r.json()
        setCaptions(d.captions || [])
      }
    } catch {}
    setLoading(false)
  }

 async function handlePhotoAction(photoId, status, photoUrl = '') {
    setActionLoading(photoId)
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-photo-status', photoId, status, photoUrl }),
    })
    setPhotos(p => p.filter(ph => ph.id !== photoId))
    setActionLoading(null)
  }

  async function handlePickWinner(submissionId) {
    setActionLoading(submissionId)
    await fetch('/api/admin/caption-winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    })
    setCaptions(c => c.map(cap => ({
      ...cap,
      IsWinner: cap.id === submissionId,
    })))
    setActionLoading(null)
  }

  function exportCSV() {
    const rows = [['Rank', 'Name', 'Location', 'Entries']]
    entries.forEach((e, i) => rows.push([i + 1, e.name, e.location, e.entries]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'america250-entries.csv'; a.click()
  }

  const TABS = [
    { id: 'pending', label: 'Pending Photos' },
    { id: 'approved', label: 'Approved Photos' },
    { id: 'captions', label: 'Caption Contest' },
    { id: 'entries', label: 'All Entries' },
  ]

  const SPIRIT_DATES = ['2026-06-29','2026-06-30','2026-07-01','2026-07-02','2026-07-03']

  if (authError) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#B22234' }}>Access denied</h2>
      <p style={{ color: '#5a5a5a', marginTop: 8 }}>Admin only.</p>
      <a href="/" style={{ color: '#002868', marginTop: 16, display: 'block' }}>← Back to app</a>
    </div>
  )

  return (
    <>
      <Head><title>Admin · PHC America 250</title></Head>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#002868' }}>America 250 · Admin</h1>
            <p style={{ fontSize: 13, color: '#9a9a9a', marginTop: 2 }}>info@pattersonhc.org</p>
          </div>
          <a href="/" style={{ fontSize: 13, color: '#9a9a9a' }}>← Back to app</a>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid #e0e0e0', paddingBottom: 12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              padding: '7px 14px', border: '1px solid', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              fontWeight: view === t.id ? 600 : 400,
              background: view === t.id ? '#002868' : 'white',
              color: view === t.id ? 'white' : '#5a5a5a',
              borderColor: view === t.id ? '#002868' : '#e0e0e0',
            }}>{t.label}</button>
          ))}
        </div>

        {loading && <p style={{ color: '#9a9a9a', fontSize: 14 }}>Loading...</p>}

        {/* Photo queues */}
        {(view === 'pending' || view === 'approved') && !loading && (
          <>
            {photos.length === 0 && (
              <p style={{ color: '#9a9a9a', fontSize: 14 }}>
                {view === 'pending' ? 'No photos awaiting review.' : 'No approved photos yet.'}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {photos.map(photo => (
                <div key={photo.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
                  {photo.PhotoURL
                    ? <img src={photo.PhotoURL} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                    : <div style={{ aspectRatio: 1, background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📸</div>
                  }
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{photo.MemberName}</div>
                    <div style={{ fontSize: 11, color: '#9a9a9a' }}>{photo.Location} · {photo.Category}</div>
                    <div style={{ fontSize: 10, color: '#9a9a9a', marginTop: 2 }}>
                      {photo.MemberEmail} · {new Date(photo.SubmittedAt).toLocaleDateString()}
                    </div>
                   {view === 'pending' && (
                      <div style={{ marginTop: 10 }}>
                        <input
                          type="url"
                          placeholder="Paste JotForm photo URL before approving..."
                          id={`url-${photo.id}`}
                          style={{
                            width: '100%', padding: '7px 10px', border: '1px solid #e0e0e0',
                            borderRadius: 6, fontSize: 12, marginBottom: 6,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => {
                              const url = document.getElementById(`url-${photo.id}`)?.value || ''
                              handlePhotoAction(photo.id, 'approved', url)
                            }}
                            disabled={actionLoading === photo.id}
                            style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 6, background: '#2d7a3a', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handlePhotoAction(photo.id, 'rejected', '')}
                            disabled={actionLoading === photo.id}
                            style={{ flex: 1, padding: '7px', border: '1px solid #e0e0e0', borderRadius: 6, background: 'white', color: '#a32d2d', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Caption contest */}
        {view === 'captions' && !loading && (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#5a5a5a' }}>Date:</label>
              <select value={captionDate} onChange={e => setCaptionDate(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13 }}>
                {SPIRIT_DATES.map(d => (
                  <option key={d} value={d}>
                    {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>

            {CAPTION_CONTESTS[captionDate] && (
              <div style={{ background: '#f4f5f7', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#5a5a5a', fontStyle: 'italic' }}>
                "{CAPTION_CONTESTS[captionDate].scenario}"
              </div>
            )}

            {captions.length === 0 && <p style={{ color: '#9a9a9a', fontSize: 14 }}>No captions submitted for this date yet.</p>}

            {captions.map(cap => (
              <div key={cap.id} style={{
                border: `1px solid ${cap.IsWinner ? '#dba51f' : '#e0e0e0'}`,
                background: cap.IsWinner ? '#fdf3d9' : 'white',
                borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  {cap.IsWinner && <div style={{ fontSize: 10, fontWeight: 600, color: '#8b6800', marginBottom: 4 }}>🏆 WINNER</div>}
                  <div style={{ fontSize: 14, color: '#222', lineHeight: 1.4, marginBottom: 6 }}>"{cap.Caption}"</div>
                  <div style={{ fontSize: 11, color: '#9a9a9a' }}>{cap.MemberName} · {cap.MemberEmail}</div>
                </div>
                {!cap.IsWinner && (
                  <button onClick={() => handlePickWinner(cap.id)} disabled={actionLoading === cap.id}
                    style={{ padding: '7px 12px', background: '#dba51f', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Pick winner 🏆
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* Entries table */}
        {view === 'entries' && !loading && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#5a5a5a' }}>{entries.length} participants total</p>
              <button onClick={exportCSV} style={{
                padding: '7px 14px', background: '#002868', color: 'white',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Export CSV for drawing</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  {['Rank', 'Name', 'Location', 'Entries'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: '#5a5a5a', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.email} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 6px', color: '#9a9a9a' }}>{i + 1}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 500 }}>{e.name}</td>
                    <td style={{ padding: '8px 6px', color: '#5a5a5a' }}>{e.location}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 700, color: '#002868' }}>{e.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  )
}
