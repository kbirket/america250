import { getSessionFromCookies } from '../../../lib/auth'
import {
  getApprovedPhotos, getMemberPhotoSubmission, savePhotoSubmission,
  getMemberVotes, saveVote, getMember,
} from '../../../lib/airtable'

export default async function handler(req, res) {
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  if (req.method === 'GET') {
    const [photos, myVotes, mySubmission] = await Promise.all([
      getApprovedPhotos(),
      getMemberVotes(session.email),
      getMemberPhotoSubmission(session.email),
    ])
    return res.status(200).json({ photos, myVotes, mySubmission: mySubmission?.fields || null })
  }

  if (req.method === 'POST') {
    const { action } = req.body

    if (action === 'vote') {
      const { photoId } = req.body
      if (!photoId) return res.status(400).json({ error: 'Photo ID required.' })
      const result = await saveVote(session.email, photoId)
      if (result.error) return res.status(400).json({ error: result.error })
      return res.status(200).json({ success: true })
    }

    if (action === 'submit') {
      const { jotformId, category, photoUrl, hipaaConfirmed } = req.body
      if (!hipaaConfirmed) {
        return res.status(400).json({ error: 'You must confirm no patients appear in your photo.' })
      }
      const existing = await getMemberPhotoSubmission(session.email)
      if (existing) return res.status(400).json({ error: 'You have already submitted a photo.' })
      const member = await getMember(session.email)
      await savePhotoSubmission(
        session.email,
        member?.fields?.Name || 'Employee',
        member?.fields?.Location || 'PHC',
        jotformId,
        category,
        photoUrl,
      )
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Unknown action.' })
  }

  return res.status(405).end()
}
