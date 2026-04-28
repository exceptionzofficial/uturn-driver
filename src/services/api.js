import axios from 'axios';

// Production Backend URL
const API_BASE = 'https://uturn-nl7u.onrender.com/api';
const GOOGLE_MAPS_API_KEY = 'AIzaSyAs3nkKoCsndZiXeV6oh0PvRLL7FpMiZ4k';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// ── Trip Discovery ────────────────────────────────────────────
export const getAvailableTrips = async () => {
  try {
    const response = await apiClient.get('/bookings/available');
    return response.data;
  } catch (error) {
    console.error('Fetch available trips error:', error);
    return [];
  }
};

// ── Accept Trip (with optional video URL) ─────────────────────
export const acceptTrip = async (tripId, driverId, videoUrl = '') => {
  try {
    if (videoUrl && (videoUrl.startsWith('file://') || videoUrl.startsWith('/'))) {
      const formData = new FormData();
      formData.append('driverId', driverId);
      formData.append('video', {
        uri: videoUrl,
        type: 'video/mp4',
        name: `video_${Date.now()}.mp4`,
      });
      const response = await apiClient.post(`/bookings/${tripId}/accept`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await apiClient.post(`/bookings/${tripId}/accept`, { driverId, videoUrl });
      return response.data;
    }
  } catch (error) {
    console.error('Accept trip error:', error);
    throw error;
  }
};

// ── Get Trip by ID ────────────────────────────────────────────
export const getTripById = async (tripId) => {
  try {
    const response = await apiClient.get(`/bookings/${tripId}`);
    return response.data;
  } catch (error) {
    console.error('Get trip by ID error:', error);
    throw error;
  }
};

// ── OTP — Generate (for customer to read to driver) ───────────
export const generateRideOtp = async (tripId) => {
  try {
    const response = await apiClient.post(`/bookings/${tripId}/otp-generate`);
    return response.data;
  } catch (error) {
    console.error('Generate OTP error:', error);
    throw error;
  }
};

// ── OTP — Start Trip ───────────────────────────────────────────
export const startTrip = async (tripId, otp, extraData = {}) => {
  try {
    const response = await apiClient.post(`/bookings/${tripId}/start`, { 
      otp: String(otp),
      startKm: extraData.startKm || 0,
    });
    return response.data;
  } catch (error) {
    console.error('Start trip error:', error);
    throw error;
  }
};

// ── Update Status (arrived, confirmed) ───────────────────────
export const updateStatus = async (tripId, status) => {
  try {
    const response = await apiClient.put(`/bookings/${tripId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update status error:', error);
    throw error;
  }
};

// ── Drop Customer (extra charges + odometer → server calculates final fare)
export const dropCustomer = async (tripId, charges) => {
  try {
    const response = await apiClient.post(`/bookings/${tripId}/drop`, {
      tollCharges:    charges.tollCharges    || 0,
      parkingCharges: charges.parkingCharges || 0,
      permitCharges:  charges.permitCharges  || 0,
      otherCharges:   charges.otherCharges   || 0,
      waitCharges:    charges.waitCharges    || 0,
      startKm:        charges.startKm        || 0,
      endKm:          charges.endKm          || 0,
      distanceKm:     charges.distanceKm     || 0,
    });
    return response.data;
  } catch (error) {
    console.error('Drop customer error:', error);
    throw error;
  }
};

// ── Complete Trip (commission + driver lock) ──────────────────
export const completeTrip = async (tripId) => {
  try {
    const response = await apiClient.post(`/bookings/${tripId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Complete trip error:', error);
    throw error;
  }
};

// ── Driver Trip History ───────────────────────────────────────
export const getDriverTrips = async (driverId, status = '') => {
  try {
    const url = `/bookings/driver/${driverId}${status ? `?status=${status}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Get driver trips error:', error);
    return [];
  }
};

// ── Legacy — kept for compatibility ──────────────────────────
export const updateTripStatus = async (tripId, action, data = {}) => {
  try {
    const response = await apiClient.post(`/bookings/${tripId}/${action}`, data);
    return response.data;
  } catch (error) {
    console.error('Update trip status error:', error);
    throw error;
  }
};

// ── Geocoding ─────────────────────────────────────────────────
export const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    return 'Unknown Location';
  } catch (error) {
    console.error('Geocoding error:', error);
    return 'Error getting address';
  }
};

// ── Trigger SOS ───────────────────────────────────────────────
export const triggerSOS = async (tripId, driverId, location) => {
  try {
    const response = await apiClient.post(`/bookings/${tripId}/sos`, { driverId, location });
    return response.data;
  } catch (error) {
    console.error('SOS trigger error:', error);
    throw error;
  }
};

// ── Create Self Ride (Driver books own trip) ──────────────────
export const createSelfRide = async (tripData) => {
  try {
    const response = await apiClient.post('/bookings/create', tripData);
    return response.data;
  } catch (error) {
    console.error('Create self ride error:', error);
    throw error;
  }
};
