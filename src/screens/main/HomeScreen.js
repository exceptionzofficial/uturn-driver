import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
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
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { getAddressFromCoords } from '../../services/api';

const { width } = Dimensions.get('window');
const SERVICE_CARD_SIZE = (width - SPACING.lg * 2 - SPACING.md) / 2;

const SERVICES = [
  { id: '1', label: 'Job', image: require('../../assets/job.png'), color: '#4CAF50' },
  { id: '2', label: 'Buy / Sell', image: require('../../assets/Vehicle.png'), color: '#2196F3' },
  { id: '3', label: 'Expense', image: require('../../assets/money.png'), color: '#FF5722' },
  { id: '4', label: 'Loan', image: require('../../assets/loan.png'), color: '#9C27B0' },
  { id: '5', label: 'Insurance', image: require('../../assets/insurance.png'), color: '#00BCD4' },
  { id: '6', label: 'Referral', image: require('../../assets/referral.png'), color: '#FF9800' },
  { id: '8', label: 'My Earnings', image: require('../../assets/earning.png'), color: '#8BC34A' },
  { id: '9', label: 'Self Drive', image: require('../../assets/selfdrive.png'), color: '#607D8B' },
];

const BANNERS = [
  { id: '1', image: require('../../assets/banner1.jpg') },
  { id: '2', image: require('../../assets/banner2.jpg') }, // Placeholder: Update these when you add more files
  { id: '3', image: require('../../assets/banner3.jpg') },
  { id: '4', image: require('../../assets/banner5.jpg') },
];

