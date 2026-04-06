import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, FastForward, Clock, Phone, ChefHat, ChevronDown } from 'lucide-react';
import { ActionSlider } from '@/modules/DeliveryV2/components/ui/ActionSlider';
import { useDeliveryStore } from '@/modules/DeliveryV2/store/useDeliveryStore';
import { getHaversineDistance, calculateETA } from '@/modules/DeliveryV2/utils/geo';

/**
 * NewOrderModal - Ported to Original 1:1 Theme with Slider Accept.
 * Matches the Zomato/Swiggy style Green Header + White Card.
 */
export const NewOrderModal = ({ order, onAccept, onReject, onMinimize }) => {
  const { riderLocation } = useDeliveryStore();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  const { distanceKm, etaMins } = useMemo(() => {
    if (!order) return { distanceKm: null, etaMins: null };

    // A. Use provided data if available (Direct distance from socket)
    const rawDist = order.pickupDistanceKm || order.distanceKm;
    const rawEta = order.estimatedTime || order.duration || order.eta;
    
    if (rawDist != null) {
      return { 
        distanceKm: Number(rawDist).toFixed(1), 
        etaMins: rawEta && rawEta > 0 ? Math.ceil(rawEta) : Math.ceil((rawDist * 1000) / 416) + 5
      };
    }

    // B. Calculate from locations (Local calculation fallback)
    const rest = order.restaurantLocation || order.restaurantId?.location || {};
    const resLat = parseFloat(order.restaurant_lat || order.restaurantLat || rest.latitude || rest.lat);
    const resLng = parseFloat(order.restaurant_lng || order.restaurantLng || rest.longitude || rest.lng);

    if (riderLocation && !isNaN(resLat) && !isNaN(resLng)) {
      const distM = getHaversineDistance(
        riderLocation.lat, riderLocation.lng,
        resLat, resLng
      );
      const km = distM / 1000;
      // Assume 25km/h avg for initial estimate (roughly 416m/min)
      const mins = Math.ceil(distM / 416) + (order.prepTime || 5);
      
      return { 
        distanceKm: km.toFixed(1), 
        etaMins: mins 
      };
    }

    return { distanceKm: '??', etaMins: order.prepTime || 15 };
  }, [order, riderLocation]);

  if (!order) return null;

  const earnings = order.earnings || order.riderEarning || (order.orderAmount ? order.orderAmount * 0.1 : 0);
  const restaurantName = order.restaurantName || order.restaurant_name || (order.restaurantId?.name) || 'Restaurant';
  const restaurantAddress = order.restaurantAddress || order.restaurant_address || (order.restaurantId?.location?.address) || 'Address not available';
  const deliveryAddress = order?.deliveryAddress || {};

  const geoCoords =
    Array.isArray(deliveryAddress?.location?.coordinates) &&
    deliveryAddress.location.coordinates.length >= 2
      ? {
          lng: deliveryAddress.location.coordinates[0],
          lat: deliveryAddress.location.coordinates[1],
        }
      : null;

  const customerLocation = order.customerLocation || order.deliveryLocation || geoCoords || null;

  const addressPartsFromSchema = [
    deliveryAddress.street,
    deliveryAddress.additionalDetails,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.zipCode,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  const customerAddress =
    order.customerAddress ||
    order.customer_address ||
    (addressPartsFromSchema.length ? addressPartsFromSchema.join(', ') : '') ||
    (customerLocation?.lat != null && customerLocation?.lng != null
      ? `Lat ${Number(customerLocation.lat).toFixed(5)}, Lng ${Number(customerLocation.lng).toFixed(5)}`
      : 'Location not available');

  const mapsLink =
    customerLocation?.lat != null && customerLocation?.lng != null
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          `${customerLocation.lat},${customerLocation.lng}`,
        )}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-x-0 bottom-0 h-full z-150 bg-black/60 flex items-end justify-center p-0"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full max-w-lg bg-white rounded-t-[3rem] overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.5)] flex flex-col pt-2"
      >
        {/* Handle / Minimize */}
        <div className="w-full flex justify-center pb-2 pt-1 bg-white relative z-10 rounded-t-[3rem] -mb-[4px]">
          <button onClick={onMinimize} className="p-1 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex flex-col items-center">
             <ChevronDown className="w-6 h-6 text-gray-400 stroke-3" />
          </button>
        </div>

        {/* Header Ribbon (Old Green Style) */}
        <div className="bg-green-500 p-8 flex justify-between items-center text-white border-b border-green-600/20">
          <div>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1">Incoming Request</p>
            <h2 className="text-4xl font-bold tracking-tighter">₹{Number(earnings || 0).toFixed(2)}</h2>
          </div>
          <div className="bg-white/20 border border-white/30 rounded-3xl px-6 py-3 text-white font-bold text-2xl shadow-inner tabular-nums">
            {timeLeft}s
          </div>
        </div>

        {/* Info Body */}
        <div className="p-8 pb-12 space-y-10">
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-1.5 mt-2 py-1">
              <div className="w-5 h-5 rounded-full bg-green-500 border-4 border-green-50 shadow-lg shadow-green-500/20" />
              <div className="w-0.5 h-16 bg-dashed border-l-2 border-gray-100" />
              <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-blue-50 shadow-lg shadow-blue-500/20" />
            </div>
            <div className="flex-1 space-y-10">
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-[10px] uppercase tracking-widest text-green-600">
                  <ChefHat className="w-4 h-4" />
                  <span>Restaurant Pickup</span>
                </div>
                <p className="text-gray-950 font-bold text-xl leading-tight">{restaurantName}</p>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">{restaurantAddress}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-[10px] uppercase tracking-widest text-blue-600">
                  <MapPin className="w-4 h-4" />
                  <span>Customer Drop</span>
                </div>
                <p className="text-gray-950 font-bold text-xl leading-tight">Customer Location</p>
                <p className="text-gray-500 text-sm font-medium line-clamp-2">{customerAddress}</p>
                {mapsLink && (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700"
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
               <Clock className="w-5 h-5 text-orange-500" />
               <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Time</span>
                  <span className="text-sm font-bold text-gray-900">{etaMins} MINS</span>
               </div>
             </div>
             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
               <MapPin className="w-5 h-5 text-gray-400" />
               <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Distance</span>
                  <span className="text-sm font-bold text-gray-900">{distanceKm} KM</span>
               </div>
             </div>
          </div>

          {/* Action Area */}
          <div className="space-y-6">
            <ActionSlider 
              label="Slide to Accept" 
              onConfirm={() => onAccept(order)} 
              color="bg-green-600"
              successLabel="Order Accepted ✓"
            />

            <button 
              onClick={onReject}
              className="w-full text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors py-2 active:scale-95"
            >
              Pass this task
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
