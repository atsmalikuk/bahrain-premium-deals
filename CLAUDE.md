# Bahrain Premium Deals App

## Overview
A React Native/Expo mobile app for finding premium deals at Bahrain supermarkets and stores.

## Tech Stack
- React Native with Expo SDK 54
- No backend yet (all data is hardcoded in state)

## Project Structure
- `App.js` - Entry point, renders BahrainDealsApp
- `BahrainDealsApp.js` - Main app component with all screens
- `app.json` - Expo configuration
- `package.json` - Dependencies

## Screens
1. **Home** - Browse deals with category and store filters
2. **Submit** - Users can submit new deals for review
3. **Admin** - Admin panel to manually add deals

## Run Instructions
```bash
npx expo start -c
```
Scan QR code with Expo Go app on phone.
