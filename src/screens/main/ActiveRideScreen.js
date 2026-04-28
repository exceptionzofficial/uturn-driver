import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, Image, Linking
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import SwipeButton from 'rn-swipe-button';
import ImageResizer from 'react-native-image-resizer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import { startTrip, dropCustomer, completeTrip, updateStatus, triggerSOS } from '../../services/api';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STAGE = {
  WAY_TO_PICKUP:  'wayToPickup',
  OTP_VERIFY:     'otpVerify',
  START_ODOMETER: 'startOdometer',
  TRIP_STARTED:   'tripStarted',
  END_ODOMETER:   'endOdometer',
  TRIP_COMPLETED: 'tripCompleted',
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

const ActiveRideScreen = ({ navigation, route }) => {
  const { trip: initialTrip } = route.params || {};
  const [trip, setTrip] = useState(initialTrip || {});
  const [stage, setStage] = useState(STAGE.WAY_TO_PICKUP);
  const insets = useSafeAreaInsets();

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // Odometer & Trip Start
  const [startPhoto, setStartPhoto] = useState(null);
  const [startKm, setStartKm] = useState('');
  const [startTimeLabel, setStartTimeLabel] = useState(null);
  
  // Timers
  const [travelSecs, setTravelSecs] = useState(0);
  const [waitSecs, setWaitSecs] = useState(0);
  const [activeTimer, setActiveTimer] = useState('travel'); // 'travel' or 'wait'
  const timerInterval = useRef(null);

  // End Trip
  const [endPhoto, setEndPhoto] = useState(null);
  const [endKm, setEndKm] = useState('');

  // Extra charges modal state
  const [showCharges, setShowCharges] = useState(false);
  const [toll,    setToll]    = useState('');
  const [parking, setParking] = useState('');
  const [permit,  setPermit]  = useState('');
  const [waitCharge, setWaitCharge] = useState('');
  const [other,   setOther]   = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  // Final billing state
  const [finalData, setFinalData] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Self ride specific
  const [selfRideOtp, setSelfRideOtp] = useState(null);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [linkShared, setLinkShared] = useState(false);

  const tripId = trip?.tripId || trip?.id;
  const isSelfRide = trip?.isSelfRide || false;

  // Load Saved State
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const saved = await AsyncStorage.getItem(`@active_ride_${tripId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.stage) setStage(parsed.stage);
          if (parsed.startPhoto) setStartPhoto(parsed.startPhoto);
          if (parsed.startKm) setStartKm(parsed.startKm);
          if (parsed.startTimeLabel) setStartTimeLabel(parsed.startTimeLabel);
          if (parsed.travelSecs) setTravelSecs(parsed.travelSecs);
          if (parsed.waitSecs) setWaitSecs(parsed.waitSecs);
          if (parsed.activeTimer) setActiveTimer(parsed.activeTimer);
          if (parsed.endPhoto) setEndPhoto(parsed.endPhoto);
          if (parsed.endKm) setEndKm(parsed.endKm);
        } else {
          // Fallback to deducing from backend trip data
          if (trip.status === 'completed' || trip.status === 'commissionPending' || trip.status === 'commissionRejected') {
            setStage(STAGE.TRIP_COMPLETED);
          } else if (trip.status === 'dropped') {
            setStage(STAGE.TRIP_COMPLETED);
          } else if (trip.status === 'inProgress' && trip.tripStartedAt) {
            setStage(STAGE.TRIP_STARTED);
            // Restore startKm from backend if available
            if (trip.startKm) setStartKm(String(trip.startKm));
          } else if (trip.otpUsed) {
            setStage(STAGE.START_ODOMETER);
          } else if (trip.status === 'arrived' || trip.arrivedAt) {
            setStage(STAGE.OTP_VERIFY);
          }
          // For driverAccepted (self-ride initial), default WAY_TO_PICKUP is correct
        }
      } catch (e) {}
    };
    if (tripId) {
      loadSavedState();
      // Auto-refresh trip status to catch vendor approvals/rejections
      const interval = setInterval(async () => {
        try {
          const { getDriverTrips } = require('../../services/api');
          const dId = (await AsyncStorage.getItem('user_data')) ? JSON.parse(await AsyncStorage.getItem('user_data')).phone : null;
          if (dId) {
            const myTrips = await getDriverTrips(dId);
            const latest = myTrips.find(t => (t.tripId || t.id) === tripId);
            if (latest && latest.status !== trip.status) {
              setTrip(latest);
            }
          }
        } catch (e) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [tripId, trip.status]);

  // Save State whenever it changes
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem(`@active_ride_${tripId}`, JSON.stringify({
          stage, startPhoto, startKm, startTimeLabel,
          travelSecs, waitSecs, activeTimer,
          endPhoto, endKm
        }));
      } catch (e) {}
    };
    if (tripId) saveState();
  }, [stage, startPhoto, startKm, startTimeLabel, travelSecs, waitSecs, activeTimer, endPhoto, endKm]);

  // Timer Effect
  useEffect(() => {
    if (stage === STAGE.TRIP_STARTED) {
      timerInterval.current = setInterval(() => {
        if (activeTimer === 'travel') setTravelSecs(s => s + 1);
        if (activeTimer === 'wait') setWaitSecs(s => s + 1);
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => clearInterval(timerInterval.current);
  }, [stage, activeTimer]);


  // ── SOS Handler ────────────────────────────────────────────
  const handleSOS = () => {
    Alert.alert(
      '🚨 Send SOS Alert',
      'This will immediately notify the Admin team that you need emergency help. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS Now',
          style: 'destructive',
          onPress: async () => {
            setSosLoading(true);
            try {
              const userData = JSON.parse(await AsyncStorage.getItem('user_data') || '{}');
              await triggerSOS(tripId, userData?.phone || userData?.driverId, 'In-App Trigger');
              setSosSent(true);
              Alert.alert('✅ SOS Sent', 'Your emergency alert has been sent to the Admin. Help is on the way.');
            } catch {
              Alert.alert('Error', 'Could not send SOS. Please call emergency services directly.');
            } finally {
              setSosLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Confirm Arrival / Start Ride ───────────────────────────
  const handleArrived = async () => {
    try {
      if (isSelfRide) {
        // For self rides: auto-generate OTP so customer tracking page shows it
        setIsGeneratingOtp(true);
        try {
          const { generateRideOtp } = require('../../services/api');
          await generateRideOtp(tripId);
        } catch (e) {
          console.warn('OTP gen warning:', e);
        } finally {
          setIsGeneratingOtp(false);
        }
      }
      await updateStatus(tripId, 'arrived');
      setStage(STAGE.OTP_VERIFY);
    } catch {
      Alert.alert('Error', 'Could not update status. Please retry.');
    }
  };

  // ── Self Ride: Share Tracking Link ─────────────────────────
  const handleShareLink = async () => {
    const trackUrl = `https://uturn-nl7u.onrender.com/api/bookings/track/${tripId}`;
    try {
      await Linking.openURL(`whatsapp://send?phone=91${trip?.customerPhone || ''}&text=Hi ${trip?.customerName || 'Customer'}! Your UTurn ride is booked.%0A%0ATrack your ride and get your OTP here:%0A${trackUrl}%0A%0APlease share the OTP shown on the page with the driver to start the ride.`);
      setLinkShared(true);
    } catch {
      Alert.alert('Share Link', `Send this link to customer:\n\n${trackUrl}`, [
        { text: 'OK' }
      ]);
      setLinkShared(true);
    }
  };

  // ── OTP Input helpers ──────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setOtpError(null);
    if (val && idx < 3) otpRefs[idx + 1]?.current?.focus();
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1]?.current?.focus();
    }
  };

  const enteredOtp = otp.join('');

  // ── Verify OTP & Go to Start Odometer ──────────────────────
  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    setOtpError(null);
    try {
      if (!isSelfRide && enteredOtp === '0000') {
        // Bypass for vendor rides testing only
        setStage(STAGE.START_ODOMETER);
      } else {
        const res = await startTrip(tripId, enteredOtp);
        if (res?.success) {
          setStage(STAGE.START_ODOMETER);
        } else {
          setOtpError(res?.message || 'Incorrect OTP. Please check with customer.');
        }
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const takePhoto = async (setPhotoFn) => {
    try {
      const img = await ImagePicker.openCamera({ 
        cropping: false, 
        compressImageQuality: 0.7,
        maxWidth: 1200,
        maxHeight: 1200
      });
      
      // Secondary compression using ImageResizer to be extra safe
      const resized = await ImageResizer.createResizedImage(
        img.path,
        1000,
        1000,
        'JPEG',
        80,
        0
      );
      
      setPhotoFn(resized.uri);
    } catch (e) {
      if (e.code !== 'E_PICKER_CANCELLED') Alert.alert('Error', 'Failed to capture and process image. Please try again.');
    }
  };

  const startTheRide = async () => {
    if (!startPhoto || !startKm) {
      Alert.alert('Required', 'Please take an odometer photo and enter the reading.');
      return;
    }
    // Save startKm to backend
    try {
      await updateStatus(tripId, 'inProgress');
    } catch (e) {
      console.warn('Status update warning:', e);
    }
    const now = new Date();
    setStartTimeLabel(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setStage(STAGE.TRIP_STARTED);
  };

  const handleConfirmDrop = async () => {
    if (!endPhoto || !endKm) {
      Alert.alert('Required', 'Please take an end odometer photo and enter the reading.');
      return;
    }
    const startNum = parseFloat(startKm) || 0;
    const endNum = parseFloat(endKm) || 0;
    if (endNum < startNum) {
      Alert.alert('Invalid', 'End KM cannot be less than Start KM.');
      return;
    }

    setIsEnding(true);
    try {
      const startNum = parseFloat(startKm) || 0;
      const endNum = parseFloat(endKm) || 0;
      const dist = endNum - startNum;

      const res = await dropCustomer(tripId, {
        tollCharges:    parseFloat(toll)    || 0,
        parkingCharges: parseFloat(parking) || 0,
        permitCharges:  parseFloat(permit)  || 0,
        waitCharges:    parseFloat(waitCharge)|| 0,
        otherCharges:   parseFloat(other)   || 0,
        startKm:        startNum,
        endKm:          endNum,
        distanceKm:     dist,
      });
      if (res?.success) {
        setFinalData(res.data);
        setShowCharges(false);
        setStage(STAGE.TRIP_COMPLETED);
      } else {
        Alert.alert('Error', 'Could not end trip. Please retry.');
      }
    } catch {
      Alert.alert('Error', 'Network error while ending trip.');
    } finally {
      setIsEnding(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const res = await completeTrip(tripId);
      if (res?.success) {
        // Clean up saved state
        await AsyncStorage.removeItem(`@active_ride_${tripId}`);
        if (isSelfRide) {
          Alert.alert('Ride Complete! 🎉', 'Cash collected directly from customer. No commission applicable.', [
            { text: 'Done', onPress: () => navigation.replace('MainTabs') }
          ]);
        } else {
          Alert.alert('Done!', 'Request sent to vendor. They will verify your payment and finalize the trip.', [
            { text: 'OK', onPress: () => navigation.replace('MainTabs') }
          ]);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not mark trip complete.');
    } finally {
      setIsCompleting(false);
    }
  };

  // ── UI helpers ─────────────────────────────────────────────
  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={COLORS.primary} style={{ width: 26 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const FareRow = ({ label, value, bold }) => (
    <View style={styles.fareRow}>
      <Text style={[styles.fareLabel, bold && styles.fareBold]}>{label}</Text>
      <Text style={[styles.fareValue, bold && styles.fareBold]}>₹{value ?? 0}</Text>
    </View>
  );

  // ── STAGE: Way to Pickup ───────────────────────────────────
  const renderWayToPickup = () => (
    <View style={styles.stageCard}>
      <LinearGradient colors={isSelfRide ? ['#FFF9C4', '#FFF'] : ['#E3F2FD', '#FFF']} style={styles.cardBgGradient}>
        <View style={styles.stageBadge}>
          <Icon name={isSelfRide ? 'account-star' : 'car-arrow-right'} size={16} color={isSelfRide ? '#F57C00' : COLORS.primary} />
          <Text style={[styles.stageBadgeText, isSelfRide && { color: '#F57C00' }]}>{isSelfRide ? 'Self Ride' : 'Way to Pickup'}</Text>
        </View>
        <Text style={styles.customerName}>{trip?.revealedCustomerName || trip?.customerName || 'Customer'}</Text>
        <TouchableOpacity 
          style={styles.callBtn}
          onPress={() => trip?.customerPhone && Linking.openURL(`tel:${trip.customerPhone}`)}
        >
          <Icon name="phone-in-talk" size={20} color={COLORS.success} />
          <Text style={styles.callBtnText}>Call Customer: {trip?.customerPhone || trip?.revealedCustomerPhone || 'N/A'}</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />

        <InfoRow icon="map-marker-radius" label="Pickup" value={trip?.pickupAddress || trip?.pickup || '—'} />
        <InfoRow icon="map-marker-check" label="Drop" value={trip?.dropAddress || trip?.drop || '—'} />
        <InfoRow icon="car-info" label="Vehicle" value={trip?.vehicleType || trip?.vehicle || '—'} />
        
        <View style={styles.fareSummary}>
          <Text style={styles.fareTitle}>Estimated Fare</Text>
          <Text style={styles.fareTotal}>₹{trip?.totalFare || trip?.totalTripAmount || 0}</Text>
        </View>

        {/* Self Ride: Share Link only */}
        {isSelfRide && (
          <View style={{ marginBottom: 10 }}>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleShareLink}
            >
              <LinearGradient colors={linkShared ? ['#66BB6A', '#43A047'] : ['#1976D2', '#0D47A1']} style={styles.btnGradient}>
                <Icon name={linkShared ? 'check-all' : 'share-variant'} size={22} color="#fff" />
                <Text style={styles.btnText}>{linkShared ? 'Link Shared ✓' : 'Share Link to Customer'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity style={styles.primaryBtn} onPress={handleArrived} activeOpacity={0.8} disabled={isGeneratingOtp}>
          <LinearGradient colors={isSelfRide ? ['#4CAF50', '#2E7D32'] : ['#2196F3', '#1565C0']} style={styles.btnGradient}>
            {isGeneratingOtp 
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Icon name={isSelfRide ? 'play-circle' : 'map-marker-check'} size={24} color="#fff" />
                  <Text style={styles.btnText}>{isSelfRide ? 'Start Ride' : 'Confirm Arrival'}</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // ── STAGE: OTP Verification ────────────────────────────────
  const renderOtpVerify = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
      <View style={[styles.stageCard, { flex: 1, justifyContent: 'center' }]}>
        <LinearGradient colors={['#F3E5F5', '#FFF']} style={styles.cardBgGradient}>
          <View style={styles.stageBadge}>
            <Icon name="shield-key" size={18} color="#9C27B0" />
            <Text style={[styles.stageBadgeText, { color: '#9C27B0' }]}>OTP Verification</Text>
          </View>
          
          <Text style={styles.otpInstruction}>
            {isSelfRide 
              ? <>Ask customer for the OTP from{`\n`}<Text style={{color: '#9C27B0', fontSize: 24}}>their tracking link</Text></>
              : <>Ask customer for their{`\n`}<Text style={{color: COLORS.primary, fontSize: 24}}>4-digit ride OTP</Text></>
            }
          </Text>
          {isSelfRide 
            ? <Text style={{textAlign: 'center', color: COLORS.textMuted, marginBottom: 30}}>Customer can see the OTP on the tracking link you shared</Text>
            : <Text style={{textAlign: 'center', color: COLORS.textMuted, marginBottom: 30}}>(Use 0000 for testing)</Text>
          }

          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={otpRefs[idx]}
                style={[styles.otpBox, otpError && styles.otpBoxError, digit && styles.otpBoxFilled]}
                value={digit}
                onChangeText={v => handleOtpChange(v, idx)}
                onKeyPress={e => handleOtpKeyPress(e, idx)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {otpError ? (
            <View style={[styles.errorRow, {justifyContent: 'center'}]}>
              <Icon name="alert-circle" size={16} color="#F44336" />
              <Text style={styles.errorText}>{otpError}</Text>
            </View>
          ) : null}

          <View style={{marginTop: 'auto', paddingTop: 20}}>
            <TouchableOpacity
              style={[styles.primaryBtn, enteredOtp.length < 4 && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={enteredOtp.length < 4 || isVerifying}
            >
              <LinearGradient
                colors={enteredOtp.length < 4 ? ['#B0BEC5', '#90A4AE'] : ['#9C27B0', '#7B1FA2']}
                style={styles.btnGradient}
              >
                {isVerifying
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Icon name="check-circle" size={24} color="#fff" />
                      <Text style={styles.btnText}>Verify & Continue</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );

  // ── STAGE: Start Odometer ──────────────────────────────────
  const renderStartOdometer = () => (
    <View style={[styles.stageCard, { flex: 1 }]}>
      <LinearGradient colors={['#E0F7FA', '#FFF']} style={styles.cardBgGradient}>
        <View style={styles.stageBadge}>
          <Icon name="speedometer" size={18} color="#00BCD4" />
          <Text style={[styles.stageBadgeText, { color: '#00BCD4' }]}>Start Odometer</Text>
        </View>
        <Text style={{fontSize: 20, fontWeight: '900', marginBottom: 20, color: COLORS.text}}>Capture starting odometer</Text>
        
        {startPhoto ? (
          <View style={styles.fullPhotoContainer}>
            <Image source={{uri: startPhoto}} style={styles.fullPhoto} />
            <TouchableOpacity style={styles.retakeBtn} onPress={() => takePhoto(setStartPhoto)}>
              <Icon name="camera-retake" size={20} color="#fff" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.fullPhotoPlaceholder} onPress={() => takePhoto(setStartPhoto)}>
            <Icon name="camera-plus" size={60} color={COLORS.textMuted} />
            <Text style={{color: COLORS.textMuted, marginTop: 15, fontSize: 16, fontWeight: '700'}}>Tap to Capture Odometer</Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Reading in KM</Text>
          <TextInput
            style={styles.fullKmInput}
            placeholder="0.0"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={startKm}
            onChangeText={setStartKm}
          />
        </View>

        <View style={{marginTop: 'auto', paddingTop: 20}}>
          <TouchableOpacity style={styles.primaryBtn} onPress={startTheRide}>
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.btnGradient}>
              <Icon name="play-circle" size={24} color="#fff" />
              <Text style={styles.btnText}>Start Ride Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // ── STAGE: Trip Started ────────────────────────────────────
  const renderTripStarted = () => (
    <View style={styles.stageCard}>
      <LinearGradient colors={['#FFF9C4', '#FFF']} style={styles.cardBgGradient}>
        <View style={styles.stageBadge}>
          <Icon name="road-variant" size={16} color="#F57C00" />
          <Text style={[styles.stageBadgeText, { color: '#F57C00' }]}>Trip In Progress</Text>
        </View>
        <InfoRow icon="map-marker-check" label="Drop" value={trip?.dropAddress || trip?.drop || '—'} />
        <View style={styles.startTimeBox}>
          <Icon name="clock-start" size={18} color={COLORS.textMuted} />
          <Text style={styles.startTimeLabel}>Started at: <Text style={{color: COLORS.text}}>{startTimeLabel}</Text></Text>
        </View>

        <View style={styles.timerContainer}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.timerBox, activeTimer === 'travel' && styles.timerActive]} 
            onPress={() => setActiveTimer('travel')}
          >
            <Icon name="steering" size={24} color={activeTimer === 'travel' ? '#fff' : COLORS.success} />
            <Text style={[styles.timerTitle, activeTimer === 'travel' && {color: '#fff'}]}>Travel</Text>
            <Text style={[styles.timerValue, activeTimer === 'travel' && {color: '#fff'}]}>{formatTime(travelSecs)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.timerBox, activeTimer === 'wait' && styles.timerWaitActive]} 
            onPress={() => setActiveTimer('wait')}
          >
            <Icon name="pause-circle" size={24} color={activeTimer === 'wait' ? '#fff' : COLORS.accentOrange} />
            <Text style={[styles.timerTitle, activeTimer === 'wait' && {color: '#fff'}]}>Wait</Text>
            <Text style={[styles.timerValue, activeTimer === 'wait' && {color: '#fff'}]}>{formatTime(waitSecs)}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 20 }}>
          <SwipeButton
            onSwipeSuccess={() => setStage(STAGE.END_ODOMETER)}
            railBackgroundColor="#FEE2E2"
            railBorderColor="#FECACA"
            thumbIconBackgroundColor="#EF4444"
            thumbIconComponent={() => <Icon name="flag-checkered" size={24} color="#fff" />}
            title="Swipe to End Trip"
            titleColor="#B91C1C"
            titleFontSize={16}
            titleStyles={{ fontWeight: '900' }}
            containerStyles={{ borderRadius: 20, height: 64, borderWidth: 1, borderColor: '#FCA5A5' }}
            railFillBackgroundColor="#FCA5A5"
            railFillBorderColor="#EF4444"
            thumbIconBorderColor="#EF4444"
            shouldResetAfterSuccess={true}
            resetAfterSuccessAnimDelay={100}
          />
        </View>
      </LinearGradient>
    </View>
  );

  // ── STAGE: End Odometer ────────────────────────────────────
  const renderEndOdometer = () => (
    <View style={[styles.stageCard, { flex: 1 }]}>
      <LinearGradient colors={['#FFEBEE', '#FFF']} style={styles.cardBgGradient}>
        <View style={styles.stageBadge}>
          <Icon name="flag-checkered" size={18} color="#F44336" />
          <Text style={[styles.stageBadgeText, { color: '#F44336' }]}>End Odometer</Text>
        </View>
        <Text style={{fontSize: 20, fontWeight: '900', marginBottom: 20, color: COLORS.text}}>Capture ending odometer</Text>
        
        {endPhoto ? (
          <View style={styles.fullPhotoContainer}>
            <Image source={{uri: endPhoto}} style={styles.fullPhoto} />
            <TouchableOpacity style={styles.retakeBtn} onPress={() => takePhoto(setEndPhoto)}>
              <Icon name="camera-retake" size={20} color="#fff" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.fullPhotoPlaceholder} onPress={() => takePhoto(setEndPhoto)}>
            <Icon name="camera-plus" size={60} color={COLORS.textMuted} />
            <Text style={{color: COLORS.textMuted, marginTop: 15, fontSize: 16, fontWeight: '700'}}>Tap to Capture Odometer</Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Final Reading (KM)</Text>
          <TextInput
            style={styles.fullKmInput}
            placeholder="0.0"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={endKm}
            onChangeText={setEndKm}
          />
        </View>

        {(startKm && endKm && (parseFloat(endKm) >= parseFloat(startKm))) && (
          <View style={{padding: 15, backgroundColor: '#E8F5E9', borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <Icon name="map-marker-distance" size={24} color="#2E7D32" />
            <View>
              <Text style={{color: COLORS.textMuted, fontSize: 12}}>Trip Distance</Text>
              <Text style={{color: '#2E7D32', fontWeight: '900', fontSize: 18}}>{(parseFloat(endKm) - parseFloat(startKm)).toFixed(1)} km</Text>
            </View>
          </View>
        )}

        <View style={{marginTop: 'auto', paddingTop: 20}}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCharges(true)}>
            <LinearGradient colors={['#F44336', '#B71C1C']} style={styles.btnGradient}>
              <Icon name="calculator" size={24} color="#fff" />
              <Text style={styles.btnText}>Calculate Final Fare</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // ── STAGE: Trip Completed (billing) ───────────────────────
  const renderTripCompleted = () => {
    const d = finalData || trip;
    const baseTotal = parseFloat(d?.finalFare || d?.totalFare || 0);
    const extraToll = parseFloat(d?.tollCharges || toll || 0);
    const extraWait = parseFloat(d?.waitFare || waitCharge || 0);
    const extraPark = parseFloat(d?.parkingCharges || parking || 0);
    const extraPermit = parseFloat(d?.permitCharges || permit || 0);
    const extraOther = parseFloat(d?.otherCharges || other || 0);
    
    // Visually sum up the total if finalData isn't completely reflecting it yet
    const visualTotal = finalData ? baseTotal : (baseTotal + extraToll + extraWait + extraPark + extraPermit + extraOther);

    return (
      <View style={styles.stageCard}>
        <View style={[styles.stageBadge, { backgroundColor: '#E8F5E9' }]}>
          <Icon name="check-decagram" size={16} color="#4CAF50" />
          <Text style={[styles.stageBadgeText, { color: '#4CAF50' }]}>Trip Completed</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={styles.receiptTitle}>Final Bill</Text>
          <TouchableOpacity 
            onPress={() => setShowCharges(true)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 }}
          >
            <Icon name="pencil-outline" size={14} color={COLORS.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>Edit Bill</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fareCard}>
          <FareRow label="Base Fare"       value={d?.baseFare} />
          <FareRow label="Distance Charge" value={d?.distanceCharge} />
          <FareRow label="Driver Bata"     value={d?.driverBata} />
          <FareRow label="Wait Charges"    value={extraWait} />
          <FareRow label="Toll"            value={extraToll} />
          <FareRow label="Parking"         value={extraPark} />
          <FareRow label="Permit"          value={extraPermit} />
          <FareRow label="Other"           value={extraOther} />
          <View style={styles.fareDivider} />
          <FareRow label="Total Fare"      value={visualTotal} bold />
          {!isSelfRide && (
            <>
              <FareRow label="Commission"      value={d?.vendorCommission || d?.commission} />
              <FareRow label="Your Payout"     value={d?.driverPayout} bold />
            </>
          )}
        </View>

        <View style={styles.paymentModeTag}>
          <Icon name={isSelfRide ? 'cash-fast' : (d?.paymentMode === 'customer_pays_vendor' ? 'account-cash' : 'cash')} size={16} color={isSelfRide ? '#4CAF50' : COLORS.primary} />
          <Text style={[styles.paymentModeText, isSelfRide && { color: '#4CAF50' }]}>
            {isSelfRide
              ? 'Collect cash directly from customer (No Commission)'
              : d?.paymentMode === 'customer_pays_vendor'
                ? 'Vendor collects payment from customer'
                : 'You collect cash from customer'}
          </Text>
        </View>

        {!isSelfRide && d?.status === 'commissionRejected' && (
          <View style={{backgroundColor: '#FFEbee', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#FFCDD2'}}>
            <Text style={{color: '#D32F2F', fontWeight: 'bold', marginBottom: 5}}>Vendor Rejected Verification</Text>
            <Text style={{color: '#D32F2F', fontSize: 13}}>Message: {d?.rejectReason || d?.commissionRejectReason || 'No reason provided.'}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.primaryBtn, !isSelfRide && d?.status === 'commissionApproved' && {opacity: 0.7}]} 
          onPress={handleComplete} 
          disabled={isCompleting || (!isSelfRide && d?.status === 'commissionApproved')}
        >
          <LinearGradient colors={isSelfRide ? ['#FF9800', '#E65100'] : ['#4CAF50', '#2E7D32']} style={styles.btnGradient}>
            {isCompleting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Icon name={isSelfRide ? 'cash-check' : 'shield-check'} size={20} color="#fff" />
                  <Text style={styles.btnText}>
                    {isSelfRide
                      ? 'Collect Cash & Complete Ride'
                      : d?.status === 'commissionApproved' 
                        ? 'Payment Verified by Vendor' 
                        : d?.status === 'commissionRejected' 
                          ? 'Re-submit for Verification' 
                          : 'Submit for Vendor Verification'}
                  </Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Extra Charges Modal ────────────────────────────────────
  const renderChargesModal = () => (
    <Modal visible={showCharges} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Extra Charges</Text>
            <Text style={styles.modalSubtitle}>Enter any out-of-pocket expenses (optional)</Text>

            <ScrollView>
              {[
                { label: 'Wait Charges (₹)',value: waitCharge, setter: setWaitCharge, icon: 'clock-time-eight' },
                { label: 'Toll Charges',    value: toll,    setter: setToll,    icon: 'road' },
                { label: 'Permit Charges',  value: permit,  setter: setPermit,  icon: 'file-document' },
                { label: 'Parking Charges', value: parking, setter: setParking, icon: 'parking' },
                { label: 'Other Charges',   value: other,   setter: setOther,   icon: 'dots-horizontal-circle' },
              ].map(({ label, value, setter, icon }) => (
                <View key={label} style={styles.chargeInputRow}>
                  <Icon name={icon} size={20} color={COLORS.textMuted} style={styles.chargeIcon} />
                  <View style={styles.chargeInputWrap}>
                    <Text style={styles.chargeLabel}>{label}</Text>
                    <TextInput
                      style={styles.chargeInput}
                      value={value}
                      onChangeText={setter}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <Text style={styles.rupeeSymbol}>₹</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCharges(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, isEnding && styles.btnDisabled]}
                onPress={handleConfirmDrop}
                disabled={isEnding}
              >
                <LinearGradient colors={['#F44336', '#B71C1C']} style={styles.confirmBtnGrad}>
                  {isEnding
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.confirmBtnText}>Confirm & End Trip</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Ride</Text>
        <Text style={styles.tripId}>#{(tripId || '').slice(-8)}</Text>
        {/* SOS Button — always visible during active ride */}
        <TouchableOpacity
          style={[styles.sosBtn, sosSent && styles.sosBtnSent]}
          onPress={handleSOS}
          disabled={sosLoading || sosSent}
        >
          {sosLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>{sosSent ? 'SENT' : 'SOS'}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {stage === STAGE.WAY_TO_PICKUP  && renderWayToPickup()}
        {stage === STAGE.OTP_VERIFY     && renderOtpVerify()}
        {stage === STAGE.START_ODOMETER && renderStartOdometer()}
        {stage === STAGE.TRIP_STARTED   && renderTripStarted()}
        {stage === STAGE.END_ODOMETER   && renderEndOdometer()}
        {stage === STAGE.TRIP_COMPLETED && renderTripCompleted()}
      </ScrollView>

      {renderChargesModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.text },
  tripId: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  sosBtn: {
    backgroundColor: '#EF4444', width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 5, elevation: 5,
  },
  sosBtnSent: { backgroundColor: '#9CA3AF' },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  stageCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 0,
    ...SHADOW.medium, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden'
  },
  stageBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20,
  },
  stageBadgeText: { marginLeft: 6, fontSize: 12, fontWeight: '800', color: COLORS.primary },
  customerName: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, width: 60 },
  infoValue: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '600' },
  cardBgGradient: { padding: 24, borderRadius: 24 },
  callBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', 
    padding: 12, borderRadius: 12, marginBottom: 15, gap: 10,
    borderWidth: 1, borderColor: '#C8E6C9'
  },
  callBtnText: { fontSize: 15, color: COLORS.success, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 15 },
  startTimeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  startTimeLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  fareSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginVertical: 16,
  },
  fareTitle: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  fareTotal: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, gap: 10 },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
  // OTP
  otpInstruction: { fontSize: 16, textAlign: 'center', color: COLORS.textMuted, marginBottom: 20, fontWeight: '600', lineHeight: 28 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 30 },
  otpBox: { 
    width: 65, height: 75, backgroundColor: '#F8FAFC', borderRadius: 16, 
    borderWidth: 2, borderColor: '#E2E8F0', fontSize: 32, fontWeight: '900', 
    color: COLORS.primary 
  },
  otpBoxFilled: { borderColor: '#9C27B0', backgroundColor: '#F3E5F5' },
  otpBoxError: { borderColor: '#F44336', backgroundColor: '#FFEBEE' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  errorText: { color: '#F44336', fontSize: 13, fontWeight: '600' },
  // Odometer
  photoPlaceholder: { height: 150, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  kmInput: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  // Timers
  timerContainer: { flexDirection: 'row', gap: 15, marginVertical: 20 },
  timerBox: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  timerActive: { backgroundColor: '#4CAF50', borderColor: '#2E7D32' },
  timerWaitActive: { backgroundColor: '#FF9800', borderColor: '#E65100' },
  timerTitle: { fontSize: 14, color: COLORS.textMuted, fontWeight: '700', marginBottom: 8 },
  timerValue: { fontSize: 24, fontWeight: '900', color: COLORS.text, fontVariant: ['tabular-nums'] },
  // Billing
  receiptTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 16 },
  fareCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 16 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  fareLabel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  fareValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  fareBold: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  fareDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  // Full UI additions
  fullPhotoContainer: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: '#000' },
  fullPhoto: { width: '100%', height: '100%' },
  retakeBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  retakeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  fullPhotoPlaceholder: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 8, marginLeft: 4 },
  fullKmInput: { backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 20, paddingVertical: 16, fontSize: 28, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  fareDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  paymentModeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  paymentModeText: { fontSize: 13, color: COLORS.primary, fontWeight: '700', flex: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  chargeInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  chargeIcon: { marginRight: 12 },
  chargeInputWrap: { flex: 1 },
  chargeLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 4 },
  chargeInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, fontWeight: '700', color: COLORS.text,
  },
  rupeeSymbol: { fontSize: 18, fontWeight: '800', color: COLORS.textMuted, marginLeft: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', height: 52 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  confirmBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  confirmBtnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default ActiveRideScreen;
