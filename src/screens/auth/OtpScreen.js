import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import OtpVerify from 'react-native-otp-verify';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import apiClient from '../../api/apiClient';

const OtpScreen = ({ navigation, route }) => {
  const { phone, isNewUser, regType } = route.params;
  const [status, setStatus] = useState('Waiting for OTP...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Get Hash for SMS (only for development/testing)
    OtpVerify.getHash().then(console.log).catch(console.log);

    // 2. Start SMS Listener
    OtpVerify.getOtp()
      .then(p => OtpVerify.addListener(otpHandler))
      .catch(p => console.log(p));

    return () => OtpVerify.removeListener();
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
        if (isNewUser) {
          navigation.replace('Register', { verifiedPhone: phone, regType });
        } else {
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

        <View style={styles.statusBox}>
          {loading ? (
            <LottieView
              source={require('../../assets/images/loader.json')}
              autoPlay
              loop
              style={styles.miniLottie}
            />
          ) : (
            <Icon name="shield" size={20} color={COLORS.primary} />
          )}
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <Text style={styles.infoText}>
          Ensure your SIM card is in this phone to continue. 
          Manual entry is not allowed for security reasons.
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
