import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Modal,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { getAddressFromCoords } from '../../services/api';

const { width } = Dimensions.get('window');
const SERVICE_CARD_SIZE = (width - SPACING.lg * 2 - SPACING.md) / 2;

const SERVICES = [
  { id: '1', label: 'Job', image: require('../../assets/job.png'), color: '#4CAF50' },
  { id: '2', label: 'Buy / Sell', image: require('../../assets/Vehicle.png'), color: '#2196F3' },
  { id: '3', label: 'Expense', image: require('../../assets/money.png'), color: '#FF5722' },
  { id: '4', label: 'Loan', icon: 'cash-multiple', color: '#9C27B0' },
  { id: '5', label: 'Insurance', icon: 'shield-check-outline', color: '#00BCD4' },
  { id: '6', label: 'Referral', icon: 'account-group-outline', color: '#FF9800' },
  { id: '8', label: 'My Earnings', icon: 'chart-line', color: '#8BC34A' },
  { id: '9', label: 'Self Drive', image: require('../../assets/Vehicle.png'), color: '#607D8B' },
];

const HomeScreen = () => {
  const [locationName, setLocationName] = useState('Locating...');
  const [isOnline, setIsOnline] = useState(false);
  const [region, setRegion] = useState({
    latitude: 11.3410,
    longitude: 77.7172,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [showMap, setShowMap] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          setLocationName('Permission Denied');
        }
      } catch (err) {
        console.warn(err);
        setLocationName('Permission Error');
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setRegion((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        try {
          const address = await getAddressFromCoords(latitude, longitude);
          setLocationName(address);
        } catch (e) {
          setLocationName('Unable to get address');
        }
      },
      (error) => {
        console.log('Location error:', error.code, error.message);
        // Fallback to a default location display instead of error
        setLocationName('Tap to set location');
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
    );
  };

  const renderServiceCard = (item) => (
    <TouchableOpacity key={item.id} style={styles.serviceCard} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        {item.image ? (
          <Image source={item.image} style={styles.serviceIconImage} resizeMode="contain" />
        ) : (
          <Icon name={item.icon} size={40} color={item.color} />
        )}
      </View>
      <Text style={styles.serviceLabel} numberOfLines={2}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandText}>UTURN</Text>
              <Text style={styles.tagline}>Moving Business Forward</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Minimal Online Toggle */}
            <TouchableOpacity
              style={[styles.onlineToggleSmall, isOnline && styles.onlineToggleSmallActive]}
              onPress={() => setIsOnline(!isOnline)}
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.pulseOnline,
                isOnline && { transform: [{ scale: pulseAnim }] }
              ]}>
                <View style={[styles.dotSmall, isOnline ? { backgroundColor: COLORS.accent } : { backgroundColor: COLORS.textMuted }]} />
              </Animated.View>
              <Text style={[styles.onlineStatusText, isOnline && { color: COLORS.secondary }]}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileCircle}>
              <Icon name="account" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Bar */}
        <TouchableOpacity
          style={styles.locationBar}
          onPress={() => setShowMap(true)}
          activeOpacity={0.8}
        >
          <View style={styles.locationIcon}>
            <Icon name="map-marker" size={20} color={COLORS.accentRed} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Current Location</Text>
            <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Banner Placeholder */}
        <View style={[styles.bannerCard, { marginTop: 10 }]}>
          <View style={styles.bannerPlaceholder}>
            <Icon name="image-outline" size={40} color={COLORS.border} />
            <Text style={styles.bannerPlaceholderText}>Promotional Banner</Text>
          </View>
        </View>

        {/* Services Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Services</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {SERVICES.map(renderServiceCard)}
        </View>

        {/* Quick Stats */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name="road-variant" size={22} color={COLORS.accent} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="currency-inr" size={22} color={COLORS.accentOrange} />
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="clock-outline" size={22} color={COLORS.info} />
            <Text style={styles.statValue}>0h</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Wallet Button */}
      <TouchableOpacity style={styles.walletFab} activeOpacity={0.8}>
        <Icon name="wallet" size={28} color={COLORS.white} />
        <Text style={styles.walletFabLabel}>Wallet</Text>
      </TouchableOpacity>

      {/* Map Modal */}
      <Modal visible={showMap} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            showsUserLocation={true}
          >
            <Marker coordinate={region} />
          </MapView>
          <TouchableOpacity
            style={styles.closeMapBtn}
            onPress={() => setShowMap(false)}
          >
            <Icon name="close" size={26} color={COLORS.black} />
          </TouchableOpacity>
          <View style={styles.mapInfoCard}>
            <Text style={styles.mapAddressTitle}>Selected Location</Text>
            <Text style={styles.mapAddressText}>{locationName}</Text>
            <TouchableOpacity
              style={styles.confirmLocationBtn}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40) : 20,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 50,
    position: 'relative',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 10,
    color: COLORS.secondary,
    opacity: 0.6,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineToggleSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  onlineToggleSmallActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: COLORS.accent,
  },
  pulseOnline: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  dotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    opacity: 0.7,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBar: {
    position: 'absolute',
    bottom: -28,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    ...SHADOW.medium,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: SPACING.lg,
  },

  /* Go Online Card */
  goOnlineCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.light,
  },
  goOnlineCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.accent,
  },
  onlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  onlineDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  onlineDotActive: {
    backgroundColor: '#C8E6C9',
  },
  onlineDotInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.textMuted,
  },
  onlineDotInnerActive: {
    backgroundColor: COLORS.accent,
  },
  onlineTextGroup: {
    flex: 1,
  },
  onlineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  onlineTitleActive: {
    color: COLORS.accent,
  },
  onlineSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  onlineSubActive: {
    color: '#388E3C',
  },
  toggleSwitch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.accent,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    ...SHADOW.light,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  /* Services Grid */
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  serviceCard: {
    width: SERVICE_CARD_SIZE,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: SPACING.md,
    ...SHADOW.light,
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  serviceIconImage: {
    width: '100%',
    height: '100%',
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  /* Banner */
  bannerCard: {
    height: 140,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOW.light,
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  bannerPlaceholderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 20,
    marginHorizontal: 5,
    ...SHADOW.light,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 4,
  },

  /* Map Modal */
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  closeMapBtn: {
    position: 'absolute',
    top: 44,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.medium,
  },
  mapInfoCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.medium,
  },
  mapAddressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  mapAddressText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmLocationBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '800',
  },
  walletFab: {
    position: 'absolute',
    bottom: 100, // Adjusted to sit above the bottom tab navigator
    right: 20,
    backgroundColor: '#E91E63', // Keeping the original wallet color
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.medium,
    elevation: 8,
    zIndex: 100,
  },
  walletFabLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
});

export default HomeScreen;
