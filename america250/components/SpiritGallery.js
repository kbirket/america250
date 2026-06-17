import { useState, useEffect } from 'react'
import { SPIRIT_WEEK } from '../lib/content'

export default function SpiritGallery({ email }) {
  const [photos, setPhotos] = useState([])
  const [myHearts, setMyHearts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDay, setOpenDay] = useState(null)
  const [hearting, setHearting] = useState(null)

  const today = new Date().toLocaleDateString('en-CA')

  useEffect(() => {
    fetch('/api/spirit/photos')
      .then(r => r.json())
      .then(d => {
        setPhotos(d.photos || [])
        setMyHearts(d.myHearts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleHeart(photoId) {
    if (hearting) return
    setHearting(photoId)
    const r = await fetch('/api/spirit/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'heart', photoId }),
    })
    const data = await r.json()
    if (r.ok) {
      setMyHearts(h => data.hearted
        ? [...h, photoId]
        : h.filter(id => id !== photoId)
      )
      setPhotos(p => p.map(ph => ph.id === photoId
        ? { ...ph, Hearts: data.hearted ? (ph.Hearts || 0) + 1 : Math.max(0, (ph.Hearts || 0) - 1) }
        : ph
      ))
    }
    setHearting(null)
  }

  if (loading) return null

  const photosByDate = {}
  photos.forEach(p => {
    if (!photosByDate[p.Date]) photosByDate[p.Date] = []
    photosByDate[p.Date].push(p)
  })

  // Only show days that have passed or are today
  const visibleDays = SPIRIT_WEEK.filter(d => d.date <= today)

  if (visibleDays.length === 0) return null

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#9a9a9a',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        Spirit Week Gallery
      </div>

      {visibleDays.map(day => {
        const dayPhotos = photosByDate[day.date] || []
        const isOpen = openDay === day.date

        return (
          <div key={day.date} style={{ marginBottom: 8 }}>
            <button
              onClick={() => setOpenDay(isOpen ? null : day.date)}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: isOpen ? '10px 10px 0 0' : 10,
                background: isOpen ? '#002868' : 'white',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <i className={`ti ${day.icon}`} style={{
                fontSize: 18,
                color: isOpen ? '#dba51f' : '#002868',
              }} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isOpen ? 'white' : '#002868' }}>
                  {day.theme}
                </div>
                <div style={{ fontSize: 11, color: isOpen ? 'rgba(255,255,255,0.6)' : '#9a9a9a' }}>
                  {day.day} · {dayPhotos.length} photo{dayPhotos.length !== 1 ? 's' : ''}
                </div>
              </div>
              <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`}
                style={{ fontSize: 16, color: isOpen ? 'white' : '#9a9a9a' }}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div style={{
                border: '1px solid #e0e0e0', borderTop: 'none',
                borderRadius: '0 0 10px 10px', padding: 12,
              }}>
                {dayPhotos.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9a9a9a', textAlign: 'center', padding: '16px 0' }}>
                    No photos yet for this day!
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {dayPhotos.map(photo => {
                      const hearted = myHearts.includes(photo.id)
                      const isOwn = photo.MemberEmail === email
                      return (
                        <div key={photo.id} style={{
                          border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden',
                        }}>
                          {photo.PhotoURL ? (
                            <img src={photo.PhotoURL} alt={`${photo.MemberName}'s outfit`}
                              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{
                              aspectRatio: 1, background: '#f4f5f7',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <i className="ti ti-shirt" style={{ fontSize: 32, color: '#e0e0e0' }} aria-hidden="true" />
                            </div>
                          )}
                          <div style={{ padding: '8px 10px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#002868' }}>
                              {photo.MemberName?.split(' ')[0]} {photo.MemberName?.split(' ').slice(-1)[0]?.[0]}.
                            </div>
                            <div style={{ fontSize: 11, color: '#9a9a9a' }}>{photo.Location}</div>
                            <button
                              onClick={() => !isOwn && handleHeart(photo.id)}
                              disabled={isOwn || hearting === photo.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                marginTop: 6, padding: '4px 8px',
                                border: '1px solid', borderRadius: 6,
                                borderColor: hearted ? '#f09595' : '#e0e0e0',
                                background: hearted ? '#fcebeb' : 'white',
                                color: hearted ? '#a32d2d' : '#9a9a9a',
                                fontSize: 11, cursor: isOwn ? 'default' : 'pointer',
                                width: '100%', justifyContent: 'center',
                              }}
                            >
                              <i className={`ti ${hearted ? 'ti-heart-filled' : 'ti-heart'}`}
                                style={{ fontSize: 13 }} aria-hidden="true" />
                              {photo.Hearts || 0} {isOwn ? '(yours)' : hearted ? 'liked' : 'like'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
