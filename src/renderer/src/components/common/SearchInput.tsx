interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">
        🔍
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? 'Filter by name or path…'}
        spellCheck={false}
        className="w-72 rounded-[10px] border border-line bg-panel py-2 pl-9 pr-3 font-mono text-[13px] text-ink outline-none transition placeholder:font-sans placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </div>
  )
}
