# Bahrain Premium Deals App 🇧🇭

A React Native mobile app prototype for discovering discounted premium products at Bahrain supermarkets.

## Features ✨

### Home Screen
- Browse premium deals from major Bahrain supermarkets (Lulu, Al Jazira, Carrefour, Alosra, Geant)
- Filter by category (Premium Seafood, Nuts, Dry Fruits, Fragrances, Electronics)
- Filter by store location
- View real-time yellow sticker deals
- See discount percentages, original vs discounted prices
- Check stock availability and expiry dates

### User-Submitted Deals
- Community-driven deal submission
- Simple form to report deals found in stores
- Submissions reviewed before appearing (future: moderation system)

### Admin Panel
- Manually add deals to the app
- Set pricing, categories, locations
- Mark yellow sticker deals
- View app statistics

## Design Philosophy 🎨

**Color Scheme:**
- Dark theme optimized for Bahrain's bright environment
- Accent colors: Teal (#4ecdc4), Coral (#ff6b6b), Gold (#ffd93d)
- Premium feel with gradients and depth

**Typography:**
- Bold, high-contrast text for outdoor readability
- Clear pricing hierarchy
- Arabic/English bilingual ready (currently English)

## Tech Stack 📱

- **Framework:** React Native (Expo)
- **Platform:** iOS & Android compatible
- **State:** React Hooks (useState)
- **UI:** Native components with custom styling
- **Data:** In-memory (ready for backend integration)

## Setup Instructions 🚀

### Prerequisites
- Node.js 16+ installed
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (iOS/Android)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
# or
expo start
```

3. Scan the QR code with:
   - **iOS:** Camera app
   - **Android:** Expo Go app

## Project Structure 📁

```
bahrain-premium-deals/
├── App.js                    # Entry point
├── BahrainDealsApp.jsx       # Main app component
├── package.json              # Dependencies
└── README.md                 # This file
```

## Current Data Model 📊

```javascript
{
  id: number,
  title: string,
  originalPrice: number,
  discountedPrice: number,
  discount: number,           // percentage
  store: string,
  category: string,
  location: string,
  image: string,             // emoji placeholder
  expiryDate: string,
  stock: string,
  isYellowSticker: boolean
}
```

## Next Steps for Production 🚧

### Backend Integration
1. **Database:** Set up PostgreSQL/MongoDB for deal storage
2. **API:** Build REST/GraphQL API with authentication
3. **Real-time updates:** WebSocket for live deal notifications
4. **Image uploads:** Cloudinary/S3 for product photos
5. **User authentication:** Firebase Auth or custom JWT

### Features to Add
- [ ] Push notifications for new deals near user
- [ ] Favorites/watchlist functionality
- [ ] User accounts and preferences
- [ ] Deal expiry notifications
- [ ] Map view of stores
- [ ] Arabic language support
- [ ] Barcode scanner for price checking
- [ ] Deal verification system
- [ ] Rating/review system
- [ ] Social sharing

### Store Partnerships
1. **Approach stores with pilot program:**
   - Lulu Hypermarket (largest, start here)
   - Al Jazira (local favorite)
   - Carrefour (international brand)

2. **Pitch points:**
   - Reduce food waste (CSR angle)
   - Increase foot traffic during slow hours
   - Build customer loyalty
   - Data insights on customer preferences

3. **Partnership models:**
   - Manual deal submission (current MVP)
   - API integration (if available)
   - POS integration (long-term)
   - Sponsored featured deals (monetization)

### Legal Considerations
- Terms of Service for user-submitted content
- Privacy Policy (PDPL compliance)
- Store partnership agreements
- Image rights and trademarks
- Age verification for age-restricted products

### Monetization Options
- Commission from stores (per customer/sale)
- Featured deal placements
- Premium subscription (early access, notifications)
- Affiliate marketing
- In-app advertising (carefully placed)

## Testing the Prototype 🧪

### Test Scenarios

1. **Browse Deals:**
   - Filter by "Premium Seafood" - should show salmon
   - Filter by "Lulu Hypermarket" - should show salmon
   - Try different combinations

2. **Submit a Deal:**
   - Fill in all fields on Submit screen
   - Try submitting incomplete form (should show error)
   - Submit complete deal (should show success)

3. **Admin Panel:**
   - Add a new deal with all details
   - Try yellow sticker toggle
   - Check stats update

## Customization Guide 🛠️

### Colors
Edit the StyleSheet in `BahrainDealsApp.jsx`:
```javascript
backgroundColor: '#1a1a2e',  // Main dark blue
backgroundColor: '#4ecdc4',  // Teal accent
backgroundColor: '#ff6b6b',  // Coral accent
backgroundColor: '#ffd93d',  // Gold accent
```

### Sample Data
Modify the `deals` state in `BahrainDealsApp.jsx` to add more sample deals.

### Categories/Stores
Update these arrays:
```javascript
const categories = ['All', 'Premium Seafood', ...];
const stores = ['All', 'Lulu Hypermarket', ...];
```

## Known Limitations ⚠️

- No backend - data resets on app restart
- No user authentication
- No image upload capability
- No real-time notifications
- No map integration
- English only (Arabic support needed)
- No deal expiry auto-removal
- No deal verification system

## Future Enhancements 🌟

### Phase 2 (2-3 months)
- Backend API with PostgreSQL
- User authentication
- Push notifications
- Image upload for deals
- Arabic language support

### Phase 3 (4-6 months)
- Store partnerships (1-2 stores)
- Map integration
- Deal verification system
- Social features (share deals)
- Advanced filtering

### Phase 4 (6-12 months)
- Full store integration
- Barcode scanning
- Loyalty program integration
- AI-powered deal recommendations
- Expansion to Kuwait/UAE

## Contributing 💡

This is a prototype. For production use:
1. Set up proper backend infrastructure
2. Implement security best practices
3. Add comprehensive error handling
4. Write unit and integration tests
5. Set up CI/CD pipeline
6. Add analytics tracking

## License 📄

Prototype for evaluation purposes.

## Contact 📧

For questions about this prototype or partnership opportunities, contact the development team.

---

**Built for the Bahrain market with ❤️**
