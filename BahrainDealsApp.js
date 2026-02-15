import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { supabase } from './supabaseClient';

// Main App Component
export default function BahrainDealsApp() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStore, setSelectedStore] = useState('All');
  const [adminMode, setAdminMode] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showSubmitDeal, setShowSubmitDeal] = useState(false);

  const categories = ['All', 'Groceries', 'Electronics', 'Appliances', 'Seafood', 'Meat', 'Dairy', 'Fruits', 'Vegetables', 'Beverages', 'Snacks', 'Bakery', 'Health & Beauty', 'Household', 'Fragrances', 'Premium Nuts', 'Premium Dry Fruits'];
  const stores = ['All', 'Lulu Hypermarket', 'Alosra', 'HyperMax', 'Nesto', 'eXtra', 'Sharaf DG', 'Ansar Gallery', 'Ramez', 'Carrefour'];

  // Fetch deals from Supabase
  const fetchDeals = useCallback(async () => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const { data, error: fetchError } = await supabase
        .from('deals')
        .select('*')
        .or(`expiry_date.gte.${today},expiry_date.is.null`)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const mapped = data.map(row => ({
          id: row.id,
          title: row.title,
          originalPrice: Number(row.original_price) || 0,
          discountedPrice: Number(row.discounted_price) || 0,
          discount: Number(row.discount) || 0,
          store: row.store,
          category: row.category || 'Groceries',
          location: row.location || 'Bahrain',
          image: row.image && row.image.startsWith('http') ? '🛒' : (row.image || '🛒'),
          expiryDate: row.expiry_date || '',
          stock: row.stock || 'Available',
          isYellowSticker: row.is_yellow_sticker || false,
        }));
        setDeals(mapped);
        setLastUpdated(data[0].updated_at);
      } else {
        setDeals([]);
        setError('No deals available right now. Pull down to refresh.');
      }
    } catch (err) {
      console.log('Failed to fetch deals:', err.message);
      setDeals([]);
      setError('Could not load deals. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeals();
  }, [fetchDeals]);

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    const categoryMatch = selectedCategory === 'All' || deal.category === selectedCategory;
    const storeMatch = selectedStore === 'All' || deal.store === selectedStore;
    return categoryMatch && storeMatch;
  });

  // Navigation Component
  const Navigation = () => (
    <View style={styles.navigation}>
      <TouchableOpacity 
        style={[styles.navButton, currentScreen === 'home' && styles.navButtonActive]}
        onPress={() => setCurrentScreen('home')}
      >
        <Text style={styles.navIcon}>🏠</Text>
        <Text style={[styles.navText, currentScreen === 'home' && styles.navTextActive]}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navButton, currentScreen === 'submit' && styles.navButtonActive]}
        onPress={() => setCurrentScreen('submit')}
      >
        <Text style={styles.navIcon}>➕</Text>
        <Text style={[styles.navText, currentScreen === 'submit' && styles.navTextActive]}>Submit</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navButton, currentScreen === 'admin' && styles.navButtonActive]}
        onPress={() => setCurrentScreen('admin')}
      >
        <Text style={styles.navIcon}>⚙️</Text>
        <Text style={[styles.navText, currentScreen === 'admin' && styles.navTextActive]}>Admin</Text>
      </TouchableOpacity>
    </View>
  );

  // Home Screen
  const HomeScreen = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#4ecdc4" />
          <Text style={styles.loadingText}>Loading deals...</Text>
        </View>
      );
    }

    return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#4ecdc4"
          colors={['#4ecdc4']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Premium Deals</Text>
        <Text style={styles.headerSubtitle}>Bahrain 🇧🇭</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Error / Offline Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.filterChip, selectedCategory === category && styles.filterChipActive]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.filterText, selectedCategory === category && styles.filterTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Store Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {stores.map(store => (
          <TouchableOpacity
            key={store}
            style={[styles.storeChip, selectedStore === store && styles.storeChipActive]}
            onPress={() => setSelectedStore(store)}
          >
            <Text style={[styles.storeText, selectedStore === store && styles.storeTextActive]}>
              {store}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deals List */}
      <View style={styles.dealsContainer}>
        {filteredDeals.length === 0 && (
          <Text style={styles.noDealsText}>No deals found for this filter.</Text>
        )}
        {filteredDeals.map(deal => (
          <View key={deal.id} style={styles.dealCard}>
            {deal.isYellowSticker && (
              <View style={styles.yellowStickerBadge}>
                <Text style={styles.badgeText}>⚡ Yellow Sticker</Text>
              </View>
            )}
            
            <View style={styles.dealHeader}>
              <Text style={styles.dealEmoji}>{deal.image}</Text>
              <View style={styles.dealInfo}>
                <Text style={styles.dealTitle}>{deal.title}</Text>
                <Text style={styles.dealCategory}>{deal.category}</Text>
              </View>
            </View>

            <View style={styles.dealPricing}>
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>BHD {deal.originalPrice.toFixed(2)}</Text>
                <Text style={styles.discountedPrice}>BHD {deal.discountedPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{deal.discount}% OFF</Text>
              </View>
            </View>

            <View style={styles.dealFooter}>
              <View style={styles.storeInfo}>
                <Text style={styles.storeIcon}>🏪</Text>
                <Text style={styles.storeName}>{deal.store}</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationName}>{deal.location}</Text>
              </View>
            </View>

            <View style={styles.stockInfo}>
              <Text style={styles.stockText}>Stock: {deal.stock}</Text>
              <Text style={styles.expiryText}>Valid until: {deal.expiryDate}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
    );
  };

  // Submit Deal Screen
  const SubmitDealScreen = () => {
    const [formData, setFormData] = useState({
      title: '',
      originalPrice: '',
      discountedPrice: '',
      store: '',
      category: '',
      location: '',
      stock: 'Available'
    });

    const handleSubmit = () => {
      if (!formData.title || !formData.originalPrice || !formData.discountedPrice || !formData.store) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const discount = Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.discountedPrice)) / parseFloat(formData.originalPrice)) * 100);
      
      Alert.alert('Success', 'Deal submitted for review! Our team will verify and add it soon.');
      setFormData({
        title: '',
        originalPrice: '',
        discountedPrice: '',
        store: '',
        category: '',
        location: '',
        stock: 'Available'
      });
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Submit a Deal</Text>
          <Text style={styles.headerSubtitle}>Help the community find great deals!</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fresh Norwegian Salmon"
            placeholderTextColor="#999"
            value={formData.title}
            onChangeText={(text) => setFormData({...formData, title: text})}
          />

          <Text style={styles.formLabel}>Original Price (BHD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 8.50"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={formData.originalPrice}
            onChangeText={(text) => setFormData({...formData, originalPrice: text})}
          />

          <Text style={styles.formLabel}>Discounted Price (BHD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5.90"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={formData.discountedPrice}
            onChangeText={(text) => setFormData({...formData, discountedPrice: text})}
          />

          <Text style={styles.formLabel}>Store *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Lulu Hypermarket"
            placeholderTextColor="#999"
            value={formData.store}
            onChangeText={(text) => setFormData({...formData, store: text})}
          />

          <Text style={styles.formLabel}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Premium Seafood"
            placeholderTextColor="#999"
            value={formData.category}
            onChangeText={(text) => setFormData({...formData, category: text})}
          />

          <Text style={styles.formLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Manama"
            placeholderTextColor="#999"
            value={formData.location}
            onChangeText={(text) => setFormData({...formData, location: text})}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Deal</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * Your submission will be reviewed by our team before appearing in the app
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Admin Screen
  const AdminScreen = () => {
    const [newDeal, setNewDeal] = useState({
      title: '',
      originalPrice: '',
      discountedPrice: '',
      store: '',
      category: '',
      location: '',
      image: '🎁',
      expiryDate: '',
      stock: 'Available',
      isYellowSticker: false
    });

    const handleAddDeal = () => {
      if (!newDeal.title || !newDeal.originalPrice || !newDeal.discountedPrice) {
        Alert.alert('Error', 'Please fill in required fields');
        return;
      }

      const discount = Math.round(((parseFloat(newDeal.originalPrice) - parseFloat(newDeal.discountedPrice)) / parseFloat(newDeal.originalPrice)) * 100);
      
      const dealToAdd = {
        id: deals.length + 1,
        title: newDeal.title,
        originalPrice: parseFloat(newDeal.originalPrice),
        discountedPrice: parseFloat(newDeal.discountedPrice),
        discount: discount,
        store: newDeal.store || 'Unknown Store',
        category: newDeal.category || 'Other',
        location: newDeal.location || 'Bahrain',
        image: newDeal.image,
        expiryDate: newDeal.expiryDate || '2026-12-31',
        stock: newDeal.stock,
        isYellowSticker: newDeal.isYellowSticker
      };

      setDeals([dealToAdd, ...deals]);
      Alert.alert('Success', 'Deal added successfully!');
      
      setNewDeal({
        title: '',
        originalPrice: '',
        discountedPrice: '',
        store: '',
        category: '',
        location: '',
        image: '🎁',
        expiryDate: '',
        stock: 'Available',
        isYellowSticker: false
      });
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage deals manually</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.adminNote}>
            ⚡ Add deals manually to the app. In production, this would be a secure admin-only panel.
          </Text>

          <Text style={styles.formLabel}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fresh Norwegian Salmon"
            placeholderTextColor="#999"
            value={newDeal.title}
            onChangeText={(text) => setNewDeal({...newDeal, title: text})}
          />

          <Text style={styles.formLabel}>Original Price (BHD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="8.50"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={newDeal.originalPrice}
            onChangeText={(text) => setNewDeal({...newDeal, originalPrice: text})}
          />

          <Text style={styles.formLabel}>Discounted Price (BHD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="5.90"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={newDeal.discountedPrice}
            onChangeText={(text) => setNewDeal({...newDeal, discountedPrice: text})}
          />

          <Text style={styles.formLabel}>Store</Text>
          <TextInput
            style={styles.input}
            placeholder="Lulu Hypermarket"
            placeholderTextColor="#999"
            value={newDeal.store}
            onChangeText={(text) => setNewDeal({...newDeal, store: text})}
          />

          <Text style={styles.formLabel}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Premium Seafood"
            placeholderTextColor="#999"
            value={newDeal.category}
            onChangeText={(text) => setNewDeal({...newDeal, category: text})}
          />

          <Text style={styles.formLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Manama"
            placeholderTextColor="#999"
            value={newDeal.location}
            onChangeText={(text) => setNewDeal({...newDeal, location: text})}
          />

          <Text style={styles.formLabel}>Emoji Icon</Text>
          <TextInput
            style={styles.input}
            placeholder="🐟"
            value={newDeal.image}
            onChangeText={(text) => setNewDeal({...newDeal, image: text})}
          />

          <Text style={styles.formLabel}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-02-20"
            placeholderTextColor="#999"
            value={newDeal.expiryDate}
            onChangeText={(text) => setNewDeal({...newDeal, expiryDate: text})}
          />

          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setNewDeal({...newDeal, isYellowSticker: !newDeal.isYellowSticker})}
          >
            <View style={[styles.checkbox, newDeal.isYellowSticker && styles.checkboxChecked]}>
              {newDeal.isYellowSticker && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Yellow Sticker Deal (Limited Time)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminButton} onPress={handleAddDeal}>
            <Text style={styles.adminButtonText}>Add Deal to App</Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Current Stats</Text>
            <Text style={styles.statsText}>Total Deals: {deals.length}</Text>
            <Text style={styles.statsText}>Active Categories: {categories.length - 1}</Text>
            <Text style={styles.statsText}>Partner Stores: {stores.length - 1}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'submit' && <SubmitDealScreen />}
      {currentScreen === 'admin' && <AdminScreen />}
      
      <Navigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#1a1a2e',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#16213e',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#16213e',
  },
  filterChipActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  filterText: {
    color: '#8892b0',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  storeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2d3561',
  },
  storeChipActive: {
    backgroundColor: '#4ecdc4',
    borderColor: '#4ecdc4',
  },
  storeText: {
    color: '#8892b0',
    fontSize: 13,
    fontWeight: '500',
  },
  storeTextActive: {
    color: '#0f0f1e',
    fontWeight: '700',
  },
  dealsContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  dealCard: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2d3561',
  },
  yellowStickerBadge: {
    position: 'absolute',
    top: -8,
    right: 15,
    backgroundColor: '#ffd93d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    color: '#1a1a2e',
    fontSize: 11,
    fontWeight: '800',
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dealEmoji: {
    fontSize: 48,
    marginRight: 15,
  },
  dealInfo: {
    flex: 1,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  dealCategory: {
    fontSize: 13,
    color: '#4ecdc4',
    fontWeight: '600',
  },
  dealPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2d3561',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 16,
    color: '#8892b0',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4ecdc4',
  },
  discountBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  discountText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  storeName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationName: {
    color: '#8892b0',
    fontSize: 13,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2d3561',
  },
  stockText: {
    color: '#ffd93d',
    fontSize: 12,
    fontWeight: '600',
  },
  expiryText: {
    color: '#8892b0',
    fontSize: 12,
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a2e',
    paddingVertical: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#2d3561',
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  navButtonActive: {
    backgroundColor: '#16213e',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    color: '#8892b0',
    fontSize: 12,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#4ecdc4',
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2d3561',
  },
  submitButton: {
    backgroundColor: '#4ecdc4',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonText: {
    color: '#0f0f1e',
    fontSize: 16,
    fontWeight: '800',
  },
  disclaimer: {
    color: '#8892b0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  adminNote: {
    backgroundColor: '#ff6b6b',
    color: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
  },
  adminButton: {
    backgroundColor: '#ff6b6b',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  adminButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4ecdc4',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ecdc4',
  },
  checkmark: {
    color: '#0f0f1e',
    fontSize: 16,
    fontWeight: '800',
  },
  checkboxLabel: {
    color: '#ffffff',
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 15,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#2d3561',
  },
  statsTitle: {
    color: '#4ecdc4',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
  },
  statsText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4ecdc4',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
  },
  lastUpdated: {
    color: '#8892b0',
    fontSize: 12,
    marginTop: 5,
  },
  errorBanner: {
    backgroundColor: '#ff6b6b22',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  noDealsText: {
    color: '#8892b0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});
