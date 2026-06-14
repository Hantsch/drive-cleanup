/* Sanity check for game/platform classification. Not part of the app. */
import { categorize } from '../src/shared/categorize'

const cases: Array<[string, string]> = [
  ['D:\\SteamLibrary\\steamapps\\common\\Elden Ring\\eldenring.exe', 'steam'],
  ['C:\\Program Files (x86)\\Steam\\steamapps\\common\\Dota 2\\dota.exe', 'steam'],
  ['C:\\Program Files\\Epic Games\\Fortnite\\FortniteClient.exe', 'epic'],
  ['C:\\Program Files (x86)\\Battle.net\\Battle.net.exe', 'blizzard'],
  ['D:\\Games\\World of Warcraft\\Wow.exe', 'blizzard'],
  ['C:\\Riot Games\\VALORANT\\live\\game.exe', 'riot'],
  ['C:\\Program Files\\Rockstar Games\\GTA V\\GTA5.exe', 'rockstar'],
  ['C:\\XboxGames\\Forza Horizon 5\\Content\\game.exe', 'xbox'],
  ['C:\\Program Files (x86)\\Origin Games\\FIFA\\fifa.exe', 'ea'],
  ['C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\AC\\ac.exe', 'ubisoft'],
  ['C:\\GOG Games\\The Witcher 3\\witcher3.exe', 'gog'],
  ['C:\\Windows\\System32\\kernel32.dll', 'system'],
  ['C:\\Users\\me\\Downloads\\setup.exe', 'installers'],
  ['C:\\Users\\me\\Videos\\movie.mkv', 'videos']
]

let failures = 0
for (const [path, expected] of cases) {
  const actual = categorize(path)
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'OK ' : 'FAIL'}  ${actual.padEnd(11)} ${path}`)
}
console.log(failures === 0 ? '\nAll cases passed.' : `\n${failures} case(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
