import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'auth.sqlite');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    rail_coins INTEGER DEFAULT 250,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_passengers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    berth_preference TEXT DEFAULT 'No Preference',
    food_preference TEXT DEFAULT 'Veg',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otp_store (
    phone TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

// Seed default demo user if empty
const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
const userCount = userCountStmt.get();
if (userCount.count === 0) {
  const demoUserId = 'usr_demo_101';
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, rail_coins)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(
    demoUserId,
    'Rajesh Kumar Sharma',
    'rajesh.sharma@railmate.in',
    '+91 98765 43210',
    crypto.createHash('sha256').update('password123').digest('hex'),
    450
  );

  const insertPassenger = db.prepare(`
    INSERT INTO saved_passengers (id, user_id, name, age, gender, berth_preference, food_preference)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPassenger.run('pass_1', demoUserId, 'Rajesh Kumar Sharma', 34, 'Male', 'Lower', 'Veg');
  insertPassenger.run('pass_2', demoUserId, 'Pooja Sharma', 31, 'Female', 'Lower', 'Veg');
  insertPassenger.run('pass_3', demoUserId, 'Aarav Sharma', 6, 'Male', 'No Preference', 'Veg');
}

// Helpers
function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd || '').digest('hex');
}

// Routes
app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'healthy', port: PORT, timestamp: new Date().toISOString() });
});

// Register
app.post('/register', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?');
    const existing = checkStmt.get(email, phone);
    if (existing) {
      return res.status(409).json({ error: 'User with this email or phone already exists' });
    }

    const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
    const pwdHash = password ? hashPassword(password) : null;

    const insertStmt = db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, rail_coins)
      VALUES (?, ?, ?, ?, ?, 250)
    `);
    insertStmt.run(userId, name, email, phone, pwdHash);

    const user = { id: userId, name, email, phone, railCoins: 250 };
    res.status(201).json({
      success: true,
      message: 'Account created successfully! +250 RailCoins welcome reward credited.',
      token: `token_${userId}_${Date.now()}`,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
app.post('/login', (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    const query = db.prepare(`
      SELECT id, name, email, phone, password_hash, rail_coins 
      FROM users 
      WHERE email = ? OR phone = ?
    `);
    const user = query.get(emailOrPhone, emailOrPhone);

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email or mobile number' });
    }

    if (password) {
      const inputHash = hashPassword(password);
      if (user.password_hash && user.password_hash !== inputHash) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
    }

    const passengersStmt = db.prepare('SELECT * FROM saved_passengers WHERE user_id = ?');
    const passengers = passengersStmt.all(user.id);

    res.json({
      success: true,
      token: `token_${user.id}_${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        railCoins: user.rail_coins,
        passengers
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Send OTP
app.post('/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    const upsertStmt = db.prepare(`
      INSERT INTO otp_store (phone, otp, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET otp = excluded.otp, expires_at = excluded.expires_at
    `);
    upsertStmt.run(phone, otp, expiresAt);

    console.log(`[AUTH-OTP] Sent OTP ${otp} to phone ${phone}`);

    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      devOtp: otp, // helpful for preview/testing
      expiresInSeconds: 300
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const checkStmt = db.prepare('SELECT otp, expires_at FROM otp_store WHERE phone = ?');
    const row = checkStmt.get(phone);

    if (!row || row.otp !== otp) {
      // Allow demo OTP 123456 as universal bypass for convenience
      if (otp !== '123456') {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
    } else if (Date.now() > row.expires_at) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Find or create user
    let userStmt = db.prepare('SELECT id, name, email, phone, rail_coins FROM users WHERE phone = ?');
    let user = userStmt.get(phone);

    if (!user) {
      const newId = 'usr_' + crypto.randomUUID().slice(0, 8);
      const email = `traveler_${newId}@railmate.in`;
      const name = 'Passenger ' + phone.slice(-4);
      db.prepare(`
        INSERT INTO users (id, name, email, phone, rail_coins)
        VALUES (?, ?, ?, ?, 250)
      `).run(newId, name, email, phone);

      user = { id: newId, name, email, phone, rail_coins: 250 };
    }

    res.json({
      success: true,
      message: 'Mobile number verified successfully',
      token: `token_${user.id}_${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        railCoins: user.rail_coins
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Profile & Passengers
app.get('/profile/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, rail_coins FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passengers = db.prepare('SELECT * FROM saved_passengers WHERE user_id = ?').all(user.id);
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        railCoins: user.rail_coins,
        passengers
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/passengers', (req, res) => {
  try {
    const { userId, name, age, gender, berthPreference, foodPreference } = req.body;
    if (!userId || !name || !age || !gender) {
      return res.status(400).json({ error: 'Missing required passenger details' });
    }

    const id = 'pass_' + crypto.randomUUID().slice(0, 8);
    const stmt = db.prepare(`
      INSERT INTO saved_passengers (id, user_id, name, age, gender, berth_preference, food_preference)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, name, Number(age), gender, berthPreference || 'No Preference', foodPreference || 'Veg');

    res.status(201).json({
      success: true,
      passenger: { id, userId, name, age: Number(age), gender, berthPreference, foodPreference }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save passenger' });
  }
});

app.listen(PORT, () => {
  console.log(`[AUTH-SERVICE] Running on port ${PORT}`);
});
