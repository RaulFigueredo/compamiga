import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Switch, Button, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen = () => {
  const [enableConversations, setEnableConversations] = useState(true);
  const [interval, setInterval] = useState('60');

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify({
        enableConversations,
        interval: parseInt(interval),
      }));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <Text style={styles.title}>Configuración</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            Activar conversaciones automáticas
          </Text>
          <Switch
            value={enableConversations}
            onValueChange={setEnableConversations}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            Intervalo de conversación (minutos)
          </Text>
          <TextInput
            mode="outlined"
            value={interval}
            onChangeText={setInterval}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <Button
          mode="contained"
          onPress={saveSettings}
          style={styles.saveButton}
        >
          Guardar configuración
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 16,
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2196F3',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 8,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
    marginRight: 16,
  },
  input: {
    width: 100,
  },
  saveButton: {
    marginTop: 20,
  },
});