const BANNER_WIDTH = width - SPACING.lg * 2;

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

  // --- Entrance Animations ---
  const headerAnim = useRef(new Animated.Value(0)).current;
  const locationBarAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const sectionTitleAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(SERVICES.map(() => new Animated.Value(0))).current;
  const statsTitleAnim = useRef(new Animated.Value(0)).current;
  const statsAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const walletFabAnim = useRef(new Animated.Value(0)).current;
  const subscriptionFabAnim = useRef(new Animated.Value(0)).current;

  const bannerRef = useRef(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeBannerIndex + 1;
      if (nextIndex >= BANNERS.length) {
        nextIndex = 0;
      }
      bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveBannerIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeBannerIndex]);

  useEffect(() => {
    requestLocationPermission();
    startEntranceAnimations();
  }, []);

  const startEntranceAnimations = () => {
    // Header slides down
    Animated.spring(headerAnim, {
      toValue: 1, friction: 8, tension: 40, useNativeDriver: true,
    }).start();

    // Location bar slides in from right
    Animated.timing(locationBarAnim, {
      toValue: 1, duration: 500, delay: 200, useNativeDriver: true,
    }).start();

    // Banner scales up
    Animated.spring(bannerAnim, {
      toValue: 1, friction: 6, tension: 50, delay: 350, useNativeDriver: true,
    }).start();

    // "Services" title fades in
    Animated.timing(sectionTitleAnim, {
      toValue: 1, duration: 400, delay: 450, useNativeDriver: true,
    }).start();

    // Service cards pop in one by one
    cardAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1, friction: 6, tension: 60, delay: 500 + i * 80, useNativeDriver: true,
      }).start();
    });

    // Stats title
    Animated.timing(statsTitleAnim, {
      toValue: 1, duration: 400, delay: 1100, useNativeDriver: true,
    }).start();

    // Stats cards slide up
    statsAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1, friction: 7, tension: 50, delay: 1200 + i * 120, useNativeDriver: true,
      }).start();
    });

    // Wallet FAB bounces in
    Animated.spring(walletFabAnim, {
      toValue: 1, friction: 5, tension: 60, delay: 1500, useNativeDriver: true,
    }).start();

    // Subscription FAB bounces in
    Animated.spring(subscriptionFabAnim, {
      toValue: 1, friction: 5, tension: 60, delay: 1600, useNativeDriver: true,
    }).start();
  };

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

  const renderServiceCard = (item, index) => {
    const anim = cardAnims[index] || new Animated.Value(1);
    return (
      <Animated.View
        key={item.id}
        style={{
          opacity: anim,
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
          ],
        }}
      >
        <TouchableOpacity
          style={[styles.serviceCard, { borderColor: item.color + '40' }]}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            {item.image ? (
              <Image source={item.image} style={styles.serviceIconImage} resizeMode="contain" />
            ) : (
              <Icon name={item.icon} size={40} color={item.color} />
            )}
          </View>
          <Text style={styles.serviceLabel} numberOfLines={2}>{item.label}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

      {/* Dynamic Background Design */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F5EF', '#F0F4F8']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - slides down */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }],
        }]}>
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
        </Animated.View>

        {/* Location Bar - slides from right (placed between header and scroll) */}
        <Animated.View style={{
          opacity: locationBarAnim,
          transform: [{ translateX: locationBarAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
          marginTop: -28,
          marginHorizontal: SPACING.lg,
          zIndex: 20,
        }}>
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
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Auto-Scrolling Banners */}
          <Animated.View style={{
            opacity: bannerAnim,
            transform: [{ scale: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            marginTop: 10,
          }}>
            <FlatList
              ref={bannerRef}
              data={BANNERS}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScrollToIndexFailed={() => { }}
              renderItem={({ item }) => (
                <View style={[styles.bannerCard, { width: BANNER_WIDTH }]}>
                  <Image
                    source={item.image}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
                setActiveBannerIndex(index);
              }}
            />
            {/* Banner Pagination Dots */}
            <View style={styles.bannerDotsContainer}>
              {BANNERS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.bannerDot,
                    activeBannerIndex === i && styles.bannerDotActive
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Services title - fades in */}
          <Animated.View style={{
            opacity: sectionTitleAnim,
            transform: [{ translateX: sectionTitleAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
          }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Services</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Service cards - pop in individually */}
          <View style={styles.servicesGrid}>
            {SERVICES.map((item, index) => renderServiceCard(item, index))}
          </View>

          {/* Stats title - fades in */}
          <Animated.View style={{
            opacity: statsTitleAnim,
            transform: [{ translateY: statsTitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Today's Summary</Text>
            </View>
          </Animated.View>

          {/* Stats cards - slide up individually */}
          <View style={styles.statsRow}>
            {[
              { icon: 'road-variant', color: COLORS.accent, value: '0', label: 'Trips' },
              { icon: 'currency-inr', color: COLORS.accentOrange, value: '₹0', label: 'Earned' },
              { icon: 'clock-outline', color: COLORS.info, value: '0h', label: 'Online' },
            ].map((stat, i) => (
              <Animated.View key={i} style={{
                flex: 1,
                opacity: statsAnims[i],
                transform: [
                  { translateY: statsAnims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                  { scale: statsAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                ],
              }}>
                <View style={styles.statCard}>
                  <Icon name={stat.icon} size={22} color={stat.color} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Subscription Button - bounces in */}
        <Animated.View style={{
          opacity: subscriptionFabAnim,
          transform: [
            { scale: subscriptionFabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
            { translateY: subscriptionFabAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
          ],
        }}>
          <TouchableOpacity style={styles.subscriptionFab} activeOpacity={0.8}>
            <Icon name="card-membership" size={28} color={COLORS.white} />
            <Text style={styles.subscriptionFabLabel}>Plan</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Floating Wallet Button - bounces in */}
        <Animated.View style={{
          opacity: walletFabAnim,
          transform: [
            { scale: walletFabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
            { translateY: walletFabAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
          ],
        }}>
          <TouchableOpacity style={styles.walletFab} activeOpacity={0.8}>
            <Icon name="wallet" size={28} color={COLORS.white} />
            <Text style={styles.walletFabLabel}>Wallet</Text>
          </TouchableOpacity>
        </Animated.View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgBlob1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(245, 197, 24, 0.15)', // UTurn Yellow tint
  },
  bgBlob2: {
    position: 'absolute',
    top: 250,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(3, 169, 244, 0.08)', // Light Blue tint
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
    borderWidth: 1.5,
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
    height: 150,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOW.light,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 20,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 3,
  },
  bannerDotActive: {
    backgroundColor: COLORS.primary,
    width: 14,
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
  subscriptionFab: {
    position: 'absolute',
    bottom: 175, // Placed above the wallet fab
    right: 20,
    backgroundColor: '#FF9800', // Gold/Orange for subscription
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.medium,
    elevation: 8,
    zIndex: 100,
  },
  subscriptionFabLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
});

export default HomeScreen;
