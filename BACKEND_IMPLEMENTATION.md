# Backend Implementation Guide
## Moving from Prototype to Production

This guide outlines how to add a backend to the Bahrain Premium Deals app and integrate real data storage, authentication, and store partnerships.

---

## Architecture Overview

```
┌─────────────────┐
│  React Native   │ ←→ REST/GraphQL API ←→ ┌──────────────┐
│   Mobile App    │                         │  PostgreSQL  │
└─────────────────┘                         │   Database   │
                                           └──────────────┘
         ↓                                        ↑
┌─────────────────┐                              │
│  Admin Panel    │ ─────────────────────────────┘
│   (Next.js)     │
└─────────────────┘
```

---

## Technology Stack Recommendations

### Option 1: Quick Start (Supabase)
**Best for:** Rapid MVP, no DevOps experience needed

**Stack:**
- **Backend:** Supabase (Backend-as-a-Service)
- **Database:** PostgreSQL (managed by Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

**Pros:**
- Setup in hours, not days
- Free tier: 500MB database, 1GB file storage
- Built-in auth, real-time subscriptions
- Generous free tier for MVP

**Cons:**
- Less control over infrastructure
- Potential vendor lock-in

**Cost:** Free → $25/month → $599/month (scales with usage)

### Option 2: Full Control (Custom Backend)
**Best for:** Long-term scalability, custom requirements

**Stack:**
- **API:** Node.js + Express / Python + FastAPI
- **Database:** PostgreSQL (AWS RDS / Railway)
- **Auth:** Firebase Auth / Auth0 / JWT
- **File Storage:** AWS S3 / Cloudinary
- **Caching:** Redis
- **Hosting:** Railway / Render / AWS ECS

**Pros:**
- Full control and customization
- No vendor lock-in
- Better for complex integrations

**Cons:**
- More setup time (1-2 weeks)
- Requires DevOps knowledge
- Higher initial complexity

**Cost:** $20-50/month → $200-500/month (at scale)

---

## Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- user, admin, store_manager
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  preferred_stores TEXT[], -- array of store IDs
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  chain VARCHAR(255), -- Lulu, Al Jazira, etc.
  location_name VARCHAR(255), -- Manama, Riffa, etc.
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  address TEXT,
  phone VARCHAR(20),
  opening_hours JSONB, -- {monday: "8am-10pm", ...}
  is_active BOOLEAN DEFAULT true,
  partnership_status VARCHAR(50), -- pilot, active, inactive
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  name_ar VARCHAR(255), -- Arabic translation
  icon VARCHAR(50), -- emoji or icon name
  display_order INT DEFAULT 0
);

-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255), -- Arabic translation
  description TEXT,
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INT,
  image_url TEXT,
  stock_status VARCHAR(50) DEFAULT 'Available', -- Available, Limited, Out of Stock
  stock_quantity INT,
  is_yellow_sticker BOOLEAN DEFAULT false,
  expiry_date DATE,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  barcode VARCHAR(100),
  view_count INT DEFAULT 0,
  redemption_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, expired, removed
  submitted_by UUID REFERENCES users(id), -- for user submissions
  verified_by UUID REFERENCES users(id), -- admin who approved
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, deal_id)
);

-- Deal views (for analytics)
CREATE TABLE deal_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Deal redemptions (tracking)
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id),
  user_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  redemption_code VARCHAR(50),
  amount_saved DECIMAL(10, 2),
  redeemed_at TIMESTAMP DEFAULT NOW()
);

