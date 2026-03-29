import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/auth/LoginScreen';
import SplashScreen from './src/screens/auth/SplashScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OtpScreen from './src/screens/auth/OtpScreen';
import ActingDriverRegisterScreen from './src/screens/auth/ActingDriverRegisterScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import MyTaskScreen from './src/screens/main/MyTaskScreen';
import TripsScreen from './src/screens/main/TripsScreen';
import HistoryScreen from './src/screens/main/HistoryScreen';
import VideoVerificationScreen from './src/screens/main/VideoVerificationScreen';
import ActiveRideScreen from './src/screens/main/ActiveRideScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import { COLORS, SHADOW } from './src/theme/AppTheme';
import { AppProvider, useAppContext } from './src/context/AppContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { isOnline } = useAppContext();
  if (!state || !state.routes) return null;
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 10; // Extra padding for 3-button nav

  return (
    <View style={[styles.tabBarContainer, { height: 85 + bottomPadding }]}>
      {/* Main Bar */}
      <View style={[styles.tabBarBackground, { height: 60 + bottomPadding, paddingBottom: bottomPadding }]}>
        {/* The Masking Circle */}
        <View style={styles.notchMask} />

        {/* Tab Buttons */}
        <View style={styles.tabsWrapper}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let iconName;
            let label;
            if (route.name === 'Home') { iconName = 'home'; label = 'Home'; }
            else if (route.name === 'MyTask') { iconName = 'car'; label = 'Trips'; }
            else if (route.name === 'Payment') { iconName = 'history'; label = 'History'; }
            else if (route.name === 'Profile') { iconName = 'account-outline'; label = 'Profile'; }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabButton,
                  index === 1 && { marginRight: 35 },
                  index === 2 && { marginLeft: 35 }
                ]}
              >
                <Icon
                  name={iconName}
                  size={24}
                  color={isFocused ? COLORS.primary : COLORS.white}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? COLORS.primary : COLORS.white }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Floating Center Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={styles.floatingButton} activeOpacity={0.9}>
          <LottieView
            source={isOnline ? require('./src/assets/radar.json') : require('./src/assets/man car.json')}
            autoPlay
            loop
            style={{ width: isOnline ? 95 : 95, height: isOnline ? 95 : 95 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyTask" component={TripsScreen} />
      <Tab.Screen name="Payment" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
  },
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.accentRed,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
  },
  notchMask: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  tabsWrapper: {
    flex: 1,
    flexDirection: 'row',
    height: 65,
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -42.5,
    width: 85,
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  floatingButton: {
    width: 85,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingIcon: {
    width: 38,
    height: 38,
  },
});

const App = () => {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'slide_from_right', animationDuration: 400 }}
            />
            <Stack.Screen
              name="Otp"
              component={OtpScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ animation: 'fade_from_bottom' }}
            />
            <Stack.Screen
              name="VideoVerification"
              component={VideoVerificationScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="ActiveRide"
              component={ActiveRideScreen}
              options={{ animation: 'flip' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ActingDriverRegister"
              component={ActingDriverRegisterScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
};

export default App;
