'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MobileNav } from '@/components/MobileNav'
import { AdSense } from '@/components/AdSense'
import {
  CalendarIcon, MapPinIcon, UsersIcon, StarIcon, ChevronLeft, ChevronRight,
  Utensils, Waves, Sparkles, Anchor, Wind, Baby, Dumbbell, Wifi, MapPin,
  Phone, Mail, Instagram, Facebook, Twitter, Youtube, Award, CheckCircle,
  Camera, X, PlayCircle, PauseCircle, HomeIcon, UtensilsCrossed
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import { toast } from 'sonner'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

const testimonials = [
  {
    name: 'Sarah Johnson',
    location: 'New York, USA',
    rating: 5,
    comment: 'An absolutely magical experience! The underwater views from our villa were breathtaking. Staff was incredibly attentive and the food was world-class.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    verified: true
  },
  {
    name: 'James Chen',
    location: 'Singapore',
    rating: 5,
    comment: 'Best vacation of our lives. The private beaches, crystal clear waters, and luxurious amenities exceeded all expectations. Already planning our return!',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    verified: true
  },
  {
    name: 'Emma Williams',
    location: 'London, UK',
    rating: 5,
    comment: 'Muraka Hotels redefined luxury for us. From the moment we arrived to our departure, everything was perfect. The sunset views are something you have to see to believe.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    verified: true
  },
  {
    name: 'Michael Rodriguez',
    location: 'Barcelona, Spain',
    rating: 5,
    comment: 'The underwater restaurant was an unforgettable experience. Swimming with manta rays just steps from our room was surreal. Service was impeccable throughout our stay.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    verified: true
  },
  {
    name: 'Yuki Tanaka',
    location: 'Tokyo, Japan',
    rating: 5,
    comment: 'Pure paradise! The overwater villas are stunning, and the spa treatments were divine. We celebrated our anniversary here and it couldn\'t have been more perfect.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    verified: true
  },
  {
    name: 'David Thompson',
    location: 'Sydney, Australia',
    rating: 5,
    comment: 'Exceptional in every way. The diving excursions showed us incredible marine life, and the private beach dinners were romantic and delicious. Highly recommend!',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    verified: true
  },
  {
    name: 'Isabella Martinez',
    location: 'Miami, USA',
    rating: 5,
    comment: 'A dream come true! The combination of luxury, nature, and exceptional service made this our best family vacation ever. Our kids loved the water sports and we loved the tranquility.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    verified: true
  }
]

const roomTypes = [
  {
    name: 'Penthouse Suite',
    size: '120 sqm',
    priceFrom: 1200,
    description: 'Luxurious penthouse with panoramic ocean views and exclusive rooftop terrace',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    amenities: ['WiFi', 'Ocean View', 'King Bed', 'Living Room']
  },
  {
    name: 'Deluxe Ocean Room',
    size: '65 sqm',
    priceFrom: 650,
    description: 'Spacious room with floor-to-ceiling windows and private balcony overlooking the ocean',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    amenities: ['WiFi', 'Ocean View', 'Queen Bed', 'Balcony']
  },
  {
    name: 'Premium Double Room',
    size: '45 sqm',
    priceFrom: 450,
    description: 'Elegantly appointed room with modern amenities and city or pool views',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
    amenities: ['WiFi', 'Pool View', 'Double Bed', 'Work Desk']
  },
  {
    name: 'Family Suite',
    size: '95 sqm',
    priceFrom: 900,
    description: 'Spacious suite with separate living area and two bedrooms, perfect for families',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80',
    amenities: ['WiFi', '2 Bedrooms', 'Living Room', 'Kitchenette']
  }
]

const experiences = [
  {
    title: 'Michelin Star Dining',
    description: 'Experience world-class cuisine crafted by award-winning chefs',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    iconName: 'utensils'
  },
  {
    title: 'Spa & Wellness',
    description: 'Overwater spa treatments with panoramic ocean views',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    iconName: 'spa'
  },
  {
    title: 'Water Sports & Diving',
    description: 'Explore pristine reefs and swim with manta rays',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    iconName: 'waves'
  },
  {
    title: 'Private Island Excursions',
    description: 'Exclusive day trips to uninhabited paradise islands',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    iconName: 'anchor'
  }
]

const restaurants = [
  {
    name: 'Subsix',
    cuisine: 'Contemporary International',
    description: 'Underwater fine dining with champagne breakfast and gourmet dinners',
    ambiance: 'Intimate & Ethereal',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'
  },
  {
    name: 'Azure',
    cuisine: 'Asian Fusion',
    description: 'Beachfront restaurant serving exquisite Pan-Asian delicacies',
    ambiance: 'Elegant & Tropical',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80'
  },
  {
    name: 'Sunset Lounge',
    cuisine: 'Cocktails & Light Bites',
    description: 'Overwater bar with signature cocktails and live music',
    ambiance: 'Relaxed & Romantic',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80'
  }
]

const amenitiesData = [
  { iconName: 'waves', title: 'Infinity Pool', description: 'Overwater pool complex' },
  { iconName: 'spa', title: 'Spa & Wellness', description: 'Award-winning spa' },
  { iconName: 'anchor', title: 'Private Beaches', description: 'Pristine white sand' },
  { iconName: 'wind', title: 'Water Sports', description: 'Kayaking, surfing, paddleboarding' },
  { iconName: 'utensils', title: 'Dive Center', description: 'PADI certified instruction' },
  { iconName: 'baby', title: 'Kids Club', description: 'Supervised activities' },
  { iconName: 'dumbbell', title: 'Fitness Center', description: '24/7 state-of-the-art gym' },
  { iconName: 'wifi', title: 'High-Speed WiFi', description: 'Throughout the resort' }
]

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    utensils: Utensils,
    spa: Sparkles,
    waves: Waves,
    anchor: Anchor,
    wind: Wind,
    baby: Baby,
    dumbbell: Dumbbell,
    wifi: Wifi
  }
  return icons[iconName] || Waves
}

