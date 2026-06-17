import { getSessionFromCookies } from '../../../lib/auth'
import { getBingoBoard, saveBingoBoard, updateBingoMarked, saveBingoCompletion } from '../../../lib/airtable'
import { generateBingoBoard, checkBingo } from '../../../lib/bingo'

export default async function handler(req, res) {
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  if (req.method === 'GET') {
    let board = await getBingoBoard(session.email)
    if (!board) {
      const squares = generateBingoBoard(session.email)
      await saveBingoBoard(session.email, squares, [12]) // 12 = FREE center
      board = await getBingoBoard(session.email)
    }
    const squares = JSON.parse(board.fields.Squares)
    const marked = JSON.parse(board.fields.Marked || '[12]')
    return res.status(200).json({ squares, marked })
  }

  if (req.method === 'POST') {
    const { marked } = req.body
    if (!Array.isArray(marked)) return res.status(400).json({ error: 'Invalid marked array.' })

    await updateBingoMarked(session.email, marked)

    const { wins, blackout } = checkBingo(marked)
    const bonuses = []

    if (wins.length > 0) {
      // Award +3 for first bingo (tracked by saveBingoCompletion dedup)
      await saveBingoCompletion(session.email, 'bingo', 3)
      bonuses.push({ type: 'bingo', entries: 3 })
    }
    if (blackout) {
      await saveBingoCompletion(session.email, 'blackout', 10)
      bonuses.push({ type: 'blackout', entries: 10 })
    }

    return res.status(200).json({ success: true, wins, blackout, bonuses })
  }

  return res.status(405).end()
}
