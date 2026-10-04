import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, Clock, ShieldCheck, ArrowRight, X, ExternalLink, Sparkles, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function UpiPaymentModal({ isOpen, onClose, bookingDetails, onPaymentSuccess }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmedTicket(null);
      setTimeLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !bookingDetails) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const upiUri = bookingDetails.payment?.upiUri || 'upi://pay?pa=railmate.irctc@icici&pn=RailMate&am=1750&cu=INR';
  const totalAmount = bookingDetails.fareSummary?.totalAmount || 1855.20;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('railmate.irctc@icici');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async (appMethod = 'GPay / PhonePe UPI') => {
    setIsVerifying(true);
    try {
      const response = await api.verifyUpiPayment(
        bookingDetails.bookingId,
        'UPI-REF-' + Math.floor(100000000000 + Math.random() * 900000000000),
        appMethod
      );

      if (response.success && response.ticket) {
        setConfirmedTicket(response.ticket);
        onPaymentSuccess?.(response.ticket);

        // Confetti celebration
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    } catch (err) {
      alert('Verification failed. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!confirmedTicket ? (
          /* Payment Processing View */
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Direct UPI Payment
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">
                    0% Convenience Markup
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Scan QR or trigger your preferred UPI App</p>
              </div>
            </div>

            {/* Total Fare & Countdown */}
            <div className="my-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Amount to Pay</div>
                <div className="text-2xl font-black font-mono text-white">
                  ₹{totalAmount.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Booking PNR: {bookingDetails.pnr}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Session Expiry
                </div>
                <div className="text-lg font-mono font-bold text-amber-400">{timeFormatted}</div>
              </div>
            </div>

            {/* Authentic QR Code Centerpiece */}
            <div className="my-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div
                className="p-3 bg-white rounded-2xl shadow-xl shadow-orange-500/10"
                dangerouslySetInnerHTML={{
                  __html: bookingDetails.payment?.qrSvg || '<div class="w-48 h-48 bg-slate-200"></div>'
                }}
              />

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                <span>VPA: <strong className="font-mono text-orange-400">railmate.irctc@icici</strong></span>
                <button
                  onClick={handleCopyUpi}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick UPI Apps Row */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] text-slate-400 text-center font-medium">Or pay instantly via UPI apps:</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Google Pay', color: 'from-blue-600 to-emerald-600' },
                  { name: 'PhonePe', color: 'from-purple-600 to-indigo-600' },
                  { name: 'Paytm UPI', color: 'from-sky-600 to-blue-700' }
                ].map((app) => (
                  <button
                    key={app.name}
                    onClick={() => handleSimulatePayment(app.name)}
                    disabled={isVerifying}
                    className={`py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all text-center flex items-center justify-center gap-1.5`}
                  >
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Simulation Action */}
            <button
              onClick={() => handleSimulatePayment('UPI_INSTANT_TEST')}
              disabled={isVerifying}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <span>Verifying UPI Transaction with Bank...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Simulate Instant UPI Confirmation
                </>
              )}
            </button>
          </div>
        ) : (
          /* Ticket Confirmation Success View */
          <div className="text-center py-2 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase tracking-wider">
              Payment Verified • Confirmed
            </span>

            <h3 className="text-2xl font-black text-white mt-2">Ticket Reserved Successfully!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your confirmed digital pass is now available and saved in offline SQLite storage.
            </p>

            {/* Ticket Card Details */}
            <div className="mt-5 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Train Number & Name</div>
                  <div className="font-bold text-white text-sm">{confirmedTicket.trainNumber} - {confirmedTicket.trainName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">PNR NUMBER</div>
                  <div className="font-mono font-bold text-orange-400 text-sm">{confirmedTicket.pnr}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Class</div>
                  <div className="font-bold text-white">{confirmedTicket.journeyClass}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Coach</div>
                  <div className="font-bold text-emerald-400 font-mono">{confirmedTicket.passengers?.[0]?.coach || 'B4'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Berth</div>
                  <div className="font-bold text-emerald-400 font-mono">
                    {confirmedTicket.passengers?.[0]?.berthNumber} ({confirmedTicket.passengers?.[0]?.berthType})
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>UPI Txn: {confirmedTicket.upiTxnId}</span>
                <span className="text-emerald-400 font-bold">Paid: ₹{confirmedTicket.totalPaid}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-colors shadow-lg shadow-orange-600/30"
            >
              Close & View in Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
