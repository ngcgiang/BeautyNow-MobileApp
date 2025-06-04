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
  Animated 
} from 'react-native';
import { Text } from '@/components/Themed';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import { login } from '../services/authService';
import { setUserType } from '../services/authService';

// Custom error message component with animation
type ErrorMessageProps = {
  message: string;
  visible: boolean;
};

// Custom error message component with animation
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'consumer' | 'salon'>('consumer'); // Default role
  const [isLoading, setIsLoading] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  
  // Reset error when input changes
  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
    setGeneralError('');
  };
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError('');
    setGeneralError('');
  };

  // Validate email format
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
  
  // Validate password
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    // Reset all errors
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    
    // Validate inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Pass the userType to the login function
      const response = await login(email, password, role);
      
      if (response && response.token) {
        // Store the user type in secure storage
        await setUserType(role);
        
        // Get the user's actual role from response if available
        const actualRole = response.role || role;
        
        // Check if attempting to login with wrong user type
        if (actualRole !== role) {
          throw new Error(`This account is registered as a ${actualRole}. Please select the correct user type.`);
        }
        
        // Navigate to the appropriate screens based on user type
        if (role === 'consumer') {
          router.replace('/(consumerTabs)');
        } else if (role === 'salon') {
          router.replace('/salonTabs');
        } else {
          throw new Error('Unknown user type');
        }
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';
      
      if (errorMessage.includes('user not found') || errorMessage.includes('no user found')) {
        setEmailError('No account found with this email');
      } else if (errorMessage.includes('incorrect password') || errorMessage.includes('wrong password')) {
        setPasswordError('Incorrect password');
      } else if (errorMessage.includes('not verified')) {
        setGeneralError('Account not verified. Please check your email for verification instructions.');
      } else if (errorMessage.includes('wrong user type') || errorMessage.includes('registered as')) {
        setGeneralError(errorMessage);
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setGeneralError('Network error. Please check your internet connection.');
      } else {
        setGeneralError('Login failed. Please check your credentials and try again.');
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

      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome Back</Text>
      </View>

      {/* Show general error if present */}
      <ErrorMessage message={generalError} visible={!!generalError} />

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input, 
            emailError ? styles.inputError : {}
          ]}
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
          style={[
            styles.input, 
            passwordError ? styles.inputError : {}
          ]}
          placeholder="Password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          placeholderTextColor="#A0A0A0"
          onBlur={validatePassword}
        />
        <ErrorMessage message={passwordError} visible={!!passwordError} />
      </View>

      <Text style={styles.sectionTitle}>I am a:</Text>
      <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            role === 'consumer' ? styles.selectedType : {}
          ]}
          onPress={() => {
            setRole('consumer');
            setGeneralError('');
          }}
        >
          <Text style={[
            styles.userTypeText,
            role === 'consumer' ? styles.selectedTypeText : {}
          ]}>Consumer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            role === 'salon' ? styles.selectedType : {}
          ]}
          onPress={() => {
            setRole('salon');
            setGeneralError('');
          }}
        >
          <Text style={[
            styles.userTypeText,
            role === 'salon' ? styles.selectedTypeText : {}
          ]}>Salon Owner</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          (!!emailError || !!passwordError) ? styles.buttonDisabled : {}
        ]}
        onPress={handleLogin}
        disabled={isLoading || !!emailError || !!passwordError}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.registerText}>Register</Text>
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
  sectionTitle: {
    alignSelf: 'flex-start',
    color: '#333',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userTypeContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  userTypeButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    marginHorizontal: 5,
  },
  selectedType: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  userTypeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTypeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#2f95dc',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#92c5e8',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  registerText: {
    color: '#2f95dc',
    fontWeight: 'bold',
  },
});