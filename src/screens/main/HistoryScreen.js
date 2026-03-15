import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { useAppContext } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const HISTORY_DATA = [
  { id: '1', date: 'Today', time: '11:20 AM', amount: '₹320.00', from: 'Town Hall', to: 'Railway Station', distance: '8.4 km', timeTaken: '24 mins' },
  { id: '2', date: 'Yesterday', time: '06:45 PM', amount: '₹185.50', from: 'Bus Stand', to: 'Hotel Residency', distance: '4.2 km', timeTaken: '12 mins' },
  { id: '3', date: '23 Oct', time: '02:15 PM', amount: '₹540.00', from: 'Airport', to: 'Saibaba Colony', distance: '12.8 km', timeTaken: '45 mins' },
  { id: '4', date: '22 Oct', time: '10:30 AM', amount: '₹210.00', from: 'Gandhipuram', to: 'Singanallur', distance: '5.6 km', timeTaken: '18 mins' },
];

const HistoryScreen = () => {
  const { isOnline, setIsOnline } = useAppContext();

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

            <TouchableOpacity style={styles.calendarBtn}>
              <Icon name="calendar-range" size={22} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Earnings Overview Card */}
        <LinearGradient
          colors={['#2D2D2D', '#1A1A1A']}
          style={styles.summaryCard}
        >
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Overall Earnings</Text>
              <Text style={styles.summaryAmount}>₹12,450.00</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Icon name="trending-up" size={16} color={COLORS.accent} />
              <Text style={styles.trendingText}>+12%</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>124</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>460km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        {HISTORY_DATA.map((item) => (
          <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.8}>
            <View style={styles.historyCardLeft}>
              <View style={styles.dateIcon}>
                <Text style={styles.dateDay}>{item.date.split(' ')[0]}</Text>
                {item.date.includes(',') && <Text style={styles.dateMonth}>{item.date.split(' ')[1]}</Text>}
              </View>
            </View>

            <View style={styles.historyInfo}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTime}>{item.time}</Text>
                <Text style={styles.infoAmount}>{item.amount}</Text>
              </View>
              
              <View style={styles.routePreview}>
                <Text style={styles.routeText} numberOfLines={1}>{item.from} → {item.to}</Text>
              </View>

              <View style={styles.rideStats}>
                <View style={styles.miniStat}>
                  <Icon name="map-marker-distance" size={14} color={COLORS.textMuted} />
                  <Text style={styles.miniStatText}>{item.distance}</Text>
                </View>
                <View style={styles.miniStat}>
                  <Icon name="clock-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.miniStatText}>{item.timeTaken}</Text>
                </View>
                <View style={[styles.miniStat, { marginLeft: 'auto' }]}>
                  <View style={styles.doneBadge}>
                    <Icon name="check-circle" size={12} color={COLORS.accent} />
                    <Text style={styles.doneText}>Completed</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  calendarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
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
  scrollContent: {
    padding: SPACING.lg,
  },
  summaryCard: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.medium,
    marginBottom: SPACING.xl,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryAmount: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 5,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendingText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  seeAll: {
    color: COLORS.accentOrange,
    fontWeight: '700',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    marginBottom: SPACING.md,
    ...SHADOW.light,
  },
  historyCardLeft: {
    marginRight: 15,
    justifyContent: 'center',
  },
  dateIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#F8F5EF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  historyInfo: {
    flex: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  infoAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  routePreview: {
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    opacity: 0.8,
  },
  rideStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  miniStatText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginLeft: 4,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doneText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '800',
    marginLeft: 3,
  },
});

export default HistoryScreen;
