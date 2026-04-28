import axios from 'axios';

const API_BASE_URL = 'https://uturn-nl7u.onrender.com/api/'; // Production URL with trailing slash

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for Render cold start
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
