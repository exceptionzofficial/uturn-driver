import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import Loader from '../../components/Loader';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.replace('MainTabs');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../../assets/images/login_bg.png')}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)']}
          style={styles.overlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
            >
              <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                  <View style={styles.logoWrapper}>
                    <Image 
                      source={require('../../assets/logo.png')} 
                      style={styles.logo} 
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Text Section */}
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Uturn</Text>
                  <Text style={styles.subtitle}>Reliable Rides Delivered</Text>
                  <Text style={styles.instructions}>Login with your phone number to continue</Text>
                </View>

                {/* Input Section */}
                <View style={styles.inputCard}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.countryCode}>+91</Text>
                    <View style={styles.divider} />
                    <TextInput
                      style={styles.input}
                      placeholder="9788800000"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      maxLength={10}
                    />
                    {phone.length === 10 && (
                      <View style={styles.checkIcon}>
                        <Icon name="check-circle" size={18} color={COLORS.accent} />
                      </View>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleLogin}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={COLORS.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>Get OTP</Text>
                      <Icon name="arrow-right" size={20} color={COLORS.white} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>By continuing, you agree to our</Text>
                  <View style={styles.footerLinks}>
                    <TouchableOpacity><Text style={styles.link}>Terms of Service</Text></TouchableOpacity>
                    <Text style={styles.footerText}> & </Text>
                    <TouchableOpacity><Text style={styles.link}>Privacy Policy</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
      <Loader visible={loading} message="Logging you in..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: SPACING.xxl,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
    ...SHADOW.medium,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  instructions: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  inputCard: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    height: 60,
  },
  countryCode: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: SPACING.sm,
  },
  loginButton: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradientButton: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  footerLinks: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  link: {
    color: '#AEDD45', // Light greenish from screenshot
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
