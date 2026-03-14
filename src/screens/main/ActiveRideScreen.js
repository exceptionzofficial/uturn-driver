import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';

const ActiveRideScreen = ({ navigation }) => {
  const [status, setStatus] = useState('Arrived');

  const handleStatusUpdate = () => {
    if (status === 'Arrived') setStatus('Start');
    else if (status === 'Start') setStatus('In Progress');
    else if (status === 'In Progress') setStatus('Complete');
    else if (status === 'Complete') navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapMock}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800' }} 
          style={styles.mapImage} 
        />
        <View style={styles.mapOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.detailsSheet}>
        <View style={styles.dragHandle} />
        
        <View style={styles.passengerInfo}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' }} 
            style={styles.passengerAvatar} 
          />
          <View style={styles.passengerText}>
            <Text style={styles.passengerName}>Jennifer Smith</Text>
            <View style={styles.ratingRow}>
              <Icon name="star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>4.9 (24 rides)</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.roundButton}>
              <Icon name="phone" size={20} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundButton, { marginLeft: 10 }]}>
              <Icon name="message-square" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.locationLabel}>Pickup: </Text>
            <Text style={styles.locationValue}>Kaveri Nagar, Erode</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.locationLabel}>Drop: </Text>
            <Text style={styles.locationValue}>Coimbatore Airport</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Estimated Fare</Text>
          <Text style={styles.priceValue}>₹1,200</Text>
        </View>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleStatusUpdate}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={status === 'Complete' ? ['#10B981', '#059669'] : COLORS.buttonGradient}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              {status === 'Arrived' ? 'Confirm Arrival' : 
               status === 'Start' ? 'Start Trip' : 
               status === 'In Progress' ? 'End Trip' : 'Finish & Go Home'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapMock: {
    flex: 1,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.medium,
  },
  detailsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingTop: SPACING.md,
    ...SHADOW.medium,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  passengerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  passengerText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: SPACING.lg,
  },
  locationSection: {
    marginBottom: SPACING.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  locationValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
  },
  priceLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  actionButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradientButton: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
});

export default ActiveRideScreen;
