import React, { useState, useEffect } from 'react';
import { Utensils, Star, Clock, ShoppingBag, CheckCircle, ChevronRight, MapPin, Tag, Plus, Minus, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';

export default function FoodOrderingSystem({ user }) {
  const [stationCode, setStationCode] = useState('KOTA');
  const [restaurants, setRestaurants] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG' | 'JAIN'
  const [cart, setCart] = useState({});
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [coachBerth, setCoachBerth] = useState('B4 - Berth 21');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const stations = [
    { code: 'KOTA', name: 'Kota Junction', eta: 'In 24 mins (PF 1A)' },
    { code: 'RTM', name: 'Ratlam Junction', eta: 'In 3h 15m (PF 4)' },
    { code: 'BRC', name: 'Vadodara Junction', eta: 'In 6h 40m (PF 3)' },
    { code: 'MAS', name: 'Chennai Central', eta: 'In 45 mins (PF 2)' }
  ];

  const fetchRestaurants = async (code = stationCode) => {
    setLoading(true);
    try {
      const data = await api.getStationRestaurants(code);
      if (data.restaurants) {
        setRestaurants(data.restaurants);
        setSelectedRestaurant(data.restaurants[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(stationCode);
  }, [stationCode]);

  const handleAddToCart = (item) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        ...item,
        qty: (prev[item.id]?.qty || 0) + 1
      }
    }));
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[itemId]?.qty > 1) {
        updated[itemId].qty -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal > 0 ? 25 : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'RAILMATE50') {
      setCouponDiscount(50);
    } else {
      alert('Invalid coupon. Try RAILMATE50 for ₹50 off!');
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    try {
      const orderPayload = {
        pnr: '2849102941',
        trainNumber: '12952',
        stationCode,
        stationName: stations.find(s => s.code === stationCode)?.name || 'Kota Junction',
        restaurantName: selectedRestaurant?.name || "Haldiram's",
        items: cartItems,
        totalAmount: grandTotal,
        coachBerth,
        customerPhone: user?.phone || '+91 98765 43210'
      };

      const result = await api.placeFoodOrder(orderPayload);
      if (result.success && result.order) {
        setActiveOrder(result.order);
        setCart({});
      }
    } catch (e) {
      alert('Failed to place order.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-2">
              <Utensils className="w-3.5 h-3.5" /> Zomato & IRCTC e-Catering In-Seat Delivery
            </div>
            <h2 className="text-2xl font-bold text-white">Order Hot Food Delivered to Your Train Seat</h2>
            <p className="text-xs text-slate-400">Synchronized with live train arrival ETA at upcoming platform stops</p>
          </div>

          {/* Upcoming Station Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <select
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
              className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
            >
              {stations.map(s => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.eta})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'VEG', label: 'Pure Veg Only' },
            { id: 'NON_VEG', label: 'Non-Vegetarian' },
            { id: 'JAIN', label: 'Jain Special (No Onion/Garlic)' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Restaurants & Menu (Left) + Cart & Active Order (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Restaurant selection & Menu Items */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Restaurant Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restaurants.map((rest) => (
              <div
                key={rest.id}
                onClick={() => setSelectedRestaurant(rest)}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  selectedRestaurant?.id === rest.id
                    ? 'bg-orange-500/10 border-orange-500/50 shadow-xl shadow-orange-500/10'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex gap-4">
                  <img
                    src={rest.image}
                    alt={rest.name}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-semibold">
                      {rest.badge}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{rest.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{rest.cuisine}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <Star className="w-3.5 h-3.5 fill-emerald-400" /> {rest.rating}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rest.deliveryTimeMins} mins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Menu Items for Selected Restaurant */}
          {selectedRestaurant && (
            <div className="glass-card rounded-3xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                Menu from <span className="text-orange-400">{selectedRestaurant.name}</span>
              </h3>

              <div className="space-y-4">
                {selectedRestaurant.menu
                  ?.filter((item) => {
                    if (activeCategory === 'VEG') return item.veg;
                    if (activeCategory === 'NON_VEG') return !item.veg;
                    if (activeCategory === 'JAIN') return item.desc.toLowerCase().includes('jain');
                    return true;
                  })
                  .map((item) => {
                    const inCartQty = cart[item.id]?.qty || 0;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-3.5 h-3.5 rounded-sm border-2 mt-1 flex items-center justify-center ${
                            item.veg ? 'border-emerald-500' : 'border-rose-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white">{item.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.desc}</p>
                            <div className="text-sm font-bold font-mono text-orange-400 mt-1">₹{item.price}</div>
                          </div>
                        </div>

                        {/* Add / Qty controls */}
                        <div>
                          {inCartQty === 0 ? (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-md shadow-orange-600/20"
                            >
                              + ADD
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-2 py-1 border border-slate-700">
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-slate-400 hover:text-white p-0.5"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-bold text-white px-1">{inCartQty}</span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="text-orange-400 hover:text-orange-300 p-0.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>

        {/* Right: Cart Drawer & Active Order Status */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Cart Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-400" /> Train Seat Cart ({cartItems.length})
            </h3>

            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Your cart is empty. Pick dishes from the station menu to order to your berth.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{item.name}</div>
                        <div className="text-slate-500 text-[11px] font-mono">₹{item.price} × {item.qty}</div>
                      </div>
                      <div className="font-mono font-bold text-white">₹{item.price * item.qty}</div>
                    </div>
                  ))}
                </div>

                {/* Delivery Seat Input */}
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Delivering to Coach & Berth</label>
                  <input
                    type="text"
                    value={coachBerth}
                    onChange={(e) => setCoachBerth(e.target.value)}
                    placeholder="Coach B4 - Berth 21"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Coupon Code */}
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon RAILMATE50"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs uppercase focus:outline-none focus:border-orange-500 font-mono"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponDiscount > 0 && (
                    <p className="text-[11px] text-emerald-400 mt-1">₹50 discount applied!</p>
                  )}
                </div>

                {/* Bill Breakdown */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Items Total</span>
                    <span className="font-mono">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Delivery Charge</span>
                    <span className="font-mono">₹{deliveryFee}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Discount</span>
                      <span className="font-mono">-₹{couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                    <span>Grand Total</span>
                    <span className="font-mono text-orange-400">₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Place Order at {stationCode} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Active Order Live Tracker */}
          {activeOrder && (
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-emerald-950/20 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Live Order Tracking
                </span>
                <span className="text-xs font-mono text-slate-400">{activeOrder.orderId}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-sm font-bold text-white">{activeOrder.restaurantName}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Delivering to: <strong className="text-slate-200">{activeOrder.coachBerth}</strong> at {activeOrder.stationName}
                </div>
                <div className="mt-2 text-xs text-emerald-400 font-mono">
                  Delivery Code: <strong>{activeOrder.deliveryCode}</strong> (Share with platform runner)
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Kitchen Cooking Fresh Meal</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Agent Standing at Platform 1A with Thermal Box</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  <span>Handover at Coach Door on Arrival</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
