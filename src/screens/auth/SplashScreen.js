import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import apiClient from '../../api/apiClient';

const { height, width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { setUserData } = useAppContext();
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const backgroundScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entry Animation Sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundScale, {
        toValue: 1.2,
        duration: 8000, // Slow zoom effect while visible
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Wait and Exit Animation
    const timer = setTimeout(() => {
      // Exit Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        try {
          const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
          const session = await AsyncStorage.getItem('user_session');
          
          if (isLoggedIn === 'true' && session) {
            const { phone } = JSON.parse(session);
            // Fetch profile
            const response = await apiClient.get(`/driver/profile/${phone}`);
            setUserData(response.data);
            navigation.replace('MainTabs');
          } else {
            navigation.replace('Login');
          }
        } catch (e) {
          console.log('Splash Session Error:', e);
          navigation.replace('Login');
        }
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Background with Zoom Effect */}
      <Animated.View style={[
        styles.backgroundWrapper, 
        { transform: [{ scale: backgroundScale }] }
      ]}>
        <LinearGradient
          colors={COLORS.cardGradient}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Centered Logo and Text */}
      <Animated.View style={[
        styles.logoContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}>
        <View style={styles.logoWrapper}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        <Animated.Text style={styles.brandTitle}>UTURN</Animated.Text>
        <Animated.Text style={styles.brandSubtitle}>Moving Business Forward</Animated.Text>
      </Animated.View>

      {/* Decorative Orbs (Matching Insightlancer design) */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.medium,
    marginBottom: SPACING.lg,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 8,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  orbTop: {
    top: -50,
    left: -50,
  },
  orbBottom: {
    bottom: -50,
    right: -50,
  },
});

export default SplashScreen;
