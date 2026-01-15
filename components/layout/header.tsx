'use client'

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">SEO Marketing Dashboard</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Welcome back!</span>
        </div>
      </div>
    </header>
  )
}
