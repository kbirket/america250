import { getSessionFromCookies } from '../../../lib/auth'
import { savePhotoSubmission, getMember, getMemberPhotoSubmission } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { category, photoUrl, hipaaConfirmed } = req.body
  if (!category || !photoUrl) return res.status(400).json({ error: 'Missing fields.' })
  if (!hipaaConfirmed) return res.status(400).json({ error: 'HIPAA confirmation required.' })

  const existing = await getMemberPhotoSubmission(session.email)
  if (existing) return res.status(400).json({ error: 'You have already submitted a photo.' })

  const member = await getMember(session.email)
  await savePhotoSubmission(
    session.email,
    member?.fields?.Name || 'Employee',
    member?.fields?.Location || 'PHC',
    '',
    category,
    photoUrl,
  )

  return res.status(200).json({ success: true })
}
