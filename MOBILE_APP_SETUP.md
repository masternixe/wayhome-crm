# 📱 CRM Mobile App Setup Guide

## 🚀 Quick Start Commands

```bash
# 1. Install Expo CLI
npm install -g @expo/cli

# 2. Create mobile app (from project root)
npx create-expo-app crm-mobile --template blank-typescript
cd crm-mobile

# 3. Install navigation packages
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# 4. Install essential mobile packages
npx expo install @expo/vector-icons expo-secure-store expo-camera expo-location
npx expo install expo-notifications expo-image-picker axios @react-native-async-storage/async-storage

# 5. Install UI/styling packages
npx expo install react-native-paper react-native-vector-icons
npm install react-native-super-grid react-native-modal

# 6. Start development
npx expo start
```

## 📱 App Structure

### Main App Component (App.tsx)
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
```

### Navigation Structure (src/navigation/AppNavigator.tsx)
```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import PropertiesScreen from '../screens/properties/PropertiesScreen';
import ClientsScreen from '../screens/clients/ClientsScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
```

### API Service (src/services/apiService.ts)
```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3001'; // Your API URL

class ApiService {
  private api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await SecureStore.setItemAsync('access_token', response.data.access_token);
    }
    return response.data;
  }

  async logout() {
    await SecureStore.deleteItemAsync('access_token');
  }

  // Properties
  async getProperties() {
    const response = await this.api.get('/properties');
    return response.data;
  }

  // Clients
  async getClients() {
    const response = await this.api.get('/clients');
    return response.data;
  }

  // Transactions
  async getTransactions() {
    const response = await this.api.get('/transactions');
    return response.data;
  }

  async createTransaction(data: any) {
    const response = await this.api.post('/transactions', data);
    return response.data;
  }
}

export const apiService = new ApiService();
```

### Auth Context (src/contexts/AuthContext.tsx)
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/apiService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        // Verify token with API and get user info
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    setUser(response.user);
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 📱 Mobile-Specific Features to Add

### 1. Camera Integration
```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    // Upload image to your API
    uploadPropertyImage(result.assets[0].uri);
  }
};
```

### 2. Location Services
```typescript
import * as Location from 'expo-location';

const getCurrentLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  let location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};
```

### 3. Push Notifications
```typescript
import * as Notifications from 'expo-notifications';

const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Send token to your API to store for sending notifications
  return token;
};
```

## 🔧 Development Workflow

1. **Start development server:**
   ```bash
   npx expo start
   ```

2. **Test on device:**
   - Install Expo Go app on your phone
   - Scan QR code from terminal

3. **Build for production:**
   ```bash
   # For app stores
   npx expo build:ios
   npx expo build:android
   
   # Or using EAS Build (recommended)
   npm install -g @expo/eas-cli
   eas build --platform all
   ```

## 📦 Key Packages Installed

- **@react-navigation/native** - Navigation
- **@expo/vector-icons** - Icons
- **expo-secure-store** - Secure token storage
- **expo-camera** - Camera access
- **expo-location** - GPS location
- **expo-notifications** - Push notifications
- **expo-image-picker** - Gallery/camera picker
- **axios** - HTTP requests

## 🎯 Next Steps

1. Run the setup commands
2. Create the basic screens
3. Port your existing API calls
4. Add mobile-specific features
5. Test on devices
6. Build for app stores

Your existing API at `http://localhost:3001` will work perfectly with the mobile app!
