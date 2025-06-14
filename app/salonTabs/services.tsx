import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  KeyboardAvoidingView,
  View as RNView
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  SalonService, 
  getSalonServices, 
  createSalonService, 
  updateSalonService, 
  deleteSalonService 
} from '../services/salonServicesService';

const CATEGORIES = [
  "Haircut", "Hair Coloring", "Hair Styling", 
  "Manicure", "Pedicure", "Facial", 
  "Massage", "Makeup", "Waxing",
  "Skincare", "Hair Treatment", "Other"
];

export default function ServicesScreen() {
  // State for services list
  const [services, setServices] = useState<SalonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<SalonService | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [illustrationImage, setIllustrationImage] = useState<string>('');
  
  // Validation errors
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Fetch salon services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const servicesData = await getSalonServices();
      console.log('Fetched salon services:', servicesData);
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error: any) {
      // Log more detailed error information
      console.error('Error fetching salon services:', error);
      
      // Check if the error is a response object with status code
      if (error && error.status) {
        console.error(`HTTP Status: ${error.status}`);
        console.error(`Response: ${JSON.stringify(error.data)}`);
        
        if (error.status === 401 || error.status === 403) {
          setError('Authentication error. Please log in again.');
        } else if (error.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(`Failed to load services: ${error.message || 'Unknown error'}`);
        }
      } else {
        // Network or other client-side error
        setError(`Connection error: ${error instanceof Error ? error.message : 'Please check your internet connection'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    // Reset form
    setName('');
    setPrice('');
    setDuration('');
    setDescription('');
    setCategories([]);
    setIllustrationImage('');
    setCurrentService(null);
    
    // Reset errors
    setNameError('');
    setPriceError('');
    setDurationError('');
    setCategoryError('');
    
    setIsEditing(false);
    setIsModalVisible(true);
  };

  const openEditModal = (service: SalonService) => {
    // Set form values from service
    setName(service.name);
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setDescription(service.description || '');
    setCategories(service.category || []);
    setIllustrationImage(service.illustrationImage || '');
    setCurrentService(service);
    
    // Reset errors
    setNameError('');
    setPriceError('');
    setDurationError('');
    setCategoryError('');
    
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setPriceError('');
    setDurationError('');
    setCategoryError('');
    
    if (!name.trim()) {
      setNameError('Service name is required');
      isValid = false;
    }
    
    if (!price.trim()) {
      setPriceError('Price is required');
      isValid = false;
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      setPriceError('Please enter a valid price');
      isValid = false;
    }
    
    if (!duration.trim()) {
      setDurationError('Duration is required');
      isValid = false;
    } else if (isNaN(Number(duration)) || Number(duration) <= 0) {
      setDurationError('Please enter a valid duration in minutes');
      isValid = false;
    }
    
    if (categories.length === 0) {
      setCategoryError('Select at least one category');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isEditing && currentService?.id) {
        // Update existing service
        await updateSalonService(
          currentService.id,
          {
            name,
            description,
            price: Number(price),
            duration: Number(duration),
            category: categories,
          },
          illustrationImage
        );
        Alert.alert('Success', 'Service updated successfully');
      } else {
        // Create new service
        await createSalonService(
          name,
          categories,
          Number(price),
          Number(duration),
          description,
          illustrationImage
        );
        Alert.alert('Success', 'Service created successfully');
      }
      
      await fetchServices();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving service:', error);
      setError('Failed to save service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (service: SalonService) => {
    if (!service.id) return;
    
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteSalonService(service.id!);
              await fetchServices();
              Alert.alert('Service Deleted', 'The service has been deleted successfully.');
            } catch (error) {
              console.error('Error deleting service:', error);
              setError('Failed to delete service. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
    // Clear any category error when selecting
    setCategoryError('');
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permission to upload images.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIllustrationImage(result.assets[0].uri);
    }
  };

  const formatPrice = (price: number): string => {
    return `$${price}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Display loading spinner while fetching data
  if (isLoading && services.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Services</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openAddModal}
        >
          <FontAwesome name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Service</Text>
        </TouchableOpacity>
      </View>
      
      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="scissors" size={50} color="#CCCCCC" />
          <Text style={styles.emptyText}>No services available</Text>
          <Text style={styles.emptySubtext}>Add your first service to get started</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id || item.name}
          renderItem={({ item }) => (
            <View style={styles.serviceCard}>
              <View style={styles.serviceContent}>
                <View style={styles.serviceHeader}>
                  <View>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.servicePrice}>{formatPrice(item.price)}</Text>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => openEditModal(item)}
                    >
                      <FontAwesome name="edit" size={18} color="#4A90E2" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item)}
                    >
                      <FontAwesome name="trash" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.serviceDetails}>
                  <View style={styles.detailRow}>
                    <FontAwesome name="clock-o" size={16} color="#666" />
                    <Text style={styles.detailText}>{formatDuration(item.duration)}</Text>
                  </View>
                  
                  <View style={styles.categoryContainer}>
                    {item.category }
                  </View>
                  
                  {item.description && (
                    <Text style={styles.description}>{item.description}</Text>
                  )}
                </View>
                
                {item.illustrationImage && (
                  <Image 
                    source={{ uri: item.illustrationImage }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={fetchServices}
        />
      )}
      
      {/* Add/Edit Service Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Service' : 'Add New Service'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Name*</Text>
                <TextInput
                  style={[styles.input, nameError ? styles.inputError : null]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter service name"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>
              
              <RNView style={styles.rowContainer}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Price ($)*</Text>
                  <TextInput
                    style={[styles.input, priceError ? styles.inputError : null]}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                  {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Duration (min)*</Text>
                  <TextInput
                    style={[styles.input, durationError ? styles.inputError : null]}
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="30"
                    keyboardType="number-pad"
                  />
                  {durationError ? <Text style={styles.errorText}>{durationError}</Text> : null}
                </View>
              </RNView>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categories*</Text>
                <View style={styles.categoriesContainer}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        categories.includes(category) ? styles.selectedCategory : null
                      ]}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text 
                        style={[
                          styles.categoryButtonText,
                          categories.includes(category) ? styles.selectedCategoryText : null
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this service"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Image</Text>
                {illustrationImage ? (
                  <RNView style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: illustrationImage }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setIllustrationImage('')}
                    >
                      <FontAwesome name="times" size={16} color="white" />
                    </TouchableOpacity>
                  </RNView>
                ) : (
                  <TouchableOpacity
                    style={styles.imagePicker}
                    onPress={pickImage}
                  >
                    <FontAwesome name="image" size={24} color="#4A90E2" />
                    <Text style={styles.imagePickerText}>Select Image</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <RNView style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </RNView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  serviceContent: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  serviceDetails: {
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  serviceImage: {
    width: '100%',
    height: 150,
    marginTop: 12,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  selectedCategory: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#4A90E2',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});