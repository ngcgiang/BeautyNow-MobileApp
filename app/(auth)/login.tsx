import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Text } from '@/components/Themed';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import { login } from '../services/authService';
import { Picker } from '@react-native-picker/picker';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('consumer'); // Default role
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Use the login service instead of inline fetch
      await login(email, password, role);
      
      // If successful, navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', typeof error === 'string' ? error : 'Failed to login. Please check your credentials.');
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
      {/* Role selection can be added here if needed */}
      <Text style={styles.pickerLabel}>I am:</Text>
      <Picker
        selectedValue={role}
        style={styles.input}
        onValueChange={(itemValue: React.SetStateAction<string>) => setRole(itemValue)}
      >
        <Picker.Item label="Consumer" value="consumer" />
        <Picker.Item label="Salon" value="salon" />
      </Picker>

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
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