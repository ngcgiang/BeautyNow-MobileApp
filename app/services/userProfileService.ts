import * as SecureStore from 'expo-secure-store';
import { API_URL, headers, handleResponse } from './apiClient';
import { getToken } from './authService';

// Interface for User Profile
export interface UserProfile {
  id?: string;
  userId?: string;
  fullName: string;
  phone?: string;
  address?: string;
  faceImage?: string;
  createdAt?: string;
}

// Create User Profile
export const createUserProfile = async (
  fullName: string, 
  phone?: string, 
  address?: string,
  faceImage?: string
) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create form data for multipart request
  const formData = new FormData();
  formData.append('fullName', fullName);
  
  if (phone) {
    formData.append('phone', phone);
  }
  
  if (address) {
    formData.append('address', address);
  }
  
  // Add face image if it exists
  if (faceImage) {
    // Get file name from URI
    const fileName = faceImage.split('/').pop() || 'face_image.jpg';
    
    // Determine file type
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
      fileType = 'image/png';
    }
    
    // Append the file to formData
    formData.append('faceImage', {
      uri: faceImage,
      name: fileName,
      type: fileType,
    } as any);
  }

  const response = await fetch(`${API_URL}/user-profile`, {
    method: 'POST',
    body: formData,
    headers: {
      // FormData sets its own content-type header with boundary
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};

// Get User Profile
export const getUserProfile = async () => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/user-profile`, {
    method: 'GET',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    },
  });
  
  const data = await handleResponse(response);
  
  // Normalize face image if needed
  if (data && data.faceImage && typeof data.faceImage === 'object') {
    data.faceImage = data.faceImage.uri || data.faceImage.url || data.faceImage.path || '';
  }
  
  return data;
};

// Update User Profile
export const updateUserProfile = async (
  profileData: {
    fullName?: string;
    phone?: string;
    address?: string;
  },
  faceImage?: string
) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create form data for multipart request
  const formData = new FormData();
  
  // Add profile data to formData
  if (profileData.fullName) formData.append('fullName', profileData.fullName);
  if (profileData.phone) formData.append('phone', profileData.phone);
  if (profileData.address) formData.append('address', profileData.address);
  
  // Add face image if it exists
  if (faceImage) {
    const fileName = faceImage.split('/').pop() || 'face_image.jpg';
    
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
      fileType = 'image/png';
    }
    
    formData.append('faceImage', {
      uri: faceImage,
      name: fileName,
      type: fileType,
    } as any);
  }

  const response = await fetch(`${API_URL}/user-profile`, {
    method: 'PUT',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};

// Delete User Profile
export const deleteUserProfile = async () => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/user-profile`, {
    method: 'DELETE',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};

// Improved error handler for debugging
export const enhancedFetch = async (url: string, options: RequestInit) => {
  try {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url, options);
    
    console.log(`Response status: ${response.status}`);
    
    try {
      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.message || response.statusText);
        // @ts-ignore
        error.status = response.status;
        // @ts-ignore
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (jsonError) {
      if (!response.ok) {
        const error = new Error(`HTTP error ${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
      }
      
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Helper to get user image uri safely
export const getImageUri = (image: any): string => {
  if (!image) return '';
  
  // If image is already a string, return it
  if (typeof image === 'string') return image;
  
  // If image is an object, try to find a valid URI property
  if (typeof image === 'object') {
    if (image.uri) return image.uri;
    if (image.url) return image.url;
    if (image.source) return typeof image.source === 'string' ? image.source : 
                        (image.source?.uri || '');
    if (image.path) return image.path;
  }
  
  // If we can't find a valid URI, return empty string
  console.warn('Unable to extract URI from image object:', image);
  return '';
};