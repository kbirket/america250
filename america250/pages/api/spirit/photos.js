import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'

export default async function handler(req, res) {
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  if (req.method === 'GET') {
    const photos = await base(Tables.SPIRIT_PHOTOS).select({
      filterByFormula: `{Status} = 'approved'`,
      sort: [{ field: 'SubmittedAt', direction: 'asc' }],
    }).firstPage()

    const hearts = await base(Tables.SPIRIT_HEARTS).select({
      filterByFormula: `{MemberEmail} = '${session.email}'`,
    }).firstPage()

    const myHearts = hearts.map(r => r.fields.PhotoID)

    return res.status(200).json({
      photos: photos.map(r => ({ id: r.id, ...r.fields })),
      myHearts,
    })
  }

  if (req.method === 'POST') {
    const { action, photoId } = req.body

    if (action === 'heart') {
      const existing = await base(Tables.SPIRIT_HEARTS).select({
        filterByFormula: `AND({MemberEmail} = '${session.email}', {PhotoID} = '${photoId}')`,
        maxRecords: 1,
      }).firstPage()

      if (existing[0]) {
        // Unheart
        await base(Tables.SPIRIT_HEARTS).destroy(existing[0].id)
        const photo = await base(Tables.SPIRIT_PHOTOS).find(photoId)
        const current = photo.fields.Hearts || 0
        await base(Tables.SPIRIT_PHOTOS).update(photoId, { Hearts: Math.max(0, current - 1) })
        return res.status(200).json({ hearted: false })
      } else {
        // Heart
        await base(Tables.SPIRIT_HEARTS).create({ MemberEmail: session.email, PhotoID: photoId })
        const photo = await base(Tables.SPIRIT_PHOTOS).find(photoId)
        const current = photo.fields.Hearts || 0
        await base(Tables.SPIRIT_PHOTOS).update(photoId, { Hearts: current + 1 })
        return res.status(200).json({ hearted: true })
      }
    }

    if (action === 'submit') {
      const { date, jotformId } = req.body
      const member = await base(Tables.MEMBERS).select({
        filterByFormula: `{Email} = '${session.email}'`,
        maxRecords: 1,
      }).firstPage()

      await base(Tables.SPIRIT_PHOTOS).create({
        MemberEmail: session.email,
        MemberName: member[0]?.fields?.Name || 'Employee',
        Location: member[0]?.fields?.Location || 'PHC',
        Date: date,
        PhotoURL: '',
        Status: 'pending',
        Hearts: 0,
        SubmittedAt: new Date().toISOString(),
      })
      return res.status(200).json({ success: true })
    }
  }

  return res.status(405).end()
}
