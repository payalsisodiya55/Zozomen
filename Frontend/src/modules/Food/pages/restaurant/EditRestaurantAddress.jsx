import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import Lenis from "lenis"
import { ArrowLeft, ChevronDown } from "lucide-react"
import BottomPopup from "@delivery/components/BottomPopup"
import { restaurantAPI } from "@food/api"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


const ADDRESS_STORAGE_KEY = "restaurant_address"

// Default coordinates for Indore (can be updated based on actual location)
const DEFAULT_LAT = 22.7196
const DEFAULT_LNG = 75.8577

export default function EditRestaurantAddress() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const [address, setAddress] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSelectOptionDialog, setShowSelectOptionDialog] = useState(false)
  const [selectedOption, setSelectedOption] = useState("minor_correction") // "update_address" or "minor_correction"
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)

  // Format address from location object
  const formatAddress = (loc) => {
    if (!loc) return ""
    const parts = []
    if (loc.addressLine1) parts.push(loc.addressLine1.trim())
    if (loc.addressLine2) parts.push(loc.addressLine2.trim())
    if (loc.area) parts.push(loc.area.trim())
    if (loc.city) {
      const city = loc.city.trim()
      if (!loc.area || !loc.area.includes(city)) {
        parts.push(city)
      }
    }
    if (loc.landmark) parts.push(loc.landmark.trim())
    return parts.join(", ") || ""
  }

  // Fetch restaurant data from backend
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        const response = await restaurantAPI.getCurrentRestaurant()
        const data = response?.data?.data?.restaurant || response?.data?.restaurant
        if (data) {
          setRestaurantName(data.name || "")
          if (data.location) {
            setLocation(data.location)
            const formatted = formatAddress(data.location)
            setAddress(formatted)
            // Set coordinates if available
            if (data.location.latitude && data.location.longitude) {
              setLat(data.location.latitude)
              setLng(data.location.longitude)
            }
          } else {
            // Fallback to localStorage
            try {
              const savedAddress = localStorage.getItem(ADDRESS_STORAGE_KEY)
              if (savedAddress) {
                setAddress(savedAddress)
              }
            } catch (error) {
              debugError("Error loading address from storage:", error)
            }
          }
        }
      } catch (error) {
        // Only log error if it's not a network/timeout error (backend might be down/slow)
        if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNABORTED' && !error.message?.includes('timeout')) {
          debugError("Error fetching restaurant data:", error)
        }
        // Fallback to localStorage
        try {
          const savedAddress = localStorage.getItem(ADDRESS_STORAGE_KEY)
          if (savedAddress) {
            setAddress(savedAddress)
          }
          // Try to get restaurant name from localStorage, but prefer empty string over hardcoded value
          const savedName = localStorage.getItem("restaurant_name") || 
                           localStorage.getItem("restaurantName") ||
                           ""
          setRestaurantName(savedName)
        } catch (e) {
          debugError("Error loading from localStorage:", e)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()

    // Listen for address updates
    const handleAddressUpdate = () => {
      fetchRestaurantData()
    }

    window.addEventListener("addressUpdated", handleAddressUpdate)
    return () => window.removeEventListener("addressUpdated", handleAddressUpdate)
  }, [])

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Handle opening Google Maps app
  const handleViewOnMap = () => {
    // Create Google Maps URL for the restaurant location
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    
    // Try to open in Google Maps app (mobile) or web
    window.open(googleMapsUrl, "_blank")
  }

  // Handle Update button click
  const handleUpdateClick = () => {
    setShowSelectOptionDialog(true)
  }

  // Handle Proceed to update
  const handleProceedUpdate = async () => {
    try {
      // For now, we'll update the location in the database
      // In a real scenario, you might want to handle FSSAI update flow separately
      if (selectedOption === "update_address") {
        // For major address update, you might want to navigate to a form
        // For now, we'll just show a message
        alert("For major address updates, FSSAI verification may be required. Please contact support.")
        setShowSelectOptionDialog(false)
        return
      } else {
        // Minor correction - update location coordinates
        // Fetch live address from coordinates using Google Maps API
        try {
          let formattedAddress = location?.formattedAddress || ""
          // Google Geocoding disabled - new backend in progress. Use existing or coords.
          if (lat && lng && !formattedAddress) {
            formattedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }

          // Update location with coordinates array and formattedAddress
          const updatedLocation = {
            ...location,
            latitude: lat,
            longitude: lng,
            coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            formattedAddress: formattedAddress || location?.formattedAddress || ""
          }
          
          const response = await restaurantAPI.updateProfile({ location: updatedLocation })
          
          if (response?.data?.data?.restaurant) {
            // Update local state
            setLocation(updatedLocation)
            // Dispatch event to notify other components
            window.dispatchEvent(new Event("addressUpdated"))
            setShowSelectOptionDialog(false)
            goBack()
          } else {
            throw new Error("Invalid response from server")
          }
        } catch (updateError) {
          debugError("Error updating address:", updateError)
          alert(`Failed to update address: ${updateError.response?.data?.message || updateError.message || "Please try again."}`)
        }
      }
    } catch (error) {
      debugError("Error updating address:", error)
      alert(`Failed to update address: ${error.response?.data?.message || error.message || "Please try again."}`)
    }
  }

  // Get simplified address for navbar (last two parts: area, city)
  const getSimplifiedAddress = (fullAddress) => {
    const parts = fullAddress.split(",").map(p => p.trim())
    if (parts.length >= 2) {
      // Return last two parts (e.g., "By Pass Road (South), Indore")
      return parts.slice(-2).join(", ")
    }
    return fullAddress
  }
  
  const simplifiedAddress = getSimplifiedAddress(address)

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3 shrink-0">
        <button
          onClick={goBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h1 className="text-base font-bold text-gray-900 truncate">{restaurantName}</h1>
            <ChevronDown className="w-4 h-4 text-gray-900 shrink-0" />
          </div>
          <p className="text-xs text-gray-600 truncate">{simplifiedAddress}</p>
        </div>
      </div>

      {/* Map Section - Takes remaining space */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Google Maps Embed */}
        <iframe
          src={`https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
        
        {/* Custom Marker Tooltip Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          {/* Tooltip */}
          <div className="bg-black text-white px-3 py-2 rounded-lg mb-2 whitespace-nowrap shadow-lg">
            <p className="text-xs font-semibold">Your outlet location</p>
            <p className="text-[10px] text-gray-300">Orders will be picked up from here</p>
          </div>
          {/* Marker Pin */}
          <div className="w-6 h-6 bg-black rounded-full border-2 border-white shadow-lg mx-auto"></div>
        </div>

        {/* Address Details Section - Overlays map at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-20 px-4 pt-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-3">Outlet address</h2>
          
          {/* Informational Banner */}
          <div className="bg-blue-100 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-gray-900">
              Customers and Zomato delivery partners will use this to locate your outlet.
            </p>
          </div>

          {/* Current Address Display */}
          <div className="mb-4">
            <p className="text-base text-gray-900">{address}</p>
          </div>

          {/* Update Button */}
          <div className="pb-4">
            <button
              onClick={handleUpdateClick}
              className="w-full bg-black text-white font-semibold py-4 text-base rounded-lg"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Select Option Bottom Popup */}
      <BottomPopup
        isOpen={showSelectOptionDialog}
        onClose={() => setShowSelectOptionDialog(false)}
        title="Select an option"
        maxHeight="auto"
      >
        <div className=" space-y-0">
          {/* Option 1: Update outlet address */}
          <button
            onClick={() => setSelectedOption("update_address")}
            className="w-full flex items-start justify-between py-4 border-b border-dashed border-gray-300"
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-gray-900 mb-1">
                Update outlet address (FSSAI required)
              </p>
              <p className="text-sm text-gray-500">{address}</p>
            </div>
            <div className="ml-4 shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "update_address"
                    ? "border-black bg-black"
                    : "border-gray-300"
                }`}
              >
                {selectedOption === "update_address" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </button>

          {/* Option 2: Minor correction */}
          <button
            onClick={() => setSelectedOption("minor_correction")}
            className="w-full flex items-start justify-between py-4"
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-gray-900 mb-1">
                Make a minor correction to the location pin
              </p>
              <p className="text-sm text-gray-500">
                If location pin on the map is slightly misplaced
              </p>
            </div>
            <div className="ml-4 shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "minor_correction"
                    ? "border-black bg-black"
                    : "border-gray-300"
                }`}
              >
                {selectedOption === "minor_correction" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </button>

          {/* Proceed Button */}
          <button
            onClick={handleProceedUpdate}
            className="w-full bg-black text-white font-semibold py-4 rounded-lg mt-6"
          >
            Proceed to update
          </button>
        </div>
      </BottomPopup>
    </div>
  )
}

