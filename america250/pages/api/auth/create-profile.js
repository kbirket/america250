import { getSessionFromCookies } from '../../../lib/auth'
import { getMember, createMember } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { name, location, department } = req.body
  if (!name || !location || !department) {
    return res.status(400).json({ error: 'Name, location, and department are required.' })
  }

  const existing = await getMember(session.email)
  if (existing) return res.status(200).json({ member: existing.fields })

  const member = await createMember({
    email: session.email,
    name: name.trim(),
    location,
    department,
  })

  return res.status(200).json({ member: member.fields })
}
