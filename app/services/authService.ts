import * as SecureStore from 'expo-secure-store';
import { API_URL, headers, handleResponse } from './apiClient';
import * as FileSystem from 'expo-file-system';

// Key for storing auth token
const TOKEN_KEY = 'userToken';

// Register a new user
export const register = async (email: string, password: string, role: string, businessLicense: string | null) => {
  // For salon registrations with file uploads, we need to use FormData
  if (role === 'salon' && businessLicense) {
    // Create form data for multipart request
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    
    // Get file name from URI
    const fileName = businessLicense.split('/').pop() || 'license.jpg';
    
    // Determine file type
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
      fileType = 'image/png';
    } else if (fileName.endsWith('.pdf')) {
      fileType = 'application/pdf';
    }
    
    // Append the file to formData
    formData.append('businessLicense', {
      uri: businessLicense,
      name: fileName,
      type: fileType,
    } as any);

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      body: formData,
      headers: {
        // FormData sets its own content-type header with boundary
        'Accept': 'application/json',
      },
    });
    
    return handleResponse(response);
  } else {
    // Regular JSON request for consumer registration
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        password,
        role,
      }),
    });
    
    return handleResponse(response);
  }
};

// Verify OTP
export const verifyOTP = async (email: string, otp: string, role: string) => {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      otp,
      role,
    }),
  });
  
  const data = await handleResponse(response);
  
  // Store token securely if verification successful
  if (data.token) {
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  }
  
  return data;
};

// Login
export const login = async (email: string, password: string, role: string = 'consumer') => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      role,
    }),
  });
  
  const data = await handleResponse(response);
  
  // Store token securely
  if (data.token) {
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  }
  
  return data;
};

// Logout
export const logout = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// Check if logged in
export const isAuthenticated = async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return !!token;
};

// Get token for authenticated requests
export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

// Get user type from secure storage
export const getUserType = async () => {
  try {
    const userType = await SecureStore.getItemAsync('userType');
    return userType as 'consumer' | 'salon' | null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
};

// Set user type in secure storage
export const setUserType = async (type: 'consumer' | 'salon') => {
  try {
    await SecureStore.setItemAsync('userType', type);
    return true;
  } catch (error) {
    console.error('Error setting user type:', error);
    return false;
  }
};