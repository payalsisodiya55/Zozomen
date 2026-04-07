import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Wallet,
  Tag,
  User,
  Leaf,
  Palette,
  Bookmark,
  Building2,
  Moon,
  Sun,
  Check,
  Percent,
  Info,
  PenSquare,
  AlertTriangle,
  Settings as SettingsIcon,
  Power,
  ShoppingCart,
  MapPin,
  Share2,
} from "lucide-react";

import AnimatedPage from "@food/components/user/AnimatedPage";
import { Card, CardContent } from "@food/components/ui/card";
import { Button } from "@food/components/ui/button";
import { useProfile } from "@food/context/ProfileContext";
import { useLocationSelector } from "@food/components/user/UserLayout";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@food/components/ui/avatar";
import { useCompanyName } from "@food/hooks/useCompanyName";
import OptimizedImage from "@food/components/OptimizedImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { authAPI, userAPI } from "@food/api";
import { firebaseAuth } from "@food/firebase";
import { clearModuleAuth } from "@food/utils/auth";
import { toast } from "sonner";
import { RED } from "@food/constants/color";

const debugLog = (...args) => { };
const debugWarn = (...args) => { };
const debugError = (...args) => { };
const USER_SESSION_PREFERENCE_KEYS = ["userVegMode", "food-under-250-filters"];
const DEFAULT_PROFILE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#dbeafe" />
        <stop offset="100%" stop-color="#bfdbfe" />
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="48" fill="url(#bg)" />
    <circle cx="48" cy="36" r="16" fill="#ffffff" />
    <path d="M24 78c4-13 16-20 24-20s20 7 24 20" fill="#ffffff" />
  </svg>`,
)}`;

import { registerWebPushForCurrentModule } from "@food/utils/firebaseMessaging";

