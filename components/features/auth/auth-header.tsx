'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AuthHeader() {
  const pathname = usePathname()
  
  // Determine the opposite action based on current path
  const isLoginPage = pathname === '/login'
  const oppositeAction = isLoginPage 
    ? { text: "Don't have an account? Register", href: "/register" }
    : { text: "Already have an account? Sign in", href: "/login" }

  return (
    <header className="flex items-center justify-between p-4 sm:p-6 lg:p-8">
      {/* Logo */}
      <Link href="/" className="cursor-pointer">
        <Image
          src="/images/brand/logo.png"
          alt="Logo"
          width={120}
          height={120}
          className="w-[120px] h-[40px]"
        />
      </Link>

      {/* Opposite Action */}
      <Button variant="ghost" asChild>
        <Link href={oppositeAction.href} className="bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent hover:from-orange-700 hover:to-orange-800">
          {oppositeAction.text}
        </Link>
      </Button>
    </header>
  )
}
