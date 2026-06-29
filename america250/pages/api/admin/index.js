import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables, getPendingPhotos, getApprovedPhotos, updatePhotoStatus, getLeaderboard } from '../../../lib/airtable'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@pattersonhc.org'

function isAdmin(email) {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export default async function handler(req, res) {
  const session = await getSessionFromCookies(req)
  if (!session || !isAdmin(session.email)) {
    return res.status(403).json({ error: 'Admin access only.' })
  }

  if (req.method === 'GET') {
    const { view } = req.query

   if (view === 'photos-pending') {
      const photos = await getPendingPhotos()
      return res.status(200).json({ photos })
    }

    if (view === 'photos-approved') {
      const photos = await getApprovedPhotos()
      return res.status(200).json({ photos })
    }

    if (view === 'spirit-pending') {
      const records = await base(Tables.SPIRIT_PHOTOS).select({
        filterByFormula: `{Status} = 'pending'`,
        sort: [{ field: 'SubmittedAt', direction: 'asc' }],
      }).firstPage()
      return res.status(200).json({ photos: records.map(r => ({ id: r.id, ...r.fields })) })
    }

    if (view === 'entries') {
      const board = await getLeaderboard()
      return res.status(200).json({ entries: board })
    }

    return res.status(400).json({ error: 'Unknown view.' })
  }

  if (req.method === 'POST') {
    const { action, photoId, status, photoUrl } = req.body

    if (action === 'update-photo-status') {
      if (!photoId || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid request.' })
      }
      await updatePhotoStatus(photoId, status, photoUrl)
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Unknown action.' })
  }

  return res.status(405).end()
}


// Caption winner selection (append to existing handler via separate export)