export default function Profile() {
  const { userProfile, vegMode, setVegMode, getDefaultAddress, addresses } =
    useProfile();
  const { openLocationSelector } = useLocationSelector();
  const navigate = useNavigate();
  const companyName = useCompanyName();
  const defaultAddress = getDefaultAddress?.();
  const savedAddressSummary = defaultAddress
    ? [
      defaultAddress.street,
      defaultAddress.additionalDetails,
      defaultAddress.city,
      defaultAddress.state,
      defaultAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ")
    : "No address saved. Tap to save Home, Work, or Other.";

  // Popup states
  const [vegModeOpen, setVegModeOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [referralReward, setReferralReward] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  // Trigger web push registration when profile mounts to ensure FCM token is saved
  useEffect(() => {
    registerWebPushForCurrentModule().catch(console.error);
  }, []);

  const handleVegModeUpdate = (nextValue) => {
    setVegMode(nextValue);
    localStorage.setItem("userVegMode", String(nextValue));
  };

  // Settings states
  const [appearance, setAppearance] = useState(() => {
    // Load theme from localStorage or default to 'light'
    return localStorage.getItem("appTheme") || "light";
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (appearance === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Save to localStorage
    localStorage.setItem("appTheme", appearance);
  }, [appearance]);

  // Get first letter of name for avatar
  const hasName =
    typeof userProfile?.name === "string" && userProfile.name.trim() !== "";
  const avatarInitial = userProfile?.name?.charAt(0)?.toUpperCase() || "U";
  const avatarImageSrc = hasName
    ? userProfile?.profileImage?.trim() || undefined
    : DEFAULT_PROFILE_AVATAR;
  const displayName = userProfile?.name || userProfile?.phone || "User";
  // Only show email if it exists and is valid, otherwise show phone or "Not available"
  const hasValidEmail =
    userProfile?.email &&
    userProfile.email.trim() !== "" &&
    userProfile.email.includes("@");
  const displayEmail = hasValidEmail
    ? userProfile.email
    : userProfile?.phone || "Not available";

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!userProfile) return 0;

    // Helper function to check if date field is filled (handles Date objects, date strings, ISO strings)
    const isDateFilled = (dateField) => {
      if (!dateField) return false;

      // Check if it's a Date object
      if (dateField instanceof Date) {
        return !isNaN(dateField.getTime());
      }

      // Check if it's a string
      if (typeof dateField === "string") {
        const trimmed = dateField.trim();
        if (trimmed === "" || trimmed === "null" || trimmed === "undefined")
          return false;

        // Try to parse as date (handles various formats: YYYY-MM-DD, ISO strings, etc.)
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          // Valid date
          return true;
        }
      }

      return false;
    };

    // Check name - must have value
    const hasName = !!(
      userProfile.name &&
      typeof userProfile.name === "string" &&
      userProfile.name.trim() !== ""
    );

    // Check contact - phone OR email (at least one)
    const hasPhone = !!(
      userProfile.phone &&
      typeof userProfile.phone === "string" &&
      userProfile.phone.trim() !== ""
    );
    const hasContact = hasPhone || hasValidEmail;

    // Check profile image - must have URL string
    const hasImage = !!(
      userProfile.profileImage &&
      typeof userProfile.profileImage === "string" &&
      userProfile.profileImage.trim() !== "" &&
      userProfile.profileImage !== "null" &&
      userProfile.profileImage !== "undefined"
    );

    // Check date of birth
    const hasDateOfBirth = isDateFilled(userProfile.dateOfBirth);

    // Check gender - must be valid value
    const validGenders = ["male", "female", "other", "prefer-not-to-say"];
    const hasGender = !!(
      userProfile.gender &&
      typeof userProfile.gender === "string" &&
      userProfile.gender.trim() !== "" &&
      validGenders.includes(userProfile.gender.trim().toLowerCase())
    );

    // Required fields only (anniversary is NOT counted - it's optional)
    // Only these 5 fields count towards 100%
    const requiredFields = {
      name: hasName,
      contact: hasContact,
      profileImage: hasImage,
      dateOfBirth: hasDateOfBirth,
      gender: hasGender,
    };

    const totalRequiredFields = 5; // Fixed: name, contact, profileImage, dateOfBirth, gender
    const completedRequiredFields =
      Object.values(requiredFields).filter(Boolean).length;

    // Calculate percentage based ONLY on required fields (anniversary NOT included)
    const percentage = Math.round(
      (completedRequiredFields / totalRequiredFields) * 100,
    );

    // Always log for debugging (remove in production if needed)
    debugLog("?? Profile completion check:", {
      requiredFields,
      completedRequiredFields,
      totalRequiredFields,
      percentage,
      fieldStatus: {
        name: hasName ? "?" : "?",
        contact: hasContact ? "?" : "?",
        profileImage: hasImage ? "?" : "?",
        dateOfBirth: hasDateOfBirth ? "?" : "?",
        gender: hasGender ? "?" : "?",
      },
      rawData: {
        name: userProfile.name || "missing",
        phone: userProfile.phone || "missing",
        email: userProfile.email || "missing",
        profileImage: userProfile.profileImage ? "exists" : "missing",
        dateOfBirth: userProfile.dateOfBirth
          ? String(userProfile.dateOfBirth)
          : "missing",
        gender: userProfile.gender || "missing",
      },
    });

    return percentage;
  };

  const profileCompletion = calculateProfileCompletion();
  const isComplete = profileCompletion === 100;
  useEffect(() => {
    let mounted = true;
    userAPI
      .getReferralStats()
      .then((res) => {
        const reward = res?.data?.data?.stats?.rewardAmount;
        if (mounted) setReferralReward(Number(reward) || 0);
      })
      .catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    userAPI
      .getWallet()
      .then((res) => {
        const w = res?.data?.data?.wallet || res?.data?.wallet;
        const bal = Number(w?.balance);
        if (mounted) setWalletBalance(Number.isFinite(bal) ? bal : 0);
      })
      .catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);

  const refId =
    userProfile?._id || userProfile?.id || userProfile?.referralCode || "";
  const referralLink = refId
    ? `${window.location.origin}/food/user/auth/login?ref=${encodeURIComponent(String(refId))}`
    : "";

  const handleShareReferral = async () => {
    if (!referralLink) return;
    const rewardText = referralReward > 0 ? `\u20B9${referralReward}` : "rewards";
    const shareText = `Join ${companyName} and earn ${rewardText}.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${companyName} referral`,
          text: shareText,
          url: referralLink,
        });
      } else {
        const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`;
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      debugError("Failed to share referral:", error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);

    try {
      // Call backend logout API to invalidate refresh token
      try {
        let fcmToken = null;
        let platform = "web";
        try {
          if (typeof window !== "undefined") {
            if (window.flutter_inappwebview) {
              platform = "mobile";
              const handlerNames = [
                "getFcmToken",
                "getFCMToken",
                "getPushToken",
                "getFirebaseToken",
              ];
              for (const handlerName of handlerNames) {
                try {
                  const t = await window.flutter_inappwebview.callHandler(
                    handlerName,
                    { module: "user" },
                  );
                  if (t && typeof t === "string" && t.length > 20) {
                    fcmToken = t.trim();
                    break;
                  }
                } catch (e) { }
              }
            } else {
              fcmToken =
                localStorage.getItem("fcm_web_registered_token_user") || null;
            }
          }
        } catch (e) {
          console.warn("Failed to get FCM token during logout", e);
        }
        await authAPI.logout(null, fcmToken, platform);
      } catch (apiError) {
        // Continue with logout even if API call fails (network issues, etc.)
        debugWarn(
          "Logout API call failed, continuing with local cleanup:",
          apiError,
        );
      }

      // Sign out from Firebase if user logged in via Google
      try {
        const { signOut } = await import("firebase/auth");
        // Firebase Auth is lazy-initialized now; only attempt sign out if it was actually used
        if (firebaseAuth) {
           const currentUser = firebaseAuth.currentUser;
           if (currentUser) {
             await signOut(firebaseAuth);
           }
        }
      } catch (firebaseError) {
        // Continue even if Firebase logout fails
        debugWarn(
          "Firebase logout failed, continuing with local cleanup:",
          firebaseError,
        );
      }

      // Clear user module authentication data using utility function
      clearModuleAuth("user");

      // Clear legacy token data for backward compatibility
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user_authenticated");
      localStorage.removeItem("user_user");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      USER_SESSION_PREFERENCE_KEYS.forEach((key) => localStorage.removeItem(key));

      // Dispatch auth change event to notify other components
      window.dispatchEvent(new Event("userAuthChanged"));

      // Navigate to sign in page
      navigate("/user/auth/login", { replace: true });
    } catch (err) {
      // Even if there's an error, we should still clear local data and logout
      debugError("Error during logout:", err);

      // Clear local data anyway using utility function
      clearModuleAuth("user");

      // Clear legacy token data for backward compatibility
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user_authenticated");
      localStorage.removeItem("user_user");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      USER_SESSION_PREFERENCE_KEYS.forEach((key) => localStorage.removeItem(key));
      window.dispatchEvent(new Event("userAuthChanged"));

      // Still navigate to login page
      navigate("/user/auth/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutClick = () => {
    if (isLoggingOut) return;
    setLogoutConfirmOpen(true);
  };

  return (
    <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 pb-20 sm:pb-24">
        {/* Header: Back Arrow */}
        <div className="flex items-center mb-4">
          <Link to="/user">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
            </Button>
          </Link>
        </div>

        {/* Profile Info Card */}
        <Card className="bg-white dark:bg-[#1a1a1a] rounded-2xl py-0 pt-1 shadow-sm mb-0 border-0 dark:border-gray-800 overflow-hidden">
          <CardContent className="p-4 py-0 pt-2">
            <div className="flex items-start gap-4 mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}>
                <Avatar className="h-16 w-16 bg-blue-300 border-0">
                  <AvatarImage src={avatarImageSrc} alt={displayName} />
                  <AvatarFallback className="bg-blue-300 text-white text-2xl font-semibold">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="flex-1 pt-1">
                <h2 className="text-xl font-bold text-black dark:text-white mb-1">
                  {displayName}
                </h2>
                {hasValidEmail && (
                  <p className="text-sm text-black dark:text-gray-300 mb-1">
                    {userProfile.email}
                  </p>
                )}
                {userProfile?.phone && (
                  <p
                    className={`text-sm ${hasValidEmail ? "text-gray-600 dark:text-gray-400" : "text-black dark:text-white"} mb-3`}>
                    {userProfile.phone}
                  </p>
                )}
                {!hasValidEmail && !userProfile?.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Not available
                  </p>
                )}
                {/* <Link to="/user/profile/activity" className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  View activity
                  <ChevronRight className="h-4 w-4" />
                </Link> */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Options */}
        <div className="space-y-2 mb-3 mt-3">
          <Link to="/user/wallet" className="block">
            <motion.div
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
              <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}>
                      <Wallet className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </motion.div>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      {companyName} Money
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-green-600 dark:text-green-400">
                      {"\u20B9"}{Number(walletBalance || 0).toFixed(0)}
                    </span>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link to="/user/profile/coupons" className="block">
            <motion.div
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
              <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}>
                      <Tag className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </motion.div>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      Your coupons
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link to="/user/cart" className="block">
            <motion.div
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
              <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}>
                      <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </motion.div>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      Your cart
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link to="/user/profile/refer-earn" className="block">
            <motion.div
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
            <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}>
                      <Tag className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </motion.div>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      Refer & Earn
                    </span>
                  </div>
                  {referralReward > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      Earn {"\u20B9"}{referralReward}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Invite a friend. Reward is added to your wallet when they
                    sign up.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShareReferral();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium ml-2 px-2 py-1 rounded-md"
                    style={{ color: RED }}
                    disabled={!referralLink}>
                    <Share2 className="h-3.5 w-3.5" />
                    Refer
                  </button>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ x: 4, scale: 1.01 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
            <Card
              className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer"
              onClick={openLocationSelector}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <motion.div
                    className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ duration: 0.3 }}>
                    <MapPin className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      Saved addresses
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {savedAddressSummary}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {addresses?.length || 0}
                  </span>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Link to="/user/profile/edit" className="block">
            <motion.div
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
              <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}>
                      <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </motion.div>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      Your profile
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.span
                      className={`text-xs font-medium px-2 py-1 rounded ${isComplete
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                        }`}
                      style={!isComplete ? { color: RED, backgroundColor: `${RED}10` } : {}}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}>
                      {profileCompletion}% completed
                    </motion.span>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ x: 4, scale: 1.01 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
            <Card
              className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer"
              onClick={() => setVegModeOpen(true)}>
              <CardContent className="p-4  flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ duration: 0.3 }}>
                    <Leaf className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </motion.div>
                  <span className="text-base font-medium text-gray-900 dark:text-white">
                    Veg Mode
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-base font-medium text-gray-900 dark:text-white"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}>
                    {vegMode ? "ON" : "OFF"}
                  </motion.span>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ x: 4, scale: 1.01 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
            <Card
              className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer"
              onClick={() => setAppearanceOpen(true)}>
              <CardContent className="p-4  flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ duration: 0.3 }}>
                    <Palette className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </motion.div>
                  <span className="text-base font-medium text-gray-900 dark:text-white">
                    Appearance
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-base font-medium text-gray-900 dark:text-white capitalize"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}>
                    {appearance}
                  </motion.span>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Collections Section */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-1 h-4 rounded" style={{ backgroundColor: RED }}></div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Collections
            </h3>
          </div>
          <Link to="/user/profile/favorites">
            <motion.div
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
              <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                <CardContent className="p-4  flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}>
                      <Bookmark className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </motion.div>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      Your collections
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </div>

        {/* Food Orders Section */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-1 h-4 rounded" style={{ backgroundColor: RED }}></div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Food Orders
            </h3>
          </div>
          <div className="space-y-2">
            <Link to="/user/orders" className="block">
              <motion.div
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
                <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                  <CardContent className="p-4  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.3 }}>
                        <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </motion.div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        Your orders
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link to="/food/user/dining/my-bookings" className="block">
              <motion.div
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
                <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                  <CardContent className="p-4  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.3 }}>
                        <Building2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </motion.div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        Table bookings
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* More Section */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-1 h-4 rounded" style={{ backgroundColor: RED }}></div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              More
            </h3>
          </div>
          <div className="space-y-2">
            <Link to="/user/about" className="block">
              <motion.div
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
                <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                  <CardContent className="p-4  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.3 }}>
                        <Info className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </motion.div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        About
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link to="/user/feedback" className="block">
              <motion.div
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
                <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                  <CardContent className="p-4  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.3 }}>
                        <PenSquare className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </motion.div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        Send feedback
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link to="/user/report" className="block">
              <motion.div
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
                <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                  <CardContent className="p-4  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.3 }}>
                        <AlertTriangle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </motion.div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        Report safety concern
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link to="/user/settings" className="block">
              <motion.div
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
                <Card className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer">
                  <CardContent className="p-4  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.3 }}>
                        <SettingsIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </motion.div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        Settings
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <motion.div
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}>
              <Card
                className="bg-white dark:bg-[#1a1a1a] py-0 rounded-xl shadow-sm border-0 dark:border-gray-800 cursor-pointer"
                onClick={handleLogoutClick}>
                <CardContent className="p-4  flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}>
                      <Power className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </motion.div>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      Log out
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Footer Text */}
        {/* <div className="mt-8 text-center bg-transparent">
          <p className="text-gray-400 text-xs italic">
            Made with love at {companyName}
          </p>
        </div> */}
      </div>

      {/* Veg Mode Dialog */}
      <Dialog open={vegModeOpen} onOpenChange={setVegModeOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-2xl bottom-0 sm:bottom-auto fixed sm:relative translate-y-0 sm:-translate-y-1/2 p-0 overflow-hidden border-0 dark:bg-[#1a1a1a]">
          <DialogHeader className="p-6 pb-2 text-left">
            <DialogTitle className="text-xl font-bold dark:text-white">Veg Mode</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Only see vegetarian food options across the app.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-2">
            <div className="space-y-2">
              <button
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  vegMode
                    ? "border-green-600 bg-green-50 dark:bg-green-950/20"
                    : "border-gray-200 dark:border-gray-800"
                }`}
                onClick={() => handleVegModeUpdate(true)}>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-green-600 flex items-center justify-center p-1">
                    <div className="w-full h-full bg-green-600 rounded-full" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Pure Veg</span>
                </div>
                {vegMode && <Check className="h-5 w-5 text-green-600" />}
              </button>
              <button
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  !vegMode
                    ? "border-gray-400 bg-gray-50 dark:bg-gray-800/20"
                    : "border-gray-200 dark:border-gray-800"
                }`}
                onClick={() => handleVegModeUpdate(false)}>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-red-600 flex items-center justify-center p-1">
                    <div className="w-full h-full bg-red-600 rounded-full" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Show everything</span>
                </div>
                {!vegMode && <Check className="h-5 w-5 text-gray-600" />}
              </button>
            </div>
            <Button
              className="w-full mt-6 h-12 rounded-xl text-base font-bold bg-black dark:bg-white dark:text-black hover:opacity-90"
              onClick={() => setVegModeOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appearance Dialog */}
      <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-2xl bottom-0 sm:bottom-auto fixed sm:relative translate-y-0 sm:-translate-y-1/2 p-0 overflow-hidden border-0 dark:bg-[#1a1a1a]">
          <DialogHeader className="p-6 pb-2 text-left">
            <DialogTitle className="text-xl font-bold dark:text-white">Appearance</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Customize how {companyName} looks for you.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                  appearance === "light"
                    ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800/20"
                    : "border-gray-200 dark:border-gray-800"
                }`}
                onClick={() => setAppearance("light")}>
                <div className="w-10 h-10 bg-white shadow-sm border rounded-full flex items-center justify-center">
                  <Sun className="h-6 w-6 text-orange-500" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Light Mode</span>
              </button>
              <button
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                  appearance === "dark"
                    ? "border-white dark:border-white bg-gray-900"
                    : "border-gray-200 dark:border-gray-800"
                }`}
                onClick={() => setAppearance("dark")}>
                <div className="w-10 h-10 bg-gray-800 shadow-sm border border-gray-700 rounded-full flex items-center justify-center">
                  <Moon className="h-6 w-6 text-blue-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Dark Mode</span>
              </button>
            </div>
            <Button
              className="w-full mt-6 h-12 rounded-xl text-base font-bold bg-black dark:bg-white dark:text-black hover:opacity-90"
              onClick={() => setAppearanceOpen(false)}>
              Apply changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-0 dark:bg-[#1a1a1a]">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold mb-2 dark:text-white">Log out of {companyName}?</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to log out? You'll need to sign in again to place orders.
            </DialogDescription>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl text-base font-semibold border-gray-200 dark:border-gray-800 dark:text-white dark:hover:bg-gray-800"
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={isLoggingOut}>
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl text-base font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                onClick={handleLogout}
                loading={isLoggingOut}
                disabled={isLoggingOut}>
                Log out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
