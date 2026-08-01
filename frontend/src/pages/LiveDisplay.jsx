import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Heart, Globe } from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

import useWebSocket from '../hooks/useWebSocket';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api`:'https://blood-donation-43ro.onrender.com/api'; 
const MAX_FEED_MESSAGES = 7; // Exactly 7 messages

const APPRECIATION_MESSAGES = [
  "Happy Friendship Day! Thank you, {name}, for donating hope.",
  "{name}, your blood donation celebrates true friendship.",
  "{name}, you made Friendship Day truly meaningful.",
  "Happy Friendship Day, {name}! Thanks for sharing the gift of life.",
  "{name}, one donation, countless friendships with humanity.",
  "Happy Friendship Day! {name}, you made a life-saving difference.",
  "{name}, your donation is the truest act of friendship.",
  "Thank you, {name}, for being a friend to humanity.",
  "Happy Friendship Day, {name}! One donation. Endless smiles.",
  "{name}, today your friendship reached someone you've never met.",
  "{name}, you're a lifesaver in disguise – happy Friendship Day!"

];

function fireConfetti() {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#a70000', '#ff4d4d', '#ffffff'],
  };
  confetti({ ...defaults, particleCount: 60, origin: { x: 0.75, y: 0.7 } });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 40, origin: { x: 0.85, y: 0.5 } });
  }, 150);
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, title, value, unit, iconColor = "text-[#b21818]" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 bg-[#fafafa] border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm w-full">
      <div className="flex-shrink-0">
        <Icon className={`w-12 h-12 lg:w-16 lg:h-16 ${iconColor} fill-current`} />
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="text-sm lg:text-base font-bold text-gray-700 uppercase tracking-wide">
          {title}
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-5xl lg:text-7xl font-black text-[#b21818] tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-base lg:text-xl font-bold text-gray-600 uppercase">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Card (Feed Item)
// ─────────────────────────────────────────────────────────────────────────────
function ChatCard({ msg }) {
  useEffect(() => {
    const timer = setTimeout(fireConfetti, 200);
    return () => clearTimeout(timer);
  }, []); 

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="bg-white border border-gray-200 shadow-[0_2px_10px_rgba(178,24,24,0.1)] rounded-lg p-4 lg:p-6 flex items-center gap-4 lg:gap-8"
    >
      <Heart className="w-8 h-8 lg:w-10 lg:h-10 text-[#b21818] fill-current flex-shrink-0" />
      
      <p className="flex-1 text-lg lg:text-2xl xl:text-4xl text-gray-800 font-medium leading-relaxed">
        {msg.template ? (
          msg.template.split('{name}').map((part, index, array) => (
            <span key={index}>
              {part}
              {index < array.length - 1 && (
                <span className="font-bold text-[#b21818]">{msg.name}</span>
              )}
            </span>
          ))
        ) : (
          <>Thank you, <span className="font-bold text-[#b21818]">{msg.name}</span>, for donating blood.</>
        )}
      </p>

      <span className="text-base lg:text-xl xl:text-3xl font-medium text-gray-500 whitespace-nowrap">
        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}
      </span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: LiveDisplay HUD (Redesigned)
// ═══════════════════════════════════════════════════════════════════════════════
export default function LiveDisplay() {
  const [counts, setCounts] = useState({ eligible: 0, completed: 0 });
  const [feedMessages, setFeedMessages] = useState([]);
  const feedEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedMessages]);

  const handleWsMessage = useCallback((data) => {
    if (data.counts) {
      setCounts(data.counts);
    }

    if (data.action_type === 'completed') {
      const randomTemplate = APPRECIATION_MESSAGES[Math.floor(Math.random() * APPRECIATION_MESSAGES.length)];
      
      const newMsg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: data.name,
        template: randomTemplate,
        timestamp: Date.now(),
      };

      setFeedMessages((prev) => {
        const filtered = prev.filter((msg) => msg.name !== data.name);
        return [...filtered, newMsg].slice(-MAX_FEED_MESSAGES);
      });
    }
  }, []);

  // Dynamically use wss:// on https and ws:// on http — never blocked by browser
  const WS_URL = import.meta.env.PROD
    ? `wss://blood-donation-43ro.onrender.com/ws/donors/`
    : `ws://localhost:8000/ws/donors/`;

  useWebSocket(WS_URL, { onMessage: handleWsMessage });

  // Fetch initial stats on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const statsRes = await axios.get(`${API_BASE}/donors/stats/`);
        setCounts(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <div className="w-full h-screen bg-[#FFF4F4] text-gray-900 overflow-hidden flex flex-col font-sans">
      
      {/* ── HEADER ── */}
      <header className="h-[12vh] min-h-[80px] bg-white flex items-center justify-between px-6 lg:px-12 shadow-md relative z-20">
        {/* Left: SNM Logo */}
        <div className="flex flex-col items-center justify-center w-48 text-center text-[#1b4079]">
          <img src="/snm-logo.jpg" alt="SNM Logo" className="w-14 h-14 lg:w-16 lg:h-16 object-contain rounded-full shadow-sm" />
        </div>
        
        {/* Center: Ribbon Banner */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative bg-[#a70000] text-white px-8 lg:px-16 py-2 lg:py-3 rounded-md shadow-lg flex items-center gap-4 lg:gap-6 border-b-4 border-[#6a0000]">
            <Droplets className="w-6 h-6 lg:w-8 lg:h-8 opacity-90" />
            <h1 className="text-2xl lg:text-4xl xl:text-5xl font-black tracking-wider uppercase">
              Thank You, Life Savers!
            </h1>
            <Droplets className="w-6 h-6 lg:w-8 lg:h-8 opacity-90" />
          </div>
          <span className="text-sm lg:text-xl font-bold mt-2 text-gray-800 tracking-wide">
            Your Blood Can Save Someone's Life
          </span>
        </div>

        {/* Right: Blood Drop Logo */}
        <div className="flex flex-col items-center justify-center w-48 text-center text-[#a70000]">
          <div className="mb-1">
            <Droplets className="w-10 h-10 lg:w-12 lg:h-12 fill-current" />
          </div>
          <span className="text-[9px] lg:text-[11px] font-extrabold uppercase tracking-widest leading-tight">
            Donate Blood<br/>Save Lives
          </span>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <main className="flex-1 flex flex-row p-4 lg:p-6 gap-4 lg:gap-6 overflow-hidden relative z-10">
        
        {/* LEFT COLUMN: Stats */}
        <aside className="w-full lg:w-[22%] xl:w-[20%] flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-[#a70000] text-white text-center py-3 lg:py-4 border-b-4 border-[#800000]">
            <h2 className="text-xl lg:text-2xl font-black uppercase tracking-widest text-center">
              Live Status
            </h2>
          </div>
          
          <div className="flex-1 p-6 flex flex-col gap-6 items-center justify-start bg-[#FFF0F0]/30 pt-12">
            <h3 className="text-3xl xl:text-4xl font-bold text-amber-600 uppercase tracking-widest text-center mb-8 drop-shadow-sm" style={{ fontFamily: 'Georgia, serif', lineHeight: '1.4' }}>
              Dhan<br/>Nirankar<br/>Ji
            </h3>
            
            <MetricCard 
              icon={Droplets} 
              title="Total Donations" 
              value={counts.completed} 
              unit="Units" 
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: Feed */}
        <section className="flex-1 flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden p-4 lg:p-8">
          
          {/* Feed Header */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-[2px] w-12 lg:w-24 bg-[#a70000] opacity-50 relative">
               <Heart className="w-3 h-3 text-[#a70000] fill-current absolute -right-2 -top-[5px]" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-[#a70000] uppercase tracking-wider mx-2 text-center">
              We Appreciate You
            </h2>
            <div className="h-[2px] w-12 lg:w-24 bg-[#a70000] opacity-50 relative">
               <Heart className="w-3 h-3 text-[#a70000] fill-current absolute -left-2 -top-[5px]" />
            </div>
          </div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {feedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Heart className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-xl font-bold uppercase tracking-wide">Waiting for Donors</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:gap-6 justify-end min-h-full">
                <AnimatePresence initial={false}>
                  {feedMessages.map((msg) => (
                    <ChatCard key={msg.id} msg={msg} />
                  ))}
                </AnimatePresence>
                <div ref={feedEndRef} className="h-1" />
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="h-[8vh] min-h-[60px] bg-[#a70000] border-t-4 border-[#6a0000] flex items-center justify-between px-6 lg:px-12 text-white shadow-[0_-4px_10px_rgba(0,0,0,0.15)] relative z-20">
        <div className="flex-1 flex justify-start items-center">
          <span className="text-lg lg:text-2xl xl:text-3xl font-black uppercase tracking-widest">
            "A Drop of Blood Can Give a Life."
          </span>
        </div>
        
        <div className="flex-shrink-0 mx-4 hidden lg:block">
          <img src="/sncf-logo.jpg" alt="SNCF Logo" className="w-12 h-12 lg:w-14 lg:h-14 object-contain bg-white rounded-full p-0.5 shadow-sm" />
        </div>
        
        <div className="flex-1 flex items-center justify-end gap-3">
          <span className="text-xl lg:text-3xl xl:text-4xl italic tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Thank You for Saving Lifes!
          </span>
          <Heart className="w-5 h-5 lg:w-8 lg:h-8 fill-current text-white/90" />
          <Heart className="w-3 h-3 lg:w-5 lg:h-5 fill-current text-white/90 -ml-1 mt-3" />
        </div>
      </footer>

    </div>
  );
}
