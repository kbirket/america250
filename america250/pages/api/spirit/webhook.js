import { getSpiritSubmission, saveSpiritSubmission } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, date } = req.body
  if (!email || !date) return res.status(400).json({ error: 'Missing fields.' })

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await getSpiritSubmission(normalizedEmail, date)
  if (existing) return res.status(200).json({ success: true })

  await saveSpiritSubmission(normalizedEmail, date, req.body.submissionID || '')
  return res.status(200).json({ success: true })
}