-- Push notification tokens
CREATE TABLE notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20), -- ios, android
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50), -- deal, store, user
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Critical indexes
CREATE INDEX idx_deals_store_id ON deals(store_id);
CREATE INDEX idx_deals_category_id ON deals(category_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_expiry ON deals(expiry_date);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX idx_stores_location ON stores(location_lat, location_lng);
CREATE INDEX idx_users_location ON users(location_lat, location_lng);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
PUT    /api/auth/profile
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Deals

```
GET    /api/deals                    # List all active deals
GET    /api/deals/:id                # Get single deal
POST   /api/deals                    # Create deal (admin/store)
PUT    /api/deals/:id                # Update deal
DELETE /api/deals/:id                # Delete deal
POST   /api/deals/:id/view           # Track view
POST   /api/deals/:id/redeem         # Redeem deal
GET    /api/deals/nearby             # Get deals near location
GET    /api/deals/trending           # Trending deals
```

### Stores

```
GET    /api/stores                   # List all stores
GET    /api/stores/:id               # Get single store
GET    /api/stores/nearby            # Stores near location
GET    /api/stores/:id/deals         # Deals from specific store
```

### Categories

```
GET    /api/categories               # List all categories
```

### User Features

```
GET    /api/favorites                # User's saved deals
POST   /api/favorites/:dealId        # Add to favorites
DELETE /api/favorites/:dealId        # Remove from favorites
GET    /api/history                  # User's view/redemption history
```

### Admin

```
GET    /api/admin/deals/pending      # Pending user submissions
PUT    /api/admin/deals/:id/approve  # Approve submission
PUT    /api/admin/deals/:id/reject   # Reject submission
GET    /api/admin/analytics          # Dashboard data
GET    /api/admin/users              # User management
GET    /api/admin/stores             # Store management
```

### Notifications

```
POST   /api/notifications/register   # Register push token
POST   /api/notifications/test       # Send test notification
GET    /api/notifications/settings   # Get user settings
PUT    /api/notifications/settings   # Update settings
```

---

## API Implementation Example (Node.js + Express)

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Deal.js
│   │   └── Store.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── deals.js
│   │   ├── stores.js
│   │   └── admin.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── notificationService.js
│   │   └── imageService.js
│   ├── utils/
│   │   ├── helpers.js
│   │   └── validators.js
│   └── index.js
├── package.json
└── .env
```

### Key Files

**src/index.js**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dealRoutes = require('./routes/deals');
const storeRoutes = require('./routes/stores');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/stores', storeRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**src/routes/deals.js**
```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/database');

// Get all active deals
router.get('/', async (req, res, next) => {
  try {
    const { 
      category, 
      store, 
      location_lat, 
      location_lng,
      radius = 10000, // 10km default
      limit = 50,
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        d.*,
        s.name as store_name,
        s.location_name,
        s.location_lat,
        s.location_lng,
        c.name as category_name,
        c.icon as category_icon,
        COUNT(f.id) as favorite_count
      FROM deals d
      LEFT JOIN stores s ON d.store_id = s.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN favorites f ON d.id = f.deal_id
      WHERE d.status = 'active'
        AND (d.expiry_date IS NULL OR d.expiry_date >= CURRENT_DATE)
    `;
    
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND c.name = $${paramIndex++}`;
      params.push(category);
    }

    if (store) {
      query += ` AND s.id = $${paramIndex++}`;
      params.push(store);
    }

    // Location-based filtering
    if (location_lat && location_lng) {
      query += `
        AND (
          6371000 * acos(
            cos(radians($${paramIndex})) * 
            cos(radians(s.location_lat)) * 
            cos(radians(s.location_lng) - radians($${paramIndex + 1})) + 
            sin(radians($${paramIndex})) * 
            sin(radians(s.location_lat))
          )
        ) <= $${paramIndex + 2}
      `;
      params.push(location_lat, location_lng, radius);
      paramIndex += 3;
    }

    query += `
      GROUP BY d.id, s.id, c.id
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      deals: result.rows,
      count: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

// Get single deal
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        d.*,
        s.name as store_name,
        s.address,
        s.phone as store_phone,
        s.location_lat,
        s.location_lng,
        c.name as category_name
      FROM deals d
      LEFT JOIN stores s ON d.store_id = s.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Increment view count
    await pool.query(
      'UPDATE deals SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create deal (admin or store manager)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      store_id,
      category_id,
      title,
      description,
      original_price,
      discounted_price,
      image_url,
      stock_quantity,
      is_yellow_sticker,
      expiry_date
    } = req.body;

    const discount_percentage = Math.round(
      ((original_price - discounted_price) / original_price) * 100
    );

    const result = await pool.query(`
      INSERT INTO deals (
        store_id, category_id, title, description,
        original_price, discounted_price, discount_percentage,
        image_url, stock_quantity, is_yellow_sticker,
        expiry_date, status, submitted_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      store_id, category_id, title, description,
      original_price, discounted_price, discount_percentage,
      image_url, stock_quantity, is_yellow_sticker,
      expiry_date, 
      req.user.role === 'admin' ? 'active' : 'pending',
      req.user.id
    ]);

    // Send notification to nearby users
    if (req.user.role === 'admin') {
      // Call notification service
      // await notificationService.sendNewDealNotification(result.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Redeem deal
router.post('/:id/redeem', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const dealResult = await pool.query(
      'SELECT * FROM deals WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (dealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found or inactive' });
    }

    const deal = dealResult.rows[0];
    const amount_saved = deal.original_price - deal.discounted_price;

    await pool.query(`
      INSERT INTO redemptions (deal_id, user_id, store_id, amount_saved)
      VALUES ($1, $2, $3, $4)
    `, [id, req.user.id, deal.store_id, amount_saved]);

    await pool.query(
      'UPDATE deals SET redemption_count = redemption_count + 1 WHERE id = $1',
      [id]
    );

    res.json({ 
      message: 'Deal redeemed successfully',
      amount_saved 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**src/middleware/auth.js**
```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, isAdmin };
```

---

## Mobile App Integration

### Update API Service

**services/api.js**
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.bahraindeals.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export const dealService = {
  getDeals: (params) => api.get('/deals', { params }),
  getDeal: (id) => api.get(`/deals/${id}`),
  createDeal: (data) => api.post('/deals', data),
  redeemDeal: (id) => api.post(`/deals/${id}/redeem`),
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};

export const storeService = {
  getStores: () => api.get('/stores'),
  getNearbyStores: (lat, lng) => api.get('/stores/nearby', { 
    params: { lat, lng } 
  }),
};

export default api;
```

### Update App Component

```javascript
import { useEffect, useState } from 'react';
import { dealService } from './services/api';

export default function BahrainDealsApp() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await dealService.getDeals({
        limit: 50,
        offset: 0
      });
      setDeals(response.data.deals);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of component...
}
```

---

## Push Notifications

### Firebase Cloud Messaging Setup

**Install dependencies:**
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**services/notificationService.js**
```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    await saveTokenToBackend(token);
  }
}

async function saveTokenToBackend(token) {
  try {
    await api.post('/notifications/register', { 
      token,
      platform: Platform.OS 
    });
    await AsyncStorage.setItem('fcmToken', token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
}

export function setupNotificationListeners() {
  // Foreground messages
  messaging().onMessage(async remoteMessage => {
    console.log('Notification received:', remoteMessage);
    // Show in-app notification
  });

  // Background messages
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background notification:', remoteMessage);
  });

  // Notification opened app
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app:', remoteMessage);
    // Navigate to deal
  });
}
```

### Backend Notification Sending

**services/notificationService.js (Backend)**
```javascript
const admin = require('firebase-admin');
const pool = require('../config/database');

