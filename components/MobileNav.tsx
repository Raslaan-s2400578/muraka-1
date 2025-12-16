/**
 * Hotel Management System - Muraka
 * 
 * @student Aminath Yaula Yaarid - S2400576
 * @student Hawwa Saha Nasih - S2400566
 * @student Milyaaf Abdul Sattar - S2300565
 * @student Mohamed Raslaan Najeeb - S2400578
 * 
 * Module: UFCF8S-30-2 Advanced Software Development
 * Institution: UWE Bristol
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import {
  X, Menu, Home, UtensilsCrossed, Sparkles, Camera, Mail,
  Instagram, Facebook, Twitter, Youtube, Phone, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  navbarTransparent: boolean
}

export function MobileNav({ navbarTransparent }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setUserRole(profile?.role || null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setIsOpen(false)
  }

  const handleDashboardClick = () => {
    if (userRole === 'admin') {
      router.push('/dashboard/admin')
    } else if (userRole === 'manager') {
      router.push('/dashboard/manager')
    } else if (userRole === 'staff') {
      router.push('/dashboard/staff')
    } else {
      router.push('/dashboard/guest')
    }
    setIsOpen(false)
  }

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger Button - Visible on mobile/tablet only */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "lg:hidden p-2 rounded-lg transition-colors z-50",
          navbarTransparent ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
        )}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop Overlay - Only rendered when menu is open */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] lg:hidden"
            onClick={closeMenu}
            aria-label="Close menu"
          />

          {/* Sidebar Menu */}
          <div
            className="fixed top-0 left-0 h-screen w-[80%] max-w-[320px] bg-white z-[110] shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto"
          >
        {/* Close Button */}
        <button
          onClick={closeMenu}
          className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo/Brand */}
        <div className="px-6 py-8 border-b border-gray-200">
          <h2 className="text-2xl font-serif font-bold text-blue-900">MURAKA</h2>
          <span className="text-sm tracking-[0.2em] text-blue-700">HOTELS</span>
        </div>

        {/* Navigation Links */}
        <nav className="px-4 py-6">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-colors min-h-[48px]"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </Link>

            <Link
              href="/rooms"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-colors min-h-[48px]"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">All Rooms</span>
            </Link>

            <a
              href="#dining"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-colors min-h-[48px]"
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="font-medium">Dining</span>
            </a>

            <a
              href="#spa"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-colors min-h-[48px]"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Spa & Wellness</span>
            </a>

            <a
              href="#experiences"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-colors min-h-[48px]"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Experiences</span>
            </a>

            <a
              href="#gallery"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-colors min-h-[48px]"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">Gallery</span>
            </a>
          </div>

          {/* User Actions */}
          <div className="mt-8 space-y-3 px-4">
            {user ? (
              <>
                <Button
                  onClick={handleDashboardClick}
                  variant="outline"
                  className="w-full min-h-[48px] justify-start"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full min-h-[48px] justify-start"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full min-h-[48px]"
                >
                  <Link href="/login" onClick={closeMenu}>Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="w-full min-h-[48px] bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white"
                >
                  <Link href="/signup" onClick={closeMenu}>Book Now</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Contact Info */}
        <div className="px-6 py-6 border-t border-gray-200 mt-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Us</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>+960 123 4567</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-xs">info@murakahotels.com</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Maldives</span>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex gap-3 mt-6">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.x.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
          </div>
        </>
      )}
    </>
  )
}
