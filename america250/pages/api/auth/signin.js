import { isValidPHCEmail, createSessionToken, setSessionCookie } from '../../../lib/auth'
import { getMember } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email || !isValidPHCEmail(email)) {
    return res.status(400).json({ error: 'A valid @pattersonhc.org email is required.' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const token = await createSessionToken(normalizedEmail)
  setSessionCookie(res, token)

  const member = await getMember(normalizedEmail)
  return res.status(200).json({
    success: true,
    isNewUser: !member,
    member: member?.fields || null,
  })
}
