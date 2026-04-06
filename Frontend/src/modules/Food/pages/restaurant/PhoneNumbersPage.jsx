import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Edit, Phone, Users, ChevronDown, X } from "lucide-react"

export default function PhoneNumbersPage() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const [editingNumber, setEditingNumber] = useState(null) // { type: 'orderReminder1' | 'orderReminder2' | 'restaurantPage' }
  const [countryCode, setCountryCode] = useState("+91")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false)
  const [showOtpPopup, setShowOtpPopup] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [pendingPhoneData, setPendingPhoneData] = useState(null) // Store phone data to save after OTP verification

  // Phone numbers data - only mobile now
  const [phoneData, setPhoneData] = useState({
    orderReminder1: "+91-9981127415",
    orderReminder2: "+91-9981127415",
    restaurantPage: "+91-9981127415"
  })

  // Country codes
  const countryCodes = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
  ]

  const handleEditClick = (type) => {
    const currentNumber = phoneData[type]
    const parts = currentNumber.split('-')
    setCountryCode(parts[0] || "+91")
    setPhoneNumber(parts[1] || "")
    setEditingNumber(type)
  }

  const handleSaveEdit = () => {
    if (!editingNumber || !phoneNumber.trim()) return
    
    // Store the data to save after OTP verification
    setPendingPhoneData({
      type: editingNumber,
      value: `${countryCode}-${phoneNumber.trim()}`,
      countryCode: countryCode,
      phoneNumber: phoneNumber.trim()
    })
    
    // Close edit popup and show OTP popup
    setEditingNumber(null)
    setShowOtpPopup(true)
    setOtp(["", "", "", "", "", ""])
  }

  const handleCancelEdit = () => {
    setEditingNumber(null)
    setCountryCode("+91")
    setPhoneNumber("")
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last character
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
    
    setOtp(newOtp)
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleVerifyOtp = () => {
    const otpString = otp.join("")
    
    // For demo purposes, accept any 6-digit OTP
    // In production, this would verify against the backend
    if (otpString.length === 6) {
      // Save the phone number
      if (pendingPhoneData) {
        setPhoneData(prev => ({
          ...prev,
          [pendingPhoneData.type]: pendingPhoneData.value
        }))
      }
      
      // Close OTP popup and reset
      setShowOtpPopup(false)
      setPendingPhoneData(null)
      setOtp(["", "", "", "", "", ""])
      setCountryCode("+91")
      setPhoneNumber("")
    }
  }

  const handleResendOtp = () => {
    // Reset OTP input
    setOtp(["", "", "", "", "", ""])
    // In production, this would trigger a new OTP to be sent
  }

  const handleCancelOtp = () => {
    setShowOtpPopup(false)
    setPendingPhoneData(null)
    setOtp(["", "", "", "", "", ""])
  }

  const getDisplayNumber = (type) => {
    return phoneData[type] || ""
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Important contacts</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">

        {/* Order reminder numbers */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900">Order reminder numbers</h2>
              <p className="text-xs text-gray-600 mt-1">
                Should always be available for Zomato to reach out for live order support and order reminders.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Order reminder number #1 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-1">Order reminder number #1</p>
                <p className="text-base font-semibold text-gray-900">{getDisplayNumber("orderReminder1")}</p>
              </div>
              <button
                onClick={() => handleEditClick("orderReminder1")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </button>
            </div>

            {/* Order reminder number #2 */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-1">Order reminder number #2</p>
                <p className="text-base font-semibold text-gray-900">{getDisplayNumber("orderReminder2")}</p>
              </div>
              <button
                onClick={() => handleEditClick("orderReminder2")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant page number */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900">Restaurant page number</h2>
              <p className="text-xs text-gray-600 mt-1">
                Number for Zomato customers to call your restaurant.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-900">{getDisplayNumber("restaurantPage")}</p>
              </div>
              <button
                onClick={() => handleEditClick("restaurantPage")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Staff management removed */}
      </div>

      {/* Edit Phone Number Popup */}
      <AnimatePresence>
        {editingNumber && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelEdit}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Edit phone number</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  {/* Country Code Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Country code
                    </label>
                    <button
                      onClick={() => setIsCountryCodeOpen(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {countryCodes.find(c => c.code === countryCode)?.flag || "🇮🇳"}
                        </span>
                        <span className="text-sm text-gray-900">{countryCode}</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!phoneNumber.trim()}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
                    phoneNumber.trim()
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Country Code Selection Popup */}
      <AnimatePresence>
        {isCountryCodeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCountryCodeOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[60] max-h-[60vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Select country code</h2>
                <button
                  onClick={() => setIsCountryCodeOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-2">
                  {countryCodes.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => {
                        setCountryCode(country.code)
                        setIsCountryCodeOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                        countryCode === country.code
                          ? "bg-gray-900 text-white"
                          : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="flex-1">{country.country}</span>
                      <span className={countryCode === country.code ? "text-white" : "text-gray-600"}>
                        {country.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* OTP Verification Popup */}
      <AnimatePresence>
        {showOtpPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelOtp}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Verify OTP</h2>
                <button
                  onClick={handleCancelOtp}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      We've sent a 6-digit OTP to
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {pendingPhoneData ? `${pendingPhoneData.countryCode}-${pendingPhoneData.phoneNumber}` : ""}
                    </p>
                  </div>

                  {/* OTP Input Fields */}
                  <div className="flex items-center justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleResendOtp}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleCancelOtp}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.join("").length !== 6}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
                    otp.join("").length === 6
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Verify
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
