import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Recommended rail travel destinations dataset with high-res photos & dynamic checklist
const DESTINATIONS = [
  {
    id: 'kashmir-vande-bharat',
    title: 'Kashmir Valley & Chenab Arch Bridge',
    category: 'Mountains & Snow',
    state: 'Jammu & Kashmir',
    nearestStation: 'SVDK / Udhampur (Upcoming Srinagar Direct)',
    featuredTrain: '22439 Vande Bharat Express',
    bannerImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    bestSeason: 'Oct - March (Snow) & Apr - June (Tulips)',
    overview: 'Travel through the world’s highest railway arch bridge over the Chenab River. Experience the snow-clad Pir Panjal mountains and Dal Lake houseboats.',
    recommendedDays: '5 Days / 4 Nights',
    checklist: [
      { id: 'c1', task: 'Cross the engineering marvel Chenab Railway Bridge during daylight', category: 'Train Experience' },
      { id: 'c2', task: 'Stay in a traditional wooden houseboat on Dal Lake, Srinagar', category: 'Sightseeing' },
      { id: 'c3', task: 'Ride the Gulmarg Gondola Phase 2 to Apharwat Peak', category: 'Adventure' },
      { id: 'c4', task: 'Sip authentic Kashmiri Kahwa with saffron and crushed almonds', category: 'Food' },
      { id: 'c5', task: 'Pack thermal innerwear and heavy woollens before Katra departure', category: 'Packing' }
    ],
    stationAmenities: [
      'Executive IRCTC Lounge with heated recliners',
      'Battery-operated wheelchairs and golf carts',
      '24/7 Cloakroom & luggage sanitizer'
    ]
  },
  {
    id: 'varanasi-ghats',
    title: 'Varanasi Ghats & Spiritual Awakening',
    category: 'Spiritual & Heritage',
    state: 'Uttar Pradesh',
    nearestStation: 'BSB / Banaras (BSBS)',
    featuredTrain: '22436 Vande Bharat Express',
    bannerImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    bestSeason: 'October to March',
    overview: 'Witness the eternal Ganga Aarti at Dashashwamedh Ghat, explore ancient labyrinth alleys, and savor Banarasi paan and malaiyo.',
    recommendedDays: '3 Days / 2 Nights',
    checklist: [
      { id: 'v1', task: 'Book front-row boat seating for evening Dashashwamedh Ganga Aarti', category: 'Sightseeing' },
      { id: 'v2', task: 'Visit Kashi Vishwanath Corridor early morning via VIP gateway', category: 'Spiritual' },
      { id: 'v3', task: 'Taste authentic winter Malaiyo foam dessert in Chowk lanes', category: 'Food' },
      { id: 'v4', task: 'Explore Sarnath Dhamek Stupa where Buddha gave his first sermon', category: 'Heritage' },
      { id: 'v5', task: 'Pick up handloom Banarasi silk sarees from local weavers', category: 'Shopping' }
    ],
    stationAmenities: [
      'Banaras Station Airport-Standard Waiting Hall',
      'IRCTC Yatri Niwas Budget Pod Rooms',
      'Automated Ticket Vending Machines (ATVM)'
    ]
  },
  {
    id: 'rajasthan-royal-palaces',
    title: 'Jaipur & Udaipur Royal Palaces',
    category: 'Royal & Desert',
    state: 'Rajasthan',
    nearestStation: 'JP (Jaipur) & UDZ (Udaipur)',
    featuredTrain: '12956 Jaipur Superfast Express / 20978 Vande Bharat',
    bannerImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    bestSeason: 'November to February',
    overview: 'The royal grandeur of Amber Fort, sunset boat rides on Lake Pichola, and the vibrant culture of royal Rajasthan.',
    recommendedDays: '6 Days / 5 Nights',
    checklist: [
      { id: 'r1', task: 'Watch sunrise over Hawa Mahal from Wind View Cafe', category: 'Sightseeing' },
      { id: 'r2', task: 'Sunset boat ride past Jag Mandir on Lake Pichola', category: 'Romantic' },
      { id: 'r3', task: 'Feast on authentic Rajasthani Dal Baati Churma with Ghee', category: 'Food' },
      { id: 'r4', task: 'Explore the City Palace and vintage car museum in Udaipur', category: 'Heritage' },
      { id: 'r5', task: 'Pack lightweight cottons for day and warm shawls for cold desert nights', category: 'Packing' }
    ],
    stationAmenities: [
      'Heritage Royal Lounge at Jaipur Junction',
      'Prepaid Auto & Taxi Booth at Station Exit',
      'Free High-Speed RailWire Wi-Fi'
    ]
  },
  {
    id: 'konkan-railway-goa',
    title: 'Konkan Scenic Coastal Railway & Goa',
    category: 'Coastal & Beaches',
    state: 'Goa & Maharashtra',
    nearestStation: 'MAO (Madgaon Junction)',
    featuredTrain: '22229 Vande Bharat / 22119 Tejas Express',
    bannerImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    bestSeason: 'November to March & Monsoon (July-Sept for Waterfalls)',
    overview: 'One of the most scenic train journeys in Asia across 2,000 bridges, lush Western Ghats tunnels, and Dudhsagar waterfall.',
    recommendedDays: '4 Days / 3 Nights',
    checklist: [
      { id: 'g1', task: 'Stand at train window to glimpse roaring Dudhsagar Falls mist', category: 'Train Experience' },
      { id: 'g2', task: 'Visit historic Fontainhas Latin Quarter colorful streets in Panjim', category: 'Heritage' },
      { id: 'g3', task: 'Relish authentic Goan Fish Curry Thali and Bebinca dessert', category: 'Food' },
      { id: 'g4', task: 'Rent two-wheeler from Madgaon station self-drive kiosks', category: 'Commute' },
      { id: 'g5', task: 'Sunset kayak through calm Sal Backwaters in South Goa', category: 'Adventure' }
    ],
    stationAmenities: [
      'Dudhsagar Rail Trek Tourist Information Center',
      '24/7 Car & Scooter Rental Counter',
      'Air-conditioned VIP waiting lounge'
    ]
  },
  {
    id: 'kerala-backwaters',
    title: 'Kerala Backwaters & Munnar Hills',
    category: 'Backwaters & Nature',
    state: 'Kerala',
    nearestStation: 'ERS (Ernakulam) & ALLP (Alleppey)',
    featuredTrain: '12626 Kerala Express / 20632 Vande Bharat',
    bannerImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    bestSeason: 'September to March',
    overview: 'Gliding on a traditional Kettuvallam through emerald palm lagoons, spice plantations, and misty green tea estates.',
    recommendedDays: '5 Days / 4 Nights',
    checklist: [
      { id: 'k1', task: 'Overnight private houseboat stay through Vembanad Lake', category: 'Relaxation' },
      { id: 'k2', task: 'Early morning trek through tea estates in Munnar', category: 'Nature' },
      { id: 'k3', task: 'Savor Kerala Sadya feast on fresh banana leaf', category: 'Food' },
      { id: 'k4', task: 'Watch traditional Kathakali martial art & dance drama', category: 'Culture' }
    ],
    stationAmenities: [
      'Ayurvedic Wellness Booth at Ernakulam Junction',
      'Houseboat & KSRTC Express booking counters',
      'IRCTC Executive Lounge'
    ]
  },
  {
    id: 'darjeeling-toy-train',
    title: 'Darjeeling Himalayan Toy Train & Kanchenjunga',
    category: 'Mountains & Snow',
    state: 'West Bengal',
    nearestStation: 'NJP (New Jalpaiguri) & DJ (Darjeeling)',
    featuredTrain: '12343 Darjeeling Mail / 52541 DHR Steam Toy Train',
    bannerImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    bestSeason: 'March to May & October to December',
    overview: 'UNESCO World Heritage steam toy train navigating famous Batasia Loop with breathtaking views of Mt. Kanchenjunga and lush tea gardens.',
    recommendedDays: '4 Days / 3 Nights',
    checklist: [
      { id: 'd1', task: 'Ride the UNESCO Heritage Steam Toy Train Joyride from Darjeeling to Ghum', category: 'Train Experience' },
      { id: 'd2', task: 'Watch 4:30 AM sunrise hit Mt. Kanchenjunga peak from Tiger Hill', category: 'Sightseeing' },
      { id: 'd3', task: 'Sip fresh first-flush organic tea at Happy Valley Tea Estate', category: 'Food' },
      { id: 'd4', task: 'Walk through Batasia Loop war memorial and spiral train track', category: 'Heritage' }
    ],
    stationAmenities: [
      'DHR Heritage Railway Museum at Ghum & NJP',
      'Shared Taxi and Pre-paid Mountain Jeeps Counter',
      'Executive Waiting Hall with Heaters'
    ]
  },
  {
    id: 'hampi-vijayanagara',
    title: 'Hampi Vijayanagara Boulder Ruins',
    category: 'Spiritual & Heritage',
    state: 'Karnataka',
    nearestStation: 'HPT (Hosapete Junction)',
    featuredTrain: '16592 Hampi Express',
    bannerImage: 'https://images.unsplash.com/photo-1600100397608-f010f4439c39?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1600100397608-f010f4439c39?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    bestSeason: 'October to February',
    overview: 'Step into an open-air museum of giant granite boulder landscapes, ancient stone chariots, and 14th-century Vijayanagara empire temples.',
    recommendedDays: '3 Days / 2 Nights',
    checklist: [
      { id: 'h1', task: 'Photograph the iconic Stone Chariot at Vijaya Vittala Temple', category: 'Heritage' },
      { id: 'h2', task: 'Climb Matanga Hill for a panoramic golden sunset over Tungabhadra River', category: 'Adventure' },
      { id: 'h3', task: 'Cross the Tungabhadra River on a traditional round coracle boat', category: 'Culture' },
      { id: 'h4', task: 'Rent a bicycle to explore the Royal Enclosure and Lotus Mahal', category: 'Commute' }
    ],
    stationAmenities: [
      'Hosapete Station KSTDC Tourism Information Center',
      'Pre-paid Tuk-Tuk & Auto-rickshaw stand',
      'AC Yatri Niwas Resting Lounge'
    ]
  },
  {
    id: 'amritsar-golden-temple',
    title: 'Amritsar Golden Temple & Heritage',
    category: 'Spiritual & Heritage',
    state: 'Punjab',
    nearestStation: 'ASR (Amritsar Junction)',
    featuredTrain: '22487 Vande Bharat Express / 12013 Shatabdi',
    bannerImage: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    bestSeason: 'October to March',
    overview: 'The divine golden glow of Sri Harmandir Sahib reflecting on the sacred Amrit Sarovar, Langar service, and patriotic Wagah Border retreat ceremony.',
    recommendedDays: '3 Days / 2 Nights',
    checklist: [
      { id: 'a1', task: 'Experience the nighttime Palki Sahib ceremony at Golden Temple', category: 'Spiritual' },
      { id: 'a2', task: 'Volunteer (Seva) at Guru Ka Langar serving thousands of pilgrims', category: 'Culture' },
      { id: 'a3', task: 'Cheer at the electrifying Beating Retreat ceremony at Wagah Border', category: 'Patriotic' },
      { id: 'a4', task: 'Eat crispy authentic Amritsari Kulcha with Chole and fresh Lassi', category: 'Food' }
    ],
    stationAmenities: [
      'Free SGPC Pilgrim AC Shuttles from Railway Station',
      'Air-conditioned VIP waiting lounge and cloakroom',
      'IRCTC Jan Aahar & Food Court'
    ]
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ service: 'destination-service', status: 'healthy', port: PORT, count: DESTINATIONS.length, timestamp: new Date().toISOString() });
});

