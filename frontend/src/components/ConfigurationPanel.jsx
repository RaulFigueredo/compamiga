import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';

const ConfigurationPanel = ({ onClose, onVoiceChange, onNameChange }) => {
  const [config, setConfig] = useState({
    assistant_voice: '',
    available_voices: [],
    assistant_name: ''
  });

  useEffect(() => {
    loadConfig();
    loadAvailableVoices();
  }, []);

  const loadAvailableVoices = () => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(voice => voice.lang.startsWith('es'));
      
      // Actualizar las voces disponibles en el backend
      axiosInstance.post('/config/voices', {
        available_voices: spanishVoices.map(voice => ({
          id: voice.name,
          name: `${voice.name} (${voice.lang})`
        }))
      });
    };

    // Obtener voces iniciales
    updateVoices();

    // Escuchar cambios en las voces disponibles
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  };

  const loadConfig = async () => {
    try {
      const response = await axiosInstance.get('/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  // Referencia al timeout del debounce
  const debounceTimeout = useRef(null);

  // Función para actualizar el nombre
  const updateAssistantName = async (newName) => {
    try {
      // Notificar al componente padre
      if (onNameChange) {
        onNameChange(newName);
      }

      // Actualizar la configuración en el backend
      await axiosInstance.post('/config', {
        ...config,
        assistant_name: newName
      });

      // Actualizar el estado local
      setConfig(prev => ({
        ...prev,
        assistant_name: newName
      }));

      // Probar el nuevo nombre
      const utterance = new SpeechSynthesisUtterance(`Mi nombre ahora es ${newName}`);
      utterance.lang = 'es-ES';
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === config.assistant_voice);
      if (voice) {
        utterance.voice = voice;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error updating assistant name:', error);
    }
  };

  // Manejador del cambio de nombre con debounce
  const handleAssistantNameChange = (e) => {
    const newName = e.target.value;
    
    // Actualizar el estado local inmediatamente para la UI
    setConfig(prev => ({
      ...prev,
      assistant_name: newName
    }));

    // Limpiar el timeout anterior si existe
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Establecer un nuevo timeout
    debounceTimeout.current = setTimeout(() => {
      updateAssistantName(newName);
    }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir
  };

  const handleVoiceChange = async (e) => {
    const newVoice = e.target.value;
    try {
      // Notificar el cambio inmediatamente al componente padre
      if (onVoiceChange) {
        onVoiceChange(newVoice);
      }

      // Actualizar la configuración en el backend
      await axiosInstance.post('/config', {
        assistant_voice: newVoice
      });

      // Actualizar el estado local
      setConfig(prev => ({
        ...prev,
        assistant_voice: newVoice
      }));

      // Probar la nueva voz
      const utterance = new SpeechSynthesisUtterance('Voz actualizada correctamente');
      utterance.lang = 'es-ES';
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === newVoice);
      if (voice) {
        utterance.voice = voice;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error updating voice:', error);
    }
  };

  return (
    <div className="configuration-panel">
      <div className="configuration-header">
        <h2>Configuración</h2>
        <button onClick={onClose}>&times;</button>
      </div>
      <div className="configuration-content">
        <div className="configuration-item">
          <label htmlFor="voice-select">Voz del Asistente:</label>
          <select
            id="voice-select"
            value={config.assistant_voice}
            onChange={handleVoiceChange}
          >
            {config.available_voices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>
        <div className="configuration-item">
          <label htmlFor="name-input">Nombre del Asistente:</label>
          <input
            id="name-input"
            type="text"
            value={config.assistant_name}
            onChange={handleAssistantNameChange}
            placeholder="Introduce un nombre para el asistente"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
