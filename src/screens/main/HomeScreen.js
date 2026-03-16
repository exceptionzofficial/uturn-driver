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
  PanResponder,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { getAddressFromCoords } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Loader from '../../components/Loader';

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
  const { isOnline, setIsOnline } = useAppContext();
  const [locationName, setLocationName] = useState('Locating...');
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 11.3410,
    longitude: 77.7172,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [showMap, setShowMap] = useState(false);
  const [incomingBooking, setIncomingBooking] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  // --- Entrance Animations ---
  const headerAnim = useRef(new Animated.Value(0)).current;
  const locationBarAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const sectionTitleAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(SERVICES.map(() => new Animated.Value(0))).current;
  const walletFabAnim = useRef(new Animated.Value(0)).current;
  const subscriptionFabAnim = useRef(new Animated.Value(0)).current;
  const switchAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  const headerCycleAnim = useRef(new Animated.Value(0)).current;

  const bannerRef = useRef(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [showHeaderInfo, setShowHeaderInfo] = useState(true);

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
    const cycleInterval = setInterval(() => {
      // Step 1: Slide OUT current
      Animated.timing(headerCycleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Step 2: Toggle content
        setShowHeaderInfo(prev => !prev);
        // Step 3: Reset animation value to bottom start
        headerCycleAnim.setValue(-1);
        // Step 4: Slide IN new
        Animated.timing(headerCycleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(cycleInterval);
  }, []);

  useEffect(() => {
    requestLocationPermission();
    startEntranceAnimations();
    
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
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
    let pulse;
    if (isOnline) {
      pulse = Animated.loop(
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
    } else {
      pulseAnim.setValue(1);
    }

    Animated.spring(switchAnim, {
      toValue: isOnline ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();

    // Trigger simulation when going online
    let simulationTimer;
    if (isOnline) {
      simulationTimer = setTimeout(() => {
        setIncomingBooking({
          id: 'UT-7842',
          pickup: 'Town Hall, Coimbatore',
          drop: 'Railway Station, Erode',
          type: 'One Way',
          vehicle: 'Premium Sedan',
          distance: '94.5 km',
          fare: {
            base: '1200',
            distance: '950',
            bata: '150',
            total: '2300'
          }
        });
      }, 3500);
    } else {
      setIncomingBooking(null);
    }

    return () => {
      if (pulse) pulse.stop();
      if (simulationTimer) clearTimeout(simulationTimer);
    };
  }, [isOnline]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= width - 120) {
          slideX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= width - 150) {
          // Slide successful
          setShowConfirmModal(true);
          Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
        } else {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const handleAcceptBooking = () => {
    setShowConfirmModal(false);
    setIncomingBooking(null);
    Alert.alert('Booking Accepted!', 'The trip is now assigned to you. Drive safe!', [
      { text: 'Got it', onPress: () => {} }
    ]);
  };

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
              <View style={styles.brandRowContainer}>
                <Animated.View style={[
                  styles.textCycleContainer,
                  {
                    opacity: headerCycleAnim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [0, 1, 0],
                    }),
                    transform: [{
                      translateY: headerCycleAnim.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [30, 0, -30],
                      })
                    }],
                    position: 'absolute',
                  }
                ]}>
                  {showHeaderInfo ? (
                    <View>
                      <Text style={styles.brandText}>UTURN</Text>
                      <Text style={styles.tagline}>Moving Business Forward</Text>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.brandText}>MY VEHICLE</Text>
                      <Text style={styles.tagline}>Maruthi Suzuki Swift</Text>
                    </View>
                  )}
                </Animated.View>
              </View>
            </View>
            <View style={styles.headerRight}>
              {/* Creative 'Beacon' Status Toggle */}
              <TouchableOpacity
                onPress={() => setIsOnline(!isOnline)}
                activeOpacity={0.9}
                style={styles.beaconToggleContainer}
              >
                <Animated.View style={[
                  styles.beaconTrack,
                  {
                    backgroundColor: switchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(0,0,0,0.5)', 'rgba(76, 175, 80, 0.8)']
                    }),
                    borderColor: isOnline ? COLORS.accent : 'rgba(255,255,255,0.2)',
                  }
                ]}>
                  {/* Status Text (Sliding) */}
                  <Animated.View style={[
                    styles.beaconLabels,
                    {
                      transform: [{
                        translateX: switchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [15, -15],
                        })
                      }]
                    }
                  ]}>
                    <Text style={[styles.beaconText, { color: COLORS.white }]}>
                      {isOnline ? 'LIVE' : 'SLEEP'}
                    </Text>
                  </Animated.View>

                  {/* Morphing Thumb */}
                  <Animated.View style={[
                    styles.beaconThumb,
                    {
                      backgroundColor: isOnline ? COLORS.accent : COLORS.white,
                      transform: [{
                        translateX: switchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-24, 24],
                        })
                      }],
                      shadowColor: isOnline ? COLORS.accent : '#000',
                    }
                  ]}>
                    <Icon
                      name={isOnline ? 'signal-variant' : 'power-off'}
                      size={18}
                      color={isOnline ? COLORS.white : COLORS.textMuted}
                    />

                    {/* Radar Effect when Online */}
                    {isOnline && (
                      <Animated.View style={[
                        styles.radarCircle,
                        { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.15], outputRange: [0.6, 0] }) }
                      ]} />
                    )}
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileCircle}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/250?img=67' }}
                  style={styles.profileImage}
                />
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
              <LottieView
                source={require('../../assets/location.json')}
                autoPlay
                loop
                style={{ width: 34, height: 34 }}
              />
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
            <LottieView
              source={require('../../assets/subscription.json')}
              autoPlay
              loop
              style={{ width: 75, height: 75 }}
            />
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
            <LottieView
              source={require('../../assets/coin purse.json')}
              autoPlay
              loop
              style={{ width: 75, height: 75 }}
            />
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
      <Loader visible={loading} message="Syncing data..." />

      {/* Booking Notification Modal */}
      <Modal
        visible={!!incomingBooking}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.bookingModalOverlay}>
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View style={styles.bookingBadge}>
                <Text style={styles.bookingBadgeText}>NEW RIDE REQUEST</Text>
              </View>
              <Text style={styles.bookingId}>#{incomingBooking?.id}</Text>
            </View>

            <View style={styles.rideInfoContainer}>
              <View style={styles.routeTrace}>
                <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
                <View style={styles.line} />
                <View style={[styles.dot, { backgroundColor: COLORS.accentRed }]} />
              </View>
              <View style={styles.addressContainer}>
                <View style={styles.addressItem}>
                  <Text style={styles.addressLabel}>Pickup</Text>
                  <Text style={styles.addressValue} numberOfLines={1}>{incomingBooking?.pickup}</Text>
                </View>
                <View style={[styles.addressItem, { marginTop: 25 }]}>
                  <Text style={styles.addressLabel}>Drop</Text>
                  <Text style={styles.addressValue} numberOfLines={1}>{incomingBooking?.drop}</Text>
                </View>
              </View>
            </View>

            <View style={styles.rideDetailsRow}>
              <View style={styles.detailItem}>
                <Icon name="car-back" size={20} color={COLORS.textMuted} />
                <Text style={styles.detailValue}>{incomingBooking?.vehicle}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="map-marker-distance" size={20} color={COLORS.textMuted} />
                <Text style={styles.detailValue}>{incomingBooking?.distance}</Text>
              </View>
            </View>

            {/* Fare Breakdown (from Vendor App analysis) */}
            <View style={styles.fareContainer}>
              <Text style={styles.fareTitle}>Estimated Fare Breakdown</Text>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Fare</Text>
                <Text style={styles.fareValue}>₹{incomingBooking?.fare.base}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance Charge</Text>
                <Text style={styles.fareValue}>₹{incomingBooking?.fare.distance}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Driver Bata</Text>
                <Text style={styles.fareValue}>₹{incomingBooking?.fare.bata}</Text>
              </View>
              <View style={styles.fareDivider} />
              <View style={styles.fareRow}>
                <Text style={styles.totalLabel}>Total Earning</Text>
                <Text style={styles.totalValue}>₹{incomingBooking?.fare.total}</Text>
              </View>
            </View>

            {/* Slide to Accept */}
            <View style={styles.slideActionContainer}>
              <View style={styles.slideBackground}>
                <Text style={styles.slideText}>Slide to Accept Ride</Text>
                <Animated.View 
                  style={[styles.slideThumb, { transform: [{ translateX: slideX }] }]}
                  {...panResponder.panHandlers}
                >
                  <Icon name="chevron-double-right" size={24} color={COLORS.white} />
                </Animated.View>
              </View>
              <TouchableOpacity 
                style={styles.declineBtn}
                onPress={() => setIncomingBooking(null)}
              >
                <Text style={styles.declineText}>Decline Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent={true} animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}>
              <Icon name="help-circle-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.confirmTitle}>Confirm Acceptance</Text>
            <Text style={styles.confirmDesc}>Are you sure you want to accept this ride? You will be expected at the pickup location shortly.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.cancelBtn]} 
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.acceptBtn]}
                onPress={handleAcceptBooking}
              >
                <Text style={styles.acceptBtnText}>Accept Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  brandRowContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  textCycleContainer: {
    width: '100%',
  },
  brandRow: {
    flex: 1,
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
  beaconToggleContainer: {
    marginRight: 12,
  },
  beaconTrack: {
    width: 90,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  beaconThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    zIndex: 5,
  },
  beaconLabels: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  beaconText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  radarCircle: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
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
  locationValue: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '700',
    flex: 1,
  },
  // Booking Modal Styles
  bookingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookingBadge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bookingBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  rideInfoContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  routeTrace: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addressContainer: {
    flex: 1,
  },
  addressItem: {
    justifyContent: 'center',
  },
  addressLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressValue: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '800',
  },
  rideDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: 15,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  fareContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  fareTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 12,
    opacity: 0.6,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  fareDivider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.accent,
  },
  slideActionContainer: {
    alignItems: 'center',
  },
  slideBackground: {
    width: '100%',
    height: 64,
    backgroundColor: COLORS.secondary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  slideText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    opacity: 0.5,
  },
  slideThumb: {
    position: 'absolute',
    left: 8,
    width: 50,
    height: 50,
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  declineBtn: {
    marginTop: 20,
    padding: 10,
  },
  declineText: {
    color: COLORS.accentRed,
    fontWeight: '800',
    fontSize: 14,
  },
  // Confirm Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  confirmBox: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    width: '100%',
    padding: SPACING.xl,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.secondary,
    marginBottom: 10,
  },
  confirmDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  confirmActions: {
    flexDirection: 'row',
  },
  confirmBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  cancelBtnText: {
    color: COLORS.secondary,
    fontWeight: '800',
  },
  acceptBtn: {
    backgroundColor: COLORS.accent,
    marginLeft: 10,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: '800',
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
    bottom: 100,
    right: 20,
    width: 85,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  walletFabLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
  subscriptionFab: {
    position: 'absolute',
    bottom: 190, // Adjusted gap to prevent overlap with larger icons
    right: 20,
    width: 85,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  subscriptionFabLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
});

export default HomeScreen;
