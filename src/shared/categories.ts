/**
 * Category catalogue shared by the scan worker (classification) and the
 * renderer (labels, colours, icons). Pure data + lookups, no Node APIs, so it
 * is safe to import from any process.
 */

export type CategoryId =
  | 'videos'
  | 'images'
  | 'audio'
  | 'documents'
  | 'archives'
  | 'installers'
  | 'diskImages'
  | 'databases'
  // Gaming platforms — detected by install path, filterable per launcher.
  | 'steam'
  | 'epic'
  | 'blizzard'
  | 'gog'
  | 'ea'
  | 'ubisoft'
  | 'riot'
  | 'xbox'
  | 'rockstar'
  | 'code'
  | 'cache'
  | 'system'
  | 'other'

export interface CategoryDef {
  readonly id: CategoryId
  readonly label: string
  readonly icon: string
  /** Hex colour used for bars, dots and legends across the UI. */
  readonly color: string
  /** File extensions (without dot, lowercase) that map to this category. */
  readonly extensions: readonly string[]
  /** Lowercase path fragments that classify a file regardless of extension. */
  readonly pathHints?: readonly string[]
}

export const CATEGORIES: readonly CategoryDef[] = [
  {
    id: 'videos',
    label: 'Videos',
    icon: '🎬',
    color: '#a78bfa',
    extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'wmv', 'flv', 'm4v', 'mpg', 'mpeg']
  },
  {
    id: 'images',
    label: 'Images',
    icon: '🖼️',
    color: '#38bdf8',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'heic', 'webp', 'svg', 'raw', 'psd']
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: '🎵',
    color: '#2dd4bf',
    extensions: ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'wma']
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: '📄',
    color: '#22d3ee',
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf', 'odt', 'csv']
  },
  {
    id: 'archives',
    label: 'Archives',
    icon: '📦',
    color: '#fbbf24',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst']
  },
  {
    id: 'installers',
    label: 'Installers',
    icon: '⬇️',
    color: '#34d399',
    extensions: ['exe', 'msi', 'msix', 'appx', 'msu']
  },
  {
    id: 'diskImages',
    label: 'Disk images',
    icon: '💿',
    color: '#fb923c',
    extensions: ['iso', 'img', 'vhd', 'vhdx', 'vmdk', 'dmg']
  },
  {
    id: 'databases',
    label: 'Databases',
    icon: '🗄️',
    color: '#f472b6',
    extensions: ['db', 'sqlite', 'sqlite3', 'mdf', 'ldf', 'dbf']
  },
  {
    id: 'steam',
    label: 'Steam',
    icon: '🎮',
    color: '#2a9df4',
    extensions: [],
    // Matches any Steam library on any drive (…\SteamLibrary\steamapps\common).
    pathHints: ['\\steamapps\\']
  },
  {
    id: 'epic',
    label: 'Epic Games',
    icon: '🎮',
    color: '#cfd3da',
    extensions: [],
    pathHints: ['\\epic games\\']
  },
  {
    id: 'blizzard',
    label: 'Blizzard / Battle.net',
    icon: '🎮',
    color: '#148eff',
    extensions: [],
    pathHints: [
      '\\battle.net\\',
      '\\world of warcraft\\',
      '\\diablo iv\\',
      '\\diablo iii\\',
      '\\diablo ii resurrected\\',
      '\\overwatch\\',
      '\\hearthstone\\',
      '\\heroes of the storm\\',
      '\\starcraft ii\\',
      '\\warcraft iii\\'
    ]
  },
  {
    id: 'gog',
    label: 'GOG',
    icon: '🎮',
    color: '#9b5de5',
    extensions: [],
    pathHints: ['\\gog galaxy\\games\\', '\\gog games\\']
  },
  {
    id: 'ea',
    label: 'EA / Origin',
    icon: '🎮',
    color: '#ff5247',
    extensions: [],
    pathHints: ['\\ea games\\', '\\origin games\\', '\\electronic arts\\']
  },
  {
    id: 'ubisoft',
    label: 'Ubisoft Connect',
    icon: '🎮',
    color: '#79c0ff',
    extensions: [],
    pathHints: ['\\ubisoft\\ubisoft game launcher\\']
  },
  {
    id: 'riot',
    label: 'Riot Games',
    icon: '🎮',
    color: '#ff4d6d',
    extensions: [],
    pathHints: ['\\riot games\\']
  },
  {
    id: 'xbox',
    label: 'Xbox / Game Pass',
    icon: '🎮',
    color: '#16a34a',
    extensions: [],
    pathHints: ['\\xboxgames\\']
  },
  {
    id: 'rockstar',
    label: 'Rockstar Games',
    icon: '🎮',
    color: '#f7b500',
    extensions: [],
    pathHints: ['\\rockstar games\\']
  },
  {
    id: 'code',
    label: 'Code & projects',
    icon: '👨‍💻',
    color: '#e879f9',
    extensions: ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'json', 'dll', 'pdb'],
    pathHints: ['\\node_modules\\', '\\.git\\', '\\target\\debug\\', '\\bin\\debug\\']
  },
  {
    id: 'cache',
    label: 'Cache & temp',
    icon: '🧹',
    color: '#fb7185',
    extensions: ['tmp', 'temp', 'log', 'cache', 'bak'],
    pathHints: ['\\temp\\', '\\tmp\\', '\\cache\\', '\\appdata\\local\\temp\\', '\\windows\\temp\\']
  },
  {
    id: 'system',
    label: 'System',
    icon: '⚙️',
    color: '#64748b',
    extensions: ['sys', 'dat'],
    pathHints: ['\\windows\\', '\\program files\\', '\\program files (x86)\\', '\\$recycle.bin\\']
  },
  {
    id: 'other',
    label: 'Other',
    icon: '❓',
    color: '#94a3b8',
    extensions: []
  }
]

export const CATEGORY_BY_ID: Readonly<Record<CategoryId, CategoryDef>> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryDef>

/** Categories that represent gaming platforms (shown as installed games). */
export const GAMING_CATEGORY_IDS: ReadonlySet<CategoryId> = new Set<CategoryId>([
  'steam',
  'epic',
  'blizzard',
  'gog',
  'ea',
  'ubisoft',
  'riot',
  'xbox',
  'rockstar'
])
