import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Configurar Axios para mostrar más detalles
axios.interceptors.request.use(request => {
  console.log('Starting Request', JSON.stringify(request, null, 2));
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
  },
  error => {
    console.error('Axios Interceptor Error:', error);
    console.error('Error Details:', {
      message: error.message,
      code: error.code,
      config: JSON.stringify(error.config, null, 2),
      response: error.response ? JSON.stringify(error.response, null, 2) : 'No response'
    });
    return Promise.reject(error);
  }
);

const API_BASE_URL = 'http://localhost:8002';
const PROCESS_ENDPOINT = '/process';

// Configurar timeout y otras opciones
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentar a 30 segundos
  timeoutErrorMessage: 'Tiempo de espera excedido al conectar con el backend',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
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
      alert("Su navegador no soporta reconocimiento de voz");
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
        alert(`Error de voz: ${event.error}`);
      };

      setVoiceInitialized(true);
      console.log('Inicialización de voz completada');
      return true;
    } catch (error) {
      console.error('Error inicializando voz:', error);
      alert("No se pudo inicializar el reconocimiento de voz");
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
    if (!voiceEnabled || !voiceInitialized) {
      alert("Por favor, active el reconocimiento de voz en configuración");
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
      alert(`No se pudo iniciar el reconocimiento de voz: ${error.message}`);
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
    if (transcript.length < 3) {
      console.log('Comando demasiado corto, ignorando');
      return;
    }

    try {
      const response = await axiosInstance.post(PROCESS_ENDPOINT, {
        text: transcript
      });

      if (response.data && typeof response.data === 'string') {
        setModalMessage(response.data);
        setShowModal(true);

        // Reproducir respuesta
        const utterance = new SpeechSynthesisUtterance(response.data);
        utterance.lang = languageCode;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error procesando comando:', error);
      alert(`No se pudo procesar el comando: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Compamiga</h1>
        <div className="config-button">
          <button 
            className="button"
            onClick={() => setIsConfigModalVisible(true)}
          >
            Configuración
          </button>
        </div>
      </header>

      <main>
        <div className="voice-container">
          <button
            className={`button ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={!voiceEnabled || !voiceInitialized}
          >
            {isListening ? 'Detener' : 'Hablar'}
          </button>
          <p className="transcript">{lastTranscript}</p>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>{modalMessage}</p>
            <button 
              className="button"
              onClick={() => setShowModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {isConfigModalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Configuración</h2>
            
            <div className="config-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                />
                <span className="slider"></span>
                <span>Habilitar Voz</span>
              </label>
            </div>

            <div className="config-item">
              <label>Idioma</label>
              <select
                className="text-input"
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
              >
                <option value="es-ES">Español</option>
                <option value="en-US">English</option>
              </select>
            </div>

            <div className="config-item">
              <label>Sensibilidad</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={voiceSensitivity}
                onChange={(e) => setVoiceSensitivity(parseFloat(e.target.value))}
              />
            </div>

            <button 
              className="button"
              onClick={() => setIsConfigModalVisible(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
