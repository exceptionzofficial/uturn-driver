import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  Animated,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Calendar } from 'react-native-calendars';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { useAppContext } from '../../context/AppContext';
import { getDriverTrips } from '../../services/api';

const { width } = Dimensions.get('window');

// Dummy data removed. Real data fetched from backend.

const HistoryScreen = () => {
  const { isOnline, setIsOnline, userData } = useAppContext();

  // Animations
  const headerCycleAnim = useRef(new Animated.Value(0)).current;
  const switchAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  const [showHeaderInfo, setShowHeaderInfo] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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

    fetchHistory();
  }, [isOnline]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const dId = userData?.phone || userData?.driverId;
      if (dId) {
        // Fetch completed trips as history
        const data = await getDriverTrips(dId, 'completed');
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const filteredHistory = selectedDate 
    ? history.filter(item => item.scheduleDate === selectedDate)
    : history;

  const totalEarnings = history.reduce((sum, item) => sum + Number(item.driverPayout || item.totalFare || item.totalTripAmount || 0), 0);
  const totalTrips = history.length;
  const totalDistance = history.reduce((sum, item) => sum + (parseFloat(item.distance) || parseFloat(item.distanceKm) || 0), 0);

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

            <TouchableOpacity 
              style={[styles.calendarBtn, selectedDate && styles.calendarBtnActive]}
              onPress={() => setShowCalendar(true)}
            >
              <Icon 
                name={selectedDate ? "calendar-check" : "calendar-range"} 
                size={22} 
                color={selectedDate ? COLORS.accent : COLORS.secondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchHistory}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        
        {/* Earnings Overview Card */}
        <LinearGradient
          colors={['#2D2D2D', '#1A1A1A']}
          style={styles.summaryCard}
        >
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Overall Earnings</Text>
              <Text style={styles.summaryAmount}>₹{totalEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Icon name="trending-up" size={16} color={COLORS.accent} />
              <Text style={styles.trendingText}>Trips</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalTrips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDistance.toFixed(1)}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData?.rating || '4.8'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDate ? `Activities on ${selectedDate}` : 'Recent Activities'}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDate('')}>
            <Text style={styles.seeAll}>{selectedDate ? 'Show All' : 'See All'}</Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        {filteredHistory.length > 0 ? filteredHistory.map((item) => (
          <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.8}>
            <View style={styles.historyCardLeft}>
              <View style={styles.dateIcon}>
                <Text style={styles.dateDay}>
                  {item.scheduleDate?.includes('/') ? item.scheduleDate.split('/')[0] : 
                   item.scheduleDate?.includes('-') ? item.scheduleDate.split('-')[2] : '??'}
                </Text>
                <Text style={styles.dateMonth}>
                  {item.scheduleDate?.includes('/') ? item.scheduleDate.split('/')[1] : 
                   item.scheduleDate?.includes('-') ? item.scheduleDate.split('-')[1] : '??'}
                </Text>
              </View>
            </View>

            <View style={styles.historyInfo}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTime}>{item.scheduleTime}</Text>
                <Text style={styles.infoAmount}>₹{item.totalFare || item.totalTripAmount || '0'}</Text>
              </View>
              
              <View style={styles.routePreview}>
                <Text style={styles.routeText} numberOfLines={1}>
                  {item.pickupAddress || item.pickup} → {item.dropAddress || item.drop}
                </Text>
              </View>

              <View style={styles.rideStats}>
                <View style={styles.miniStat}>
                  <Icon name="map-marker-distance" size={14} color={COLORS.textMuted} />
                  <Text style={styles.miniStatText}>{item.distanceKm || item.distance || '0'} km</Text>
                </View>
                <View style={styles.miniStat}>
                  <Icon name="clock-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.miniStatText}>{item.estimatedTime || item.travelTime || 'N/A'}</Text>
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
        )) : (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No activities on this day</Text>
            <Text style={styles.emptySubText}>Try selecting another date</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Icon name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={onDateSelect}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: COLORS.primary, selectedTextColor: COLORS.secondary }
              }}
              renderArrow={(direction) => (
                <Icon 
                  name={direction === 'left' ? 'chevron-left' : 'chevron-right'} 
                  size={28} 
                  color={COLORS.secondary} 
                />
              )}
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.white,
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.secondary,
                todayTextColor: COLORS.accent,
                dayTextColor: COLORS.secondary,
                textDisabledColor: '#d9e1e8',
                dotColor: COLORS.primary,
                selectedDotColor: COLORS.secondary,
                arrowColor: COLORS.secondary,
                monthTextColor: COLORS.secondary,
                indicatorColor: COLORS.secondary,
                textDayFontWeight: '600',
                textMonthFontWeight: '900',
                textDayHeaderFontWeight: '700',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12
              }}
            />
          </View>
        </TouchableOpacity>
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
  calendarBtnActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.medium,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 5,
  },
});

export default HistoryScreen;
