import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { useAppContext } from '../../context/AppContext';
import { getAvailableTrips, getDriverTrips } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Dummy data removed. Real data fetched from backend.

const TripsScreen = ({ navigation }) => {
  const { 
    isOnline, setIsOnline, userData,
    notifications, setNotifications,
    showNotifModal, setShowNotifModal
  } = useAppContext();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Active');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  // Animations
  const headerCycleAnim = useRef(new Animated.Value(0)).current;
  const switchAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  const [showHeaderInfo, setShowHeaderInfo] = useState(true);

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      Animated.timing(headerCycleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowHeaderInfo(prev => !prev);
        headerCycleAnim.setValue(-1);
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
    Animated.spring(switchAnim, {
      toValue: isOnline ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  // Reload trips every time screen comes into focus (handles app restart, tab switch, returning from SelfRide)
  useFocusEffect(
    useCallback(() => {
      loadTrips();
      const interval = setInterval(() => {
        loadTrips(true);
      }, 5000);
      return () => clearInterval(interval);
    }, [isOnline, userData])
  );

  const loadTrips = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dId = userData?.phone || userData?.driverId;
      // Always fetch available trips; only fetch driver trips if we have a driverId
      const [available, active] = await Promise.all([
        getAvailableTrips(),
        dId ? getDriverTrips(dId) : Promise.resolve([])
      ]);
      
      const combined = [...(available || []), ...(active || [])];
      // remove duplicates by tripId
      const uniqueTrips = Array.from(new Map(combined.map(item => [item.tripId || item.id, item])).values());
      
      setTrips(uniqueTrips);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderTripCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {item.isSelfRide && (
            <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#FFB74D' }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#E65100' }}>SELF RIDE</Text>
            </View>
          )}
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: (item.status === 'pending') ? COLORS.accentOrange : COLORS.accent }]} />
            <Text style={styles.statusText}>
              {item.status === 'pending' ? 'AVAILABLE' 
                : item.status === 'driverAccepted' ? (item.isSelfRide ? 'READY TO START' : 'Verification Pending') 
                : item.status === 'vendorApproved' ? 'VENDOR APPROVED' 
                : item.status === 'commissionPending' ? 'PAYMENT PENDING' 
                : item.status === 'commissionRejected' ? 'REJECTED BY VENDOR' 
                : (item.status || 'Pending').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.amountText}>₹{item.totalFare || item.totalTripAmount || '0'}</Text>
      </View>

      {!item.isSelfRide && item.status === 'driverAccepted' && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: RADIUS.md, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
          <Icon name="clock-check-outline" size={18} color="#FF9800" style={{ marginRight: 8 }} />
          <Text style={{ color: '#E65100', fontWeight: 'bold', fontSize: 13 }}>Verification Pending: Vendor is reviewing your video.</Text>
        </View>
      )}

      {item.isSelfRide && item.status === 'driverAccepted' && (
        <View style={{ backgroundColor: '#E8F5E9', padding: 10, borderRadius: RADIUS.md, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#4CAF50' }}>
          <Icon name="account-star" size={18} color="#4CAF50" style={{ marginRight: 8 }} />
          <Text style={{ color: '#1B5E20', fontWeight: 'bold', fontSize: 13 }}>Self Ride ready. Tap to start the ride flow.</Text>
        </View>
      )}

      {item.status === 'commissionPending' && (
        <View style={{ backgroundColor: '#E3F2FD', padding: 12, borderRadius: RADIUS.md, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#1976D2' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Icon name="clock-time-eight-outline" size={18} color="#1976D2" style={{ marginRight: 8 }} />
            <Text style={{ color: '#0D47A1', fontWeight: 'bold', fontSize: 13 }}>Awaiting Vendor Payment Approval</Text>
          </View>
          <Text style={{ color: '#1565C0', fontSize: 12 }}>Ride submitted. Waiting for vendor to confirm payment receipt.</Text>
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
            {['Submitted', 'Pending Vendor', 'Approved'].map((s, i) => (
              <View key={s} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: i === 0 ? '#1976D2' : i === 1 ? '#90CAF9' : '#E3F2FD' }} />
                <Text style={{ fontSize: 9, color: '#1976D2', marginTop: 3, fontWeight: i < 2 ? 'bold' : 'normal' }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {item.status === 'commissionRejected' && (
        <View style={{ backgroundColor: '#FFEBEE', padding: 10, borderRadius: RADIUS.md, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#D32F2F' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="alert-circle" size={18} color="#D32F2F" style={{ marginRight: 8 }} />
            <Text style={{ color: '#B71C1C', fontWeight: 'bold', fontSize: 13 }}>Vendor Rejected — Resubmit Payment Proof</Text>
          </View>
        </View>
      )}

      <View style={styles.routeContainer}>
        <View style={styles.pathDecoration}>
          <View style={styles.circleMarker} />
          <View style={styles.dashedLine} />
          <View style={[styles.circleMarker, { borderColor: COLORS.accentRed }]} />
        </View>
        
        <View style={styles.locationInfo}>
          <View style={styles.locationBlock}>
            <Text style={styles.timeLabel}>{item.scheduleDate} • {item.scheduleTime}</Text>
            <Text style={styles.addressText} numberOfLines={1}>{item.pickupAddress || item.pickup}</Text>
          </View>
          <View style={[styles.locationBlock, { marginTop: 20 }]}>
            <Text style={styles.addressText} numberOfLines={1}>{item.dropAddress || item.drop}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="phone" size={18} color={COLORS.accent} />
          <Text style={styles.actionText}>Contact</Text>
        </TouchableOpacity>
        <View style={styles.footerDivider} />
        <TouchableOpacity 
          style={[styles.actionBtn, styles.primaryActionBtn, 
            !item.isSelfRide && item.status === 'driverAccepted' && { backgroundColor: COLORS.accentOrange },
            item.isSelfRide && item.status === 'driverAccepted' && { backgroundColor: '#4CAF50' },
            item.status === 'commissionPending' && { backgroundColor: '#1976D2' },
          ]}
          onPress={() => {
            if (item.isSelfRide) {
              // Self rides always go directly to ActiveRide
              navigation.navigate('ActiveRide', { trip: item });
            } else if (item.status === 'pending') {
              navigation.navigate('VideoVerification', { trip: item });
            } else if (item.status !== 'driverAccepted') {
              navigation.navigate('ActiveRide', { trip: item });
            }
          }}
          disabled={!item.isSelfRide && item.status === 'driverAccepted'}
        >
          <Text style={styles.primaryActionText}>
            {item.isSelfRide && item.status === 'driverAccepted' ? 'Start Ride'
              : item.status === 'pending' ? 'Accept Ride' 
              : item.status === 'driverAccepted' ? 'Sent for Verification' 
              : item.status === 'commissionPending' ? 'View Submission' 
              : item.status === 'commissionRejected' ? 'Resubmit' 
              : 'View Details'}
          </Text>
          {(item.isSelfRide || item.status !== 'driverAccepted') && <Icon name="chevron-right" size={20} color={COLORS.white} />}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const blockingTrips = trips.filter(t => 
    (t.status === 'commissionPending' || t.status === 'commissionRejected') && 
    (t.paymentMode === 'pay_driver')
  );
  const isBlocked = blockingTrips.length > 0;

  const activeRideStatuses = ['driverAccepted', 'vendorApproved', 'arrived', 'inProgress', 'dropped'];
  const hasActiveRide = trips.some(t => activeRideStatuses.includes(t.status));
  const hasSelfRide   = trips.some(t => activeRideStatuses.includes(t.status) && t.isSelfRide);
  const hasVendorRide = trips.some(t => activeRideStatuses.includes(t.status) && !t.isSelfRide);

  const filteredData = trips.filter(trip => {
    // Always show my active/settlement trips regardless of online status
    if (activeRideStatuses.includes(trip.status) || ['commissionRejected', 'commissionPending'].includes(trip.status)) {
      return true;
    }
    
    // Only show available (pending) rides if online and not blocked/active
    if (isOnline && trip.status === 'pending') {
      // If driver has an active SELF ride, hide all vendor trips
      if (hasSelfRide) return false;
      // If driver has an active VENDOR ride, hide new pending trips too
      return !hasVendorRide && !isBlocked;
    }
    
    return false;
  }).sort((a, b) => {
    // vendorApproved to the top
    if (a.status === 'vendorApproved' && b.status !== 'vendorApproved') return -1;
    if (a.status !== 'vendorApproved' && b.status === 'vendorApproved') return 1;
    return 0;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      
      {/* Premium Branded Header */}
      <View style={styles.header}>
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
                    <Text style={styles.brandText} numberOfLines={1} adjustsFontSizeToFit>UTURN</Text>
                    <Text style={styles.tagline} numberOfLines={1}>Moving Business Forward</Text>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.brandText} numberOfLines={1} adjustsFontSizeToFit>{userData?.vehicleType?.toUpperCase() || 'MY VEHICLE'}</Text>
                    <Text style={styles.tagline} numberOfLines={1}>{userData?.vehicleNumber || 'Wait for approval'}</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </View>

          <View style={styles.headerRight}>
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
                    outputRange: ['rgba(0,0,0,0.1)', 'rgba(76, 175, 80, 0.25)']
                  }),
                  borderColor: isOnline ? COLORS.accent : 'rgba(0,0,0,0.1)',
                }
              ]}>
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
                  <Text style={[styles.beaconText, { color: isOnline ? COLORS.accent : COLORS.textMuted }]}>
                    {isOnline ? 'LIVE' : 'SLEEP'}
                  </Text>
                </Animated.View>

                <Animated.View style={[
                  styles.beaconThumb,
                  {
                    backgroundColor: isOnline ? COLORS.accent : COLORS.white,
                    transform: [{
                      translateX: switchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-24, 24],
                      })
                    }]
                  }
                ]}>
                  <Icon 
                    name={isOnline ? 'signal-variant' : 'power-off'} 
                    size={14} 
                    color={isOnline ? COLORS.white : COLORS.textMuted} 
                  />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.notifBtn} 
              onPress={() => setShowNotifModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="bell-outline" size={24} color={COLORS.secondary} />
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={[styles.notifBadge, { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>{notifications.filter(n => !n.read).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModalContent, { height: '70%', padding: 0 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <Icon name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              {notifications.length === 0 ? (
                <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 40 }}>No notifications yet</Text>
              ) : (
                notifications.map((notif) => (
                  <TouchableOpacity key={notif.id} onPress={() => {
                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                  }} style={{ padding: 15, backgroundColor: notif.read ? '#FFF' : '#E3F2FD', borderRadius: RADIUS.md, marginBottom: 10, ...SHADOW.light }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontWeight: 'bold', color: COLORS.text, fontSize: 16 }}>{notif.title}</Text>
                      <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{notif.time}</Text>
                    </View>
                    <Text style={{ color: COLORS.text, fontSize: 14 }}>{notif.message}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unified List Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Ride Records</Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>{filteredData.length} Live</Text>
        </View>
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderTripCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTrips}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LottieView
              source={require('../../assets/radar.json')}
              autoPlay
              loop
              style={styles.emptyLottie}
            />
            <Text style={styles.emptyText}>
              {isOnline ? 'No active trips currently' : 'You are currently SLEEP'}
            </Text>
            <Text style={styles.emptySubText}>
              {isOnline ? 'New ride invitations will appear here as soon as they are published.' : 'Please go LIVE at the top to see available and active rides.'}
            </Text>
          </View>
        }
      />

      {/* Self Ride FAB — only show when no active ride */}
      {!hasVendorRide && !hasActiveRide && !isBlocked && (
        <TouchableOpacity
          style={styles.selfRideFab}
          onPress={() => navigation.navigate('SelfRide')}
          activeOpacity={0.85}
        >
          <Icon name="account-star" size={22} color="#fff" />
          <Text style={styles.selfRideFabText}>Self Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20) : 10,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 38,
    height: 38,
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
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 9,
    color: COLORS.secondary,
    opacity: 0.6,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beaconToggleContainer: {
    marginRight: 10,
  },
  beaconTrack: {
    width: 80,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  beaconThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 5,
  },
  beaconLabels: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  beaconText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  notifBtn: {
    padding: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentRed,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100, // Bottom tab spacer
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accent,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pathDecoration: {
    alignItems: 'center',
    width: 20,
    marginRight: 15,
  },
  circleMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
  },
  dashedLine: {
    width: 1,
    height: 30,
    borderWidth: 1,
    borderColor: '#CCC',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationBlock: {
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 15,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginLeft: 10,
    flex: 1.5,
  },
  primaryActionText: {
    color: COLORS.white,
    fontWeight: '800',
    marginRight: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyLottie: {
    width: 200,
    height: 200,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 5,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.accentRed,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  confirmModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  selfRideFab: {
    position: 'absolute',
    bottom: 110, // above tab bar
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  selfRideFabText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});

export default TripsScreen;
