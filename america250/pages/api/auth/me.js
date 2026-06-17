import { getSessionFromCookies } from '../../../lib/auth'
import { getMember } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getSessionFromCookies(req)
  if (!session) return res.status(200).json({ authenticated: false })

  const member = await getMember(session.email)
  if (!member) return res.status(200).json({ authenticated: true, isNewUser: true, email: session.email })

  return res.status(200).json({
    authenticated: true,
    isNewUser: false,
    email: session.email,
    member: member.fields,
  })
}
