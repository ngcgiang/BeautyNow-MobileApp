import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { 
  UserProfile, 
  getUserProfile, 
  createUserProfile, 
  updateUserProfile, 
  deleteUserProfile,
  getImageUri 
} from '../services/userProfileService';
import { logout } from '../services/authService';

export default function ConsumerProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [faceImage, setFaceImage] = useState<string>('');
  
  // Validation errors
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileData = await getUserProfile();
      setProfile(profileData);
      
      // Initialize form data with profile data
      if (profileData) {
        setFullName(profileData.fullName || '');
        setPhone(profileData.phone || '');
        setAddress(profileData.address || '');
        setFaceImage(getImageUri(profileData.faceImage) || '');
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      if (error && error.status === 404) {
        // Profile doesn't exist yet, that's fine
        setProfile(null);
      } else {
        setError('Failed to load profile. Please try again.');
      }
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFaceImage(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setPhoneError('');
    
    if (!fullName.trim()) {
      setNameError('Full name is required');
      isValid = false;
    }
    
    if (phone.trim() && !/^\+?[0-9]{10,15}$/.test(phone.trim())) {
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
      if (profile?.id) {
        // Update existing profile
        const profileData = {
          fullName,
          phone,
          address,
        };
        
        await updateUserProfile(profileData, faceImage);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        // Create new profile
        await createUserProfile(fullName, phone, address, faceImage);
        Alert.alert('Success', 'Profile created successfully');
      }
      
      await fetchUserProfile();
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
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteUserProfile();
              Alert.alert('Profile Deleted', 'Your profile has been deleted.');
              setProfile(null);
              setFullName('');
              setPhone('');
              setAddress('');
              setFaceImage('');
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
  if (isLoading && !isEditing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Profile Header */}
          <View style={styles.header}>
            {faceImage ? (
              <Image 
                source={{ uri: faceImage }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <FontAwesome name="user" size={60} color="#CCCCCC" />
              </View>
            )}
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Edit Profile' : (profile ? fullName : 'Create Your Profile')}
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
                <Text style={styles.label}>Profile Picture</Text>
                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                  {faceImage ? (
                    <Image source={{ uri: faceImage }} style={styles.pickerImage} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <FontAwesome name="camera" size={36} color="#4A90E2" />
                      <Text style={styles.imagePickerText}>Select Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name*</Text>
                <TextInput
                  style={[styles.input, nameError ? styles.inputError : null]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, phoneError ? styles.inputError : null]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    if (profile) {
                      // Reset form with original values
                      setFullName(profile.fullName || '');
                      setPhone(profile.phone || '');
                      setAddress(profile.address || '');
                      setFaceImage(getImageUri(profile.faceImage) || '');
                    } else {
                      // Reset to empty if no profile exists
                      setFullName('');
                      setPhone('');
                      setAddress('');
                      setFaceImage('');
                    }
                    setIsEditing(false);
                    setNameError('');
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
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    
                    <View style={styles.infoRow}>
                      <FontAwesome name="user" size={18} color="#666" />
                      <Text style={styles.infoText}>{profile.fullName}</Text>
                    </View>
                    
                    {profile.phone && (
                      <View style={styles.infoRow}>
                        <FontAwesome name="phone" size={18} color="#666" />
                        <Text style={styles.infoText}>{profile.phone}</Text>
                      </View>
                    )}
                    
                    {profile.address && (
                      <View style={styles.infoRow}>
                        <FontAwesome name="map-marker" size={18} color="#666" />
                        <Text style={styles.infoText}>{profile.address}</Text>
                      </View>
                    )}
                  </View>

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
                    You haven't set up your profile yet
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
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 24,
    padding: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePickerPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 8,
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