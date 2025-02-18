import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
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

=======
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import * as Voice from '@react-native-community/voice';
import * as Speech from 'expo-speech';
import { sendMessage } from '../services/conversationService';

export const HomeScreen = () => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [webRecognition, setWebRecognition] = useState(null);

>>>>>>> restored-version
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

<<<<<<< HEAD
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
=======
  const handleSendMessage = async (textToSend) => {
    const messageToSend = textToSend || message;
    
    if (messageToSend.trim() === '') return;

    // Añadir mensaje del usuario a la conversación
    const userMessageObj = { 
      text: messageToSend, 
      sender: 'user' 
    };
    setConversation(prev => [...prev, userMessageObj]);

    try {
      // Enviar mensaje y obtener respuesta
      const response = await sendMessage(messageToSend);

      // Añadir respuesta del asistente
      const assistantMessageObj = { 
        text: response.response, 
        sender: 'assistant' 
      };
      setConversation(prev => [...prev, assistantMessageObj]);

      // Hablar la respuesta
      speakResponse(response.response);
    } catch (error) {
      console.error('Error en la conversación:', error);
      const errorMessageObj = { 
        text: 'Lo siento, hubo un problema. Intenta de nuevo.', 
        sender: 'assistant' 
      };
      setConversation(prev => [...prev, errorMessageObj]);
    }

    // Limpiar input
    setMessage('');
    setSpokenText('');
  };
>>>>>>> restored-version

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
<<<<<<< HEAD
=======
      Alert.alert('Error', 'No se pudo iniciar el reconocimiento de voz');
>>>>>>> restored-version
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

<<<<<<< HEAD
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
=======
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
          handleSendMessage(text);
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
        const text = e.value[0];
        setSpokenText(text);
        handleSendMessage(text);
        setIsListening(false);
      };

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CompAmiga</Text>
      
      <ScrollView 
        style={styles.conversationContainer}
        ref={(ref) => {this.scrollView = ref}}
        onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}
      >
        {conversation.map((msg, index) => (
          <View 
            key={index} 
            style={[
              styles.messageContainer, 
              msg.sender === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={() => handleSendMessage()}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && styles.listeningButton]} 
          onPress={isListening ? stopListening : startListening}
        >
          <Text style={styles.voiceButtonText}>{isListening ? '🛑' : '🎤'}</Text>
        </TouchableOpacity>
      </View>
>>>>>>> restored-version
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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
=======
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  conversationContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
  },
  messageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  voiceButton: {
    backgroundColor: '#28a745',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  listeningButton: {
    backgroundColor: '#dc3545',
  },
  voiceButtonText: {
    color: '#fff',
    fontWeight: 'bold',
>>>>>>> restored-version
  },
});
