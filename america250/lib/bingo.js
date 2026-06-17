// 45-square pool — unique board generated per email via seeded shuffle
export const BINGO_SQUARES = [
  'Wore red, white & blue',
  'Sang a patriotic song',
  'Ate apple pie',
  'Watched fireworks',
  'Shared a fun fact about America',
  'Wore a patriotic hat',
  'Named all 50 states (almost!)',
  'Posted a spirit week photo',
  'Said "Happy 250th!"',
  'Tried a red, white & blue recipe',
  'Read part of the Declaration',
  'Decorated your workspace',
  'Named the first president',
  'Wore denim today',
  'Made a coworker smile with a flag item',
  'Spotted a bald eagle (photo proof!)',
  'Named 5 founding fathers',
  'Played trivia with a coworker',
  'Wore a costume accessory',
  'Took a team photo in spirit gear',
  'Named the year America was founded',
  'Made a patriotic snack to share',
  'Went all-out on costume day',
  'Voted in the photo contest',
  'Got all 3 trivia questions right in one day',
  'Named your state\'s senators',
  'Said the Pledge of Allegiance',
  'Wore stars AND stripes',
  'Named the last 3 presidents',
  'Got a bingo on the first try',
  'High-fived someone in patriotic gear',
  'Named the capital of your state',
  'Wore something with "USA" on it',
  'Made a patriotic playlist',
  'Took a selfie with a coworker in spirit gear',
  'Named 3 things on the US flag and their meaning',
  'Watched a patriotic movie clip at lunch',
  'Said the year of America\'s first Independence Day',
  'Named the document that starts "We the People"',
  'Brought in a patriotic treat for the team',
  'Participated every day of spirit week',
  'Wore patriotic socks or shoes',
  'Named all 13 original colonies',
  'Hosted or joined a trivia session',
  'Submitted a photo to the contest',
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
