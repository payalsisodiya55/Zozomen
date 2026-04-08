import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { MapPin, SlidersHorizontal, Star, X, ArrowDownUp, Timer, IndianRupee, Clock, Bookmark, UtensilsCrossed } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Card, CardContent } from "@food/components/ui/card"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { useSearchOverlay, useLocationSelector } from "@food/components/user/UserLayout"
import { useLocation as useLocationHook } from "@food/hooks/useLocation"
import { useProfile } from "@food/context/ProfileContext"
import { diningAPI } from "@food/api"
import OptimizedImage from "@food/components/OptimizedImage"
import HomeHeader from "@food/components/user/home/HomeHeader"
import { RED } from "../../constants/color"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const slugifyValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const getCoordinates = (restaurant) => {
  const latitude = restaurant?.location?.latitude
  const longitude = restaurant?.location?.longitude
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude }
  }

  const coords = restaurant?.location?.coordinates
  if (Array.isArray(coords) && coords.length === 2) {
    return { latitude: coords[1], longitude: coords[0] }
  }

  return null
}

const getDistanceKm = (userLocation, restaurant) => {
  const userLat = Number(userLocation?.latitude)
  const userLng = Number(userLocation?.longitude)
  const restaurantCoords = getCoordinates(restaurant)

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng) || !restaurantCoords) {
    return Number.POSITIVE_INFINITY
  }

  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(restaurantCoords.latitude - userLat)
  const dLng = toRadians(restaurantCoords.longitude - userLng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(restaurantCoords.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const shimmerClassName =
  "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:animate-[shimmer_2.2s_infinite]"

const loadingCategoryCards = Array.from({ length: 6 }, (_, index) => `category-skeleton-${index}`)
const loadingRestaurantCards = Array.from({ length: 6 }, (_, index) => `restaurant-skeleton-${index}`)

function DiningCategorySkeleton({ index }) {
  return (
    <motion.div
      className={`relative h-[138px] overflow-hidden rounded-[18px] border border-[#e9e1d8] bg-[linear-gradient(180deg,#fff9f2_0%,#fff2e6_100%)] shadow-[0_1px_2px_rgba(35,24,12,0.05)] sm:h-[154px] md:h-[166px] ${shimmerClassName}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="h-3 w-16 rounded-full bg-[#f0dcca]" />
        <div className="mt-3 h-4 w-24 rounded-full bg-[#ead2bc]" />
        <div className="mt-2 h-4 w-20 rounded-full bg-[#f3e3d4]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[64%] rounded-b-[18px] bg-[radial-gradient(circle_at_25%_20%,rgba(226,40,27,0.1),transparent_30%),linear-gradient(180deg,#fff5f5_0%,#ffebee_100%)]">
        <div className="absolute bottom-3 left-3 h-14 w-14 rounded-full bg-white/45 blur-md" />
      </div>
    </motion.div>
  )
}

function DiningRestaurantSkeleton({ index }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <div className="h-full overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-[#efe2d3]">
        <div className={`relative h-48 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(226,40,27,0.12),transparent_28%),linear-gradient(135deg,#fff8f8_0%,#fff2f2_100%)] sm:h-56 md:h-60 lg:h-64 xl:h-72 ${shimmerClassName}`}>
          <div className="absolute left-4 top-4 h-8 w-28 rounded-lg bg-black/10" />
          <div className="absolute right-4 top-4 h-9 w-9 rounded-lg bg-white/60" />
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${RED}, transparent 80%)` }}>
            <div className="flex h-full flex-col justify-end pl-4 pb-4 sm:pl-5 sm:pb-5">
              <div className="h-2.5 w-24 rounded-full bg-white/35" />
              <div className="mt-2 h-px w-24 bg-white/25" />
              <div className="mt-3 h-4 w-40 rounded-full bg-white/55" />
            </div>
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="h-5 w-40 rounded-full bg-[#ead8c8]" />
              <div className="mt-2 h-4 w-24 rounded-full bg-[#f2e7dd]" />
            </div>
            <div className="h-8 w-12 rounded-lg bg-[#d7efe0]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-[#efe2d7]" />
            <div className="h-4 w-24 rounded-full bg-[#efe2d7]" />
            <div className="h-4 w-4 rounded-full bg-[#f5ece4]" />
            <div className="h-4 w-20 rounded-full bg-[#f5ece4]" />
          </div>
          <div className="h-4 w-48 rounded-full bg-[#f0e1d3]" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Dining() {
  const navigate = useNavigate()
  const [heroSearch, setHeroSearch] = useState("")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [activeFilters, setActiveFilters] = useState(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilterTab, setActiveFilterTab] = useState('sort')
  const [sortBy, setSortBy] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState(null)
  const filterSectionRefs = useRef({})
  const rightContentRef = useRef(null)
  const { openSearch, closeSearch, setSearchValue } = useSearchOverlay()
  const { openLocationSelector } = useLocationSelector()
  const { location } = useLocationHook()
  const { addFavorite, removeFavorite, isFavorite } = useProfile()

  const [categories, setCategories] = useState([])
  const [restaurantList, setRestaurantList] = useState([])
  const [loading, setLoading] = useState(true)
  const [diningHeroBanners, setDiningHeroBanners] = useState([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [hasScrolledPastBanner, setHasScrolledPastBanner] = useState(false)
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0)
  const autoSlideIntervalRef = useRef(null)
  const bannerShellRef = useRef(null)
  const stickyHeaderRef = useRef(null)
  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)
  const touchEndXRef = useRef(0)
  const touchEndYRef = useRef(0)
  const isBannerSwipingRef = useRef(false)
  const placeholders = useMemo(
    () => [
      'Search "cafe"',
      'Search "buffet"',
      'Search "rooftop"',
      'Search "family dining"',
      'Search "fine dine"',
    ],
    [],
  )

  useEffect(() => {
    const fetchDiningData = async () => {
      try {
        setLoading(true)
        const [bannerResponse, cats, rests] = await Promise.all([
          diningAPI.getHeroBanners().catch(() => ({ data: { success: false, data: { banners: [] } } })),
          diningAPI.getCategories(),
          diningAPI.getRestaurants(location?.city ? { city: location.city } : {}),
        ])

        const heroBanners = Array.isArray(bannerResponse?.data?.data?.banners)
          ? bannerResponse.data.data.banners
              .map((banner, index) => {
                const imageUrl = String(banner?.imageUrl || "").trim()
                if (!imageUrl) return null

                return {
                  id: String(banner?._id || banner?.id || `dining-banner-${index}`),
                  imageUrl,
                  tagline: String(banner?.title || banner?.tagline || "").trim(),
                  promoCode: String(banner?.ctaText || banner?.promoCode || "").trim(),
                }
              })
              .filter(Boolean)
          : []

        setDiningHeroBanners(heroBanners)
        setCategories(cats?.data?.success ? (cats.data.data || []) : [])
        setRestaurantList(rests?.data?.success ? (rests.data.data || []) : [])
      } catch (error) {
        debugError("Failed to fetch dining data", error)
        setDiningHeroBanners([])
        setCategories([])
        setRestaurantList([])
      } finally {
        setLoading(false)
      }
    }
    fetchDiningData()
  }, [location?.city])

  useEffect(() => {
    if (placeholders.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 2200)

    return () => window.clearInterval(intervalId)
  }, [placeholders])

  const safeCategories = useMemo(() => {
    return (Array.isArray(categories) ? categories : [])
      .filter((category) => {
        const categoryName = String(category?.name || "").trim()
        return categoryName.length > 0
      })
      .map((category, index) => ({
        ...category,
        name: String(category?.name || "").trim(),
        slug: String(category?.slug || category?.name || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        imageUrl: String(category?.imageUrl || "").trim()
      }))
  }, [categories])

  const normalizedRestaurantList = useMemo(() => {
    return (Array.isArray(restaurantList) ? restaurantList : [])
      .filter((restaurant) => String(restaurant?.restaurantName || restaurant?.name || "").trim().length > 0)
      .map((restaurant, index) => {
        const distanceKm = getDistanceKm(location, restaurant)
        const restaurantName = String(restaurant?.restaurantName || restaurant?.name || "").trim()
        return {
          ...restaurant,
          id: restaurant?._id || restaurant?.id || `restaurant-${index}`,
          name: restaurantName,
          slug: String(restaurant?.restaurantNameNormalized || "").trim() || slugifyValue(restaurantName),
          cuisine: Array.isArray(restaurant?.cuisines) && restaurant.cuisines.length > 0
            ? restaurant.cuisines.join(", ")
            : "Multi-cuisine",
          image: String(
            restaurant?.coverImages?.[0]?.url ||
            restaurant?.coverImages?.[0] ||
            restaurant?.coverImage ||
            restaurant?.menuImages?.[0]?.url ||
            restaurant?.menuImages?.[0] ||
            restaurant?.profileImage?.url ||
            restaurant?.profileImage ||
            ""
          ).trim(),
          offer: String(restaurant?.offer || "Pre-book table").trim(),
          featuredDish: String(restaurant?.featuredDish || "Chef's special").trim(),
          featuredPrice: Number(restaurant?.featuredPrice || 0),
          rating: Number(restaurant?.rating || restaurant?.avgRating || 0),
          deliveryTime: String(
            restaurant?.estimatedDeliveryTime ||
            restaurant?.deliveryTime ||
            (restaurant?.estimatedDeliveryTimeMinutes ? `${restaurant.estimatedDeliveryTimeMinutes} mins` : "30-40 mins")
          ).trim(),
          distanceValue: distanceKm,
          distance: Number.isFinite(distanceKm) ? `${distanceKm.toFixed(1)} km` : "Distance unavailable",
          diningType: restaurant?.diningSettings?.diningType || restaurant?.categories?.[0]?.slug || "dining",
        }
      })
  }, [restaurantList, location])

  const categoryRestaurantKeys = useMemo(() => {
    const keySet = new Set()

    normalizedRestaurantList.forEach((restaurant) => {
      const rawCategories = []

      if (Array.isArray(restaurant?.categories)) {
        rawCategories.push(...restaurant.categories)
      }

      if (restaurant?.diningSettings?.diningType) {
        rawCategories.push(restaurant.diningSettings.diningType)
      }

      rawCategories.forEach((category) => {
        if (typeof category === "string") {
          const normalized = slugifyValue(category)
          if (normalized) keySet.add(normalized)
          return
        }

        if (category && typeof category === "object") {
          const slug = slugifyValue(category?.slug || category?.name || category?.title || "")
          if (slug) keySet.add(slug)
        }
      })
    })

    return keySet
  }, [normalizedRestaurantList])

  const filteredCategories = useMemo(() => {
    return safeCategories.filter((category) => categoryRestaurantKeys.has(category.slug))
  }, [safeCategories, categoryRestaurantKeys])

  const nearbyPopularRestaurants = useMemo(() => {
    const within10Km = normalizedRestaurantList
      .filter((restaurant) => Number.isFinite(restaurant.distanceValue) && restaurant.distanceValue <= 10)
      .sort((a, b) => a.distanceValue - b.distanceValue)

    return within10Km.length > 0 ? within10Km : normalizedRestaurantList
  }, [normalizedRestaurantList])

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(filterId)) {
        newSet.delete(filterId)
      } else {
        newSet.add(filterId)
      }
      return newSet
    })
  }

  const filteredRestaurants = useMemo(() => {
    let filtered = [...nearbyPopularRestaurants]

    if (activeFilters.has('delivery-under-30')) {
      filtered = filtered.filter(r => {
        const timeMatch = r.deliveryTime.match(/(\d+)/)
        return timeMatch && parseInt(timeMatch[1]) <= 30
      })
    }
    if (activeFilters.has('delivery-under-45')) {
      filtered = filtered.filter(r => {
        const timeMatch = r.deliveryTime.match(/(\d+)/)
        return timeMatch && parseInt(timeMatch[1]) <= 45
      })
    }
    if (activeFilters.has('distance-under-1km')) {
      filtered = filtered.filter(r => {
        const distMatch = r.distance.match(/(\d+\.?\d*)/)
        return distMatch && parseFloat(distMatch[1]) <= 1.0
      })
    }
    if (activeFilters.has('distance-under-2km')) {
      filtered = filtered.filter(r => {
        const distMatch = r.distance.match(/(\d+\.?\d*)/)
        return distMatch && parseFloat(distMatch[1]) <= 2.0
      })
    }
    if (activeFilters.has('rating-35-plus')) {
      filtered = filtered.filter(r => r.rating >= 3.5)
    }
    if (activeFilters.has('rating-4-plus')) {
      filtered = filtered.filter(r => r.rating >= 4.0)
    }
    if (activeFilters.has('rating-45-plus')) {
      filtered = filtered.filter(r => r.rating >= 4.5)
    }

    // Apply cuisine filter
    if (selectedCuisine) {
      filtered = filtered.filter(r => r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()))
    }

    // Apply sorting
    if (sortBy === 'rating-high') {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'rating-low') {
      filtered.sort((a, b) => a.rating - b.rating)
    }

    return filtered
  }, [nearbyPopularRestaurants, activeFilters, selectedCuisine, sortBy])

  useEffect(() => {
    setCurrentBannerIndex((prev) => {
      if (diningHeroBanners.length === 0) return 0
      return Math.min(prev, diningHeroBanners.length - 1)
    })
  }, [diningHeroBanners.length])

  useEffect(() => {
    if (typeof window === "undefined") return

    diningHeroBanners.forEach((banner) => {
      if (!banner?.imageUrl) return
      const img = new window.Image()
      img.src = banner.imageUrl
    })
  }, [diningHeroBanners])

  const startBannerAutoSlide = useCallback(() => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current)
    }

    if (diningHeroBanners.length <= 1) return

    autoSlideIntervalRef.current = setInterval(() => {
      if (!isBannerSwipingRef.current) {
        setCurrentBannerIndex((prev) => (prev + 1) % diningHeroBanners.length)
      }
    }, 3500)
  }, [diningHeroBanners.length])

  const resetBannerAutoSlide = useCallback(() => {
    startBannerAutoSlide()
  }, [startBannerAutoSlide])

  useEffect(() => {
    startBannerAutoSlide()

    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current)
      }
    }
  }, [startBannerAutoSlide])

  useEffect(() => {
    const handleBannerScroll = () => {
      const bannerShell = bannerShellRef.current
      const stickyHeader = stickyHeaderRef.current

      if (!bannerShell) {
        setHasScrolledPastBanner(false)
        return
      }

      const bannerRect = bannerShell.getBoundingClientRect()
      const stickyHeight = stickyHeader?.getBoundingClientRect().height || 0
      setHasScrolledPastBanner(bannerRect.bottom <= stickyHeight)
    }

    handleBannerScroll()
    window.addEventListener("scroll", handleBannerScroll, { passive: true })
    window.addEventListener("resize", handleBannerScroll)

    return () => {
      window.removeEventListener("scroll", handleBannerScroll)
      window.removeEventListener("resize", handleBannerScroll)
    }
  }, [])

  useEffect(() => {
    const updateHeaderHeight = () => {
      const nextHeight = stickyHeaderRef.current?.getBoundingClientRect().height || 0
      setMobileHeaderHeight(nextHeight)
    }

    updateHeaderHeight()
    window.addEventListener("resize", updateHeaderHeight)

    return () => {
      window.removeEventListener("resize", updateHeaderHeight)
    }
  }, [])

  const handleBannerTouchStart = useCallback((event) => {
    if (diningHeroBanners.length <= 1) return
    touchStartXRef.current = event.touches[0].clientX
    touchStartYRef.current = event.touches[0].clientY
    touchEndXRef.current = event.touches[0].clientX
    touchEndYRef.current = event.touches[0].clientY
    isBannerSwipingRef.current = true
  }, [diningHeroBanners.length])

  const handleBannerTouchMove = useCallback((event) => {
    if (!isBannerSwipingRef.current) return
    touchEndXRef.current = event.touches[0].clientX
    touchEndYRef.current = event.touches[0].clientY
  }, [])

  const handleBannerTouchEnd = useCallback(() => {
    if (!isBannerSwipingRef.current || diningHeroBanners.length <= 1) {
      isBannerSwipingRef.current = false
      return
    }

    const deltaX = touchEndXRef.current - touchStartXRef.current
    const deltaY = Math.abs(touchEndYRef.current - touchStartYRef.current)
    const minSwipeDistance = 40

    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY) {
      setCurrentBannerIndex((prev) => {
        if (deltaX > 0) {
          return (prev - 1 + diningHeroBanners.length) % diningHeroBanners.length
        }
        return (prev + 1) % diningHeroBanners.length
      })
      resetBannerAutoSlide()
    }

    isBannerSwipingRef.current = false
  }, [diningHeroBanners.length, resetBannerAutoSlide])


  const handleSearchFocus = useCallback(() => {
    if (heroSearch) {
      setSearchValue(heroSearch)
    }
    openSearch()
  }, [heroSearch, openSearch, setSearchValue])

  return (
    <AnimatedPage className="bg-white dark:bg-[#0a0a0a]" style={{ minHeight: '100vh', paddingBottom: '80px', overflow: 'visible' }}>
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      <div
        ref={stickyHeaderRef}
        className={`md:hidden sticky top-0 overflow-x-clip z-[80] ${hasScrolledPastBanner ? 'bg-white' : ''}`}
      >
        <HomeHeader
          activeTab="food"
          setActiveTab={() => {}}
          location={location}
          savedAddressText={location?.area || location?.city || ""}
          handleLocationClick={openLocationSelector}
          handleSearchFocus={handleSearchFocus}
          placeholderIndex={placeholderIndex}
          placeholders={placeholders}
          vegMode={false}
          onVegModeChange={() => {}}
          showVegMode={false}
          showBanner={false}
          hasScrolledPastBanner={hasScrolledPastBanner}
        />
      </div>

      <div
        className="md:hidden overflow-x-clip"
        style={mobileHeaderHeight > 0 ? { marginTop: -mobileHeaderHeight } : undefined}
      >
        <HomeHeader
          activeTab="food"
          setActiveTab={() => {}}
          location={location}
          savedAddressText={location?.area || location?.city || ""}
          handleLocationClick={openLocationSelector}
          handleSearchFocus={handleSearchFocus}
          placeholderIndex={placeholderIndex}
          placeholders={placeholders}
          vegMode={false}
          onVegModeChange={() => {}}
          showVegMode={false}
          showHeaderContent={false}
          bannerContent={
            diningHeroBanners.length > 0 ? (
              <div
                ref={bannerShellRef}
                className="h-full w-full"
                onTouchStart={handleBannerTouchStart}
                onTouchMove={handleBannerTouchMove}
                onTouchEnd={handleBannerTouchEnd}
              >
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
                >
                  {diningHeroBanners.map((banner, index) => (
                    <div key={banner.id} className="relative h-full w-full shrink-0">
                      <OptimizedImage
                        src={banner.imageUrl}
                        alt={`Dining Banner ${index + 1}`}
                        className="h-full w-full"
                        objectFit="cover"
                        priority={index === 0}
                        sizes="100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          }
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-6 md:pb-8 lg:pb-10">
        {/* Categories Section */}
        <div className="mb-6">
          <div className="mb-4 sm:mb-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              <h3 className="font-['Poppins',_'Nunito_Sans',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.38em] text-gray-500 text-center whitespace-nowrap">
                What are you looking for?
              </h3>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
            {loading
              ? loadingCategoryCards.map((key, index) => (
                <DiningCategorySkeleton key={key} index={index} />
              ))
              : filteredCategories.map((category, index) => (
              <Link
                key={category._id || category.id}
                to={`/user/dining/${category.slug}`}
              >
                <motion.div
                  className="relative h-[138px] sm:h-[154px] md:h-[166px] overflow-hidden rounded-[18px] border border-[#e9e1d8] bg-white shadow-[0_1px_2px_rgba(35,24,12,0.05)] cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -2, boxShadow: "0 10px 24px -18px rgba(63, 38, 18, 0.24)" }}
                >
                  <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3 sm:px-4 sm:pt-4">
                    <p className="font-['Poppins',_'Nunito_Sans',sans-serif] max-w-[74%] text-[13px] sm:text-[15px] md:text-[16px] font-semibold leading-[1.02] tracking-[-0.02em] text-[#2d2722]">
                      {category.name}
                    </p>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-[64%] overflow-hidden rounded-b-[18px]">
                    {category.imageUrl ? (
                      <OptimizedImage
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
                        objectFit="cover"
                        sizes="(max-width: 640px) 31vw, (max-width: 768px) 180px, 220px"
                        placeholder="blur"
                        priority={index < 6}
                      />
                    ) : (
                      <div className={`relative h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(226,40,27,0.1),transparent_35%),linear-gradient(180deg,#fff8f8_0%,#fff0f0_100%)] ${shimmerClassName}`}>
                        <div className="absolute inset-x-0 bottom-0 h-[70%] rounded-t-[60%] bg-white/55" />
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
              ))}
          </div>
        </div>

        {/* Popular Restaurants Around You Section */}
        <div className="mb-6 mt-8 sm:mt-12">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Popular Restaurants Within 10km
              </h3>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                {filteredRestaurants.length} nearby places
              </p>
            </div>
          </div>

          {loading ? (
            <section className="mb-4 py-1">
              <div className="flex items-center gap-2 overflow-hidden pb-1">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={`filter-skeleton-${index}`}
                    className={`relative h-8 rounded-md border border-[#efe3d7] bg-[#fff7f1] ${shimmerClassName}`}
                    style={{ width: index === 0 ? 90 : index % 2 === 0 ? 122 : 108 }}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="py-1 mb-4">
              <div
                className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {/* Filter Button - Opens Modal */}
                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(true)}
                  className="h-7 sm:h-8 px-2 sm:px-3 rounded-md flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 font-medium transition-all bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-bold text-black dark:text-white">Filters</span>
                </Button>

                {/* Filter Buttons */}
                {[
                  { id: 'delivery-under-30', label: 'Under 30 mins' },
                  { id: 'delivery-under-45', label: 'Under 45 mins' },
                  { id: 'distance-under-1km', label: 'Under 1km', icon: MapPin },
                  { id: 'distance-under-2km', label: 'Under 2km', icon: MapPin },
                  { id: 'rating-35-plus', label: '3.5+ Rating' },
                  { id: 'rating-4-plus', label: '4.0+ Rating' },
                  { id: 'rating-45-plus', label: '4.5+ Rating' },
                ].map((filter) => {
                  const Icon = filter.icon
                  const isActive = activeFilters.has(filter.id)
                  return (
                    <Button
                      key={filter.id}
                      variant="outline"
                      onClick={() => toggleFilter(filter.id)}
                      className={`h-7 sm:h-8 px-2 sm:px-3 rounded-md flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-all font-medium ${isActive
                        ? 'text-white border'
                        : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      style={isActive ? { backgroundColor: RED, borderColor: RED } : {}}
                    >
                      {Icon && <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'text-white fill-white' : 'text-current'}`} />}
                      <span className={`text-xs sm:text-sm font-bold ${isActive ? 'text-white' : 'text-black dark:text-white'}`}>{filter.label}</span>
                    </Button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Restaurant Cards */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
              {loadingRestaurantCards.map((key, index) => (
                <DiningRestaurantSkeleton key={key} index={index} />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] px-6 py-12 text-center text-sm font-medium text-gray-500">
              No popular dining restaurants were found within 10 km for the current location.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {/* First 2 Restaurants */}
            {filteredRestaurants.slice(0, 2).map((restaurant, index) => {
              const restaurantSlug = restaurant.slug || restaurant.name.toLowerCase().replace(/\s+/g, "-")
              const diningDetailPath = `/food/user/dining/${restaurant.diningType || "dining"}/${restaurantSlug}`
              const favorite = isFavorite(restaurantSlug)

              const handleToggleFavorite = (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (favorite) {
                  removeFavorite(restaurantSlug)
                } else {
                  addFavorite({
                    slug: restaurantSlug,
                    name: restaurant.name,
                    cuisine: restaurant.cuisine,
                    rating: restaurant.rating,
                    deliveryTime: restaurant.deliveryTime,
                    distance: restaurant.distance,
                    image: restaurant.image
                  })
                }
              }

              return (
                <motion.div
                  key={restaurant._id || restaurant.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  style={{ perspective: 1000 }}
                >
                  <motion.div
                    className="h-full"
                    whileHover="hover"
                    initial="rest"
                    variants={{
                      rest: {
                        y: 0,
                        scale: 1,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      },
                      hover: {
                        y: -12,
                        scale: 1.02,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(34, 197, 94, 0.1)",
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          mass: 0.5
                        }
                      }
                    }}
                  >
                    <Link
                      to={diningDetailPath}
                      state={{ restaurant }}
                      className="h-full flex"
                    >
                      <Card className="overflow-hidden gap-0 cursor-pointer border-0 dark:border-gray-800 group bg-white dark:bg-[#1a1a1a] shadow-md transition-all duration-500 py-0 rounded-2xl h-full flex flex-col w-full relative">
                        {/* Image Section */}
                        <div className="relative h-48 sm:h-56 md:h-60 lg:h-64 xl:h-72 w-full overflow-hidden rounded-t-2xl flex-shrink-0">
                          <motion.div
                            className="absolute inset-0"
                            variants={{
                              rest: { scale: 1 },
                              hover: { scale: 1.15 }
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {restaurant.image ? (
                              <OptimizedImage
                                src={restaurant.image}
                                alt={restaurant.name}
                                className="w-full h-full"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                objectFit="cover"
                                placeholder="blur"
                                priority={index < 3}
                              />
                            ) : (
                              <div className={`relative h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(235,89,14,0.24),transparent_30%),linear-gradient(135deg,#fff5e8_0%,#fffaf4_55%,#ffe5d0_100%)] ${shimmerClassName}`} />
                            )}
                          </motion.div>

                          {/* Gradient Overlay on Hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0"
                            variants={{
                              rest: { opacity: 0 },
                              hover: { opacity: 1 }
                            }}
                            transition={{ duration: 0.4 }}
                          />

                          {/* Shine Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                            variants={{
                              rest: { x: "-100%" },
                              hover: {
                                x: "200%",
                                transition: {
                                  duration: 0.8,
                                  ease: "easeInOut",
                                  delay: 0.2
                                }
                              }
                            }}
                          />

                          {/* Featured Dish Badge - Top Left */}
                          <motion.div
                            className="absolute top-3 left-3 flex items-center z-10"
                            variants={{
                              rest: { scale: 1, y: 0 },
                              hover: { scale: 1.05, y: -2 }
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="bg-gray-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium shadow-lg">
                              {restaurant.featuredDish} • ₹{restaurant.featuredPrice}
                            </div>
                          </motion.div>

                          {/* Bookmark Icon - Top Right */}
                          <motion.div
                            variants={{
                              rest: { scale: 1, rotate: 0 },
                              hover: { scale: 1.1, rotate: 5 }
                            }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-3 right-3 z-10"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors"
                              onClick={handleToggleFavorite}
                            >
                              <Bookmark className={`h-5 w-5 ${favorite ? "fill-gray-800 dark:fill-gray-200 text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`} strokeWidth={2} />
                            </Button>
                          </motion.div>

                          {/* Blue Section - Bottom 40% */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${RED}, transparent)`, height: '40%' }}>
                            <div className="h-full flex flex-col justify-end">
                              <div className="pl-4 sm:pl-5 pb-4 sm:pb-5">
                                <p className="text-white text-xs sm:text-sm font-medium uppercase tracking-wide mb-1">
                                  PRE-BOOK TABLE
                                </p>
                                <div className="h-px bg-white/30 mb-2 w-24"></div>
                                <p className="text-white text-base sm:text-lg font-bold">
                                  {restaurant.offer}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <motion.div
                          variants={{
                            rest: { y: 0 },
                            hover: { y: -4 }
                          }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                          <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
                            {/* Restaurant Name & Rating */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <motion.h3
                                  className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-1"
                                  variants={{
                                    rest: {},
                                    hover: { color: RED }
                                  }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {restaurant.name}
                                </motion.h3>
                              </div>
                              <motion.div
                                className="flex-shrink-0 bg-green-600 text-white px-2 py-1 rounded-lg flex items-center gap-1"
                                variants={{
                                  rest: { scale: 1, rotate: 0 },
                                  hover: { scale: 1.1, rotate: 5 }
                                }}
                                transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
                              >
                                <span className="text-sm font-bold">{restaurant.rating}</span>
                                <Star className="h-3 w-3 fill-white text-white" />
                              </motion.div>
                            </div>

                            {/* Delivery Time & Distance */}
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <Clock className="h-4 w-4" strokeWidth={1.5} />
                              <span className="font-medium">{restaurant.deliveryTime}</span>
                              <span className="mx-1">|</span>
                              <span className="font-medium">{restaurant.distance}</span>
                            </div>

                            {/* Offer Badge */}
                            {restaurant.offer && (
                              <div className="flex items-center gap-2 text-sm">
                              <span 
                                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                                style={{ backgroundColor: `${RED}1A`, color: RED }}
                              >
                                Off
                              </span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{restaurant.offer}</span>
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      </Card>
                    </Link>
                  </motion.div>
                </motion.div>
              )
            })}

            {/* Remaining Restaurants */}
            {filteredRestaurants.slice(2).map((restaurant, index) => {
              const restaurantSlug = restaurant.slug || restaurant.name.toLowerCase().replace(/\s+/g, "-")
              const diningDetailPath = `/food/user/dining/${restaurant.diningType || "dining"}/${restaurantSlug}`
              const favorite = isFavorite(restaurantSlug)

              const handleToggleFavorite = (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (favorite) {
                  removeFavorite(restaurantSlug)
                } else {
                  addFavorite({
                    slug: restaurantSlug,
                    name: restaurant.name,
                    cuisine: restaurant.cuisine,
                    rating: restaurant.rating,
                    deliveryTime: restaurant.deliveryTime,
                    distance: restaurant.distance,
                    image: restaurant.image
                  })
                }
              }

              return (
                <motion.div
                  key={restaurant._id || restaurant.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    delay: (index + 2) * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  style={{ perspective: 1000 }}
                >
                  <motion.div
                    className="h-full"
                    whileHover="hover"
                    initial="rest"
                    variants={{
                      rest: {
                        y: 0,
                        scale: 1,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      },
                      hover: {
                        y: -12,
                        scale: 1.02,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(34, 197, 94, 0.1)",
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          mass: 0.5
                        }
                      }
                    }}
                  >
                    <Link
                      to={diningDetailPath}
                      state={{ restaurant }}
                      className="h-full flex"
                    >
                      <Card className="overflow-hidden cursor-pointer border-0 dark:border-gray-800 group bg-white dark:bg-[#1a1a1a] shadow-md transition-all duration-500 py-0 rounded-2xl h-full flex flex-col w-full relative">
                        {/* Image Section */}
                        <div className="relative h-48 sm:h-56 md:h-60 lg:h-64 xl:h-72 w-full overflow-hidden rounded-t-2xl flex-shrink-0">
                          <motion.div
                            className="absolute inset-0"
                            variants={{
                              rest: { scale: 1 },
                              hover: { scale: 1.15 }
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {restaurant.image ? (
                              <OptimizedImage
                                src={restaurant.image}
                                alt={restaurant.name}
                                className="w-full h-full"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                objectFit="cover"
                                placeholder="blur"
                              />
                            ) : (
                              <div className={`relative h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(226,40,27,0.12),transparent_30%),linear-gradient(135deg,#fff8f8_0%,#fffaf4_55%,#fff0f0_100%)] ${shimmerClassName}`} />
                            )}
                          </motion.div>

                          {/* Gradient Overlay on Hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0"
                            variants={{
                              rest: { opacity: 0 },
                              hover: { opacity: 1 }
                            }}
                            transition={{ duration: 0.4 }}
                          />

                          {/* Shine Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                            variants={{
                              rest: { x: "-100%" },
                              hover: {
                                x: "200%",
                                transition: {
                                  duration: 0.8,
                                  ease: "easeInOut",
                                  delay: 0.2
                                }
                              }
                            }}
                          />

                          {/* Featured Dish Badge - Top Left */}
                          <div className="absolute top-3 left-3">
                            <div className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                              {restaurant.featuredDish} • ₹{restaurant.featuredPrice}
                            </div>
                          </div>

                          {/* Bookmark Icon - Top Right */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 h-9 w-9 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors"
                            onClick={handleToggleFavorite}
                          >
                            <Bookmark className={`h-5 w-5 ${favorite ? "fill-gray-800 dark:fill-gray-200 text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`} strokeWidth={2} />
                          </Button>

                          {/* Blue Section - Bottom 40% */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${RED}, transparent)`, height: '40%' }}>
                            <div className="h-full flex flex-col justify-end">
                              <div className="pl-4 sm:pl-5 pb-4 sm:pb-5">
                                <p className="text-white text-xs sm:text-sm font-medium uppercase tracking-wide mb-1">
                                  PRE-BOOK TABLE
                                </p>
                                <div className="h-px bg-white/30 mb-2 w-24"></div>
                                <p className="text-white text-base sm:text-lg font-bold">
                                  {restaurant.offer}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
                          {/* Restaurant Name & Rating */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-red-600 transition-colors" style={{ color: 'inherit' }}>
                                <style>{`.group:hover h3 { color: ${RED} !important; }`}</style>
                                {restaurant.name}
                              </h3>
                            </div>
                            <div className="flex-shrink-0 bg-green-600 text-white px-2 py-1 rounded-lg flex items-center gap-1">
                              <span className="text-sm font-bold">{restaurant.rating}</span>
                              <Star className="h-3 w-3 fill-white text-white" />
                            </div>
                          </div>

                          {/* Delivery Time & Distance */}
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <Clock className="h-4 w-4" strokeWidth={1.5} />
                            <span className="font-medium">{restaurant.deliveryTime}</span>
                            <span className="mx-1">|</span>
                            <span className="font-medium">{restaurant.distance}</span>
                          </div>

                          {/* Offer Badge */}
                          {restaurant.offer && (
                            <div className="flex items-center gap-2 text-sm">
                              <span 
                                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                                style={{ backgroundColor: `${RED}1A`, color: RED }}
                              >
                                Off
                              </span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{restaurant.offer}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-4xl bg-white dark:bg-[#1a1a1a] rounded-t-3xl md:rounded-3xl max-h-[85vh] md:max-h-[90vh] flex flex-col animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b dark:border-gray-800">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Filters and sorting</h2>
              <button
                onClick={() => {
                  setActiveFilters(new Set())
                  setSortBy(null)
                  setSelectedCuisine(null)
                }}
                style={{ color: RED }}
                className="font-medium text-sm md:text-base"
              >
                Clear all
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - Tabs */}
              <div className="w-24 sm:w-28 md:w-32 bg-gray-50 dark:bg-[#0a0a0a] border-r dark:border-gray-800 flex flex-col">
                {[
                  { id: 'sort', label: 'Sort By', icon: ArrowDownUp },
                  { id: 'time', label: 'Time', icon: Timer },
                  { id: 'rating', label: 'Rating', icon: Star },
                  { id: 'distance', label: 'Distance', icon: MapPin },
                  { id: 'price', label: 'Dish Price', icon: IndianRupee },
                  { id: 'cuisine', label: 'Cuisine', icon: UtensilsCrossed },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeFilterTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilterTab(tab.id)}
                      className={`flex flex-col items-center gap-1 py-4 px-2 text-center relative transition-colors ${isActive ? 'bg-white dark:bg-[#1a1a1a]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      style={isActive ? { color: RED } : {}}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r" style={{ backgroundColor: RED }} />
                      )}
                      <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                      <span className="text-xs md:text-sm font-medium leading-tight">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Right Content Area - Scrollable */}
              <div ref={rightContentRef} className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* Sort By Tab */}
                {activeFilterTab === 'sort' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Sort by</h3>
                    <div className="flex flex-col gap-3 md:gap-4">
                      {[
                        { id: null, label: 'Relevance' },
                        { id: 'rating-high', label: 'Rating: High to Low' },
                        { id: 'rating-low', label: 'Rating: Low to High' },
                      ].map((option) => (
                        <button
                          key={option.id || 'relevance'}
                          onClick={() => setSortBy(option.id)}
                          className={`px-4 md:px-5 py-3 md:py-4 rounded-xl border text-left transition-colors ${sortBy === option.id
                            ? 'border'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                          style={sortBy === option.id ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                        >
                          <span className={`text-sm md:text-base font-medium ${sortBy === option.id ? '' : 'text-gray-700 dark:text-gray-300'}`} style={sortBy === option.id ? { color: RED } : {}}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Tab */}
                {activeFilterTab === 'time' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estimated Time</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('delivery-under-30')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('delivery-under-30')
                          ? 'border'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        style={activeFilters.has('delivery-under-30') ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                      >
                        <Timer className="h-6 w-6" style={activeFilters.has('delivery-under-30') ? { color: RED } : { color: '#4b5563' }} strokeWidth={1.5} />
                        <span className="text-sm font-medium" style={activeFilters.has('delivery-under-30') ? { color: RED } : { color: '#374151' }}>Under 30 mins</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('delivery-under-45')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('delivery-under-45')
                          ? 'border'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        style={activeFilters.has('delivery-under-45') ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                      >
                        <Timer className="h-6 w-6" style={activeFilters.has('delivery-under-45') ? { color: RED } : { color: '#4b5563' }} strokeWidth={1.5} />
                        <span className="text-sm font-medium" style={activeFilters.has('delivery-under-45') ? { color: RED } : { color: '#374151' }}>Under 45 mins</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Rating Tab */}
                {activeFilterTab === 'rating' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Restaurant Rating</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('rating-35-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-35-plus')
                          ? 'border'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        style={activeFilters.has('rating-35-plus') ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                      >
                        <Star className="h-6 w-6" style={activeFilters.has('rating-35-plus') ? { color: RED, fill: RED } : { color: '#9ca3af' }} />
                        <span className="text-sm font-medium" style={activeFilters.has('rating-35-plus') ? { color: RED } : { color: '#374151' }}>Rated 3.5+</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('rating-4-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-4-plus')
                          ? 'border'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        style={activeFilters.has('rating-4-plus') ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                      >
                        <Star className="h-6 w-6" style={activeFilters.has('rating-4-plus') ? { color: RED, fill: RED } : { color: '#9ca3af' }} />
                        <span className="text-sm font-medium" style={activeFilters.has('rating-4-plus') ? { color: RED } : { color: '#374151' }}>Rated 4.0+</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('rating-45-plus')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('rating-45-plus')
                          ? 'border'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        style={activeFilters.has('rating-45-plus') ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                      >
                        <Star className="h-6 w-6" style={activeFilters.has('rating-45-plus') ? { color: RED, fill: RED } : { color: '#9ca3af' }} />
                        <span className="text-sm font-medium" style={activeFilters.has('rating-45-plus') ? { color: RED } : { color: '#374151' }}>Rated 4.5+</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Distance Tab */}
                {activeFilterTab === 'distance' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distance</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => toggleFilter('distance-under-1km')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('distance-under-1km')
                          ? 'border'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        style={activeFilters.has('distance-under-1km') ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                      >
                        <MapPin className="h-6 w-6" style={activeFilters.has('distance-under-1km') ? { color: RED } : { color: '#4b5563' }} strokeWidth={1.5} />
                        <span className="text-sm font-medium" style={activeFilters.has('distance-under-1km') ? { color: RED } : { color: '#374151' }}>Under 1 km</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('distance-under-2km')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${activeFilters.has('distance-under-2km')
                          ? 'border'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        style={activeFilters.has('distance-under-2km') ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                      >
                        <MapPin className="h-6 w-6" style={activeFilters.has('distance-under-2km') ? { color: RED } : { color: '#4b5563' }} strokeWidth={1.5} />
                        <span className="text-sm font-medium" style={activeFilters.has('distance-under-2km') ? { color: RED } : { color: '#374151' }}>Under 2 km</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Tab */}
                {activeFilterTab === 'price' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dish Price</h3>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => toggleFilter('price-under-200')}
                        className={`px-4 py-3 rounded-xl border text-left transition-colors ${activeFilters.has('price-under-200')
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-500'
                          }`}
                      >
                        <span className={`text-sm font-medium ${activeFilters.has('price-under-200') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Under ₹200</span>
                      </button>
                      <button
                        onClick={() => toggleFilter('price-under-500')}
                        className={`px-4 py-3 rounded-xl border text-left transition-colors ${activeFilters.has('price-under-500')
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-500'
                          }`}
                      >
                        <span className={`text-sm font-medium ${activeFilters.has('price-under-500') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>Under ₹500</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Cuisine Tab */}
                {activeFilterTab === 'cuisine' && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cuisine</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {['Continental', 'Italian', 'Asian', 'Indian', 'Chinese', 'American', 'Seafood', 'Cafe'].map((cuisine) => (
                        <button
                          key={cuisine}
                          onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
                          className={`px-4 py-3 rounded-xl border text-center transition-colors ${selectedCuisine === cuisine
                            ? 'border'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                          style={selectedCuisine === cuisine ? { backgroundColor: `${RED}1A`, borderColor: RED } : {}}
                        >
                          <span className="text-sm font-medium" style={selectedCuisine === cuisine ? { color: RED } : { color: '#374151' }}>
                            {cuisine}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5 border-t dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3 md:py-4 text-center font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base"
              >
                Close
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                  style={(activeFilters.size > 0 || sortBy || selectedCuisine) ? { backgroundColor: RED } : {}}
                  className={`flex-1 py-3 md:py-4 font-semibold rounded-xl transition-colors text-sm md:text-base ${activeFilters.size > 0 || sortBy || selectedCuisine
                    ? 'text-white hover:bg-opacity-90'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
              >
                {activeFilters.size > 0 || sortBy || selectedCuisine
                  ? `Show ${filteredRestaurants.length} results`
                  : 'Show results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}


