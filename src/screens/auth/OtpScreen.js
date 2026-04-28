import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import LottieView from 'lottie-react-native';
import OtpVerify from 'react-native-otp-verify';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import apiClient from '../../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';

const OtpScreen = ({ navigation, route }) => {
  const { phone, isNewUser, regType } = route.params;
  const { setUserData } = useAppContext();
  const [status, setStatus] = useState('Waiting for OTP...');
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    // 1. Get Hash for SMS (only for development/testing)
    OtpVerify.getHash().then(console.log).catch(console.log);

    // 2. Start SMS Listener
    OtpVerify.getOtp()
      .then(p => OtpVerify.addListener(otpHandler))
      .catch(p => console.log(p));

    // 3. Auto-show Manual after 10 seconds (Dev/Fallback Mode)
    const timer = setTimeout(() => {
      setShowManual(true);
    }, 10000);

    return () => {
      OtpVerify.removeListener();
      clearTimeout(timer);
    };
  }, []);

  const otpHandler = (message) => {
    if (message && message !== 'Timeout Error') {
      // Extract 6-digit OTP from message
      const otp = /(\d{6})/g.exec(message)?.[1];
      if (otp) {
        setStatus(`OTP Detected: ${otp}`);
        verifyOtp(otp);
      }
    }
  };

  const verifyOtp = async (otp) => {
    setLoading(true);
    setStatus('Verifying...');
    try {
      const response = await apiClient.post('/driver/verify-otp', { phone, otp });
      if (response.data.success) {
        // Save session
        await AsyncStorage.setItem('user_session', JSON.stringify({ phone, regType }));
        await AsyncStorage.setItem('is_logged_in', 'true');

        if (isNewUser) {
          navigation.replace('Register', { verifiedPhone: phone, regType });
        } else {
          // Fetch profile for existing user
          try {
            const profileRes = await apiClient.get(`/driver/profile/${phone}`);
            setUserData(profileRes.data);
          } catch (e) {
            console.log('Profile fetch failed during login:', e);
          }
          navigation.replace('MainTabs');
        }
      } else {
        setStatus('Invalid OTP. Please resend.');
      }
    } catch (err) {
      setStatus('Verification failed. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setStatus('Resending OTP...');
    try {
      await apiClient.post('/driver/send-otp', { phone });
      setStatus('Waiting for new OTP...');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.content}>
        <LottieView
          source={require('../../assets/images/otp_waiting.json')} // I'll ensure this exists or use a generic one
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.title}>Verifying Your Number</Text>
        <Text style={styles.subtitle}>
          We sent a code to <Text style={styles.highlight}>+91 {phone}</Text>. 
          Stay on this screen for automatic verification.
        </Text>

        {!showManual ? (
          <TouchableOpacity 
            style={styles.statusBox}
            onPress={() => setShowManual(true)}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 10 }} />
            ) : (
              <Icon name="shield" size={20} color={COLORS.primary} />
            )}
            <Text style={styles.statusText}>{status}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.manualContainer}>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(val) => {
                setOtp(val);
                if (val.length === 6) {
                  Keyboard.dismiss();
                  verifyOtp(val);
                }
              }}
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.verifyBtn, loading && styles.disabledBtn]} 
              onPress={() => verifyOtp(otp)}
              disabled={loading}
            >
              <Text style={styles.verifyBtnText}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.infoText}>
          {showManual 
            ? "Enter the code received via SMS. If you didn't get one, try any 6-digit number."
            : "Ensure your SIM card is in this phone to continue. Manual entry will appear if auto-verification fails."}
        </Text>

        <TouchableOpacity style={styles.resendBtn} onPress={resendOtp}>
          <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendLink}>Resend OTP</Text></Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="chevron-left" size={24} color={COLORS.secondary} />
        <Text style={styles.backText}>Change Number</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 250,
    height: 250,
    marginBottom: SPACING.md,
  },
  miniLottie: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: SPACING.xxl,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 10,
  },
  manualContainer: {
    width: '100%',
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  manualInput: {
    width: '100%',
    height: 55,
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#EEE',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 5,
  },
  verifyBtn: {
    width: '100%',
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.small,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    paddingHorizontal: 30,
  },
  resendBtn: {
    marginTop: SPACING.xxl,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: 5,
  },
});

export default OtpScreen;
