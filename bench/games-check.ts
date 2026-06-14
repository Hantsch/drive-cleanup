/* Sanity check for game-folder detection. Not part of the app. */
import { detectGameFolder } from '../src/shared/games'

const cases: Array<[string, string, string | null]> = [
  ['D:\\SteamLibrary\\steamapps\\common', 'Elden Ring', 'steam'],
  ['C:\\Program Files (x86)\\Steam\\steamapps\\common', 'Dota 2', 'steam'],
  ['C:\\Program Files\\Epic Games', 'Fortnite', 'epic'],
  ['C:\\Riot Games', 'VALORANT', 'riot'],
  ['C:\\Program Files\\Rockstar Games', 'Grand Theft Auto V', 'rockstar'],
  ['C:\\XboxGames', 'Forza Horizon 5', 'xbox'],
  ['C:\\Program Files (x86)\\Origin Games', 'FIFA 23', 'ea'],
  ['D:\\Games', 'World of Warcraft', 'blizzard'],
  // not a game folder:
  ['D:\\SteamLibrary\\steamapps\\common\\Elden Ring', 'Game', null],
  ['C:\\Users\\me', 'Documents', null]
]

let failures = 0
for (const [parent, child, expected] of cases) {
  const actual = detectGameFolder(parent, child)
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'OK ' : 'FAIL'}  ${String(actual).padEnd(9)} ${parent}\\${child}`)
}
console.log(failures === 0 ? '\nAll cases passed.' : `\n${failures} case(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
