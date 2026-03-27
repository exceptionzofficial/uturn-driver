import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { useAppContext } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const TRIPS_DATA = [
  {
    id: '2',
    type: 'Active',
    time: 'Now',
    date: 'Today, 25 Oct',
    from: 'Railway Station, Erode',
    to: 'Bus Stand, Bhavani',
    amount: '₹220',
    status: 'In Progress',
  }
];

const TripsScreen = () => {
  const { isOnline, setIsOnline } = useAppContext();
  const [activeTab, setActiveTab] = useState('Active');
  const tabs = ['Active', 'Invitations'];

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

  const renderTripCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: item.type === 'Active' ? COLORS.accent : COLORS.accentOrange }]} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.amountText}>{item.amount}</Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.pathDecoration}>
          <View style={styles.circleMarker} />
          <View style={styles.dashedLine} />
          <View style={[styles.circleMarker, { borderColor: COLORS.accentRed }]} />
        </View>
        
        <View style={styles.locationInfo}>
          <View style={styles.locationBlock}>
            <Text style={styles.timeLabel}>{item.date} • {item.time}</Text>
            <Text style={styles.addressText} numberOfLines={1}>{item.from}</Text>
          </View>
          <View style={[styles.locationBlock, { marginTop: 20 }]}>
            <Text style={styles.addressText} numberOfLines={1}>{item.to}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="phone" size={18} color={COLORS.accent} />
          <Text style={styles.actionText}>Contact</Text>
        </TouchableOpacity>
        <View style={styles.footerDivider} />
        <TouchableOpacity style={[styles.actionBtn, styles.primaryActionBtn]}>
          <Text style={styles.primaryActionText}>
            {item.type === 'Active' ? 'View Map' : 'Details'}
          </Text>
          <Icon name="chevron-right" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const filteredData = TRIPS_DATA.filter(trip => 
    activeTab === 'Invitations' ? trip.type === 'Pending' : trip.type === activeTab
  );

  return (
    <SafeAreaView style={styles.container}>
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

            <TouchableOpacity style={styles.notifBtn}>
              <Icon name="bell-outline" size={24} color={COLORS.secondary} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Custom Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderTripCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LottieView
              source={require('../../assets/radar.json')}
              autoPlay
              loop
              style={styles.emptyLottie}
            />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} trips currently</Text>
            <Text style={styles.emptySubText}>New ride requests will appear here</Text>
          </View>
        }
      />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    // Styling for active tab
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.primaryDark,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '40%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
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
});

export default TripsScreen;
