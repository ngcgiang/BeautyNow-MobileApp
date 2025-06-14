import { API_URL, headers, handleResponse } from './apiClient';
import { getToken } from './authService';
import { getImageUri } from './userProfileService';

// Interface for filtered service results
export interface FilteredService {
  id: string;
  salonId: string;
  name: string;
  category: string[];
  description?: string;
  price: number;
  duration: number;
  illustrationImage?: string;
  salon?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
    description?: string;
    portfolio?: string[];
    rating?: number;
  };
}

// Interface for filter parameters
export interface ServiceFilterParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}

/**
 * Filter services based on specified criteria
 * @param filterParams Object containing filter parameters
 * @returns Array of filtered services with salon information
 */
export const filterServices = async (filterParams: ServiceFilterParams) => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}/services/filter`, {
      method: 'POST',
      headers: {
        ...headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(filterParams)
    });
    
    const data = await handleResponse(response);
    
    // Process images to ensure they're in the correct format
    if (data && data.services) {
      return data.services.map((service: any) => {
        // Process illustration image
        if (service.illustrationImage) {
          service.illustrationImage = getImageUri(service.illustrationImage);
        }
        
        // Process salon data if available
        if (service.Salon) {
          service.salon = {
            id: service.Salon.id,
            name: service.Salon.SalonProfile?.name || '',
            address: service.Salon.SalonProfile?.address || '',
            phone: service.Salon.SalonProfile?.phone,
            description: service.Salon.SalonProfile?.description,
            portfolio: service.Salon.SalonProfile?.portfolio?.map((img: any) => getImageUri(img)) || [],
            rating: service.Salon.rating
          };
          
          // Remove the raw Salon object
          delete service.Salon;
        }

        return service;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error filtering services:', error);
    throw error;
  }
};

/**
 * Search services by keywords across name, description, and salon details
 * @param keyword Search term
 * @returns Array of filtered services matching the search
 */
export const searchServices = async (keyword: string) => {
  if (!keyword || keyword.trim() === '') {
    return [];
  }
  
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}/services/search`, {
      method: 'POST',
      headers: {
        ...headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ keyword: keyword.trim() })
    });
    
    const data = await handleResponse(response);
    
    // Process images and normalize data structure
    if (data && data.services) {
      return data.services.map((service: any) => {
        // Process illustration image
        if (service.illustrationImage) {
          service.illustrationImage = getImageUri(service.illustrationImage);
        }
        
        // Process salon data if available
        if (service.Salon) {
          service.salon = {
            id: service.Salon.id,
            name: service.Salon.SalonProfile?.name || '',
            address: service.Salon.SalonProfile?.address || '',
            phone: service.Salon.SalonProfile?.phone,
            description: service.Salon.SalonProfile?.description,
            portfolio: service.Salon.SalonProfile?.portfolio?.map((img: any) => getImageUri(img)) || [],
            rating: service.Salon.rating
          };
          
          // Remove the raw Salon object
          delete service.Salon;
        }
        
        return service;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};
