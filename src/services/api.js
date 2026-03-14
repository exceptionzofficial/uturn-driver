import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAs3nkKoCsndZiXeV6oh0PvRLL7FpMiZ4k';

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
