'use client'

export function SettingsTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-muted-foreground">Configure your SPERT preferences</p>
      </div>

      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">
          Settings will be available in a future version.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Planned features include theme selection, default values, and data export/import.
        </p>
      </div>
    </div>
  )
}
