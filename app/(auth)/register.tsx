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
  Image as RNImage,
  Animated,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Text } from '@/components/Themed';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { register, verifyOTP } from '../services/authService';

// Custom error message component with animation
type ErrorMessageProps = {
  message: string;
  visible: boolean;
};

const ErrorMessage = ({ message, visible }: ErrorMessageProps) => {
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.errorContainer, { opacity }]}>
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
};

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
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Update isSalon state whenever role changes
  useEffect(() => {
    setIsSalon(role === 'salon');
    // Clear business license if switching to consumer
    if (role !== 'salon') {
      setBusinessLicense(null);
      setLicenseError('');
    }
  }, [role]);

  // Input change handlers to clear errors
  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
    setGeneralError('');
  };
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError('');
    validateConfirmPassword(text, confirmPassword);
  };
  
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    validateConfirmPassword(password, text);
  };
  
  const handleOtpChange = (text: string) => {
    setOtp(text);
    setOtpError('');
  };

  // Validation functions
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    return true;
  };
  
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };
  
  const validateConfirmPassword = (pwd = password, confirmPwd = confirmPassword) => {
    if (pwd && confirmPwd && pwd !== confirmPwd) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };
  
  const validateLicense = () => {
    if (isSalon && !businessLicense) {
      setLicenseError('Business license is required for salon registration');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      setLicenseError('Permission to access photos is required');
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
      setLicenseError('');
    }
  };

  const handleRegister = async () => {
    // Reset all errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setLicenseError('');
    setGeneralError('');
    
    // Validate all inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isLicenseValid = validateLicense();
    
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isLicenseValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Register user and explicitly request that OTP be sent immediately
      const response = await register(email, password, role, businessLicense);
      
      if (!response.otpSent) {
        // If the backend didn't send an OTP, show an error
        throw new Error('Verification code could not be sent. Please try again.');
      }
      
      if (role === 'salon') {
        // For salons: notify that both OTP verification and admin approval are needed
        Alert.alert(
          'Registration Submitted',
          'Your registration has been submitted successfully!\n\n' +
          [{ text: 'Verify Email', onPress: () => setShowOtpInput(true) }]
        );
      } else {
        // For consumers: just OTP verification
        Alert.alert(
          'Registration Successful',
          'Check your email for the verification code.',
          [{ text: 'OK', onPress: () => setShowOtpInput(true) }]
        );
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Registration failed';
      
      if (errorMessage.includes('already exists') || errorMessage.includes('already in use')) {
        setEmailError('An account with this email already exists');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setGeneralError('Network error. Please check your internet connection');
      } else if (errorMessage.includes('license')) {
        setLicenseError('There was a problem with your business license. Please try uploading again');
      } else if (errorMessage.includes('verification') || errorMessage.includes('OTP') || errorMessage.includes('code')) {
        // Handle OTP-specific errors
        setGeneralError(errorMessage);
      } else {
        setGeneralError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    // Reset errors
    setOtpError('');
    setGeneralError('');
    
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP with backend
      await verifyOTP(email, otp, role);
      
      if (role === 'salon') {
        // For salons: admin approval pending
        Alert.alert(
          'Email Verified',
          'Your account has been verified successfully!',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        // For consumers, proceed to app
        Alert.alert(
          'Verification Successful',
          'Your account has been verified successfully!',
          [{ text: 'Continue', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Verification failed';
      
      if (errorMessage.includes('invalid') || errorMessage.includes('incorrect') || errorMessage.includes('wrong')) {
        setOtpError('Invalid verification code. Please try again');
      } else if (errorMessage.includes('expired')) {
        setOtpError('Verification code has expired. Please request a new one');
      } else {
        setGeneralError(errorMessage);
      }
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
        </View>
        
        {/* Show general error if present */}
        <ErrorMessage message={generalError} visible={!!generalError} />
        
        {!showOtpInput ? (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : {}]}
                placeholder="Email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
                onBlur={validateEmail}
              />
              <ErrorMessage message={emailError} visible={!!emailError} />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : {}]}
                placeholder="Password"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                placeholderTextColor="#A0A0A0"
                onBlur={validatePassword}
              />
              <ErrorMessage message={passwordError} visible={!!passwordError} />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, confirmPasswordError ? styles.inputError : {}]}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                placeholderTextColor="#A0A0A0"
                onBlur={() => validateConfirmPassword()}
              />
              <ErrorMessage message={confirmPasswordError} visible={!!confirmPasswordError} />
            </View>
            
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
                  style={[styles.licensePicker, licenseError ? styles.licensePickerError : {}]}
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
                
                <ErrorMessage message={licenseError} visible={!!licenseError} />
                
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
              style={[styles.button, 
                (!!emailError || !!passwordError || !!confirmPasswordError || !!licenseError) 
                  ? styles.buttonDisabled : {}
              ]}
              onPress={handleRegister}
              disabled={isLoading || !!emailError || !!passwordError || !!confirmPasswordError || !!licenseError}
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
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.otpInput, otpError ? styles.inputError : {}]}
                placeholder="6-digit code"
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor="#A0A0A0"
              />
              <ErrorMessage message={otpError} visible={!!otpError} />
            </View>
            
            <TouchableOpacity
              style={[styles.button, otpError ? styles.buttonDisabled : {}]}
              onPress={handleVerifyOTP}
              disabled={isLoading || !!otpError || otp.length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.resendContainer}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
            </TouchableOpacity>
          </>
        )}
        
        <View style={styles.loginContainer}>
          <Text>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F7F7F7',
  },
  inputError: {
    borderColor: '#ff4747',
    borderWidth: 1.5,
  },
  errorContainer: {
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 4,
    marginBottom: 5,
  },
  errorText: {
    color: '#ff4747',
    fontSize: 12,
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
  licensePickerError: {
    borderColor: '#ff4747',
    borderWidth: 1.5,
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
  buttonDisabled: {
    backgroundColor: '#92c5e8',
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
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
  },
  resendContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  resendText: {
    color: '#2f95dc',
    fontSize: 14,
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