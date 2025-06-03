import Constants from 'expo-constants';

// API base URL - using localhost for development
// For actual device testing, use your computer's IP address
const API_URL = 'http://192.168.1.16:3000'; // Android emulator uses 10.0.2.2 to access localhost
// const API_URL = 'http://localhost:3000'; // Use this for iOS simulator
// const API_URL = 'https://your-deployed-api-url.com'; // Production URL

// Common headers
const headers = {
  'Content-Type': 'application/json',
};

// Error handling utility
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // You can add more sophisticated error handling here
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  
  return data;
};

export { API_URL, headers, handleResponse };