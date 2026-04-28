import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, Dimensions, Platform, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import Loader from '../../components/Loader';
import { acceptTrip } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import ImagePicker from 'react-native-image-crop-picker';

const { width } = Dimensions.get('window');

const VideoVerificationScreen = ({ navigation, route }) => {
  const { trip } = route.params || {};
  const { userData } = useAppContext();
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRecordPress = async () => {
    try {
      const video = await ImagePicker.openCamera({
        mediaType: 'video',
        useFrontCamera: true,
      });
      setVideoUri(video.path);
    } catch (e) {
      if (e.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to record video');
      }
    }
  };

  const handleSubmit = async () => {
    if (!videoUri) {
      Alert.alert('Required', 'Please record a video first.');
      return;
    }
    setLoading(true);
    try {
      const dId = userData?.phone || userData?.driverId;
      const res = await acceptTrip(trip.id, dId, videoUri);
      if (res.success) {
        Alert.alert('Submitted!', 'Verification video sent. Waiting for vendor approval.', [
          { text: 'OK', onPress: () => navigation.goBack() } // Or replace to a "Waiting" screen
        ]);
      } else {
        Alert.alert('Error', res.error || res.message || 'Failed to accept trip.');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection failed.');
    } finally {
      setLoading(false);
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
            <Text style={styles.instructionTitle}>Step 2: Video Identity</Text>
            <Text style={styles.instructionText}>Record a 3-second selfie video showing your face clearly. This is mandatory for vendor approval.</Text>
          </View>

          <View style={styles.controls}>
            {videoUri ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: COLORS.accent, marginBottom: 10, fontWeight: 'bold' }}>✓ Video Recorded</Text>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                  <TouchableOpacity style={styles.retakeButton} onPress={handleRecordPress}>
                    <Icon name="refresh-cw" size={20} color={COLORS.white} />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Submit for Approval</Text>
                    <Icon name="check" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.recordOuter} 
                onPress={handleRecordPress}
              >
                <View style={styles.recordInner} />
                <Text style={styles.recordLabel}>Open Camera</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Driver Verification</Text>
        <Text style={styles.footerSubtitle}>Your video will be reviewed by the vendor before they approve your ride.</Text>
      </View>
      <Loader visible={loading} message="Uploading verification..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  cameraView: { flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, padding: SPACING.lg, justifyContent: 'space-between' },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 0 : 20 },
  instructionsContainer: { backgroundColor: 'rgba(0,0,0,0.7)', padding: SPACING.lg, borderRadius: RADIUS.lg, borderLeftWidth: 5, borderLeftColor: COLORS.primary },
  instructionTitle: { color: COLORS.white, fontWeight: '900', fontSize: 18, marginBottom: 6 },
  instructionText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,0,0,0.2)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,0,0,0.5)' },
  redDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.error, marginRight: 10 },
  timerText: { color: COLORS.white, fontWeight: '900', fontSize: 20, fontVariant: ['tabular-nums'] },
  controls: { alignItems: 'center', marginBottom: SPACING.xl },
  recordOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  recordInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.error, marginBottom: 5 },
  recordLabel: { color: COLORS.white, fontSize: 12, position: 'absolute', bottom: -25, fontWeight: 'bold' },
  retakeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  retakeText: { color: COLORS.white, marginLeft: 8, fontWeight: 'bold' },
  submitButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  submitText: { color: COLORS.white, marginRight: 8, fontWeight: 'bold' },
  footer: { backgroundColor: COLORS.white, padding: SPACING.xl, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  footerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primaryDark, textAlign: 'center' },
  footerSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
});

export default VideoVerificationScreen;