const galleryImages = [
  { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80', category: 'Rooms', title: 'Overwater Villa' },
  { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80', category: 'Rooms', title: 'Beach Villa' },
  { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', category: 'Dining', title: 'Underwater Restaurant' },
  { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80', category: 'Spa', title: 'Spa Treatment' },
  { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80', category: 'Activities', title: 'Water Sports' },
  { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80', category: 'Views', title: 'Aerial View' },
  { url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80', category: 'Rooms', title: 'Family Suite' },
  { url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80', category: 'Dining', title: 'Asian Fusion' },
  { url: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80', category: 'Views', title: 'Paradise Views' }
]

export default function Home() {
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guests, setGuests] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [navbarTransparent, setNavbarTransparent] = useState(true)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<number | null>(null)
  const [galleryFilter, setGalleryFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

  const heroSlides = [
    {
      title: "Underwater Luxury",
      subtitle: "Experience paradise beneath the waves",
      image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=80",
      video: null
    },
    {
      title: "Tropical Paradise",
      subtitle: "Your dream escape in the Maldives",
      image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1920&q=80",
      video: null
    },
    {
      title: "Exclusive Resorts",
      subtitle: "Three stunning locations await",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&q=80",
      video: null
    }
  ]

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Handle scroll for navbar
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      setNavbarTransparent(scroll < 100)
    })

    // Loading animation
    setTimeout(() => setLoading(false), 1500)

    return () => {
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    checkUser()

    // Auto-advance hero carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Auto-advance testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useGSAP(() => {
    // Animate sections on scroll
    const sections = gsap.utils.toArray('.animate-section')
    sections.forEach((section: any) => {
      gsap.from(section, {
        opacity: 0,
        y: 100,
        duration: 1,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'top 20%',
          toggleActions: 'play none none reverse'
        }
      })
    })

    // Parallax hero
    gsap.to('.hero-content', {
      y: 100,
      opacity: 0.8,
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })

    // Animate amenity icons
    const amenityIcons = gsap.utils.toArray('.amenity-icon')
    amenityIcons.forEach((icon: any, index: number) => {
      gsap.from(icon, {
        scale: 0,
        rotation: 360,
        duration: 0.8,
        delay: index * 0.1,
        scrollTrigger: {
          trigger: icon,
          start: 'top 90%'
        }
      })
    })
  }, [])

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
  }

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates')
      return
    }

    const searchParams = new URLSearchParams({
      ...(location && { location }),
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guests: guests || '2'
    })

    router.push(`/search?${searchParams.toString()}`)
  }

  const filteredGallery = galleryFilter === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === galleryFilter)

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-6xl font-serif text-gold-400 animate-pulse">MURAKA</div>
            <div className="text-xl text-white/80 tracking-[0.3em] mt-2">HOTELS</div>
          </div>
          <div className="flex gap-2 justify-center">
            <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        navbarTransparent
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-lg shadow-lg"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Mobile Menu Button */}
            <MobileNav navbarTransparent={navbarTransparent} />

            {/* Logo - Centered on mobile, left on desktop */}
            <div className="flex items-center lg:flex-none absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-0 lg:transform-none">
              <h1 className={cn(
                "text-2xl sm:text-3xl font-serif font-bold transition-colors duration-300",
                navbarTransparent ? "text-white drop-shadow-lg" : "text-blue-900"
              )}>
                MURAKA
              </h1>
              <span className={cn(
                "ml-2 text-xs sm:text-sm tracking-[0.2em] transition-colors duration-300",
                navbarTransparent ? "text-white/90" : "text-blue-700"
              )}>
                HOTELS
              </span>
            </div>

            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="/rooms"
                className={cn(
                  "text-sm font-medium hover:text-gold-500 transition-colors",
                  navbarTransparent ? "text-white" : "text-gray-700"
                )}
              >
                All Rooms
              </Link>
              {['Dining', 'Spa', 'Experiences', 'Gallery'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={cn(
                    "text-sm font-medium hover:text-gold-500 transition-colors",
                    navbarTransparent ? "text-white" : "text-gray-700"
                  )}
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Desktop User Actions - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleDashboardClick}
                    className={navbarTransparent ? "text-white hover:text-white/80" : ""}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className={navbarTransparent ? "text-white border-white hover:bg-white/10" : ""}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(
                      "hidden md:flex",
                      navbarTransparent ? "text-white hover:text-white/80" : ""
                    )}
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white"
                  >
                    <Link href="/signup">Book Now</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Book Now Button */}
            <div className="lg:hidden">
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white text-xs px-3 py-2 h-9"
              >
                <Link href="/signup">Book</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Find Rooms CTA - Responsive */}
      <Button
        onClick={() => router.push('/rooms')}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-2xl rounded-full px-4 py-3 sm:px-8 sm:py-6 text-sm sm:text-lg font-semibold animate-pulse"
      >
        <span className="hidden sm:inline">Find Rooms</span>
        <span className="sm:hidden">Rooms</span>
      </Button>

      {/* Hero Section - Fullscreen with Parallax */}
      <section className="hero-section relative h-screen overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              index === currentSlide ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="relative w-full h-full">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"></div>
            </div>
          </div>
        ))}

        {/* Hero Content - Responsive */}
        <div className="hero-content absolute inset-0 flex items-center justify-center text-center text-white px-4 sm:px-6">
          <div className="max-w-4xl w-full">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-serif font-bold mb-4 sm:mb-6 drop-shadow-2xl">
              {heroSlides[currentSlide].title}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-light mb-8 sm:mb-12 drop-shadow-lg">
              {heroSlides[currentSlide].subtitle}
            </p>

            {/* Quick Booking Form in Hero - Responsive */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white/90 hover:bg-white border-none h-12 sm:h-auto"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="text-gray-700 text-sm sm:text-base">
                        {checkIn ? format(checkIn, "MMM dd, yyyy") : "Check-in"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white/90 hover:bg-white border-none h-12 sm:h-auto"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="text-gray-700 text-sm sm:text-base">
                        {checkOut ? format(checkOut, "MMM dd, yyyy") : "Check-out"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      disabled={(date) => date <= (checkIn || new Date())}
                    />
                  </PopoverContent>
                </Popover>

                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger className="bg-white/90 hover:bg-white border-none text-gray-900 h-12 sm:h-auto">
                    <SelectValue placeholder="2 Guests" className="text-gray-900" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold h-12 sm:h-auto text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Search Availability</span>
                  <span className="sm:hidden">Search</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Carousel Indicators */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "bg-white w-12"
                  : "bg-white/50 hover:bg-white/75 w-8"
              )}
            />
          ))}
        </div>
      </section>

      {/* Ad Unit 1 - After Hero */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AdSense adSlot="5041787387" />
        </div>  
      </section>

      {/* Signature Experiences - Responsive */}
      <section id="experiences" className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Signature Experiences
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Discover extraordinary moments that define luxury in the Maldives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {experiences.map((exp, index) => {
              const IconComponent = getIcon(exp.iconName)
              return (
                <Card
                  key={index}
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 p-0"
                >
                  <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                    <img
                      src={exp.image}
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
                      <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-3 sm:mb-4 text-gold-400" />
                      <h4 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold mb-2">{exp.title}</h4>
                      <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-3 sm:mb-4">{exp.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white text-black bg-white hover:bg-gold-500 hover:text-white hover:border-gold-500 transition-all min-h-[48px] sm:min-h-0"
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Room Types - Responsive */}
      <section id="rooms" className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Room Types
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Choose from our elegantly designed rooms and suites
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {roomTypes.map((room, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 p-0">
                <div className="relative h-56 sm:h-64 lg:h-80 overflow-hidden">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-gold-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-xs sm:text-sm">
                    From ${room.priceFrom}/night
                  </div>
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-xs sm:text-sm">
                    {room.size}
                  </div>
                </div>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-2">{room.name}</h4>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{room.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                    {room.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs sm:text-sm">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 min-h-[48px] sm:min-h-0">
                      View Details
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 min-h-[48px] sm:min-h-0">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Unit 2 - After Room Types */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <AdSense adSlot="4891304647" />
        </div>
      </section>

      {/* Spa & Wellness - Responsive */}
      <section id="spa" className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Spa & Wellness
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Rejuvenate your body and mind with our world-class spa treatments
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <h4 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">The Muraka Spa Experience</h4>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                Our award-winning spa offers a sanctuary of peace and tranquility, featuring overwater treatment rooms with glass floor panels revealing the vibrant marine life below.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                  <h5 className="font-serif font-bold text-lg sm:text-xl text-gray-900 mb-2">Massage Therapies</h5>
                  <p className="text-gray-600 text-xs sm:text-sm">Traditional and modern techniques</p>
                </div>
                <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                  <h5 className="font-serif font-bold text-lg sm:text-xl text-gray-900 mb-2">Facial Treatments</h5>
                  <p className="text-gray-600 text-xs sm:text-sm">Luxury skincare rituals</p>
                </div>
                <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                  <h5 className="font-serif font-bold text-lg sm:text-xl text-gray-900 mb-2">Body Treatments</h5>
                  <p className="text-gray-600 text-xs sm:text-sm">Scrubs, wraps & therapies</p>
                </div>
                <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                  <h5 className="font-serif font-bold text-lg sm:text-xl text-gray-900 mb-2">Yoga & Meditation</h5>
                  <p className="text-gray-600 text-xs sm:text-sm">Daily wellness sessions</p>
                </div>
              </div>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 min-h-[48px] sm:min-h-0">
                Book Spa Treatment
              </Button>
            </div>

            <div className="relative h-64 sm:h-96 lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80"
                alt="Spa Treatment"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Dining & Bars - Responsive */}
      <section id="dining" className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Dining & Bars
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Savor world-class cuisine in breathtaking settings
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {restaurants.map((restaurant, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 p-0">
                <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 text-white">
                    <h4 className="text-xl sm:text-2xl font-serif font-bold mb-1">{restaurant.name}</h4>
                    <p className="text-xs sm:text-sm text-gold-400">{restaurant.cuisine}</p>
                  </div>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 mb-3">{restaurant.description}</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm text-gray-500">{restaurant.ambiance}</span>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[48px] sm:min-h-0">Reserve Table</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities - Responsive */}
      <section id="amenities" className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              World-Class Amenities
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Everything you need for an unforgettable stay
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {amenitiesData.map((amenity, index) => {
              const IconComponent = getIcon(amenity.iconName)
              return (
                <div key={index} className="amenity-icon text-center group cursor-pointer">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">{amenity.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">{amenity.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Locations - Alternating Sections */}
      <section className="animate-section bg-gradient-to-b from-white to-blue-50">
        {[
          {
            name: 'Muraka Male',
            location: 'Male Atoll',
            description: 'Experience urban luxury near the capital with easy airport access and city conveniences. Our flagship resort combines contemporary design with traditional Maldivian hospitality.',
            features: ['15 min from Airport', 'City Access', 'Business Center', 'Conference Facilities'],
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80',
            travelTime: '15 minutes by speedboat',
            uniqueOffering: 'Perfect for business travelers and quick getaways'
          },
          {
            name: 'Muraka Laamu',
            location: 'Laamu Atoll',
            description: 'Immerse yourself in pristine nature with crystal-clear waters and vibrant marine life. Home to some of the best diving spots in the Maldives.',
            features: ['World-Class Diving', 'Marine Conservation', 'Private Beaches', 'Overwater Villas'],
            image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
            travelTime: '40 minutes by seaplane',
            uniqueOffering: 'UNESCO Biosphere Reserve with exceptional marine biodiversity'
          },
          {
            name: 'Muraka Faafu',
            location: 'Faafu Atoll',
            description: 'Discover tranquil paradise with secluded beaches and breathtaking sunset views. Our most exclusive and intimate resort experience.',
            features: ['Sunset Views', 'Spa & Wellness', 'Water Sports', 'Private Islands'],
            image: 'https://images.unsplash.com/photo-1590523278191-995cbcda646b?w=1200&q=80',
            travelTime: '35 minutes by seaplane',
            uniqueOffering: 'Adults-only luxury with personalized butler service'
          }
        ].map((location, index) => (
          <div
            key={index}
            className={cn(
              "py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8",
              index % 2 === 1 && "bg-white/50"
            )}
          >
            <div className="max-w-7xl mx-auto">
              <div className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center",
                index % 2 === 1 && "lg:grid-flow-dense"
              )}>
                <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                  <div className="inline-block px-3 sm:px-4 py-1 bg-gold-100 text-gold-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                    {location.location}
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
                    {location.name}
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">{location.description}</p>

                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">{location.travelTime}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">{location.uniqueOffering}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                    {location.features.map((feature, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-700 border-0 text-xs sm:text-sm">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white min-h-[48px] sm:min-h-0">
                    Explore {location.name}
                  </Button>
                </div>

                <div className={cn(
                  "relative h-64 sm:h-80 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl",
                  index % 2 === 1 && "lg:col-start-1 lg:row-start-1"
                )}>
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Gallery - Responsive */}
      <section id="gallery" className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Gallery
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
              A glimpse into paradise
            </p>

            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap px-4">
              {['All', 'Rooms', 'Dining', 'Spa', 'Activities', 'Views'].map((filter) => (
                <Button
                  key={filter}
                  variant={galleryFilter === filter ? "default" : "outline"}
                  onClick={() => setGalleryFilter(filter)}
                  className={cn(
                    "text-xs sm:text-sm min-h-[40px] sm:min-h-0",
                    galleryFilter === filter ? "bg-blue-600" : ""
                  )}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filteredGallery.map((image, index) => (
              <div
                key={index}
                onClick={() => setSelectedGalleryImage(index)}
                className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="font-semibold">{image.title}</p>
                  <p className="text-sm text-white/80">{image.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox for Gallery */}
      {selectedGalleryImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <button
            onClick={() => setSelectedGalleryImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gold-400 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedGalleryImage((prev) =>
                prev! > 0 ? prev! - 1 : filteredGallery.length - 1
              )
            }}
            className="absolute left-4 text-white hover:text-gold-400 transition-colors"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>

          <img
            src={filteredGallery[selectedGalleryImage].url}
            alt={filteredGallery[selectedGalleryImage].title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedGalleryImage((prev) =>
                (prev! + 1) % filteredGallery.length
              )
            }}
            className="absolute right-4 text-white hover:text-gold-400 transition-colors"
          >
            <ChevronRight className="w-12 h-12" />
          </button>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
            <p className="text-xl font-semibold">{filteredGallery[selectedGalleryImage].title}</p>
            <p className="text-sm text-white/70">{filteredGallery[selectedGalleryImage].category}</p>
          </div>
        </div>
      )}

      {/* Ad Unit 3 - Before Testimonials */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AdSense adSlot="7173126709" />
        </div>
      </section>

      {/* Testimonials - Responsive with Touch Support */}
      <section className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Guest Reviews
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Hear from our delighted guests
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-2xl">
              {testimonials.map((review, index) => (
                <div
                  key={index}
                  className={cn(
                    "transition-all duration-500",
                    index === currentTestimonial
                      ? "opacity-100 h-auto"
                      : "opacity-0 h-0 overflow-hidden"
                  )}
                >
                  <div className="p-6 sm:p-8 lg:p-12">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <img
                        src={review.image}
                        alt={review.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-gold-200"
                      />
                      <div className="text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                          <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{review.name}</h4>
                          {review.verified && (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-gray-600">{review.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1 mb-4 sm:mb-6">
                      {[...Array(review.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 sm:w-6 sm:h-6 fill-gold-400 text-gold-400" />
                      ))}
                    </div>

                    <p className="text-sm sm:text-base lg:text-xl text-gray-700 italic leading-relaxed text-center sm:text-left">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial Controls - Touch Friendly */}
            <div className="flex justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <button
                onClick={() => setCurrentTestimonial((prev) =>
                  prev > 0 ? prev - 1 : testimonials.length - 1
                )}
                className="p-2 sm:p-3 rounded-full bg-white shadow-lg hover:bg-gold-50 transition-colors min-w-[48px] min-h-[48px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      index === currentTestimonial
                        ? "bg-blue-600 w-6 sm:w-8"
                        : "bg-gray-300 w-2"
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentTestimonial((prev) =>
                  (prev + 1) % testimonials.length
                )}
                className="p-2 sm:p-3 rounded-full bg-white shadow-lg hover:bg-gold-50 transition-colors min-w-[48px] min-h-[48px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section - Responsive */}
      <section id="booking-section" className="animate-section py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4 sm:mb-6">
            Begin Your Journey to Paradise
          </h3>
          <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-12 text-white/90">
            Experience the ultimate luxury escape in the Maldives
          </p>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="bg-white text-gray-900 h-12 sm:h-auto">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Muraka Male</SelectItem>
                    <SelectItem value="Laamu">Muraka Laamu</SelectItem>
                    <SelectItem value="Faafu">Muraka Faafu</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal bg-white hover:bg-gray-100 h-12 sm:h-auto"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-gray-700 text-sm sm:text-base">
                        {checkIn ? format(checkIn, "MMM dd, yyyy") : "Check-in"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal bg-white hover:bg-gray-100 h-12 sm:h-auto sm:col-span-2 lg:col-span-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-gray-700 text-sm sm:text-base">
                        {checkOut ? format(checkOut, "MMM dd, yyyy") : "Check-out"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      disabled={(date) => date <= (checkIn || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleSearch}
                size="lg"
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-base sm:text-lg min-h-[48px] sm:min-h-0"
              >
                Check Availability
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer - Responsive */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
            <div className="sm:col-span-2">
              <h5 className="text-2xl sm:text-3xl font-serif font-bold mb-3 sm:mb-4">MURAKA HOTELS</h5>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                Luxury accommodation across three beautiful locations in the Maldives.
                Experience unparalleled service and breathtaking natural beauty.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://www.x.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h5>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><Link href="/rooms" className="hover:text-gold-400 transition-colors inline-block min-h-[44px] flex items-center">All Rooms</Link></li>
                <li><a href="#dining" className="hover:text-gold-400 transition-colors inline-block min-h-[44px] flex items-center">Dining</a></li>
                <li><a href="#spa" className="hover:text-gold-400 transition-colors inline-block min-h-[44px] flex items-center">Spa & Wellness</a></li>
                <li><a href="#experiences" className="hover:text-gold-400 transition-colors inline-block min-h-[44px] flex items-center">Experiences</a></li>
                <li><a href="#gallery" className="hover:text-gold-400 transition-colors inline-block min-h-[44px] flex items-center">Gallery</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact</h5>
              <ul className="space-y-3 text-sm sm:text-base text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>+960 123 4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="break-all">info@murakahotels.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Maldives</span>
                </li>
              </ul>

              <div className="mt-4 sm:mt-6">
                <h6 className="text-xs sm:text-sm font-semibold mb-2">Awards & Certifications</h6>
                <div className="flex gap-2">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gold-400" />
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gold-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-400">
            <p>&copy; 2025 Muraka Hotels. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
