import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'
import { getMember } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { date, caption } = req.body
  if (!date || !caption?.trim()) return res.status(400).json({ error: 'Missing fields.' })

  const existing = await base(Tables.CAPTION_SUBMISSIONS).select({
    filterByFormula: `AND({MemberEmail} = '${session.email}', {Date} = '${date}')`,
    maxRecords: 1,
  }).firstPage()
  if (existing[0]) return res.status(400).json({ error: 'Already submitted today.' })

  const member = await getMember(session.email)
  await base(Tables.CAPTION_SUBMISSIONS).create({
    MemberEmail: session.email,
    MemberName: member?.fields?.Name || 'Employee',
    Date: date,
    Caption: caption.trim(),
    IsWinner: false,
    SubmittedAt: new Date().toISOString(),
  })

  return res.status(200).json({ success: true })
}
