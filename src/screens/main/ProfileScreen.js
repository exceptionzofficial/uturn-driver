import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation Refs
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const statsTitleAnim = useRef(new Animated.Value(0)).current;
  const statsAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const [lowRideEnabled, setLowRideEnabled] = useState(false);

  useEffect(() => {
    // Start entrance animations
    Animated.spring(avatarAnim, {
      toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
    }).start();

    Animated.timing(statsTitleAnim, {
      toValue: 1, duration: 400, delay: 300, useNativeDriver: true,
    }).start();

    statsAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1, friction: 7, tension: 50, delay: 400 + i * 120, useNativeDriver: true,
      }).start();
    });
  }, []);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 140],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F5EF', '#F0F4F8']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header Section */}
          <View style={styles.profileHeader}>
            <Animated.View style={[styles.avatarContainer, {
              opacity: avatarAnim,
              transform: [
                { scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                { translateY: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
              ]
            }]}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/250?img=67' }}
                style={styles.avatar}
              />
            </Animated.View>

            <Text style={styles.userName}>Hariprasath G</Text>
            <Text style={styles.userRole}>Premium Driver</Text>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: '#FFF9C4' }]}>
                <Icon name="star" size={14} color="#FBC02D" />
                <Text style={styles.badgeText}>4.9 Rating</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#E1F5FE' }]}>
                <Icon name="shield-check" size={14} color="#039BE5" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Today's Summary Section (Moved from Home) */}
          <Animated.View style={{
            opacity: statsTitleAnim,
            transform: [{ translateY: statsTitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            marginTop: 30,
          }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Today's Summary</Text>
              <TouchableOpacity>
                <Text style={styles.historyText}>View History</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.statsRow}>
            {[
              { icon: 'road-variant', color: COLORS.accent, value: '12', label: 'Trips' },
              { icon: 'currency-inr', color: COLORS.accentOrange, value: '₹1,250', label: 'Earned' },
              { icon: 'clock-outline', color: COLORS.info, value: '8.5h', label: 'Online' },
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
                  <Icon name={stat.icon} size={26} color={stat.color} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Ride Settings Section */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuSectionTitle}>Ride Settings</Text>
            <View style={styles.menuItem}>
              <View style={[styles.menuIconContainer, { backgroundColor: COLORS.accent + '15' }]}>
                <Icon name="trending-down" size={22} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Accept Low Rides</Text>
                <Text style={styles.menuSubLabel}>Allow requests with lower Rides</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLowRideEnabled(!lowRideEnabled)}
                style={[
                  styles.switchTrack,
                  { backgroundColor: lowRideEnabled ? COLORS.accent : '#E0E0E0' }
                ]}
              >
                <View style={[
                  styles.switchThumb,
                  { transform: [{ translateX: lowRideEnabled ? 22 : 2 }] }
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions / Settings */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuSectionTitle}>Account Settings</Text>
            {[
              { icon: 'car-outline', label: 'Vehicle Documents', color: '#66BB6A' },
              { icon: 'card-account-details-outline', label: 'Subscription Details', color: '#FFA726' },
              { icon: 'bell-outline', label: 'Notifications', color: '#26C6DA' },
              { icon: 'shield-lock-outline', label: 'Privacy & Security', color: '#78909C' },
              { icon: 'help-circle-outline', label: 'Support & Help', color: '#AB47BC' },
              { icon: 'logout', label: 'Logout', color: COLORS.accentRed },
            ].map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                  <Icon name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
  },
  bgBlob1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(245, 197, 24, 0.15)',
  },
  bgBlob2: {
    position: 'absolute',
    top: 250,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(3, 169, 244, 0.08)',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: COLORS.white,
    ...SHADOW.medium,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  historyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 20,
    marginHorizontal: 5,
    ...SHADOW.light,
    elevation: 4,
  },
  statValue: {
    fontSize: 18,
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
  menuContainer: {
    marginTop: 35,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 15,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    ...SHADOW.light,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSubLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
});

export default ProfileScreen;
