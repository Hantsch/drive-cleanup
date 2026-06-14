const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Atmospheric background: a lime key light, a cool fill, and a faint grain. */
export function BackdropGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-48 left-1/2 h-[560px] w-[860px] -translate-x-1/2 rounded-full opacity-[0.16] blur-[130px]"
        style={{ background: 'radial-gradient(circle, #bef264 0%, transparent 60%)' }}
      />
      <div
        className="absolute right-[-180px] top-1/3 h-[440px] w-[440px] rounded-full opacity-[0.10] blur-[130px]"
        style={{ background: 'radial-gradient(circle, #7c83ff 0%, transparent 60%)' }}
      />
      <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: NOISE }} />
    </div>
  )
}
