import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Initialize SQLite database for food ordering
const db = new DatabaseSync(path.join(__dirname, 'food.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS food_orders (
    id TEXT PRIMARY KEY,
    pnr TEXT NOT NULL,
    train_number TEXT NOT NULL,
    station_code TEXT NOT NULL,
    station_name TEXT NOT NULL,
    restaurant_name TEXT NOT NULL,
    items_json TEXT NOT NULL,
    total_amount REAL NOT NULL,
    delivery_status TEXT NOT NULL,
    coach_berth TEXT NOT NULL,
    customer_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Station restaurant partners & menus (Zomato / IRCTC e-Catering verified)
const RESTAURANT_CATALOG = [
  {
    id: 'rest_haldiram_kota',
    stationCode: 'KOTA',
    stationName: 'Kota Junction',
    name: "Haldiram's Sweets & Thali",
    rating: 4.6,
    deliveryTimeMins: 25,
    minOrder: 150,
    cuisine: 'North Indian, Pure Veg, Sweets',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    badge: 'IRCTC Approved',
    menu: [
      { id: 'm1', name: 'Executive Maharaja Veg Thali', price: 280, veg: true, desc: 'Paneer Butter Masala, Dal Makhani, Jeera Rice, 3 Butter Rotis, Gulab Jamun, Raita & Pickle' },
      { id: 'm2', name: 'Chole Bhature Platter (2 Pcs)', price: 160, veg: true, desc: 'Puffed bhature with Amritsari spicy chole, onion salad & pickle' },
      { id: 'm3', name: 'Dal Khichdi & Dahi Combo', price: 180, veg: true, desc: 'Homestyle comforting moong dal khichdi served with spiced curd & papad' },
      { id: 'm4', name: 'Jain Special Dal Tadka & Jeera Rice', price: 210, veg: true, desc: 'Prepared strictly without onion or garlic as per Jain culinary standards' },
      { id: 'm5', name: 'Gulab Jamun (2 pcs in hot syrup)', price: 70, veg: true, desc: 'Soft khoya dumplings soaked in fragrant cardamom sugar syrup' },
      { id: 'm6', name: 'Masala Chaas / Lassi Bottle (300ml)', price: 50, veg: true, desc: 'Chilled spiced buttermilk with roasted cumin and mint' }
    ]
  },
  {
    id: 'rest_dominos_kota',
    stationCode: 'KOTA',
    stationName: 'Kota Junction',
    name: "Domino's Train Express",
    rating: 4.4,
    deliveryTimeMins: 20,
    minOrder: 200,
    cuisine: 'Pizza, Fast Food, Italian',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    badge: 'Hot at Coach Door',
    menu: [
      { id: 'm7', name: 'Peppy Paneer Medium Pizza', price: 349, veg: true, desc: 'Crisp capsicum, red paprika, spiced paneer chunks with liquid cheese' },
      { id: 'm8', name: 'Chicken Golden Delight Medium', price: 429, veg: false, desc: 'Double barbecue chicken, golden corn, extra cheese' },
      { id: 'm9', name: 'Garlic Breadsticks with Cheesy Dip', price: 139, veg: true, desc: 'Freshly baked buttery garlic loaf with creamy jalapeno dip' }
    ]
  },
  {
    id: 'rest_behrouz_rtm',
    stationCode: 'RTM',
    stationName: 'Ratlam Junction',
    name: 'Behrouz Royal Biryani',
    rating: 4.7,
    deliveryTimeMins: 30,
    minOrder: 250,
    cuisine: 'Mughlai, Dum Biryani, Kebabs',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    badge: 'Zomato Gold Partner',
    menu: [
      { id: 'm10', name: 'Dum Gosht Mutton Biryani (Boneless)', price: 480, veg: false, desc: 'Tender marinated lamb slow-cooked with aged basmati rice and saffron' },
      { id: 'm11', name: 'Subz-e-Biryani Royal Veg', price: 320, veg: true, desc: 'Exotic vegetables and paneer infused with whole royal spices' },
      { id: 'm12', name: 'Murgh Tikka Kebab (6 pcs)', price: 310, veg: false, desc: 'Smoky tandoori chicken skewers with mint dip and lachha onion' }
    ]
  },
  {
    id: 'rest_saravana_mas',
    stationCode: 'MAS',
    stationName: 'Chennai Central',
    name: 'Saravana Bhavan Grand',
    rating: 4.8,
    deliveryTimeMins: 15,
    minOrder: 120,
    cuisine: 'South Indian, Filter Coffee',
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
    badge: 'Legendary Station Outlet',
    menu: [
      { id: 'm13', name: 'Special Ghee Masala Dosa', price: 140, veg: true, desc: 'Crispy fermented crepe roasted with pure desi ghee & potato filling' },
      { id: 'm14', name: 'Idli Vada Combo (2 Idli + 1 Medu Vada)', price: 95, veg: true, desc: 'Steamed fluffy rice cakes with crunchy lentil donut & 3 varieties of chutneys' },
      { id: 'm15', name: 'Traditional Filter Kaapi (Flask)', price: 45, veg: true, desc: 'Authentic chicory blend frothy South Indian filter coffee in thermos cup' }
    ]
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ service: 'food-service', status: 'healthy', port: PORT, timestamp: new Date().toISOString() });
});

