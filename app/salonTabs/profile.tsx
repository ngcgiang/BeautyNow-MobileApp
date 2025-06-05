import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SalonProfile, getSalonProfile, updateSalonProfile, createSalonProfile, deleteSalonProfile } from '../services/salonProfileService';
import { logout } from '../services/authService';

const getImageUri = (image: any): string => {
  if (!image) return '';
  
  // If image is already a string, return it
  if (typeof image === 'string') return image;
  
  // If image is an object, try to find a valid URI property
  if (typeof image === 'object') {
    // Check common properties that might contain the URL
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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<SalonProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  
  // Validation errors
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Fetch salon profile on component mount
  useEffect(() => {
    fetchSalonProfile();
  }, []);

  const fetchSalonProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileData = await getSalonProfile();
      setProfile(profileData);
      
      // Initialize form data with profile data
      if (profileData) {
        setName(profileData.name || '');
        setAddress(profileData.address || '');
        setPhone(profileData.phone || '');
        setDescription(profileData.description || '');
        
        // Ensure portfolio images are always strings
        const safePortfolio = (profileData.portfolio || []).map((img: any) => getImageUri(img));
        setPortfolioImages(safePortfolio);
      }
    } catch (error) {
      console.error('Error fetching salon profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'Unable to log out. Please try again.');
    }
  };

  const pickImage = async () => {
    if (portfolioImages.length >= 5) {
      Alert.alert('Portfolio Limit', 'You can only add up to 5 images to your portfolio.');
      return;
    }
    
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
      setPortfolioImages([...portfolioImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setAddressError('');
    setPhoneError('');
    
    if (!name.trim()) {
      setNameError('Salon name is required');
      isValid = false;
    }
    
    if (!address.trim()) {
      setAddressError('Address is required');
      isValid = false;
    }
    
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      setPhoneError('Please enter a valid phone number');
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
      const profileData = {
        name,
        address,
        phone,
        description,
      };
      
      if (profile?.id) {
        // Update existing profile
        await updateSalonProfile(profileData, portfolioImages);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        // Create new profile
        await createSalonProfile(name, address, phone, description, portfolioImages);
        Alert.alert('Success', 'Profile created successfully');
      }
      
      await fetchSalonProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your salon profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteSalonProfile();
              Alert.alert('Profile Deleted', 'Your salon profile has been deleted.');
              setProfile(null);
              setName('');
              setAddress('');
              setPhone('');
              setDescription('');
              setPortfolioImages([]);
              setIsEditing(false);
            } catch (error) {
              console.error('Error deleting profile:', error);
              setError('Failed to delete profile. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Display loading spinner while fetching data
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Profile Header */}
        <View style={styles.header}>
          <FontAwesome name="user-circle" size={80} color="#4A90E2" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Salon Profile' : (profile ? profile.name : 'Create Your Profile')}
            </Text>
            {profile && !isEditing && (
              <Text style={styles.subTitle}>Tap edit to update your information</Text>
            )}
          </View>
        </View>

        {/* Profile Content */}
        {isEditing ? (
          // Edit Mode
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salon Name*</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                value={name}
                onChangeText={setName}
                placeholder="Enter salon name"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address*</Text>
              <TextInput
                style={[styles.input, addressError ? styles.inputError : null]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter salon address"
                multiline
              />
              {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number*</Text>
              <TextInput
                style={[styles.input, phoneError ? styles.inputError : null]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your salon services and specialties"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Portfolio Images (Max 5)</Text>
              <View style={styles.portfolioContainer}>
                {portfolioImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: getImageUri(image) }} style={styles.portfolioImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <FontAwesome name="times" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                {portfolioImages.length < 5 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                    <FontAwesome name="plus" size={24} color="#4A90E2" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.helperText}>
                Add photos of your salon and work (max 5 images)
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  if (profile) {
                    // Reset form with original values
                    setName(profile.name || '');
                    setAddress(profile.address || '');
                    setPhone(profile.phone || '');
                    setDescription(profile.description || '');
                    setPortfolioImages(profile.portfolio || []);
                  } else {
                    // Reset to empty if no profile exists
                    setName('');
                    setAddress('');
                    setPhone('');
                    setDescription('');
                    setPortfolioImages([]);
                  }
                  setIsEditing(false);
                  setNameError('');
                  setAddressError('');
                  setPhoneError('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>

            {profile && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteProfile}
              >
                <Text style={styles.deleteButtonText}>Delete Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // View Mode
          <View style={styles.profileContainer}>
            {profile ? (
              <>
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Salon Information</Text>
                  
                  <View style={styles.infoRow}>
                    <FontAwesome name="building" size={18} color="#666" />
                    <Text style={styles.infoText}>{profile.name}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <FontAwesome name="map-marker" size={18} color="#666" />
                    <Text style={styles.infoText}>{profile.address}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <FontAwesome name="phone" size={18} color="#666" />
                    <Text style={styles.infoText}>{profile.phone}</Text>
                  </View>
                  
                  {profile.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.sectionTitle}>About</Text>
                      <Text style={styles.descriptionText}>{profile.description}</Text>
                    </View>
                  )}
                </View>

                {profile.portfolio && profile.portfolio.length > 0 && (
                  <View style={styles.portfolioSection}>
                    <Text style={styles.sectionTitle}>Portfolio</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {profile.portfolio.map((image, index) => (
                        <Image 
                          key={index} 
                          source={{ uri: getImageUri(image) }}
                          style={styles.portfolioImageLarge}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.button, styles.editButton]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyProfileContainer}>
                <Text style={styles.emptyProfileText}>
                  You haven't set up your salon profile yet
                </Text>
                <TouchableOpacity 
                  style={[styles.button, styles.createButton]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonText}>Create Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 24,
    padding: 16,
  },
  headerTextContainer: {
    marginLeft: 16,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileContainer: {
    backgroundColor: 'transparent',
  },
  formContainer: {
    backgroundColor: 'transparent',
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
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
  portfolioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    position: 'relative',
    margin: 8,
    backgroundColor: 'transparent',
  },
  portfolioImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  portfolioImageLarge: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    flex: 1,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    flex: 1,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#4A90E2',
    marginTop: 24,
  },
  createButton: {
    backgroundColor: '#4CD964',
    marginTop: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 24,
  },
  deleteButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  portfolioSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  emptyProfileContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyProfileText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  }
});