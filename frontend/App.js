import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView,
  Animated,
  Modal,
  Switch,
  Alert 
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isListening, setIsListening] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  
  // Configuraciones
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [languageCode, setLanguageCode] = useState('es-ES');
  const [voiceSensitivity, setVoiceSensitivity] = useState(0.5);

  // Referencias
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const transcriptBufferRef = useRef('');

  // Inicializar reconocimiento de voz
  const initializeVoice = useCallback(() => {
    // Verificar soporte de Web Speech API
    if (!('webkitSpeechRecognition' in window)) {
      Alert.alert(
        "Navegador No Soportado", 
        "Su navegador no soporta reconocimiento de voz"
      );
      return false;
    }

    try {
      // Crear instancia de reconocimiento
      recognitionRef.current = new window.webkitSpeechRecognition();
      
      // Configurar parámetros
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = languageCode;

      // Configurar eventos
      recognitionRef.current.onstart = () => {
        console.log('Comenzando escucha');
        setIsListening(true);
        transcriptBufferRef.current = ''; // Limpiar buffer
      };

      recognitionRef.current.onend = () => {
        console.log('Finalizando escucha');
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        // Acumular resultados
        const results = Array.from(event.results);
        const transcript = results
          .map(result => result[0].transcript)
          .join(' ')
          .trim();
        
        console.log('Resultado parcial:', transcript);
        transcriptBufferRef.current = transcript;
        setLastTranscript(transcript);

        // Limpiar timeout anterior
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }

        // Establecer nuevo timeout para detectar final del discurso
        speechTimeoutRef.current = setTimeout(() => {
          // Si ha pasado un tiempo sin hablar, procesar comando
          if (transcriptBufferRef.current) {
            processVoiceCommand(transcriptBufferRef.current);
            transcriptBufferRef.current = ''; // Limpiar buffer
          }
        }, 2000 * (1 / voiceSensitivity)); // Ajustar sensibilidad
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        setIsListening(false);
        
        Alert.alert(
          "Error de Voz", 
          `Ocurrió un problema: ${event.error}`
        );
      };

      setVoiceInitialized(true);
      console.log('Inicialización de voz completada');
      return true;
    } catch (error) {
      console.error('Error inicializando voz:', error);
      Alert.alert(
        "Error de Inicialización", 
        "No se pudo inicializar el reconocimiento de voz"
      );
      return false;
    }
  }, [languageCode, voiceSensitivity]);

  useEffect(() => {
    console.log('Montaje del componente, inicializando voz');
    initializeVoice();

    // Limpiar al desmontar
    return () => {
      console.log('Desmontando componente');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [initializeVoice]);

  const startListening = () => {
    console.log('Intentando iniciar escucha');
    console.log('Voice inicializado:', voiceInitialized);
    console.log('Voz habilitada:', voiceEnabled);

    if (!voiceEnabled || !voiceInitialized) {
      Alert.alert(
        "Reconocimiento de Voz Desactivado", 
        "Por favor, active el reconocimiento de voz en configuración"
      );
      return;
    }
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        console.log('Escucha iniciada correctamente');
      } else {
        throw new Error('Instancia de reconocimiento no disponible');
      }
    } catch (error) {
      console.error('Error iniciando escucha:', error);
      Alert.alert(
        "Error de Escucha", 
        `No se pudo iniciar el reconocimiento de voz: ${error.message}`
      );
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Error deteniendo escucha:', error);
    }
  };

  const processVoiceCommand = async (transcript) => {
    console.log('Comando final recibido:', transcript);
    
    // Filtrar comandos muy cortos o ruido
    if (transcript.length < 3) {
      console.log('Comando demasiado corto, ignorando');
      return;
    }

    try {
      const response = await axios.post('http://tu-backend-api.com/process', { 
        text: transcript 
      });
      console.log('Respuesta del backend:', response.data);
    } catch (error) {
      console.error('Error procesando comando:', error);
    }
  };

  const startApp = async () => {
    console.log('Iniciando aplicación');
    const initialized = initializeVoice();
    if (initialized) {
      setConversationStarted(true);
      startListening();
    }
  };

  const openConfigModal = () => {
    setIsConfigModalVisible(true);
  };

  const closeConfigModal = () => {
    setIsConfigModalVisible(false);
  };

  const saveConfiguration = () => {
    console.log('Configuración guardada:', {
      voiceEnabled,
      languageCode,
      voiceSensitivity
    });
    closeConfigModal();
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false  // Cambiar a false para soporte web
    }).start();
  }, []);

  const ConfigModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isConfigModalVisible}
      onRequestClose={closeConfigModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Configuración</Text>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Activar Voz</Text>
            <Switch
              value={voiceEnabled}
              onValueChange={setVoiceEnabled}
              trackColor={{ false: "#767577", true: "#3498DB" }}
            />
          </View>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Idioma</Text>
            <TouchableOpacity 
              style={styles.languageSelector}
              onPress={() => setLanguageCode(
                languageCode === 'es-ES' ? 'en-US' : 'es-ES'
              )}
            >
              <Text style={styles.languageSelectorText}>
                {languageCode === 'es-ES' ? 'Español' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Sensibilidad de Voz</Text>
            <View style={styles.sensitivitySlider}>
              {[0.25, 0.5, 0.75].map((value) => (
                <TouchableOpacity 
                  key={value}
                  style={[
                    styles.sensitivityOption,
                    voiceSensitivity === value && styles.selectedSensitivity
                  ]}
                  onPress={() => setVoiceSensitivity(value)}
                >
                  <Text style={styles.sensitivityText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={saveConfiguration}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalButtonCancel} 
              onPress={closeConfigModal}
            >
              <Text style={styles.modalButtonCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!conversationStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity 
          style={styles.configIcon} 
          onPress={openConfigModal}
        >
          <Ionicons name="settings-outline" size={30} color="#2C3E50" />
        </TouchableOpacity>
        
        <ConfigModal />
        
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <Text style={styles.title}>
            CompAmiga
          </Text>
          
          <Text style={styles.subtitle}>
            Tu compañero digital para una vida más conectada
          </Text>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startApp}
            accessibilityLabel="Comenzar conversación"
          >
            <Text style={styles.startButtonText}>
              Comenzar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.conversationContainer}>
      <TouchableOpacity 
        style={styles.configIcon} 
        onPress={openConfigModal}
      >
        <Ionicons name="settings-outline" size={30} color="#2C3E50" />
      </TouchableOpacity>
      
      <ConfigModal />
      
      <View style={styles.conversationContent}>
        <Text style={styles.statusText}>
          {isListening ? 'Escuchando...' : 'Esperando tu mensaje'}
        </Text>
        
        {lastTranscript ? (
          <Text style={styles.transcriptText}>
            Último mensaje: {lastTranscript}
          </Text>
        ) : null}
        
        <TouchableOpacity 
          style={styles.listenButton}
          onPress={isListening ? stopListening : startListening}
        >
          <Text style={styles.listenButtonText}>
            {isListening ? 'Detener Escucha' : 'Iniciar Escucha'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.85,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  conversationContainer: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    width: width * 0.85,
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 24,
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  transcriptText: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  listenButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  listenButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  configIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 18,
    color: '#2C3E50',
  },
  languageSelector: {
    backgroundColor: '#F0F4F8',
    padding: 10,
    borderRadius: 10,
  },
  languageSelectorText: {
    color: '#2C3E50',
    fontSize: 16,
  },
  sensitivitySlider: {
    flexDirection: 'row',
  },
  sensitivityOption: {
    backgroundColor: '#F0F4F8',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  selectedSensitivity: {
    backgroundColor: '#3498DB',
  },
  sensitivityText: {
    color: '#2C3E50',
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 30,
    flex: 1,
    marginRight: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  modalButtonCancel: {
    backgroundColor: '#F0F4F8',
    padding: 15,
    borderRadius: 30,
    flex: 1,
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
  },
  modalButtonCancelText: {
    color: '#2C3E50',
    textAlign: 'center',
    fontSize: 18,
  }
});
