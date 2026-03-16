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
  Dimensions,
  Alert,
  Modal,
  FlatList,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import Loader from '../../components/Loader';

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

const ActingDriverRegisterScreen = ({ navigation, route }) => {
  const verifiedPhone = route.params?.verifiedPhone || '';
  const [loading, setLoading] = useState(false);
  
  // Modals visibility
  const [showStateModal, setShowStateModal] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(''); // 'dob' or 'licence'
  const [stateSearchQuery, setStateSearchQuery] = useState('');

  const [tempDay, setTempDay] = useState('01');
  const [tempMonth, setTempMonth] = useState(MONTHS[new Date().getMonth()]);
  const [tempYear, setTempYear] = useState(CURRENT_YEAR.toString());

  const [formData, setFormData] = useState({
    name: '',
    phone: verifiedPhone,
    dob: '',
    state: '',
    aadhar: '',
    licenceNumber: '',
    licenceExpiry: '',
    experience: '',
    preferredVehicles: [],
    preferredTripType: 'Passenger',
  });

  const toggleVehicle = (v) => {
    const list = [...formData.preferredVehicles];
    if (list.includes(v)) {
      setFormData({...formData, preferredVehicles: list.filter(item => item !== v)});
    } else {
      setFormData({...formData, preferredVehicles: [...list, v]});
    }
  };

  const isDateExpired = (dateString) => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const handleDateConfirm = () => {
    const formattedDate = `${tempYear}-${(MONTHS.indexOf(tempMonth) + 1).toString().padStart(2, '0')}-${tempDay}`;
    
    if (calendarTarget === 'dob') {
        setFormData({...formData, dob: formattedDate});
    } else if (calendarTarget === 'licence') {
        if (isDateExpired(formattedDate)) {
            Alert.alert('Expired Licence', 'Selected expiry is in the past.');
            return;
        }
        setFormData({...formData, licenceExpiry: formattedDate});
    }
    setShowMonthYearPicker(false);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.state || !formData.dob || !formData.licenceExpiry || formData.preferredVehicles.length === 0) {
      Alert.alert('Incomplete Form', 'Please fill in all mandatory details and documents.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Your acting driver application is submitted for verification!', [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
    }, 2000);
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
      <Loader visible={loading} message="Submitting application..." />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={26} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acting Driver Registration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
        <View style={styles.welcomeBox}>
            <Text style={styles.title}>Professional Driver Setup</Text>
            <Text style={styles.subtitle}>Register to drive vehicles for our customer network.</Text>
        </View>

        {/* Profile Photo Upload */}
        <View style={styles.profileUploadContainer}>
            <TouchableOpacity style={styles.profileUploadBox}>
              <View style={styles.avatarPlaceholder}>
                <Icon name="account" size={50} color="#DDD" />
              </View>
              <View style={styles.cameraIconBadge}>
                <Icon name="camera" size={16} color={COLORS.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.profilePhotoLabel}>Profile Photo *</Text>
        </View>

        {renderInputField('Full Name *', 'account-outline', formData.name, (t) => setFormData({...formData, name: t}), 'Enter as per Aadhaar')}
        {renderInputField('Verified Phone', 'phone-outline', formData.phone, null, '', 'phone-pad', false)}
        
        {renderSelectorField('Date of Birth *', 'calendar-outline', formData.dob, () => {
            setCalendarTarget('dob');
            setTempYear((CURRENT_YEAR - 20).toString());
            setShowMonthYearPicker(true);
        }, 'YYYY-MM-DD')}

        {renderSelectorField('State *', 'map-marker-outline', formData.state, () => setShowStateModal(true), 'Select')}

        {renderInputField('Experience (Years)', 'steering', formData.experience, (val) => setFormData({...formData, experience: val}), 'e.g. 5', 'number-pad')}

        <View style={styles.divider} />

        <Text style={styles.sectionHeading}>Vehicle Preferences</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Trip Type</Text>
          <View style={styles.row}>
            {['Passenger', 'Load'].map((t) => (
              <TouchableOpacity 
                key={t}
                style={[styles.chip, formData.preferredTripType === t && styles.activeChip]}
                onPress={() => setFormData({...formData, preferredTripType: t, preferredVehicles: []})}
              >
                <Text style={[styles.chipText, formData.preferredTripType === t && styles.activeChipText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What can you drive? *</Text>
          <View style={styles.row}>
            {(formData.preferredTripType === 'Passenger' 
              ? ['Bike', 'Auto', 'Hatchback', 'Sedan', 'SUV', 'Tempo']
              : ['Mini Truck', 'Tempo', 'Truck', 'Trailor']
            ).map((v) => (
              <TouchableOpacity 
                key={v}
                style={[styles.choiceChip, formData.preferredVehicles.includes(v) && styles.activeChoiceChip]}
                onPress={() => toggleVehicle(v)}
              >
                <Icon 
                  name={formData.preferredVehicles.includes(v) ? "check-circle" : "plus-circle-outline"} 
                  size={16} 
                  color={formData.preferredVehicles.includes(v) ? COLORS.secondary : COLORS.textLight} 
                />
                <Text style={[styles.choiceText, formData.preferredVehicles.includes(v) && styles.activeChoiceText]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeading}>KYC Documents</Text>

        {renderInputField('Aadhaar Number *', 'card-account-details-outline', formData.aadhar, (t) => setFormData({...formData, aadhar: t}), '12-digit number', 'number-pad')}
        
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Aadhaar Card Upload *</Text>
            <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadBox}>
                <Icon name="camera-plus-outline" size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Front Side</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBox}>
                <Icon name="camera-plus-outline" size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Back Side</Text>
                </TouchableOpacity>
            </View>
        </View>

        {renderInputField('Driving Licence No.*', 'badge-account-outline', formData.licenceNumber, (t) => setFormData({...formData, licenceNumber: t}), 'Enter DL Number')}
        
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Driving Licence Upload *</Text>
            <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadBox}>
                <Icon name="camera-plus-outline" size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Front Side</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBox}>
                <Icon name="camera-plus-outline" size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Back Side</Text>
                </TouchableOpacity>
            </View>
        </View>

        {renderSelectorField('Licence Expiry *', 'calendar-clock-outline', formData.licenceExpiry, () => {
            setCalendarTarget('licence');
            setTempYear(CURRENT_YEAR.toString());
            setShowMonthYearPicker(true);
        }, 'YYYY-MM-DD')}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.mainBtn} onPress={handleSubmit}>
          <LinearGradient
            colors={COLORS.buttonGradient}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>Submit Application</Text>
            <Icon name="send-outline" size={20} color={COLORS.white} />
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
                    setFormData({...formData, state: item});
                    setShowStateModal(false);
                    setStateSearchQuery('');
                  }}
                >
                  <Text style={[styles.stateText, formData.state === item && { color: COLORS.primary, fontWeight: '800' }]}>
                    {item}
                  </Text>
                  {formData.state === item && <Icon name="check" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFF',
    ...SHADOW.light,
    zIndex: 10,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  scrollArea: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  welcomeBox: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '600',
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
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.lg,
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    marginBottom: 10,
  },
  activeChip: {
    backgroundColor: COLORS.secondary,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginRight: 10,
    marginBottom: 10,
  },
  activeChoiceChip: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
    marginLeft: 8,
  },
  activeChoiceText: {
    color: COLORS.secondary,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadBox: {
    flex: 0.48,
    height: 90,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  mainBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOW.large,
  },
  gradientBtn: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 10,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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

export default ActingDriverRegisterScreen;
