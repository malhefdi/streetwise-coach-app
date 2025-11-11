'use client'

import { Button } from '@/components/ui'

export function Header() {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        <div className="w-96">
          <input
            type="search"
            placeholder="Search students, lessons..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          🔔
        </Button>
        <Button variant="ghost" size="sm">
          ⚙️
        </Button>
      </div>
    </header>
  )
}
