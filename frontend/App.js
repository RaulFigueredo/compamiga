import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'CompAmiga' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Configuración' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
