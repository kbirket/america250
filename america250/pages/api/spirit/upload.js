import { getSessionFromCookies } from '../../../lib/auth'
import { getSpiritSubmission, saveSpiritSubmission } from '../../../lib/airtable'
import base, { Tables } from '../../../lib/airtable'
import { getMember } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { date, photoUrl } = req.body
  if (!date || !photoUrl) return res.status(400).json({ error: 'Missing fields.' })

  // Award entry (SpiritSubmissions)
  const existing = await getSpiritSubmission(session.email, date)
  if (!existing) {
    await saveSpiritSubmission(session.email, date, '')
  }

  // Create SpiritPhotos record for gallery
  const member = await getMember(session.email)
  await base(Tables.SPIRIT_PHOTOS).create({
    MemberEmail: session.email,
    MemberName: member?.fields?.Name || 'Employee',
    Location: member?.fields?.Location || 'PHC',
    Date: date,
    PhotoURL: photoUrl,
    Status: 'pending',
    Hearts: 0,
    SubmittedAt: new Date().toISOString(),
  })

  return res.status(200).json({ success: true })
}
