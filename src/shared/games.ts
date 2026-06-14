import type { CategoryId } from './categories'

interface GameContainer {
  id: CategoryId
  /** A game folder is a DIRECT child of a directory whose path ends with one
   *  of these (lowercase) markers. */
  markers: readonly string[]
}

const GAME_CONTAINERS: readonly GameContainer[] = [
  { id: 'steam', markers: ['\\steamapps\\common'] },
  { id: 'epic', markers: ['\\epic games'] },
  { id: 'gog', markers: ['\\gog games', '\\gog galaxy\\games'] },
  { id: 'ea', markers: ['\\origin games', '\\ea games'] },
  { id: 'ubisoft', markers: ['\\ubisoft game launcher\\games'] },
  { id: 'riot', markers: ['\\riot games'] },
  { id: 'rockstar', markers: ['\\rockstar games'] },
  { id: 'xbox', markers: ['\\xboxgames'] }
]

/** Blizzard games each live in their own folder with no shared container, so
 *  they are matched by folder name instead. */
const BLIZZARD_GAMES: ReadonlySet<string> = new Set([
  'world of warcraft',
  'diablo iv',
  'diablo iii',
  'diablo ii resurrected',
  'overwatch',
  'hearthstone',
  'heroes of the storm',
  'starcraft ii',
  'starcraft',
  'warcraft iii'
])

/**
 * If the directory `childName` inside `parentPath` is a game installation
 * folder, returns its platform category; otherwise null. Matched
 * case-insensitively.
 */
export function detectGameFolder(parentPath: string, childName: string): CategoryId | null {
  const parent = parentPath.toLowerCase()
  for (const container of GAME_CONTAINERS) {
    for (const marker of container.markers) {
      if (parent.endsWith(marker)) return container.id
    }
  }
  return BLIZZARD_GAMES.has(childName.toLowerCase()) ? 'blizzard' : null
}
