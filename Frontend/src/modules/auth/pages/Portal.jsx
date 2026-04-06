import React from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { UtensilsCrossed, ShoppingBasket, Car, Bed, ArrowRight, ShieldCheck, Star } from "lucide-react"

const SERVICES = [
  {
    id: "food",
    name: "Foods",
    description: "Delicious local favorites",
    image: "/super-app/food.png",
    path: "/food/user",
    icon: UtensilsCrossed,
    color: "from-[#FF4D4D] to-[#CB202D]",
    badge: "Fast",
    badgeIcon: "⚡"
  },
  {
    id: "grocery",
    name: "Quick Commerce",
    description: "20-Min Essentials",
    image: "/super-app/grocery.png",
    path: "/food/user",
    icon: ShoppingBasket,
    color: "from-[#4CAF50] to-[#2DAB52]",
    badge: "Instant",
    badgeIcon: "⏱️"
  },
  {
    id: "taxi",
    name: "Taxi",
    description: "Safe city rides",
    image: "/super-app/taxi.png",
    path: "/food/user",
    icon: Car,
    color: "from-[#333333] to-[#000000]",
    badge: "Safe",
    badgeIcon: "🛡️"
  },
  {
    id: "hotel",
    name: "Hotel",
    description: "Luxury book stays",
    image: "/super-app/hotel.png",
    path: "/food/user",
    icon: Bed,
    color: "from-[#64B5F6] to-[#4A90E2]",
    badge: "Premium",
    badgeIcon: "💎"
  }
]

export default function SuperAppPortal() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col pt-16 pb-24 px-6 overflow-hidden relative">
      {/* Lining Effect & Pattern Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0" style={{ 
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: `40px 40px`
          }} />
          <div className="absolute inset-0 animate-scanline" style={{ 
            backgroundImage: `linear-gradient(transparent 0%, #000 50%, transparent 100%)`,
            backgroundSize: `100% 200px`,
            opacity: 0.5
          }} />
      </div>

      {/* Dynamic Background Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
             <motion.div
               key={i}
               animate={{
                 y: [0, -100, 0],
                 x: [0, 50, 0],
                 scale: [1, 1.2, 1],
                 opacity: [0.1, 0.2, 0.1]
               }}
               transition={{
                 duration: 10 + i * 2,
                 repeat: Infinity,
                 ease: "linear"
               }}
               className="absolute w-64 h-64 bg-[#CB202D]/5 rounded-full blur-3xl"
               style={{
                 left: `${Math.random() * 100}%`,
                 top: `${Math.random() * 100}%`,
               }}
             />
          ))}
      </div>

      {/* Top Header Section */}
      <div className="flex flex-col items-center text-center space-y-6 mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-full px-5 py-2.5 flex items-center gap-2 shadow-xl shadow-gray-200/50"
        >
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-6 h-6 bg-gradient-to-br from-[#CB202D] to-red-700 rounded-lg flex items-center justify-center shadow-lg"
          >
             <span className="text-white text-[10px] font-black italic">A</span>
          </motion.div>
          <span className="text-[10px] font-black tracking-[0.2em] text-[#BABCBD] uppercase">Everything you need, delivered</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="text-5xl md:text-7xl font-black text-[#1A202C] tracking-tight leading-none"
        >
          Welcome to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CB202D] via-rose-500 to-[#CB202D] bg-[length:200%_auto] animate-gradient block mt-2">AppZeto</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[#718096] text-sm md:text-lg font-bold max-w-[320px] mx-auto leading-relaxed"
        >
          Choose a service to continue
        </motion.p>
      </div>

      {/* Main Service Grid - Crazy Animations */}
      <div className="max-w-[800px] mx-auto w-full grid grid-cols-2 lg:grid-cols-2 gap-6 relative z-10">
        {SERVICES.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 50, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            transition={{ 
              delay: 0.4 + idx * 0.15, 
              type: "spring", 
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ 
               y: -10, 
               scale: 1.05,
               rotateY: idx % 2 === 0 ? 5 : -5,
               transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(service.path)}
            className="group cursor-pointer relative perspective"
          >
            <div className={`relative h-[220px] md:h-[260px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-white/20 transition-all duration-500`}>
              {/* Image Base */}
              <div className="absolute inset-0 bg-gray-50 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
                />
                <div className={`absolute inset-0 bg-gradient-to-tr ${service.color.replace('from-', 'from-black/40 to-')} opacity-30 group-hover:opacity-40 transition-opacity duration-500`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
              </div>

              {/* CRAZY Linear Shine Effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-30 group-hover:animate-line-shine" />
              </div>

              {/* Service Icon floating */}
              <div className="absolute top-6 left-6 z-30">
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
                  className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl"
                >
                  <service.icon className="w-6 h-6 text-white" />
                </motion.div>
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-6 left-6 right-6 z-30 space-y-1">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none group-hover:tracking-wider transition-all duration-500">
                  {service.name}
                </h2>
                <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  {service.description}
                </p>
              </div>

              {/* Corner Badge */}
              <div className="absolute top-0 right-0 z-30">
                 <motion.div 
                   initial={{ x: 20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: 0.8 + idx * 0.1 }}
                   className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-bl-3xl border-l border-b border-white/20 shadow-2xl flex items-center gap-2"
                 >
                    <span className="text-[10px] scale-125 mb-0.5">{service.badgeIcon}</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{service.badge}</span>
                 </motion.div>
              </div>
            </div>

            {/* Neon Glow on Hover */}
            <div className={`absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-30 blur-2xl transition-all duration-500 scale-90 group-hover:scale-110`} />
          </motion.div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective {
          perspective: 1000px;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
        @keyframes line-shine {
          0% { left: -100%; transition: none; }
          100% { left: 200%; transition: all 0.8s ease-in-out; }
        }
        .animate-line-shine {
          animation: line-shine 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}} />

      {/* Trust Badge at bottom */}
      <div className="mt-16 flex flex-col items-center gap-3 opacity-50">
         <div className="flex items-center gap-1.5 grayscale">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure by AppZeto</span>
         </div>
      </div>
    </div>
  )
}
