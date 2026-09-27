'use client'

export function AuthFooter() {
  return (
    <footer className="text-center py-6">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>© 2024 Structra. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <a href="/terms" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Terms of Service
          </a>
          <a href="/privacy" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Privacy Policy
          </a>
          <a href="/help" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Help Center
          </a>
        </div>
      </div>
    </footer>
  )
}