admin.initializeApp({
  credential: admin.credential.cert(require('../config/firebase-key.json'))
});

async function sendNewDealNotification(deal) {
  try {
    // Get users near the store
    const users = await pool.query(`
      SELECT DISTINCT u.id, nt.token
      FROM users u
      JOIN notification_tokens nt ON u.id = nt.user_id
      JOIN stores s ON s.id = $1
      WHERE u.notification_enabled = true
        AND (
          6371000 * acos(
            cos(radians(u.location_lat)) * 
            cos(radians(s.location_lat)) * 
            cos(radians(s.location_lng) - radians(u.location_lng)) + 
            sin(radians(u.location_lat)) * 
            sin(radians(s.location_lat))
          )
        ) <= 5000
    `, [deal.store_id]);

    const tokens = users.rows.map(u => u.token);

    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: `${deal.discount_percentage}% OFF - ${deal.title}`,
        body: `BHD ${deal.discounted_price} at ${deal.store_name}`,
      },
      data: {
        dealId: deal.id.toString(),
        type: 'new_deal'
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`Sent ${response.successCount} notifications`);
  } catch (error) {
    console.error('Notification error:', error);
  }
}

module.exports = { sendNewDealNotification };
```

---

## Image Upload

### Using Cloudinary

**Install:**
```bash
npm install cloudinary multer
```

**Backend route:**
```javascript
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'deals',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

---

## Analytics & Monitoring

### Tools to Add

1. **Application Monitoring:**
   - Sentry (error tracking)
   - LogRocket (session replay)
   - DataDog (infrastructure monitoring)

2. **Analytics:**
   - Mixpanel (user behavior)
   - Google Analytics
   - Amplitude

3. **Performance:**
   - New Relic
   - Prometheus + Grafana

---

## Deployment

### Option 1: Railway (Easiest)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Option 2: AWS (Production-grade)

**Stack:**
- ECS Fargate (containers)
- RDS PostgreSQL (database)
- S3 (file storage)
- CloudFront (CDN)
- Route 53 (DNS)
- ALB (load balancer)

---

## Security Checklist

- [ ] HTTPS only in production
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] JWT tokens expire (24h recommended)
- [ ] Passwords hashed (bcrypt, 10+ rounds)
- [ ] Environment variables secured
- [ ] API keys rotated regularly
- [ ] Database backups automated
- [ ] Error messages don't leak data
- [ ] File uploads validated (type, size)
- [ ] Admin routes protected
- [ ] Audit logging enabled

---

## Testing

### Backend Tests

```javascript
// tests/deals.test.js
const request = require('supertest');
const app = require('../src/index');

describe('GET /api/deals', () => {
  it('should return list of deals', async () => {
    const res = await request(app).get('/api/deals');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('deals');
  });
});
```

---

## Next Steps

1. **Week 1:** Set up Supabase or custom backend
2. **Week 2:** Implement auth and basic CRUD
3. **Week 3:** Add push notifications
4. **Week 4:** Test with real data, deploy to staging
5. **Week 5:** Beta testing with 50 users
6. **Week 6:** Fix bugs, optimize, production deploy

---

**Questions? Reach out for implementation support!**
