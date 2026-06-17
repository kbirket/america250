import { savePhotoSubmission, getMember } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, category, q3_photo_url } = req.body

  if (!email) return res.status(400).json({ error: 'No email provided.' })

  const normalizedEmail = email.toLowerCase().trim()
  const member = await getMember(normalizedEmail)
  if (!member) return res.status(404).json({ error: 'Member not found.' })

  await savePhotoSubmission(
    normalizedEmail,
    member.fields.Name,
    member.fields.Location,
    req.body.submissionID || '',
    category || 'Other',
    q3_photo_url || '',
  )

  return res.status(200).json({ success: true })
}
