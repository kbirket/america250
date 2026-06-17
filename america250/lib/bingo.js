// 45-square pool — unique board generated per email via seeded shuffle
export const BINGO_SQUARES = [
  'Wore red, white & blue',
  'Wore a patriotic hat or headband',
  'Wore patriotic socks or shoes',
  'Wore something with "USA" on it',
  'Wore stars AND stripes at the same time',
  'Dressed up for costume day',
  'Wore denim today',
  'Wore a patriotic accessory (pin, lanyard, etc.)',
  'Submitted a spirit week photo',
  'Submitted a photo to the photo contest',
  'Got all 3 trivia questions right in one day',
  'Answered every trivia question this week',
  'Voted in the photo contest',
  'Submitted a caption contest entry',
  'Voted in the daily bracket',
  'Correctly named the state of the day',
  'Brought in a patriotic treat to share',
  'Made a red, white & blue snack',
  'Ate apple pie or a patriotic dessert',
  'Decorated your workspace or workstation',
  'Took a selfie with a coworker in spirit gear',
  'Took a team photo in patriotic gear',
  'High-fived someone in patriotic gear',
  'Said "Happy 250th!" to a coworker',
  'Spotted a bald eagle (photo proof!)',
  'Watched fireworks this weekend',
  'Attended a July 4th celebration',
  'Shared a patriotic photo from the weekend',
  'Made a coworker laugh with a patriotic joke',
  'Wore patriotic gear on your day off',
  'Participated in spirit week every single day',
  'Got a coworker to join the app',
  'Hearted a photo in the spirit gallery',
  'Got your photo approved in the gallery',
  'Wore a full patriotic costume head to toe',
  'Brought patriotic decorations from home',
  'Sang a patriotic song out loud at work',
  'Wished a patient a happy Independence Day',
  'Found a coworker wearing all 3 colors',
  'Wore patriotic colors two days in a row',
  'Submitted a photo on a day off',
  'Told a coworker they did a great job today',
  'Went out of your way to help a coworker',
  'Left an encouraging note for a coworker',
  'Thanked someone on another department\'s team',
]

// Seeded pseudo-random number generator (mulberry32)
function seededRNG(seed) {
  let s = seed
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Turn email string into a numeric seed
function emailToSeed(email) {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// Generate a unique 24-square board (25th is FREE center) from the pool
export function generateBingoBoard(email) {
  const seed = emailToSeed(email)
  const rng = seededRNG(seed)
  const pool = [...BINGO_SQUARES]

  // Fisher-Yates shuffle with seeded RNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }

  // Take 24, insert FREE in center (index 12)
  const selected = pool.slice(0, 24)
  selected.splice(12, 0, 'FREE')
  return selected // 25 squares, 5x5
}

// Check for bingo wins
export function checkBingo(marked) {
  const grid = Array(5).fill(null).map((_, r) =>
    Array(5).fill(null).map((_, c) => marked.includes(r * 5 + c))
  )

  const wins = []

  // Rows
  for (let r = 0; r < 5; r++) {
    if (grid[r].every(Boolean)) wins.push(`row${r}`)
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    if (grid.every(row => row[c])) wins.push(`col${c}`)
  }
  // Diagonals
  if ([0,1,2,3,4].every(i => grid[i][i])) wins.push('diag1')
  if ([0,1,2,3,4].every(i => grid[i][4-i])) wins.push('diag2')

  const blackout = marked.length === 25

  return { wins, blackout, hasBingo: wins.length > 0 }
}
