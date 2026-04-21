'use client'

export function AuthFooter() {
  return (
    <footer className="text-center py-6">
      <div className="text-sm text-gray-500">
        <p>© 2024 BuildReady. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <a href="/terms" className="text-gray-400 hover:text-gray-600 transition-colors">
            Terms of Service
          </a>
          <a href="/privacy" className="text-gray-400 hover:text-gray-600 transition-colors">
            Privacy Policy
          </a>
          <a href="/help" className="text-gray-400 hover:text-gray-600 transition-colors">
            Help Center
          </a>
        </div>
      </div>
    </footer>
  )
}
