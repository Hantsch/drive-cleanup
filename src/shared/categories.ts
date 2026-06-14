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
