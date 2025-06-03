import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  View,
  Image as RNImage
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Text } from '@/components/Themed';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { register, verifyOTP } from '../services/authService';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('consumer');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [businessLicense, setBusinessLicense] = useState<string | null>(null);
  const [isSalon, setIsSalon] = useState(false);

  // Update isSalon state whenever role changes
  useEffect(() => {
    setIsSalon(role === 'salon');
    // Clear business license if switching to consumer
    if (role !== 'salon') {
      setBusinessLicense(null);
    }
  }, [role]);

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'You need to enable permission to access your photos');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setBusinessLicense(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    // Basic validation
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters long.');
      return;
    }

    if (isSalon && !businessLicense) {
      Alert.alert('Error', 'Business license is required for salon registration.');
      return;
    }

    setIsLoading(true);

    try {
      // Use register service with file upload if salon
      await register(email, password, role, businessLicense);
      
      if (role === 'salon') {
        Alert.alert('Success', 'Salon registered! Your license will be reviewed. You will receive an email with verification instructions once approved.');
        // Navigate back to login since salon verification is manual
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Success', 'Registration successful! Check your email for OTP verification.');
        setShowOtpInput(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', typeof error === 'string' ? error : 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      // Use verifyOTP service instead of inline fetch
      await verifyOTP(email, otp, role);
      
      Alert.alert('Success', 'Account verified successfully!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', typeof error === 'string' ? error : 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="auto" />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create Account</Text>
      </View>
      
      {!showOtpInput ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A0A0A0"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#A0A0A0"
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#A0A0A0"
          />
          
          <Text style={styles.pickerLabel}>Register as:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              style={styles.picker}
              onValueChange={(itemValue) => setRole(itemValue)}
            >
              <Picker.Item label="Consumer" value="consumer" />
              <Picker.Item label="Salon" value="salon" />
            </Picker>
          </View>
          
          {isSalon && (
            <View style={styles.licenseContainer}>
              <Text style={styles.licenseLabel}>Business License*</Text>
              
              <TouchableOpacity 
                style={styles.licensePicker}
                onPress={pickImage}
              >
                {businessLicense ? (
                  <RNImage 
                    source={{ uri: businessLicense }} 
                    style={styles.licensePreview} 
                  />
                ) : (
                  <Text style={styles.licensePickerText}>Upload Business License</Text>
                )}
              </TouchableOpacity>
              
              {businessLicense && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setBusinessLicense(null)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.otpText}>Enter the 6-digit code sent to your email</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#A0A0A0"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>
        </>
      )}
      
      <View style={styles.loginContainer}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F7F7F7',
  },
  pickerLabel: {
    alignSelf: 'flex-start',
    color: '#333',
    marginBottom: 5,
    fontSize: 16,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  licenseContainer: {
    width: '100%',
    marginBottom: 20,
  },
  licenseLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  licensePicker: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2f95dc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  licensePickerText: {
    color: '#2f95dc',
    fontSize: 16,
  },
  licensePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  removeButtonText: {
    color: '#ff4747',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  otpText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  loginText: {
    color: '#2f95dc',
    fontWeight: 'bold',
  },
});