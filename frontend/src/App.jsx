import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Agregar los iconos de Material
const materialIconsLink = document.createElement('link');
materialIconsLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
materialIconsLink.rel = 'stylesheet';
document.head.appendChild(materialIconsLink);

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
  const [conversation, setConversation] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const conversationEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const [languageCode] = useState('es-ES');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastProcessedTime, setLastProcessedTime] = useState(0);
  const minTimeBetweenProcessing = 2000; // Mínimo tiempo entre procesamientos en ms

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Función para manejar la síntesis de voz
  const speak = useCallback(async (text) => {
    console.log('Intentando hablar:', text);

    // Verificar soporte de síntesis de voz
    if (!window.speechSynthesis) {
      console.error('La síntesis de voz no está soportada en este navegador');
      return;
    }

    // Si el usuario no ha interactuado, no intentar hablar
    if (!hasUserInteracted) {
      console.log('Esperando interacción del usuario para hablar');
      return;
    }

    // Si el usuario está hablando, esperar un momento
    if (isSpeaking) {
      console.log('Usuario hablando, esperando...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Detener temporalmente el reconocimiento mientras hablamos
    if (recognitionRef.current) {
      try {
        console.log('Deteniendo temporalmente el reconocimiento para hablar...');
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error al detener reconocimiento:', error);
      }
    }

    // Detener cualquier síntesis anterior
    window.speechSynthesis.cancel();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 0.9; // Velocidad ligeramente más lenta para mejor claridad
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        console.log('Finalizó la síntesis de voz');
        console.log('Estado actual - isPaused:', isPaused, 'hasUserInteracted:', hasUserInteracted);
        
        // Pequeña pausa antes de reiniciar el reconocimiento
        setTimeout(() => {
          if (!isPaused && hasUserInteracted) {
            console.log('Reiniciando reconocimiento después de hablar...');
            startRecognition();
          } else {
            console.log('No se reinicia el reconocimiento - está pausado o no hay interacción');
          }
        }, 250);

        resolve();
      };
      utterance.onerror = (error) => {
        console.error('Error en la síntesis de voz:', error);
        if (error.error === 'not-allowed') {
          console.log('Permiso denegado para síntesis de voz');
          setHasUserInteracted(false);
        }
        resolve();
      };

      // Pequeña pausa para asegurar que todo esté listo
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    });
  }, [languageCode, hasUserInteracted]);

  // Efecto para mostrar mensaje de bienvenida
  useEffect(() => {
    const welcomeMessage = {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente virtual. Estoy aquí para ayudarte y conversar contigo. ¿En qué puedo ayudarte hoy?'
    };
    setConversation([welcomeMessage]);

    // Reproducir mensaje de bienvenida
    speak(welcomeMessage.content);
  }, [speak]);

  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [isStartPending, setIsStartPending] = useState(false);

  const resetRecognition = useCallback(() => {
    if (recognitionRef.current) {
      // Limpiar la instancia actual
      recognitionRef.current.onstart = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      try {
        recognitionRef.current.abort();
      } catch (error) {
        console.log('Error al abortar reconocimiento:', error);
      }
      recognitionRef.current = null;
    }
    setIsRecognitionActive(false);
    setIsStartPending(false);
  }, []);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    resetRecognition();
  }, [resetRecognition]);

  const startRecognition = useCallback(() => {
    if (isStartPending || isRecognitionActive) {
      console.log('No iniciando reconocimiento: ya está pendiente o activo');
      return;
    }
    
    console.log('Iniciando nuevo reconocimiento...');
    setIsStartPending(true);

    // Asegurarnos de empezar limpio
    resetRecognition();
    
    // Crear nueva instancia
    setTimeout(() => {
      try {
        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = languageCode;

        // Configurar eventos
        recognitionRef.current.onstart = () => {
          console.log('Reconocimiento iniciado correctamente');
          setIsRecognitionActive(true);
          setIsStartPending(false);
        };

        recognitionRef.current.onend = () => {
          console.log('Reconocimiento finalizado, estado de pausa:', isPaused);
          setIsRecognitionActive(false);
          setIsStartPending(false);
          
          // Si no está pausado y hubo interacción, reiniciar automáticamente
          if (!isPaused && hasUserInteracted) {
            console.log('Reiniciando reconocimiento automáticamente...');
            // Pequeña pausa antes de reiniciar
            setTimeout(() => startRecognition(), 100);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Error de reconocimiento:', event.error);
          setIsRecognitionActive(false);
          setIsStartPending(false);
          
          if (event.error === 'not-allowed') {
            alert('Por favor, permite el acceso al micrófono');
          } else if (!isPaused && hasUserInteracted) {
            // Reintentar si no está pausado
            console.log('Reintentando después de error...');
            setTimeout(() => startRecognition(), 1000);
          }
        };

        recognitionRef.current.onresult = (event) => {
          const results = Array.from(event.results);
          const transcript = results
            .map(result => result[0].transcript)
            .join(' ')
            .trim();
          
          const currentTime = Date.now();
          const timeSinceLastProcess = currentTime - lastProcessedTime;

          // Solo procesar si ha pasado suficiente tiempo desde el último procesamiento
          // y hay un transcript válido
          if (event.results[0].isFinal && 
              transcript && 
              timeSinceLastProcess > minTimeBetweenProcessing) {
            console.log('Tiempo desde último procesamiento:', timeSinceLastProcess, 'ms');
            setLastProcessedTime(currentTime);
            processVoiceCommand(transcript);
          }
        };

        // Detectar cuando el usuario está hablando
        recognitionRef.current.onspeechstart = () => {
          console.log('Usuario empezó a hablar');
          setIsSpeaking(true);
        };

        recognitionRef.current.onspeechend = () => {
          console.log('Usuario terminó de hablar');
          setIsSpeaking(false);
        };

        // Detectar si no hay voz
        recognitionRef.current.onnomatch = () => {
          console.log('No se detectó voz');
          setIsSpeaking(false);
        };

        // Iniciar reconocimiento
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
        setIsRecognitionActive(false);
        setIsStartPending(false);
        
        // Reintentar si no está pausado
        if (!isPaused && hasUserInteracted) {
          console.log('Reintentando después de error de inicio...');
          setTimeout(() => startRecognition(), 1000);
        }
      }
    }, 100);
  }, [isStartPending, isRecognitionActive, resetRecognition, isPaused, hasUserInteracted, languageCode]);

  const togglePausePlay = useCallback(() => {
    const newPausedState = !isPaused;
    console.log('Cambiando estado de pausa a:', newPausedState);
    
    // Marcar que el usuario ha interactuado
    if (!hasUserInteracted) {
      console.log('Primera interacción del usuario detectada');
      setHasUserInteracted(true);
    }

    // Primero actualizar el estado
    setIsPaused(newPausedState);

    // Luego manejar el reconocimiento
    if (newPausedState) {
      console.log('Pausando reconocimiento...');
      stopRecognition();
    } else {
      console.log('Iniciando reconocimiento...');
      startRecognition();
    }
  }, [isPaused, hasUserInteracted, stopRecognition, startRecognition]);

  useEffect(() => {
    window.speechSynthesis.cancel();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Inicializar reconocimiento de voz
  const initializeVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error("Su navegador no soporta reconocimiento de voz");
      return false;
    }

    // Solo inicializar si no existe ya una instancia
    if (!recognitionRef.current) {
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
          setIsRecognitionActive(true);
        };

        recognitionRef.current.onend = () => {
          console.log('Finalizando escucha');
          setIsRecognitionActive(false);
          
          // Si no está en pausa y hubo interacción, reiniciar
          if (!isPaused && hasUserInteracted) {
            startRecognition();
          }
        };

        recognitionRef.current.onresult = (event) => {
          const results = Array.from(event.results);
          const transcript = results
            .map(result => result[0].transcript)
            .join(' ')
            .trim();
          
          console.log('Resultado parcial:', transcript);
          
          if (event.results[0].isFinal && transcript) {
            processVoiceCommand(transcript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Error de reconocimiento:', event.error);
          setIsRecognitionActive(false);
          
          if (event.error === 'not-allowed') {
            alert('Por favor, permite el acceso al micrófono');
          } else if (event.error === 'aborted') {
            console.log('Reconocimiento abortado intencionalmente');
          } else {
            // Para otros errores, intentar reiniciar si no está en pausa
            if (!isPaused && hasUserInteracted) {
              startRecognition();
            }
          }
        };

        console.log('Inicialización de voz completada');
        return true;
      } catch (error) {
        console.error('Error inicializando voz:', error);
        return false;
      }
    }
    return true;
  }, [languageCode]);



  // Efecto para scroll automático
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    initializeVoice();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (error) {
          console.error('Error al detener reconocimiento:', error);
        }
      }
    };
  }, [initializeVoice]);

  // Efecto para manejar el estado de pausa/reproducción
  useEffect(() => {
    if (!hasUserInteracted) return;

    if (isPaused) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error al detener reconocimiento:', error);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error al iniciar reconocimiento:', error);
        }
      }
    }
  }, [isPaused, hasUserInteracted]);



  const processVoiceCommand = async (transcript) => {
    // Ignorar si el sistema está hablando
    if (window.speechSynthesis.speaking) {
      console.log('Sistema hablando, ignorando comando:', transcript);
      return;
    }

    console.log('Procesando comando de voz:', transcript);
    
    try {
      // Marcar que ha habido interacción si es la primera vez
      if (!hasUserInteracted) {
        console.log('Primera interacción detectada');
        setHasUserInteracted(true);
      }
      
      // Detener temporalmente el reconocimiento
      if (recognitionRef.current) {
        try {
          console.log('Deteniendo temporalmente el reconocimiento para procesar comando...');
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error al detener reconocimiento:', error);
        }
      }

      // Mostrar el mensaje del usuario en la conversación
      const userMessage = { role: 'user', content: transcript };
      setConversation(prev => [...prev, userMessage]);
      
      if (transcript.length < 3) {
        console.log('Comando demasiado corto, ignorando');
        return;
      }

      console.log('Enviando solicitud al backend...');
      const response = await axiosInstance.post(PROCESS_ENDPOINT, {
        text: transcript
      });

      console.log('Respuesta completa:', response);
      console.log('Datos de la respuesta:', response.data);
      console.log('Tipo de response.data:', typeof response.data);
      console.log('Propiedades de response.data:', Object.keys(response.data));

      // Si response.data es un string, asumimos que es la respuesta directa
      const assistantResponse = typeof response.data === 'string' 
        ? response.data 
        : response.data.response;

      // Validar y procesar la respuesta
      if (!assistantResponse) {
        console.error('Respuesta vacía del servidor');
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('Respuesta del asistente:', assistantResponse);
      
      // Añadir al historial de conversación
      const assistantMessage = { role: 'assistant', content: assistantResponse };
      setConversation(prev => [...prev, assistantMessage]);

      try {
        // Esperar a que termine de hablar antes de continuar
        console.log('Reproduciendo respuesta...');
        await speak(assistantResponse);
        console.log('Respuesta reproducida');
        
        // Reiniciar el reconocimiento si no está pausado
        if (!isPaused) {
          console.log('Reiniciando reconocimiento después de procesar comando...');
          startRecognition();
        } else {
          console.log('No se reinicia el reconocimiento - está pausado');
        }
      } catch (speakError) {
        console.error('Error al reproducir respuesta:', speakError);
        // Si falla la síntesis, intentar reiniciar el reconocimiento
        if (!isPaused) {
          startRecognition();
        }
      }
    } catch (error) {
      console.error('Error en processVoiceCommand:', error);
      const errorMessage = 'Lo siento, hubo un error procesando tu comando.';
      
      // Añadir mensaje de error a la conversación
      const errorResponse = { role: 'assistant', content: errorMessage };
      setConversation(prev => [...prev, errorResponse]);
      
      try {
        // Reproducir mensaje de error
        await speak(errorMessage);
      } catch (speakError) {
        console.error('Error al reproducir mensaje de error:', speakError);
      }
      
      // Reanudar el reconocimiento si no está en pausa
      if (!isPaused) {
        startRecognition();
      }

    }
  };

  const handleStartInteraction = () => {
    setHasUserInteracted(true);
    // Intentar reproducir el mensaje de bienvenida después de la interacción
    speak('¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?');
  };

  return (
    <div className="app-container">
      <div className="top-zone">
        <button className="config-button">
          <span className="material-icons config-icon">settings</span>
        </button>
        {!hasUserInteracted && (
          <button 
            className="start-button"
            onClick={handleStartInteraction}
          >
            Iniciar Asistente
          </button>
        )}
      </div>
      
      <div className="center-control">
        <button 
          onClick={togglePausePlay} 
          className="toggle-button"
          disabled={!hasUserInteracted}
        >
          <img 
            src={isPaused ? '/assets/circle_pause_state.gif' : '/assets/circle_pulse_wave_effect.gif'} 
            alt={isPaused ? 'Play' : 'Pause'}
            className="control-icon"
          />
        </button>
      </div>

      <div className="bottom-zone">
        <div className="conversation-container">
          {conversation.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <p>{message.content}</p>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      </div>
    </div>
  );
}
