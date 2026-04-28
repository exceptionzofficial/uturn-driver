import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Dimensions, Alert, Modal,
  FlatList, ActivityIndicator, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, SHADOW, SPACING } from '../../theme/AppTheme';
import { createSelfRide } from '../../services/api';

const { width } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyAs3nkKoCsndZiXeV6oh0PvRLL7FpMiZ4k';

const VEHICLE_TYPES = [
  { id: '1', name: 'Bike', icon: 'motorbike', category: 'Passenger' },
  { id: '2', name: 'Auto', icon: 'van-passenger', category: 'Passenger' },
  { id: '3', name: 'Sedan', icon: 'car', category: 'Passenger' },
  { id: '4', name: 'SUV', icon: 'car-estate', category: 'Passenger' },
  { id: '5', name: 'Van', icon: 'van-passenger', category: 'Passenger' },
  { id: '6', name: 'Bus', icon: 'bus', category: 'Passenger' },
  { id: '7', name: 'Mini Truck', icon: 'truck-delivery', category: 'Load' },
  { id: '8', name: 'Truck', icon: 'truck', category: 'Load' },
  { id: '9', name: 'Lorry', icon: 'truck-cargo-container', category: 'Load' },
];

const TRIP_TYPE_OPTIONS = [
  { id: '1', name: 'One Way', key: 'One Way', icon: 'arrow-right-bold-circle' },
  { id: '2', name: 'Round Trip', key: 'Round Trip', icon: 'swap-horizontal-bold' },
  { id: '3', name: 'Local', key: 'Local', icon: 'map-marker-radius' },
  { id: '4', name: 'Rental', key: 'Rental', icon: 'clock-fast' },
  { id: '5', name: 'Tour Package', key: 'Tour Package', icon: 'island' },
  { id: '6', name: 'Out Station', key: 'Out Station', icon: 'map-marker-distance' },
];

const RENTAL_TYPES = [
  { id: 'hourly', name: 'Hourly', icon: 'timer-outline' },
  { id: 'day', name: 'Day', icon: 'calendar-today' },
];

const LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Others'];

const SelfRideScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef(null);
  const mapRef = useRef(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerLanguage: 'Tamil',
    category: 'Passenger',
    numberOfPeople: 1,
    loadCapacity: '',
    pickup: '',
    drop: '',
    pickupCoords: null,
    dropCoords: null,
    tripType: 'One Way',
    rentalType: 'Hourly',
    vehicle: 'Sedan',
    scheduledDate: new Date().toLocaleDateString('en-IN'),
    scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    returnDate: '',
    returnTime: '',
    stops: [],
    
    baseFare: '0',
    perKmRate: '0',
    waitingCharge: '0',
    driverBata: '0',
    nightAllowance: '0',
    hillsAllowance: '0',
    totalTripAmount: '0',
    
    estimatedDistance: '',
    estimatedTime: '',
  });

  const [isLangModalVisible, setLangModalVisible] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Set user vehicle automatically on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await AsyncStorage.getItem('user_data');
        if (res) {
          const user = JSON.parse(res);
          setUserData(user);
          const v = user.vehicleType || user.vehicle || 'Sedan';
          const vData = VEHICLE_TYPES.find(x => x.name === v);
          if (vData) {
            setFormData(prev => ({
              ...prev,
              vehicle: v,
              category: vData.category,
            }));
          }
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Total Fare Auto-calculate Effect
  useEffect(() => {
    const base = parseFloat(formData.baseFare) || 0;
    const pm = parseFloat(formData.perKmRate) || 0;
    const db = parseFloat(formData.driverBata) || 0;
    const na = parseFloat(formData.nightAllowance) || 0;
    const ha = parseFloat(formData.hillsAllowance) || 0;

    let distVal = 0;
    if (formData.estimatedDistance) {
      const cleaned = formData.estimatedDistance.replace(/,/g, '');
      const match = cleaned.match(/([\d.]+)/);
      if (match) distVal = parseFloat(match[1]);
    }

    const computed = base + (distVal * pm) + db + na + ha;
    
    if (computed > 0 && Math.abs(computed - parseFloat(formData.totalTripAmount)) > 1) {
       setFormData(prev => ({ ...prev, totalTripAmount: Math.round(computed).toString() }));
    }
  }, [formData.baseFare, formData.perKmRate, formData.driverBata, formData.nightAllowance, formData.hillsAllowance, formData.estimatedDistance]);

  // Check Customer info when 10 digits are filled
  useEffect(() => {
    const checkCust = async () => {
      if (formData.customerPhone?.length === 10) {
        try {
          const res = await fetch('https://uturn-nl7u.onrender.com/api/vendors/check-customer?phone=' + formData.customerPhone);
          const data = await res.json();
          if (data.exists) {
            setFormData(prev => ({ 
              ...prev, 
              customerName: data.name || prev.customerName,
              customerLanguage: data.language || prev.customerLanguage 
            }));
            Alert.alert('Customer Found', `Welcome back, ${data.name || 'Customer'}`);
          }
        } catch (e) {}
      }
    };
    checkCust();
  }, [formData.customerPhone]);

  // Suggestions Fetcher
  const fetchSuggestions = async (query) => {
    if (query.length < 3) return;
    setIsSearching(true);
    try {
      const resp = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`);
      const data = await resp.json();
      setSuggestions(data.predictions || []);
    } catch (e) {
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async (place) => {
    const field = activeField;
    setFormData(p => ({ ...p, [field]: place.description }));
    setActiveField(null);
    setSuggestions([]);
    setSearchQuery('');

    // Fetch Coordinates
    try {
      const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${place.place_id}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await resp.json();
      if (data.results[0]) {
        const coords = data.results[0].geometry.location;
        const latlng = { latitude: coords.lat, longitude: coords.lng };
        setFormData(p => ({ ...p, [field + 'Coords']: latlng }));

        const newForm = { ...formData, [field + 'Coords']: latlng };

        if (newForm.pickupCoords && newForm.dropCoords) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates([newForm.pickupCoords, newForm.dropCoords], { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
          }, 500);

          try {
            const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${newForm.pickupCoords.latitude},${newForm.pickupCoords.longitude}&destinations=${newForm.dropCoords.latitude},${newForm.dropCoords.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
            const distResp = await fetch(distUrl);
            const distData = await distResp.json();
            if (distData.rows[0]?.elements[0]?.status === "OK") {
              const distanceText = distData.rows[0].elements[0].distance.text;
              const durationText = distData.rows[0].elements[0].duration.text;
              setFormData(p => ({ ...p, estimatedDistance: distanceText, estimatedTime: durationText }));
            }
          } catch(e) {}
        } else {
          mapRef.current?.animateToRegion({ ...latlng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 1000);
        }
      }
    } catch (e) {}
  };

  const addStop = () => setFormData(p => ({ ...p, stops: [...p.stops, ''] }));
  const updateStop = (val, idx) => {
    const newStops = [...formData.stops];
    newStops[idx] = val;
    setFormData(p => ({ ...p, stops: newStops }));
  };
  const removeStop = (idx) => {
    const newStops = formData.stops.filter((_, i) => i !== idx);
    setFormData(p => ({ ...p, stops: newStops }));
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.pickup || !formData.drop) {
      Alert.alert('Required Fields', 'Please fill all mandatory details (Customer Info, Pickup, Drop).');
      return;
    }
    if (formData.customerPhone.length < 10) return Alert.alert('Error', 'Invalid Phone Number');

    setLoading(true);
    try {
      const totalAmt = parseFloat(formData.totalTripAmount || 0);
      const bFare = parseFloat(formData.baseFare || 0);
      const dBata = parseFloat(formData.driverBata || 0);
      const nAllw = parseFloat(formData.nightAllowance || 0);
      const hAllw = parseFloat(formData.hillsAllowance || 0);
      const dCharge = totalAmt - bFare - dBata - nAllw - hAllw;

      const res = await createSelfRide({
        isSelfRide: true,
        vendorId: userData?.phone || 'SELF',
        driverId: userData?.phone || userData?.driverId,
        driverName: userData?.name || 'Self',
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerLanguage: formData.customerLanguage,
        pickup: formData.pickup,
        drop: formData.drop,
        pickupAddress: formData.pickup,
        dropAddress: formData.drop,
        pickupCoords: formData.pickupCoords || { latitude: 0, longitude: 0 },
        dropCoords: formData.dropCoords || { latitude: 0, longitude: 0 },
        additionalStops: formData.stops.filter(s => s.trim()),
        vehicleType: formData.vehicle,
        vehicle: formData.vehicle,
        category: formData.category,
        tripType: formData.tripType,
        numberOfPeople: parseInt(formData.numberOfPeople) || 1,
        loadCapacity: formData.loadCapacity,
        scheduleDate: formData.scheduledDate,
        scheduleTime: formData.scheduledTime,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime,
        baseFare: bFare,
        perKmRate: parseFloat(formData.perKmRate) || 0,
        driverBata: dBata,
        nightAllowance: nAllw,
        hillsAllowance: hAllw,
        waitingChargesPerMin: parseFloat(formData.waitingCharge) || 0,
        distanceCharge: dCharge > 0 ? dCharge.toFixed(2) : '0',
        estimatedDistance: formData.estimatedDistance,
        estimatedTime: formData.estimatedTime,
        totalFare: totalAmt,
        totalTripAmount: totalAmt,
        paymentMode: 'pay_driver',
        vendorCommission: 0,
        vendorCommissionPercentage: 0,
        status: 'driverAccepted',
      });
      
      if (res?.success) {
         // Build the trip object for ActiveRide
         const createdTrip = {
           tripId: res.tripId,
           isSelfRide: true,
           customerName: formData.customerName,
           customerPhone: formData.customerPhone,
           revealedCustomerName: formData.customerName,
           revealedCustomerPhone: formData.customerPhone,
           pickup: formData.pickup,
           drop: formData.drop,
           pickupAddress: formData.pickup,
           dropAddress: formData.drop,
           pickupCoords: formData.pickupCoords,
           dropCoords: formData.dropCoords,
           vehicleType: formData.vehicle,
           vehicle: formData.vehicle,
           tripType: formData.tripType,
           baseFare: bFare,
           distanceCharge: dCharge > 0 ? parseFloat(dCharge.toFixed(2)) : 0,
           driverBata: dBata,
           nightAllowance: nAllw,
           hillsAllowance: hAllw,
           totalFare: totalAmt,
           totalTripAmount: totalAmt,
           estimatedDistance: formData.estimatedDistance,
           estimatedTime: formData.estimatedTime,
           paymentMode: 'pay_driver',
           vendorCommission: 0,
           status: 'driverAccepted',
         };
         Alert.alert('Trip Created', 'Self ride created! You can see it in your active rides.', [
           { text: 'Go to Trips', onPress: () => navigation.navigate('MyTask') }
         ]);
      } else {
         Alert.alert('Error', 'Failed to publish trip');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while publishing.');
    } finally {
      setLoading(false);
    }
  };

  const renderPricingRow = (label, val, key) => (
    <View style={styles.pricingInputRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <View style={styles.priceInputWrapper}>
        <TextInput
          style={styles.priceInput}
          value={val === '0' ? '' : val}
          placeholder="0"
          placeholderTextColor="#000"
          keyboardType="numeric"
          onChangeText={(t) => setFormData({ ...formData, [key]: t })}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerActionBtn}>
          <Icon name="arrow-left" size={26} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Self Booking</Text>
        <View style={styles.headerActionBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Customer Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Customer Details</Text>
          <View style={styles.inputField}>
            <Icon name="phone" size={20} color={COLORS.primary} style={styles.fieldIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Mobile Number"
              placeholderTextColor="#000"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.customerPhone}
              onChangeText={(t) => setFormData({ ...formData, customerPhone: t })}
            />
          </View>
          <View style={styles.inputField}>
            <Icon name="account" size={20} color={COLORS.primary} style={styles.fieldIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Customer Name"
              placeholderTextColor="#000"
              value={formData.customerName}
              onChangeText={(t) => setFormData({ ...formData, customerName: t })}
            />
          </View>
          <TouchableOpacity style={styles.inputField} onPress={() => setLangModalVisible(true)}>
            <Icon name="translate" size={20} color={COLORS.primary} style={styles.fieldIcon} />
            <Text style={styles.textInput}>{formData.customerLanguage}</Text>
            <Icon name="chevron-down" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Trip Configuration */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Trip Configuration</Text>

          {/* Vehicle Info Locked */}
          <View style={[styles.inputField, { backgroundColor: '#F8F9FD', borderColor: COLORS.primary + '40' }]}>
             <Icon name={VEHICLE_TYPES.find(v => v.name === formData.vehicle)?.icon || 'car'} size={24} color={COLORS.primary} style={styles.fieldIcon} />
             <View style={{ flex: 1 }}>
               <Text style={[styles.textInput, { color: COLORS.primaryDark, fontWeight: '800' }]}>{formData.vehicle}</Text>
               <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Auto-selected from your profile</Text>
             </View>
             <Icon name="lock" size={18} color={COLORS.textMuted} />
          </View>

          {formData.category === 'Passenger' ? (
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Number of Passengers</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => setFormData({ ...formData, numberOfPeople: Math.max(1, formData.numberOfPeople - 1) })}>
                  <Icon name="minus-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{formData.numberOfPeople}</Text>
                <TouchableOpacity onPress={() => setFormData({ ...formData, numberOfPeople: formData.numberOfPeople + 1 })}>
                  <Icon name="plus-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Load Capacity Needed</Text>
              <TextInput
                style={styles.capacityInput}
                placeholder="e.g. 500kg, 2 Tons"
                placeholderTextColor="#000"
                value={formData.loadCapacity}
                onChangeText={(t) => setFormData({ ...formData, loadCapacity: t })}
              />
            </View>
          )}

          <Text style={styles.subHeaderStyle}>Trip Type</Text>
          <View style={styles.tripTypeGrid}>
            {TRIP_TYPE_OPTIONS.map((item) => {
              if (formData.vehicle === 'Bike' || formData.vehicle === 'Auto') {
                if (item.key !== 'Local' && item.key !== 'Rental') return null;
              }
              if ((item.key === 'Tour Package' || item.key === 'Out Station') && formData.category !== 'Passenger') return null;

              const isActive = formData.tripType === item.key;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.tripTypeCard, isActive && styles.tripTypeCardActive]}
                  onPress={() => setFormData({ ...formData, tripType: item.key })}
                >
                  <Icon name={item.icon} size={26} color={isActive ? '#FFF' : COLORS.primary} />
                  <Text style={[styles.tripTypeLabel, isActive && styles.tripTypeLabelActive]}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {formData.tripType === 'Rental' && (
            <View style={styles.rentalTypeRow}>
              {RENTAL_TYPES.map((rt) => {
                const isRtActive = formData.rentalType === rt.name;
                return (
                  <TouchableOpacity
                    key={rt.id}
                    activeOpacity={0.7}
                    style={[styles.rentalTypeChip, isRtActive && styles.rentalTypeChipActive]}
                    onPress={() => setFormData({ ...formData, rentalType: rt.name })}
                  >
                    <Icon name={rt.icon} size={18} color={isRtActive ? '#FFF' : COLORS.textMuted} />
                    <Text style={[styles.rentalTypeText, isRtActive && styles.rentalTypeTextActive]}>{rt.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Map & Route */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Location & Route</Text>

          <View style={styles.locationContainer}>
            <TouchableOpacity style={styles.locationField} onPress={() => setActiveField('pickup')}>
              <Icon name="record-circle-outline" size={20} color={COLORS.success} />
              <Text style={[styles.locationText, !formData.pickup && { color: COLORS.textMuted }]} numberOfLines={1}>
                {formData.pickup || 'Tap to set Pickup Location'}
              </Text>
            </TouchableOpacity>
            <View style={styles.hDots} />
            <TouchableOpacity style={styles.locationField} onPress={() => setActiveField('drop')}>
              <Icon name="map-marker-outline" size={20} color={COLORS.error} />
              <Text style={[styles.locationText, !formData.drop && { color: COLORS.textMuted }]} numberOfLines={1}>
                {formData.drop || 'Tap to set Drop-off Destination'}
              </Text>
            </TouchableOpacity>
          </View>

          {formData.tripType === 'Tour Package' && (
            <View style={styles.stopsContainer}>
              <Text style={styles.subHeaderStyle}>Intermediate Stops</Text>
              {formData.stops.map((stop, index) => (
                <View key={index} style={styles.stopRow}>
                  <View style={styles.stopDot} />
                  <TextInput
                    style={styles.stopInput}
                    placeholder={`Stop ${index + 1}`}
                    placeholderTextColor="#000"
                    value={stop}
                    onChangeText={(t) => updateStop(t, index)}
                  />
                  <TouchableOpacity onPress={() => removeStop(index)}>
                    <Icon name="close-circle" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addStopBtn} onPress={addStop}>
                <Icon name="plus" size={18} color={COLORS.primary} />
                <Text style={styles.addStopText}>Add Stop / Waypoint</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: 13.0827,
                longitude: 80.2707,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {formData.pickupCoords && <Marker coordinate={formData.pickupCoords} pinColor="green" title="Pickup" />}
              {formData.dropCoords && <Marker coordinate={formData.dropCoords} pinColor="red" title="Drop" />}
            </MapView>
          </View>

          {formData.estimatedDistance && formData.estimatedTime && (
            <View style={styles.etaContainer}>
              <View style={styles.etaBox}>
                <Icon name="map-marker-distance" size={24} color={COLORS.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.etaLabel}>Total Distance</Text>
                  <Text style={styles.etaValue}>{formData.estimatedDistance}</Text>
                </View>
              </View>
              <View style={styles.etaDivider} />
              <View style={styles.etaBox}>
                <Icon name="clock-fast" size={24} color={COLORS.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.etaLabel}>Est. Traversal Time</Text>
                  <Text style={styles.etaValue}>{formData.estimatedTime}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.topScheduleRow, { marginTop: 20 }]}>
            <View style={styles.topScheduleBox}>
              <Icon name="calendar-check" size={18} color={COLORS.primary} />
              <TextInput 
                style={styles.topScheduleInput} 
                value={formData.scheduledDate} 
                onChangeText={t => setFormData({...formData, scheduledDate: t})} 
                placeholder="DD/MM/YYYY" 
                placeholderTextColor="#000"
              />
            </View>
            <View style={styles.topScheduleBox}>
              <Icon name="clock-outline" size={18} color={COLORS.primary} />
              <TextInput 
                style={styles.topScheduleInput} 
                value={formData.scheduledTime} 
                onChangeText={t => setFormData({...formData, scheduledTime: t})} 
                placeholder="HH:MM AM" 
                placeholderTextColor="#000"
              />
            </View>
          </View>

          {(formData.tripType === 'Round Trip' || formData.tripType === 'Tour Package' || formData.tripType === 'Rental' || formData.tripType === 'Out Station') && (
            <View style={[styles.topScheduleRow, { marginTop: 10 }]}>
              <View style={[styles.topScheduleBox, { borderColor: COLORS.primary + '40', borderWidth: 1 }]}>
                <Icon name="calendar-refresh" size={18} color={COLORS.primary} />
                <TextInput 
                  style={styles.topScheduleInput} 
                  value={formData.returnDate} 
                  onChangeText={t => setFormData({...formData, returnDate: t})} 
                  placeholder="Return Date" 
                  placeholderTextColor="#000"
                />
              </View>
              <View style={[styles.topScheduleBox, { borderColor: COLORS.primary + '40', borderWidth: 1 }]}>
                <Icon name="clock-check-outline" size={18} color={COLORS.primary} />
                <TextInput 
                  style={styles.topScheduleInput} 
                  value={formData.returnTime} 
                  onChangeText={t => setFormData({...formData, returnTime: t})} 
                  placeholder="Return Time" 
                  placeholderTextColor="#000"
                />
              </View>
            </View>
          )}
        </View>

        {/* Pricing Configuration */}
        <View style={styles.card}>
          <View style={styles.settingsHeader}>
            <View style={styles.settingsTitleRow}>
              <Icon name="currency-rupee" size={20} color={COLORS.primary} />
              <Text style={styles.settingsTitle}>
                Trip Cost Settings
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          {renderPricingRow('Base Fare / 2.5km (₹)', formData.baseFare, 'baseFare')}
          {renderPricingRow('Per KM Rate (₹)', formData.perKmRate, 'perKmRate')}
          {renderPricingRow('Waiting Charge/min (₹)', formData.waitingCharge, 'waitingCharge')}
          {renderPricingRow('Driver Bata (₹) / per day', formData.driverBata, 'driverBata')}
          {renderPricingRow('Night Allowance (₹)', formData.nightAllowance, 'nightAllowance')}
          {renderPricingRow('Hills Allowance (₹)', formData.hillsAllowance, 'hillsAllowance')}
        </View>

        {/* Total Price Summary Card */}
        <View style={styles.card}>
            <View style={styles.sectionHeaderTitleRow}>
                <Icon name="cash-multiple" size={20} color={COLORS.success} />
                <Text style={styles.sectionTitleBlack}>Pricing Summary</Text>
            </View>
            <View style={styles.divider} />

            <View style={{ marginBottom: 20 }}>
                <Text style={styles.priceLabel}>Total Trip Amount (₹)</Text>
                <View style={[styles.totalInputWrapper, { borderColor: COLORS.primary + '30' }]}>
                    <Icon name="cash" size={22} color={COLORS.primary} />
                    <TextInput 
                        style={styles.totalInput}
                        value={formData.totalTripAmount === '0' ? '' : formData.totalTripAmount}
                        placeholder="0"
                        placeholderTextColor="#000"
                        keyboardType="numeric"
                        onChangeText={(t) => setFormData({...formData, totalTripAmount: t})}
                    />
                </View>
            </View>

            <View style={styles.paymentSelector}>
                <View style={[styles.paymentOption, styles.paymentOptionActive, { backgroundColor: '#F0FDF4' }]}>
                    <Icon name="account-cash" size={20} color="#16A34A" />
                    <Text style={[styles.paymentOptionText, styles.paymentOptionTextActive, { color: '#16A34A', fontSize: 13 }]}>Direct Customer Payment (No Commission)</Text>
                </View>
            </View>
        </View>

        {/* Publish Action */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.publishMainBtn} onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.publishGradientSmall}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.publishTextSmall}>CREATE BOOKING</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* SEARCH MODAL */}
      <Modal visible={!!activeField} animationType="slide">
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setActiveField(null)}>
              <Icon name="close" size={28} color="#000" />
            </TouchableOpacity>
            <TextInput
              autoFocus
              placeholder={`Search ${activeField === 'pickup' ? 'Pickup' : 'Drop'}...`}
              placeholderTextColor="#000"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                fetchSuggestions(t);
              }}
            />
            {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleLocationSelect(item)}>
                <Icon name="map-marker-outline" size={22} color={COLORS.textMuted} />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={styles.suggestionMain}>{item.structured_formatting?.main_text || item.description}</Text>
                  <Text style={styles.suggestionSub}>{item.structured_formatting?.secondary_text || ''}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={isLangModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Preferred Language</Text>
            {LANGUAGES.map(lang => (
              <TouchableOpacity key={lang} style={styles.langItem} onPress={() => { setFormData({ ...formData, customerLanguage: lang }); setLangModalVisible(false); }}>
                <Text style={[styles.langText, formData.customerLanguage === lang && styles.langTextActive]}>{lang}</Text>
                {formData.customerLanguage === lang && <Icon name="check" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm, height: 60, backgroundColor: COLORS.primary,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: COLORS.black },
  headerActionBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SPACING.md, paddingBottom: 50 },
  topScheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  topScheduleBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, ...SHADOW.light,
    width: '48%',
  },
  topScheduleInput: { flex: 1, marginLeft: 10, fontWeight: '700', color: COLORS.text, fontSize: 13, padding: 0 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.light },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 15 },
  sectionHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitleBlack: { fontSize: 16, fontWeight: '900', color: '#000', marginLeft: 10 },
  subHeaderStyle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 15, marginBottom: 10 },
  inputField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  fieldIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },

  configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 },
  configLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  counterContainer: { flexDirection: 'row', alignItems: 'center' },
  counterValue: { fontSize: 18, fontWeight: '900', marginHorizontal: 15, color: COLORS.primaryDark },
  capacityInput: { flex: 0.6, height: 40, borderBottomWidth: 1, borderBottomColor: '#DDD', textAlign: 'right', fontWeight: '700', color: COLORS.primary },

  locationContainer: { paddingVertical: 5 },
  locationField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EEE'
  },
  hDots: { width: 2, height: 10, backgroundColor: '#DDD', marginLeft: 21, marginVertical: 4 },
  locationText: { marginLeft: 12, fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  mapContainer: { height: 180, borderRadius: 15, overflow: 'hidden', marginTop: 15, borderWidth: 1, borderColor: '#EEE' },
  map: { flex: 1 },

  etaContainer: { flexDirection: 'row', marginTop: 15, backgroundColor: '#F8F9FD', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
  etaBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  etaLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  etaValue: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  etaDivider: { width: 1, height: 30, backgroundColor: '#DDD' },

  tripTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tripTypeCard: {
    width: '31%', aspectRatio: 1.1, backgroundColor: '#F8F9FD', borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EEE'
  },
  tripTypeCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tripTypeLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text, marginTop: 8, textAlign: 'center' },
  tripTypeLabelActive: { color: '#FFF' },
  rentalTypeTextActive: { color: '#FFF' },
  rentalTypeRow: { flexDirection: 'row', marginTop: 5, justifyContent: 'center' },
  rentalTypeChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F0F2F5', marginHorizontal: 5
  },
  rentalTypeChipActive: { backgroundColor: COLORS.primary },
  rentalTypeText: { marginLeft: 8, fontSize: 12, fontWeight: '700', color: COLORS.textMuted },

  stopsContainer: { marginTop: 15, paddingHorizontal: 5 },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stopDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 10 },
  stopInput: { flex: 1, backgroundColor: '#F8F9FD', borderRadius: 10, padding: 8, fontSize: 13, fontWeight: '600', color: COLORS.text, borderWidth: 1, borderColor: '#EEE', marginRight: 10 },
  addStopBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 5 },
  addStopText: { marginLeft: 5, fontSize: 13, fontWeight: '800', color: COLORS.primary },

  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  settingsTitleRow: { flexDirection: 'row', alignItems: 'center' },
  settingsTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginLeft: 10 },
  divider: { height: 1, backgroundColor: '#EEE', marginBottom: 15 },

  pricingInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  priceInputWrapper: { width: 90, height: 42, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: '#F9F9F9' },
  priceInput: { textAlign: 'center', fontSize: 16, fontWeight: '900', color: '#333' },

  totalInputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD',
    borderWidth: 1.5, borderColor: '#EEE', borderRadius: 15, paddingHorizontal: 18, height: 60, marginTop: 10,
  },
  totalInput: { flex: 1, marginLeft: 12, fontSize: 22, fontWeight: '900', color: '#000' },
  
  paymentSelector: { flexDirection: 'row', marginTop: 10, backgroundColor: '#F0F2F5', borderRadius: 12, padding: 4 },
  paymentOption: { flex: 1, height: 45, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  paymentOptionActive: { backgroundColor: COLORS.primary, ...SHADOW.light },
  paymentOptionText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginLeft: 8 },
  paymentOptionTextActive: { color: '#FFF' },

  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  publishMainBtn: { flex: 1, height: 56, borderRadius: 15, overflow: 'hidden', ...SHADOW.medium },
  publishGradientSmall: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  publishTextSmall: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  searchModal: { flex: 1, backgroundColor: '#FFF' },
  searchHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#F9F9F9'
  },
  searchInput: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '700', color: '#000' },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  suggestionMain: { fontSize: 15, fontWeight: '700', color: '#000' },
  suggestionSub: { fontSize: 12, color: '#666', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  langText: { fontSize: 16, fontWeight: '700' },
  langTextActive: { color: COLORS.primary },
});

export default SelfRideScreen;
