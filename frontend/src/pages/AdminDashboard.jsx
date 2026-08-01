import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  Syringe,
  Plus,
  CheckCircle2,
  Loader2,
  Users,
  Droplets,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import useWebSocket from '../hooks/useWebSocket';

const API_BASE = 'https://blood-donation-43ro.onrender.com/api/';

/**
 * Admin Dashboard – Two-tab interface for volunteers.
 *
 * Tab 1: Screening Desk  → Register donors as ELIGIBLE
 * Tab 2: Donation Bed     → Mark donors as COMPLETED
 *
 * All text is in English for volunteer speed.
 * Highly mobile-friendly for tablet/phone use.
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('screening');
  const [donorName, setDonorName] = useState('');
  const [eligibleDonors, setEligibleDonors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ eligible: 0, completed: 0 });

  // ── WebSocket for real-time updates ──────────────────────────────────
  const handleWsMessage = useCallback((data) => {
    // Update stats from WebSocket payload
    if (data.counts) {
      setStats(data.counts);
    }

    if (data.action_type === 'eligible') {
      // A new donor was registered — refresh eligible list
      fetchEligibleDonors();
    } else if (data.action_type === 'completed') {
      // A donor was completed — remove from eligible list
      setEligibleDonors((prev) => prev.filter((d) => d.name !== data.name));
    }
  }, []);

  const WS_URL = import.meta.env.PROD
    ? `wss://blood-donation-43ro.onrender.com/ws/donors/`
    : `ws://localhost:8000/ws/donors/`;

  const { isConnected } = useWebSocket(WS_URL, { onMessage: handleWsMessage });

  // ── Fetch eligible donors ────────────────────────────────────────────
  const fetchEligibleDonors = async () => {
    try {
      const res = await axios.get(`${API_BASE}donors/?status=ELIGIBLE`);
      setEligibleDonors(res.data);
    } catch (err) {
      console.error('Failed to fetch eligible donors:', err);
    }
  };

  // ── Fetch stats ──────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await axios.get(`https://blood-donation-43ro.onrender.com/api/donors/stats/`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchEligibleDonors();
    fetchStats();
  }, []);

  // ── Show toast notification ──────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Create Donor (Screening Desk) ────────────────────────────────────
  const handleCreateDonor = async (e) => {
    e.preventDefault();
    if (!donorName.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.post(`https://blood-donation-43ro.onrender.com/api/donors/`, {
        name: donorName.trim(),
        language: 'EN',
      });
      showToast(`✅ ${donorName.trim()} registered as eligible!`);
      setDonorName('');
    } catch (err) {
      console.error('Failed to create donor:', err);
      showToast('❌ Failed to register donor. Try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Mark Completed (Donation Bed Desk) ───────────────────────────────
  const handleMarkCompleted = async (donor) => {
    setCompletingId(donor.id);
    try {
      await axios.patch(`https://blood-donation-43ro.onrender.com/api/donors/${donor.id}/complete/`);
      showToast(`🎉 ${donor.name} marked as completed!`);
    } catch (err) {
      console.error('Failed to mark completed:', err);
      showToast('❌ Failed to update. Try again.', 'error');
    } finally {
      setCompletingId(null);
    }
  };

  const tabs = [
    { id: 'screening', label: 'Screening Desk', icon: ClipboardCheck },
    { id: 'donation', label: 'Donation Bed', icon: Syringe },
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
                  SNCF Blood Drive
                </h1>
                <p className="text-xs text-slate-400">Admin Dashboard</p>
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Quick Stats */}
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Users className="w-4 h-4" />
                  <span>{stats.eligible} in queue</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Droplets className="w-4 h-4" />
                  <span>{stats.completed} donated</span>
                </div>
              </div>

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="flex sm:hidden items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Users className="w-4 h-4" />
              <span>{stats.eligible} in queue</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Droplets className="w-4 h-4" />
              <span>{stats.completed} donated</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5">
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.id === 'screening' ? 'Screen' : 'Donate'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <AnimatePresence mode="wait">
          {activeTab === 'screening' ? (
            <motion.div
              key="screening"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Screening Desk Form ─────────────────────────────────── */}
              <div className="glass rounded-2xl p-5 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-['Outfit']">
                      Register New Donor
                    </h2>
                    <p className="text-sm text-slate-400">
                      After screening, register the donor as eligible.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateDonor} className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="donor-name" className="block text-sm font-medium text-slate-300 mb-2">
                      Donor Name
                    </label>
                    <input
                      id="donor-name"
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Enter donor's full name"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-lg"
                      autoFocus
                      required
                    />
                  </div>


                  {/* Submit Button */}
                  <button
                    id="btn-mark-eligible"
                    type="submit"
                    disabled={isSubmitting || !donorName.trim()}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {isSubmitting ? 'Registering...' : 'Mark Eligible'}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="donation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Donation Bed Desk ───────────────────────────────────── */}
              <div className="glass rounded-2xl p-5 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Syringe className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-['Outfit']">
                        Donation Bed
                      </h2>
                      <p className="text-sm text-slate-400">
                        Mark donors as completed after donation.
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-refresh-eligible"
                    onClick={fetchEligibleDonors}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Eligible Donors List */}
                {eligibleDonors.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No eligible donors in queue</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Donors registered at the Screening Desk will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {eligibleDonors.map((donor) => (
                        <motion.div
                          key={donor.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between p-3.5 sm:p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {donor.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold truncate">{donor.name}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(donor.created_at).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <button
                            id={`btn-complete-${donor.id}`}
                            onClick={() => handleMarkCompleted(donor)}
                            disabled={completingId === donor.id}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer flex-shrink-0 active:scale-95 ml-2"
                          >
                            {completingId === donor.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">{completingId === donor.id ? 'Updating...' : 'Mark Completed'}</span>
                            <span className="sm:hidden">{completingId === donor.id ? '...' : 'Done'}</span>
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Toast Notification ──────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium z-50 ${toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600 text-white'
              }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
