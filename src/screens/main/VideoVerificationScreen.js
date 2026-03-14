import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';

const { width } = Dimensions.get('window');

const VideoVerificationScreen = ({ navigation, route }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = () => {
    if (isRecording) {
      setIsRecording(false);
      setTimeout(() => {
        navigation.navigate('ActiveRide');
      }, 1500);
    } else {
      setIsRecording(true);
      setTimer(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.cameraView}>
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="x" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionTitle}>Instruction</Text>
            <Text style={styles.instructionText}>Please record a video of yourself and the vehicle before starting the ride.</Text>
          </View>

          {isRecording && (
            <View style={styles.timerContainer}>
              <View style={styles.redDot} />
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.recordOuter, isRecording && styles.recordingButton]} 
              onPress={handleRecordPress}
            >
              <View style={[styles.recordInner, isRecording && styles.recordingInner]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Mandatory Verification</Text>
        <Text style={styles.footerSubtitle}>This video helps ensure safety for both you and the passenger.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  cameraView: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 20,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  instructionTitle: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  instructionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    marginRight: 8,
  },
  timerText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
  },
  controls: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  recordOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    borderColor: 'rgba(255,255,255,0.5)',
  },
  recordInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
  },
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  footerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default VideoVerificationScreen;
