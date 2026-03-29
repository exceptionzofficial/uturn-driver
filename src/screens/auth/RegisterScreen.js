import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Calendar } from 'react-native-calendars';
import ImagePicker from 'react-native-image-crop-picker';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import Loader from '../../components/Loader';
import apiClient from '../../api/apiClient';

const { width, height } = Dimensions.get('window');

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CURRENT_YEAR = new Date().getFullYear();
const PAST_YEARS = Array.from({ length: CURRENT_YEAR - 18 - 1960 + 1 }, (_, i) => (1960 + i).toString()).reverse();
const FUTURE_YEARS = Array.from({ length: 25 }, (_, i) => (CURRENT_YEAR + i).toString());
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

const RegisterScreen = ({ navigation, route }) => {
  const verifiedPhone = route.params?.verifiedPhone || '';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Modals visibility
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(''); // 'dob' or 'licence' or 'insurance' or 'fc'
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  
  const [tempDay, setTempDay] = useState('01');
  const [tempMonth, setTempMonth] = useState(MONTHS[new Date().getMonth()]);
  const [tempYear, setTempYear] = useState(CURRENT_YEAR.toString());
  const [aadharError, setAadharError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [dlFront, setDlFront] = useState(null);
  const [dlBack, setDlBack] = useState(null);
  const [rcFront, setRcFront] = useState(null);
  const [insuranceFront, setInsuranceFront] = useState(null);
  const [fcFront, setFcFront] = useState(null);
  const [permitFront, setPermitFront] = useState(null);

  // Step 1: Personal Data
  const [personalData, setPersonalData] = useState({
    name: '',
    phone: verifiedPhone,
    aadhar: '',
    dob: '',
    state: '',
    licenceNumber: '',
    licenceExpiry: '',
  });

  // Step 2: Vehicle Data
  const [vehicleData, setVehicleData] = useState({
    number: '',
    insuranceExpiry: '',
    fcExpiry: '',
    permitExpiry: '',
    tripType: 'Passenger',
    vehicleType: 'Sedan',
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Validation function
  const isDateExpired = (dateString) => {
    if (!dateString) return false;
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!personalData.name || !personalData.state || !personalData.dob || !personalData.licenceExpiry || !personalData.aadhar || !profilePhoto || !aadhaarFront || !dlFront || !dlBack) {
        Alert.alert('Incomplete Form', 'Please fill in all mandatory fields and capture all required documents (Selfie, Aadhaar Front, DL Front & Back).');
        return;
      }
      if (aadharError) {
        Alert.alert('Existing Account', aadharError);
        return;
      }
      if (isDateExpired(personalData.licenceExpiry)) {
        Alert.alert('Invalid Licence', 'Your driving licence appears to be expired. We cannot accept expired licences.');
        return;
      }
      animateTransition(() => setStep(2));
    }
  };

  const checkAadhar = async (val) => {
    if (val.length === 12) {
      try {
        const response = await apiClient.post('/driver/check-aadhar', { aadhar: val });
        if (response.data.exists) {
          setAadharError('Aadhaar already exists. Please login.');
        } else {
          setAadharError('');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setAadharError('');
    }
  };

  const takeSelfie = () => {
    ImagePicker.openCamera({
      width: 400,
      height: 400,
      cropping: true,
      useFrontCamera: true,
      includeBase64: false,
    }).then(image => {
      setProfilePhoto(image);
    }).catch(err => {
      if (err.message !== 'User cancelled image selection') {
        Alert.alert('Camera Error', 'Could not open camera.');
      }
    });
  };

  const captureDocument = (type) => {
    ImagePicker.openCamera({
      width: 800,
      height: 500,
      cropping: true,
      includeBase64: false,
    }).then(image => {
      if (type === 'aadhaarFront') setAadhaarFront(image);
      else if (type === 'dlFront') setDlFront(image);
      else if (type === 'dlBack') setDlBack(image);
      else if (type === 'rcFront') setRcFront(image);
      else if (type === 'insuranceFront') setInsuranceFront(image);
      else if (type === 'fcFront') setFcFront(image);
      else if (type === 'permitFront') setPermitFront(image);
    }).catch(err => {
      if (err.message !== 'User cancelled image selection') {
        Alert.alert('Camera Error', 'Could not open camera.');
      }
    });
  };

  const handleBack = () => {
    if (step === 2) {
      animateTransition(() => setStep(1));
    } else {
      navigation.goBack();
    }
  };

  const animateTransition = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }).start();
    });
  };

  const handleSubmit = async () => {
    if (!vehicleData.number || !vehicleData.insuranceExpiry || !rcFront || !insuranceFront || !fcFront) {
      Alert.alert('Required', 'Please fill in mandatory vehicle and capture Required Documents (RC, Insurance & FC).');
      return;
    }
    setLoading(true);
    
    try {
      const formData = new FormData();
      
      // Helper to append file
      const appendFile = (field, file, name) => {
        if (file) {
          formData.append(field, {
            uri: Platform.OS === 'android' ? file.path : file.path.replace('file://', ''),
            type: file.mime,
            name: `${name}_${personalData.phone}.jpg`,
          });
        }
      };

      appendFile('profilePhoto', profilePhoto, 'profile');
      appendFile('aadhaarFront', aadhaarFront, 'aadhaar_front');
      appendFile('dlFront', dlFront, 'dl_front');
      appendFile('dlBack', dlBack, 'dl_back');
      appendFile('rcFront', rcFront, 'rc_front');
      appendFile('insuranceFront', insuranceFront, 'insurance_front');
      appendFile('fcFront', fcFront, 'fc_front');
      appendFile('permitFront', permitFront, 'permit_front');
      
      const payload = {
        ...personalData,
        ...vehicleData,
        vehicleNumber: vehicleData.number // Map for backend
      };
      
      formData.append('driverData', JSON.stringify(payload));

      const response = await apiClient.post('/driver/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLoading(false);
      if (response.data.success) {
        Alert.alert('Application Submitted', 'Welcome to U-Turn! Your documents are being verified. Your login will be active once approved.', [
          { text: 'Got it', onPress: () => navigation.replace('Login')}
        ]);
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Registration Failed', 'Something went wrong. Please try again.');
      console.error(err);
    }
  };

  const onDateSelect = (day) => {
    const formattedDate = day.dateString;
    if (calendarTarget === 'dob') {
        setPersonalData({...personalData, dob: formattedDate});
    }
    setShowCalendar(false);
  };

  const handleDateConfirm = () => {
    const formattedDate = `${tempYear}-${(MONTHS.indexOf(tempMonth) + 1).toString().padStart(2, '0')}-${tempDay}`;
    
    if (calendarTarget === 'dob') {
        setPersonalData({...personalData, dob: formattedDate});
    } else {
        if (calendarTarget === 'licence') {
            if (isDateExpired(formattedDate)) {
                Alert.alert('Expired Licence', 'Selected expiry is in the past.');
                return;
            }
            setPersonalData({...personalData, licenceExpiry: formattedDate});
        } else if (calendarTarget === 'insurance') {
            setVehicleData({...vehicleData, insuranceExpiry: formattedDate});
        } else if (calendarTarget === 'fc') {
            setVehicleData({...vehicleData, fcExpiry: formattedDate});
        } else if (calendarTarget === 'permit') {
            setVehicleData({...vehicleData, permitExpiry: formattedDate});
        }
    }
    setShowMonthYearPicker(false);
  };


  const renderInputField = (label, icon, value, onChangeText, placeholder, keyboardType = 'default', editable = true) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.disabledInput]}>
        <Icon name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          editable={editable}
        />
      </View>
    </View>
  );

  const renderSelectorField = (label, icon, value, onPress, placeholder) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.inputWrapper} onPress={onPress}>
        <Icon name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
        <Text style={[styles.inputText, !value && { color: '#999' }]}>
          {value || placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <Loader visible={loading} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={26} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Onboarding</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step}/2</Text>
        </View>
      </View>

      <Animated.View style={[styles.main, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {step === 1 ? (
            <View>
              <View style={styles.welcomeBox}>
                <Text style={styles.title}>Welcome Abroad!</Text>
                <Text style={styles.subtitle}>Let's verify your identity to get started.</Text>
              </View>

              {/* Profile Photo Upload */}
              <View style={styles.profileUploadContainer}>
                <TouchableOpacity style={styles.profileUploadBox} onPress={takeSelfie}>
                  <View style={styles.avatarPlaceholder}>
                    {profilePhoto ? (
                      <Image source={{ uri: profilePhoto.path }} style={styles.selfieImage} />
                    ) : (
                      <Icon name="account" size={50} color="#DDD" />
                    )}
                  </View>
                  <View style={styles.cameraIconBadge}>
                    <Icon name="camera" size={16} color={COLORS.white} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.profilePhotoLabel}>Real Selfie Only *</Text>
              </View>

              {renderInputField('Full Name *', 'account-outline', personalData.name, (t) => setPersonalData({...personalData, name: t}), 'Enter as per Aadhaar')}
              {renderInputField('Phone Number', 'phone-outline', personalData.phone, null, '', 'phone-pad', false)}
              
              {renderSelectorField('Date of Birth *', 'calendar-outline', personalData.dob, () => {
                setCalendarTarget('dob');
                setTempYear((CURRENT_YEAR - 20).toString());
                setShowMonthYearPicker(true);
              }, 'YYYY-MM-DD')}

              {renderSelectorField('State *', 'map-marker-outline', personalData.state, () => setShowStateModal(true), 'Select')}

              <View style={styles.divider} />
              
              <Text style={styles.sectionHeading}>KYC Documents</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhaar Number *</Text>
                <View style={[styles.inputWrapper, aadharError && styles.errorInput]}>
                  <Icon name="card-account-details-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={personalData.aadhar}
                    onChangeText={(t) => {
                      setPersonalData({...personalData, aadhar: t});
                      checkAadhar(t);
                    }}
                    placeholder="12-digit number"
                    keyboardType="number-pad"
                    maxLength={12}
                  />
                  {aadharError && <Icon name="alert-circle" size={18} color={COLORS.error} />}
                </View>
                {aadharError ? <Text style={styles.errorText}>{aadharError}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhaar Card Front *</Text>
                <TouchableOpacity style={styles.fullUploadCard} onPress={() => captureDocument('aadhaarFront')}>
                  {aadhaarFront ? (
                    <Image source={{ uri: aadhaarFront.path }} style={styles.docPreview} resizeMode="cover" />
                  ) : (
                    <>
                      <Icon name="camera-plus-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.uploadTextLarge}>Capture Aadhaar Front</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {renderInputField('Driving Licence No.*', 'badge-account-outline', personalData.licenceNumber, (t) => setPersonalData({...personalData, licenceNumber: t}), 'Enter DL Number')}
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Driving Licence Front *</Text>
                <TouchableOpacity style={styles.fullUploadCard} onPress={() => captureDocument('dlFront')}>
                  {dlFront ? (
                    <Image source={{ uri: dlFront.path }} style={styles.docPreview} resizeMode="cover" />
                  ) : (
                    <>
                      <Icon name="camera-plus-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.uploadTextLarge}>Capture DL Front</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Driving Licence Back *</Text>
                <TouchableOpacity style={styles.fullUploadCard} onPress={() => captureDocument('dlBack')}>
                  {dlBack ? (
                    <Image source={{ uri: dlBack.path }} style={styles.docPreview} resizeMode="cover" />
                  ) : (
                    <>
                      <Icon name="camera-plus-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.uploadTextLarge}>Capture DL Back</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {renderSelectorField('Licence Expiry *', 'calendar-clock-outline', personalData.licenceExpiry, () => {
                setCalendarTarget('licence');
                setTempYear(CURRENT_YEAR.toString());
                setShowMonthYearPicker(true);
              }, 'YYYY-MM-DD')}
            </View>
          ) : (
            <View>
              <View style={styles.welcomeBox}>
                <Text style={styles.title}>Vehicle Setup</Text>
                <Text style={styles.subtitle}>Enter the details of the vehicle you'll drive.</Text>
              </View>

              {renderInputField('Vehicle Registration No.*', 'car-cog', vehicleData.number, (t) => setVehicleData({...vehicleData, number: t}), 'e.g. TN 37 AB 1234')}
              


              <View style={styles.inputGroup}>
                <Text style={styles.label}>Trip Type *</Text>
                <View style={styles.chipRow}>
                  {['Passenger', 'Load'].map(t => (
                    <TouchableOpacity 
                      key={t}
                      style={[styles.chip, vehicleData.tripType === t && styles.activeChip]}
                      onPress={() => setVehicleData({...vehicleData, tripType: t, vehicleType: t === 'Passenger' ? 'Sedan' : 'Load'})}
                    >
                      <Text style={[styles.chipText, vehicleData.tripType === t && styles.activeChipText]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {vehicleData.tripType === 'Passenger' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vehicle Type *</Text>
                  <View style={styles.chipRow}>
                    {['Bike', 'Auto', 'Hatchback', 'Sedan', 'SUV'].map(v => (
                      <TouchableOpacity 
                        key={v}
                        style={[styles.choiceChip, vehicleData.vehicleType === v && styles.activeChoiceChip]}
                        onPress={() => setVehicleData({...vehicleData, vehicleType: v})}
                      >
                        <Text style={[styles.choiceText, vehicleData.vehicleType === v && styles.activeChoiceText]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.divider} />

               {/* RC SECTION */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>RC Details *</Text>
                <TouchableOpacity style={styles.fullUploadCard} onPress={() => captureDocument('rcFront')}>
                  {rcFront ? (
                    <Image source={{ uri: rcFront.path }} style={styles.docPreview} resizeMode="cover" />
                  ) : (
                    <>
                      <Icon name="file-document-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.uploadTextLarge}>Upload RC Document</Text>
                      <Text style={styles.uploadSubText}>Clear photo of Registration Certificate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* INSURANCE SECTION */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Insurance Policy *</Text>
                <TouchableOpacity style={styles.fullUploadCard} onPress={() => captureDocument('insuranceFront')}>
                  {insuranceFront ? (
                    <Image source={{ uri: insuranceFront.path }} style={styles.docPreview} resizeMode="cover" />
                  ) : (
                    <>
                      <Icon name="shield-check-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.uploadTextLarge}>Upload Insurance Photocopy</Text>
                      <Text style={styles.uploadSubText}>Valid insurance policy document</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              {renderSelectorField('Insurance Expiry *', 'calendar-star-outline', vehicleData.insuranceExpiry, () => {
                setCalendarTarget('insurance');
                setTempYear(CURRENT_YEAR.toString());
                setShowMonthYearPicker(true);
              }, 'YYYY-MM-DD')}

              {/* FC SECTION */}
              {vehicleData.vehicleType !== 'Bike' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fitness Certificate (FC) *</Text>
                    <TouchableOpacity style={styles.fullUploadCard} onPress={() => captureDocument('fcFront')}>
                      {fcFront ? (
                        <Image source={{ uri: fcFront.path }} style={styles.docPreview} resizeMode="cover" />
                      ) : (
                        <>
                          <Icon name="certificate-outline" size={32} color={COLORS.primary} />
                          <Text style={styles.uploadTextLarge}>Upload FC Document</Text>
                          <Text style={styles.uploadSubText}>Current vehicle fitness certificate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  {renderSelectorField('FC Expiry Date', 'calendar-check-outline', vehicleData.fcExpiry, () => {
                    setCalendarTarget('fc');
                    setTempYear(CURRENT_YEAR.toString());
                    setShowMonthYearPicker(true);
                  }, 'YYYY-MM-DD')}
                </>
              )}

              {/* PERMIT SECTION */}
              {vehicleData.tripType === 'Passenger' && !['Bike', 'Auto'].includes(vehicleData.vehicleType) && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Vehicle Permit</Text>
                    <TouchableOpacity style={styles.fullUploadCard} onPress={() => captureDocument('permitFront')}>
                      {permitFront ? (
                        <Image source={{ uri: permitFront.path }} style={styles.docPreview} resizeMode="cover" />
                      ) : (
                        <>
                          <Icon name="newspaper-variant-outline" size={32} color={COLORS.primary} />
                          <Text style={styles.uploadTextLarge}>Upload Permit Document</Text>
                          <Text style={styles.uploadSubText}>Valid state or national permit</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  {renderSelectorField('Permit Expiry Date', 'calendar-clock', vehicleData.permitExpiry, () => {
                    setCalendarTarget('permit');
                    setTempYear(CURRENT_YEAR.toString());
                    setShowMonthYearPicker(true);
                  }, 'YYYY-MM-DD')}
                </>
              )}

              <View style={{ height: 20 }} />
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueBtn} 
          activeOpacity={0.9} 
          onPress={step === 1 ? handleNext : handleSubmit}
        >
          <LinearGradient
            colors={COLORS.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.btnText}>{step === 1 ? 'Go to Vehicle Settings' : 'Submit for Verification'}</Text>
            <Icon name={step === 1 ? "arrow-right" : "check-all"} size={22} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* States Modal */}
      <Modal visible={showStateModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalBg}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Home State</Text>
              <TouchableOpacity onPress={() => {
                setShowStateModal(false);
                setStateSearchQuery('');
              }}>
                <Icon name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {/* State Search Bar */}
            <View style={styles.searchBarWrapper}>
              <Icon name="magnify" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search state..."
                value={stateSearchQuery}
                onChangeText={setStateSearchQuery}
                placeholderTextColor="#999"
              />
              {stateSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setStateSearchQuery('')}>
                  <Icon name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={INDIAN_STATES.filter(s => s.toLowerCase().includes(stateSearchQuery.toLowerCase()))}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.stateItem} 
                  onPress={() => {
                    setPersonalData({...personalData, state: item});
                    setShowStateModal(false);
                    setStateSearchQuery('');
                  }}
                >
                  <Text style={[styles.stateText, personalData.state === item && { color: COLORS.primary, fontWeight: '800' }]}>
                    {item}
                  </Text>
                  {personalData.state === item && <Icon name="check" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.modalBgCentered}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>
                    {calendarTarget === 'dob' ? 'Date of Birth' : 'Select Date'}
                </Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                    <Icon name="close" size={20} color={COLORS.text} />
                </TouchableOpacity>
            </View>
            <Calendar
                onDayPress={onDateSelect}
                markedDates={{ [personalData.dob]: { selected: true, selectedColor: COLORS.primary }}}
                theme={{
                   selectedDayBackgroundColor: COLORS.primary,
                   todayTextColor: COLORS.primary,
                   arrowColor: COLORS.secondary,
                }}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal (Full Date - YYYY-MM-DD) */}
      <Modal visible={showMonthYearPicker} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.myPickerContainer, { height: 500 }]}>
            <View style={styles.myPickerHeader}>
              <Text style={styles.modalTitle}>
                {calendarTarget === 'dob' ? 'Select Birth Date' : 'Select Expiry Date'}
              </Text>
              <TouchableOpacity onPress={() => setShowMonthYearPicker(false)}>
                <Icon name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.myPickerBody}>
              {/* Day Selector - Now for all dates */}
              <View style={{ flex: 0.8 }}>
                <FlatList
                  data={DAYS}
                  keyExtractor={item => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.myOption, tempDay === item && styles.myOptionActive]}
                      onPress={() => setTempDay(item)}
                    >
                      <Text style={[styles.myOptionText, tempDay === item && styles.myOptionTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              
              <View style={styles.myPickerDivider} />

              {/* Months */}
              <View style={{ flex: 1 }}>
                <FlatList
                  data={MONTHS}
                  keyExtractor={item => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.myOption, tempMonth === item && styles.myOptionActive]}
                      onPress={() => setTempMonth(item)}
                    >
                      <Text style={[styles.myOptionText, tempMonth === item && styles.myOptionTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              
              <View style={styles.myPickerDivider} />

              {/* Years */}
              <View style={{ flex: 1 }}>
                <FlatList
                  data={calendarTarget === 'dob' ? PAST_YEARS : FUTURE_YEARS}
                  keyExtractor={item => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.myOption, tempYear === item && styles.myOptionActive]}
                      onPress={() => setTempYear(item)}
                    >
                      <Text style={[styles.myOptionText, tempYear === item && styles.myOptionTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.mySubmitBtn} onPress={handleDateConfirm}>
              <Text style={styles.mySubmitBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: '#FFF',
    ...SHADOW.light,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  stepBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stepBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  main: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  welcomeBox: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 8,
    marginLeft: 4,
    opacity: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#EEE',
    height: 54,
    paddingHorizontal: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  activeChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeChipText: {
    color: COLORS.white,
  },
  choiceChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  activeChoiceChip: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  choiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeChoiceText: {
    color: COLORS.primary,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: SPACING.xl,
  },
  profileUploadContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profileUploadBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profilePhotoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 8,
    opacity: 0.7,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  docPreview: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.md,
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    marginLeft: 5,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.lg,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadBox: {
    flex: 0.48,
    height: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullUploadCard: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#EFEFEF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 5,
  },
  uploadTextLarge: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '800',
  },
  uploadSubText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 15,
    borderRadius: RADIUS.lg,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D0E1F9',
  },
  docCardText: {
    flex: 1,
    marginLeft: 12,
  },
  docCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  docCardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  captureBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.medium,
  },
  manualEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  smallUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  smallUploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOW.large,
  },
  gradientBtn: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBgCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: '#FFF',
    height: height * 0.7,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.xl,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  stateText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 50,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
    marginLeft: 8,
  },
  calendarCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  myPickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.xl,
    height: 450,
  },
  myPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  myPickerBody: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  myOption: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12,
  },
  myOptionActive: {
    backgroundColor: COLORS.primary + '15',
  },
  myOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  myOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  myPickerDivider: {
    width: 2,
    backgroundColor: '#F0F0F0',
    height: '100%',
    marginHorizontal: 10,
  },
  mySubmitBtn: {
    backgroundColor: COLORS.secondary,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  mySubmitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default RegisterScreen;