// List restaurants for a station
app.get('/restaurants', (req, res) => {
  const { stationCode = 'KOTA' } = req.query;
  const filtered = RESTAURANT_CATALOG.filter(r => r.stationCode === stationCode.toUpperCase());
  res.json({
    success: true,
    stationCode: stationCode.toUpperCase(),
    restaurants: filtered.length > 0 ? filtered : RESTAURANT_CATALOG
  });
});

// Single restaurant details and menu
app.get('/restaurant/:id', (req, res) => {
  const rest = RESTAURANT_CATALOG.find(r => r.id === req.params.id) || RESTAURANT_CATALOG[0];
  res.json({ success: true, restaurant: rest });
});

// Place order
app.post('/order', (req, res) => {
  try {
    const {
      pnr = '2849102941',
      trainNumber = '12952',
      stationCode = 'KOTA',
      stationName = 'Kota Junction',
      restaurantName = "Haldiram's Sweets & Thali",
      items = [],
      totalAmount = 350,
      coachBerth = 'B4 - Berth 21',
      customerPhone = '+91 98765 43210'
    } = req.body;

    const orderId = 'ORD_' + Math.floor(100000 + Math.random() * 900000);

    const insertStmt = db.prepare(`
      INSERT INTO food_orders (
        id, pnr, train_number, station_code, station_name,
        restaurant_name, items_json, total_amount, delivery_status,
        coach_berth, customer_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      orderId,
      pnr,
      trainNumber,
      stationCode,
      stationName,
      restaurantName,
      JSON.stringify(items),
      totalAmount,
      'PREPARING_IN_KITCHEN',
      coachBerth,
      customerPhone
    );

    res.status(201).json({
      success: true,
      message: `Food order placed successfully! Delivery scheduled at ${stationName} directly to seat ${coachBerth}.`,
      order: {
        orderId,
        pnr,
        stationName,
        restaurantName,
        coachBerth,
        totalAmount,
        status: 'PREPARING_IN_KITCHEN',
        etaMinutes: 28,
        deliveryCode: Math.floor(1000 + Math.random() * 9000) // OTP for delivery agent
      }
    });
  } catch (err) {
    console.error('Food order error:', err);
    res.status(500).json({ error: 'Failed to place food order' });
  }
});

// Track Order status
app.get('/order/:orderId', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM food_orders WHERE id = ?').get(req.params.orderId);
    if (!order) {
      // Return simulated active order if fresh ID requested
      return res.json({
        success: true,
        order: {
          orderId: req.params.orderId,
          status: 'OUT_FOR_DELIVERY_AT_PLATFORM',
          statusDesc: 'Delivery agent Deepak Kumar is standing at Coach B4 with your thermal hot bag.',
          stationName: 'Kota Junction (Platform 1)',
          agentPhone: '+91 98234 11223',
          etaMinutes: 6
        }
      });
    }

    res.json({
      success: true,
      order: {
        ...order,
        items: JSON.parse(order.items_json),
        statusStages: [
          { title: 'Order Confirmed', time: '18:10', done: true },
          { title: 'Kitchen Preparing Fresh Food', time: '18:15', done: true },
          { title: 'Dispatched to Platform Agent', time: '18:32', done: true },
          { title: 'Train Arriving at Platform 1', time: '18:40', active: true },
          { title: 'Handover to Seat', time: '18:43', done: false }
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

app.listen(PORT, () => {
  console.log(`[FOOD-SERVICE] Running on port ${PORT}`);
});
