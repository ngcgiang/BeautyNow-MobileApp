import * as SecureStore from 'expo-secure-store';
import { API_URL, headers, handleResponse } from './apiClient';
import { getToken } from './authService';

const TOKEN_KEY = 'userToken';

// Interface for Salon Service
export interface SalonService {
  id?: string;
  salonId?: string;
  name: string;
  category: string[];
  description?: string;
  price: number;
  duration: number;
  illustrationImage?: string;
  createdAt?: string;
}

// CREATE SALON SERVICE
export const createSalonService = async (
  name: string,
  category: string[],
  price: number,
  duration: number,
  description?: string,
  illustrationImage?: string
) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create form data for multipart request
  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', JSON.stringify(category));
  formData.append('price', price.toString());
  formData.append('duration', duration.toString());
  
  if (description) {
    formData.append('description', description);
  }
  
  // Add illustration image if it exists
  if (illustrationImage) {
    const fileName = illustrationImage.split('/').pop() || 'service.jpg';
    
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
      fileType = 'image/png';
    }
    
    formData.append('illustrationImage', {
      uri: illustrationImage,
      name: fileName,
      type: fileType,
    } as any);
  }
    console.log(formData);

  const response = await fetch(`${API_URL}/salon-profile/services`, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};

// GET SALON SERVICES
export const getSalonServices = async () => {
  const token = await getToken();
  console.log('Fetching salon services with token:', token);
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await fetch(`${API_URL}/salon-profile/services`, {
    method: 'GET',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    },
  });

  const data = await handleResponse(response);
  console.log('Fetched salon services:', data);
  // Normalize illustration image if needed
  if (Array.isArray(data)) {
    return data.map(service => {
      if (service.illustrationImage && typeof service.illustrationImage === 'object') {
        service.illustrationImage = service.illustrationImage.uri || 
                                   service.illustrationImage.url || 
                                   service.illustrationImage.path || '';
      }
      return service;
    });
  }
  
  return data;
};

// GET SINGLE SALON SERVICE
export const getSalonService = async (serviceId: string) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/salon-profile/services/${serviceId}`, {
    method: 'GET',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    },
  });
  
  const data = await handleResponse(response);
  
  // Normalize illustration image if needed
  if (data && data.illustrationImage && typeof data.illustrationImage === 'object') {
    data.illustrationImage = data.illustrationImage.uri || 
                             data.illustrationImage.url || 
                             data.illustrationImage.path || '';
  }
  
  return data;
};

// UPDATE SALON SERVICE
export const updateSalonService = async (
  serviceId: string,
  serviceData: {
    name?: string;
    description?: string;
    price?: number;
    duration?: number;
    category?: string[];
  },
  illustrationImage?: string
) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create form data for multipart request
  const formData = new FormData();
  
  // Add service data to formData
  if (serviceData.name) formData.append('name', serviceData.name);
  if (serviceData.description) formData.append('description', serviceData.description);
  if (serviceData.price) formData.append('price', serviceData.price.toString());
  if (serviceData.duration) formData.append('duration', serviceData.duration.toString());
  if (serviceData.category) formData.append('category', JSON.stringify(serviceData.category));
  
  // Add illustration image if it exists
  if (illustrationImage) {
    const fileName = illustrationImage.split('/').pop() || 'service.jpg';
    
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
      fileType = 'image/png';
    }
    
    formData.append('illustrationImage', {
      uri: illustrationImage,
      name: fileName,
      type: fileType,
    } as any);
  }

  const response = await fetch(`${API_URL}/salon-profile/services/${serviceId}`, {
    method: 'PUT',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};

// DELETE SALON SERVICE
export const deleteSalonService = async (serviceId: string) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/salon-profile/services/${serviceId}`, {
    method: 'DELETE',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`
    },
  });
  
  return handleResponse(response);
};