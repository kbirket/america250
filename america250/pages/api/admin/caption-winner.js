import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@pattersonhc.org'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session || session.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Admin access only.' })
  }

  const { submissionId } = req.body
  if (!submissionId) return res.status(400).json({ error: 'Submission ID required.' })

  // Get the submission to find its date
  const submission = await base(Tables.CAPTION_SUBMISSIONS).find(submissionId)
  const date = submission.fields.Date

  // Clear any existing winner for that date
  const existing = await base(Tables.CAPTION_SUBMISSIONS).select({
    filterByFormula: `AND({Date} = '${date}', {IsWinner} = TRUE())`,
  }).firstPage()
  for (const r of existing) {
    await base(Tables.CAPTION_SUBMISSIONS).update(r.id, { IsWinner: false })
  }

  // Set new winner
  await base(Tables.CAPTION_SUBMISSIONS).update(submissionId, { IsWinner: true })

  return res.status(200).json({ success: true })
}
