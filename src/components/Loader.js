import React from 'react';
import { StyleSheet, View, Text, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS } from '../theme/AppTheme';

const Loader = ({ visible, message = 'Loading...' }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.loaderCard}>
          <LottieView
            source={require('../assets/car.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCard: {
    width: 150,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  message: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default Loader;
