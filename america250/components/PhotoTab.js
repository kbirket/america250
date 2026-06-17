import { useState, useEffect } from 'react'

const CATEGORIES = ['Patriotic Setup', 'Patriotic Food', 'Patriotic Fun', 'Other']

export default function PhotoTab({ member, email, onToast }) {
  const [photos, setPhotos] = useState([])
  const [myVotes, setMyVotes] = useState([])
  const [mySubmission, setMySubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSubmit, setShowSubmit] = useState(false)
  const [hipaaConfirmed, setHipaaConfirmed] = useState(false)
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [voting, setVoting] = useState(null)

  const JOTFORM_PHOTO_ID = process.env.NEXT_PUBLIC_JOTFORM_PHOTO_ID || 'YOUR_PHOTO_JOTFORM_ID'
  const votesRemaining = 3 - myVotes.length

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const r = await fetch('/api/photos')
      const d = await r.json()
      setPhotos(d.photos || [])
      setMyVotes(d.myVotes || [])
      setMySubmission(d.mySubmission)
    } catch {}
    setLoading(false)
  }

  async function handleVote(photoId) {
    if (voting || myVotes.includes(photoId)) return
    setVoting(photoId)
    const r = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', photoId }),
    })
    const data = await r.json()
    if (r.ok) {
      setMyVotes(v => [...v, photoId])
      setPhotos(p => p.map(ph => ph.id === photoId ? { ...ph, Votes: (ph.Votes || 0) + 1 } : ph))
      onToast(`❤️ Voted! ${votesRemaining - 1} votes remaining`)
    } else {
      onToast(data.error)
    }
    setVoting(null)
  }

  async function handlePhotoSubmit() {
    if (!hipaaConfirmed || !category) return
    setSubmitting(true)
    const r = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        jotformId: 'pending',
        category,
        photoUrl: '',
        hipaaConfirmed,
      }),
    })
    const data = await r.json()
    if (r.ok) {
      setMySubmission({ Status: 'pending', Category: category })
      setShowSubmit(false)
      onToast('📸 Photo submitted for review! +1 entry earned')
    } else {
      onToast(data.error)
    }
    setSubmitting(false)
  }

  const votingClosed = new Date() > new Date('2026-07-04T00:00:00')

  if (loading) return <div className="loading">Loading photo contest...</div>

  return (
    <>
      <div className="section-label">America 250 Photo Contest</div>

      {/* My submission status */}
      {mySubmission ? (
        <div className={mySubmission.Status === 'approved' ? 'success-box' : 'info-box'} style={{ marginBottom: 12 }}>
          <i className={`ti ${mySubmission.Status === 'approved' ? 'ti-check' : 'ti-clock'}`}
            style={{ verticalAlign: -2, marginRight: 4 }} aria-hidden="true" />
          {mySubmission.Status === 'approved'
            ? 'Your photo is live in the gallery!'
            : mySubmission.Status === 'rejected'
            ? 'Your photo was removed. Please resubmit without patients visible.'
            : 'Your photo is pending admin review. Check back soon!'}
        </div>
      ) : (
        <div className="card card-blue" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#002868', marginBottom: 10, lineHeight: 1.4 }}>
            <strong>Submit a patriotic photo</strong> for +1 entry and a chance at the People's Choice award! No patients or patient spaces in the photo, please.
          </p>
          <button
            className="btn-primary"
            style={{ fontSize: 13 }}
            onClick={() => setShowSubmit(!showSubmit)}
          >
            <i className="ti ti-upload" style={{ verticalAlign: -2, marginRight: 5 }} aria-hidden="true" />
            Submit my photo
          </button>
        </div>
      )}

      {/* Submit form */}
      {showSubmit && !mySubmission && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label className="input-label">Photo category</label>
            <select className="select-field" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select a category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="checkbox-row" style={{ borderColor: hipaaConfirmed ? '#97c459' : '#e0e0e0', background: hipaaConfirmed ? '#eaf3de' : 'white' }}>
            <input
              type="checkbox"
              id="hipaa"
              checked={hipaaConfirmed}
              onChange={e => setHipaaConfirmed(e.target.checked)}
            />
            <label className="checkbox-label" htmlFor="hipaa">
              I confirm that <strong>no patients, patient information, or identifiable clinical spaces</strong> appear in my photo. I understand this is required for HIPAA compliance.
            </label>
          </div>

          <div style={{ fontSize: 12, color: '#5a5a5a', marginBottom: 10 }}>
            Use the form below to upload your photo. After submitting, click "Claim my entry."
          </div>

          <iframe
            src={`https://form.jotform.com/${JOTFORM_PHOTO_ID}?email=${encodeURIComponent(email || '')}&category=${encodeURIComponent(category)}`}
            style={{ width: '100%', height: 400, border: 'none', borderRadius: 8 }}
            title="Photo Contest Submission"
          />

          <button
            className="btn-primary"
            style={{ marginTop: 10, fontSize: 13 }}
            onClick={handlePhotoSubmit}
            disabled={!hipaaConfirmed || !category || submitting}
          >
            {submitting ? 'Submitting...' : 'I submitted the form — claim my entry (+1)'}
          </button>
        </div>
      )}

      {/* Votes remaining */}
      {!votingClosed && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="section-label" style={{ margin: 0 }}>Gallery · vote for your favorites</span>
          <span style={{ fontSize: 12, color: '#9a9a9a' }}>
            {votesRemaining > 0 ? `${votesRemaining} votes left` : 'All votes cast'}
          </span>
        </div>
      )}

      {votingClosed && (
        <div className="info-box" style={{ marginBottom: 10 }}>
          Voting is closed. People's Choice winner announced July 3!
        </div>
      )}

      {photos.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <p style={{ fontSize: 13, color: '#5a5a5a' }}>No approved photos yet — be the first to submit!</p>
        </div>
      )}

      <div className="photo-grid">
        {photos.map(photo => {
          const voted = myVotes.includes(photo.id)
          const isOwn = photo.MemberEmail === email
          return (
            <div key={photo.id} className="photo-card">
              {photo.PhotoURL ? (
                <img src={photo.PhotoURL} alt={`${photo.MemberName}'s photo`} />
              ) : (
                <div style={{ aspectRatio: 1, background: '#eef4fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-camera" style={{ fontSize: 32, color: '#b5d4f4' }} aria-hidden="true" />
                </div>
              )}
              <div className="photo-card-footer">
                <div className="photo-name">
                  {photo.MemberName?.split(' ')[0]} {photo.MemberName?.split(' ').slice(-1)[0]?.[0]}.
                </div>
                <div className="photo-loc">{photo.Location}</div>
                <div style={{ fontSize: 10, color: '#9a9a9a', marginTop: 2 }}>{photo.Category}</div>
                <button
                  className={`vote-btn${voted ? ' voted' : ''}`}
                  onClick={() => !isOwn && !votingClosed && !voted && handleVote(photo.id)}
                  disabled={isOwn || voted || votingClosed || votesRemaining === 0}
                  style={{ cursor: isOwn || voted || votingClosed ? 'default' : 'pointer' }}
                >
                  <i className={`ti ${voted ? 'ti-heart-filled' : 'ti-heart'}`} style={{ fontSize: 13 }} aria-hidden="true" />
                  {photo.Votes || 0} {isOwn ? '(your photo)' : voted ? 'voted' : 'vote'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
