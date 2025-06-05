import * as SecureStore from 'expo-secure-store';
import { API_URL, headers, handleResponse } from './apiClient';
import { getToken } from './authService';

const TOKEN_KEY = 'userToken';

// Interface for Salon Profile
export interface SalonProfile {
  id?: string;
  salonId?: string;
  name: string;
  address: string;
  phone: string;
  description?: string;
  portfolio?: string[];
  createdAt?: string;
}

// Create Salon Profile
export const createSalonProfile = async (
  name: string, 
  address: string, 
  phone: string, 
  description?: string, 
  portfolioFiles?: string[]
) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create form data for multipart request
  const formData = new FormData();
  formData.append('name', name);
  formData.append('address', address);
  formData.append('phone', phone);
  
  if (description) {
    formData.append('description', description);
  }
  
  // Add portfolio files if they exist
  if (portfolioFiles && portfolioFiles.length > 0) {
    portfolioFiles.forEach((file, index) => {
      // Get file name from URI
      const fileName = file.split('/').pop() || `portfolio_${index}.jpg`;
      
      // Determine file type
      let fileType = 'image/jpeg';
      if (fileName.endsWith('.png')) {
        fileType = 'image/png';
      } else if (fileName.endsWith('.mp4')) {
        fileType = 'video/mp4';
      }
      
      // Append the file to formData
      formData.append('portfolio', {
        uri: file,
        name: fileName,
        type: fileType,
      } as any);
    });
  }

  const response = await fetch(`${API_URL}/salon-profile`, {
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

// Get Salon Profile
export const getSalonProfile = async () => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/salon-profile`, {
    method: 'GET',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    },
  });
  
  const data = await handleResponse(response);
  
  // Normalize portfolio data if it exists
  if (data && data.portfolio) {
    // Ensure each portfolio item is a string
    data.portfolio = data.portfolio.map((item: any) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        return item.uri || item.url || item.path || '';
      }
      return '';
    }).filter(Boolean); // Remove any empty strings
  }
  
  return data;
};

// Update Salon Profile
export const updateSalonProfile = async (
  profileData: {
    name?: string;
    address?: string;
    phone?: string;
    description?: string;
  },
  portfolioFiles?: string[]
) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create form data for multipart request
  const formData = new FormData();
  
  // Add profile data to formData
  if (profileData.name) formData.append('name', profileData.name);
  if (profileData.address) formData.append('address', profileData.address);
  if (profileData.phone) formData.append('phone', profileData.phone);
  if (profileData.description) formData.append('description', profileData.description);
  
  // Add portfolio files if they exist
  if (portfolioFiles && portfolioFiles.length > 0) {
    portfolioFiles.forEach((file, index) => {
      const fileName = file.split('/').pop() || `portfolio_${index}.jpg`;
      
      let fileType = 'image/jpeg';
      if (fileName.endsWith('.png')) {
        fileType = 'image/png';
      } else if (fileName.endsWith('.mp4')) {
        fileType = 'video/mp4';
      }
      
      formData.append('portfolio', {
        uri: file,
        name: fileName,
        type: fileType,
      } as any);
    });
  }

  const response = await fetch(`${API_URL}/salon-profile`, {
    method: 'PUT',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};

// Delete Salon Profile
export const deleteSalonProfile = async () => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/salon-profile`, {
    method: 'DELETE',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};