// List all destinations with optional search and category filters
app.get('/featured-destinations', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  const cat = (req.query.category || '').toLowerCase().trim();

  let filtered = DESTINATIONS;
  if (cat && cat !== 'all') {
    filtered = filtered.filter(d => (d.category || '').toLowerCase().includes(cat));
  }
  if (query) {
    filtered = filtered.filter(d =>
      d.title.toLowerCase().includes(query) ||
      d.state.toLowerCase().includes(query) ||
      d.nearestStation.toLowerCase().includes(query) ||
      d.featuredTrain.toLowerCase().includes(query) ||
      (d.category && d.category.toLowerCase().includes(query)) ||
      d.overview.toLowerCase().includes(query) ||
      d.checklist.some(c => c.task.toLowerCase().includes(query))
    );
  }

  res.json({
    success: true,
    total: DESTINATIONS.length,
    count: filtered.length,
    destinations: filtered
  });
});

// Get destination by ID
app.get('/destination/:id', (req, res) => {
  const dest = DESTINATIONS.find(d => d.id === req.params.id) || DESTINATIONS[0];
  res.json({
    success: true,
    destination: dest
  });
});

// Google Places API adapter (Search nearby places / station amenities)
app.get('/google-places-search', (req, res) => {
  const { query = 'lounge', stationCode = 'NDLS' } = req.query;

  const mockPlaces = [
    {
      placeId: 'pl_1',
      name: `IRCTC Executive Lounge (${stationCode})`,
      rating: 4.5,
      userRatingsTotal: 3420,
      vicinity: `Platform 1 & 16, ${stationCode} Railway Station`,
      openNow: true,
      priceLevel: 2,
      photos: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80'],
      types: ['lounge', 'amenity', 'transit_station']
    },
    {
      placeId: 'pl_2',
      name: `Cloak Room & Luggage Locker`,
      rating: 4.1,
      userRatingsTotal: 1240,
      vicinity: `Near PRS Ticket Counter, ${stationCode}`,
      openNow: true,
      types: ['storage', 'convenience']
    },
    {
      placeId: 'pl_3',
      name: `Jan Aahar Cafeteria`,
      rating: 4.2,
      userRatingsTotal: 2150,
      vicinity: `Platform 2-3 concourse`,
      openNow: true,
      types: ['restaurant', 'food']
    }
  ];

  res.json({
    success: true,
    query,
    stationCode,
    results: mockPlaces
  });
});

app.listen(PORT, () => {
  console.log(`[DESTINATION-SERVICE] Running on port ${PORT}`);
});
