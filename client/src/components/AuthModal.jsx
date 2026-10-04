import React, { useState } from 'react';
import { User, Phone, Mail, Lock, ShieldCheck, Coins, Users, Plus, CheckCircle, X, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, user, onAuthSuccess, onLogout }) {
  const [tab, setTab] = useState('otp'); // 'otp' | 'login' | 'register'
  const [phone, setPhone] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [email, setEmail] = useState('rajesh.sharma@railmate.in');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');

  // Add passenger form
  const [newPassName, setNewPassName] = useState('');
  const [newPassAge, setNewPassAge] = useState('');
  const [newPassGender, setNewPassGender] = useState('Male');
  const [newPassBerth, setNewPassBerth] = useState('Lower');

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.sendOtp(phone);
      if (data.success) {
        setOtpSent(true);
        setDevOtp(data.devOtp || '123456');
        setOtp(data.devOtp || '123456'); // auto-fill for testing ease
        setSuccessMsg(`OTP sent to +91 ${phone}!`);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.verifyOtp(phone, otp);
      if (data.success && data.user) {
        onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      if (data.success && data.user) {
        onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.register(name, email, phone, password);
      if (data.success && data.user) {
        onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {user ? (
          /* Profile & Saved Passengers View */
          <div>
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-orange-500/20">
                {user.name ? user.name[0] : 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {user.name}
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-400">{user.phone} • {user.email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{user.railCoins || 450} RailCoins Available</span>
                </div>
              </div>
            </div>

            <div className="my-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-400" /> Saved Co-Passengers for 1-Click Booking
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(user.passengers || [
                  { id: 'p1', name: 'Rajesh Kumar Sharma', age: 34, gender: 'Male', berth_preference: 'Lower' },
                  { id: 'p2', name: 'Pooja Sharma', age: 31, gender: 'Female', berth_preference: 'Lower' }
                ]).map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{p.name}</span>
                      <span className="text-slate-400 ml-2">({p.age} yrs, {p.gender})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-orange-300 text-[11px]">
                      {p.berth_preference || 'Lower'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={onLogout}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
              >
                Sign Out of RailMate
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Login / Registration Tabs */
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Sign in to <span className="gradient-text-orange">RailMate</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Access booked tickets, direct UPI payments, and personalized live alerts
              </p>
            </div>

            {/* Mode switch */}
            <div className="flex p-1 mb-5 bg-slate-800/80 rounded-xl border border-slate-700/50">
              <button
                onClick={() => { setTab('otp'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${tab === 'otp' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Mobile OTP (Instant)
              </button>
              <button
                onClick={() => { setTab('login'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${tab === 'login' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Email Login
              </button>
              <button
                onClick={() => { setTab('register'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${tab === 'register' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                New Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {successMsg}
              </div>
            )}

            {tab === 'otp' && (
              <div>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Indian Mobile Number</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-mono">+91</span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">We will generate an instant 6-digit test code</p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? 'Sending OTP...' : 'Send Login OTP'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {devOtp && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                        <span>Simulated OTP Code: <strong>{devOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtp(devOtp)}
                          className="text-[11px] px-2 py-0.5 bg-amber-500/20 rounded hover:bg-amber-500/30"
                        >
                          Fill Code
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Enter 6-Digit OTP</label>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-center text-lg tracking-widest focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enter RailMate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-center text-xs text-slate-400 hover:text-white"
                    >
                      Change phone number
                    </button>
                  </form>
                )}
              </div>
            )}

            {tab === 'login' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email / Phone</label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Demo login: rajesh.sharma@railmate.in / password123</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            )}

            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Nair"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Create Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all"
                >
                  {loading ? 'Creating...' : 'Register & Claim +250 RailCoins'}
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
