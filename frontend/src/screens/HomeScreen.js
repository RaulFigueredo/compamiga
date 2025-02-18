import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import * as Voice from '@react-native-community/voice';
import * as Speech from 'expo-speech';
import Constants from 'expo-constants';

export const HomeScreen = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [webRecognition, setWebRecognition] = useState(null);

  const generateAIResponse = async (text, history) => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:8000/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error('Error en la comunicación con el backend');
      }

      const data = await response.json();
      const aiResponse = data.response || 
        'Lo siento, no pude generar una respuesta en este momento.';
      
      setAssistantResponse(aiResponse);
      speakResponse(aiResponse);
      setConversationHistory(prev => [...prev, text]);
    } catch (error) {
      console.error('Error generando respuesta de IA:', error);
      setAssistantResponse('Disculpa, tuve un problema para procesar tu mensaje.');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text) => {
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
      }
    } else {
      Speech.speak(text, { 
        language: 'es', 
        pitch: 1, 
        rate: 0.8 
      });
    }
  };

  useEffect(() => {
    if (spokenText && !isProcessing) {
      generateAIResponse(spokenText, conversationHistory);
    }
  }, [spokenText]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Configurar Web Speech API para web
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          setSpokenText(text);
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          console.error('Error en reconocimiento:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setWebRecognition(recognition);
      } else {
        console.error('El reconocimiento de voz no está soportado en este navegador');
      }
    } else {
      // Configurar react-native-voice para móvil
      Voice.onSpeechResults = (e) => {
        setSpokenText(e.value[0]);
      };

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
  }, []);

  const startListening = async () => {
    try {
      if (Platform.OS === 'web') {
        if (webRecognition) {
          webRecognition.start();
          setIsListening(true);
        } else {
          console.error('El reconocimiento de voz no está disponible');
        }
      } else {
        await Voice.start('es-ES');
        setIsListening(true);
      }
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      if (Platform.OS === 'web') {
        if (webRecognition) {
          webRecognition.stop();
          setIsListening(false);
        }
      } else {
        await Voice.stop();
        setIsListening(false);
      }
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <Text style={styles.welcomeText}>
          CompAmiga: Tu Compañero Virtual
        </Text>
        
        <View style={styles.chatArea}>
          {spokenText ? (
            <Text style={styles.spokenText}>Tú: {spokenText}</Text>
          ) : (
            <Text style={styles.hint}>
              Pulsa el botón para hablar conmigo
            </Text>
          )}
          
          {assistantResponse && (
            <Text style={styles.assistantResponse}>CompAmiga: {assistantResponse}</Text>
          )}

          {isProcessing && (
            <Text style={styles.processingText}>Procesando...</Text>
          )}
        </View>

        <Button
          mode="contained"
          onPress={isListening || isProcessing ? stopListening : startListening}
          style={styles.voiceButton}
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando' : (isListening ? 'Detener' : 'Hablar')}
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
        >
          Configuración
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
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    color: '#2196F3',
  },
  chatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  spokenText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  assistantResponse: {
    fontSize: 18,
    textAlign: 'center',
    color: '#2196F3',
    marginTop: 10,
  },
  hint: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  voiceButton: {
    marginTop: 20,
    padding: 8,
  },
  settingsButton: {
    marginTop: 12,
  },
});
