import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const CONVERSATION_ENDPOINT = process.env.REACT_APP_BACKEND_CONVERSATION_ENDPOINT || '/conversation';
const IS_MOCK = process.env.REACT_APP_OPENAI_MOCK === 'true';

// Mock responses para pruebas
const mockResponses = {
  'Hola': '¡Hola! Soy CompAmiga, estoy aquí para ayudarte.',
  '¿Cómo estás?': 'Estoy bien, gracias por preguntar. ¿En qué puedo ayudarte hoy?',
  'Ayúdame': 'Claro, estoy aquí para ayudarte. ¿Qué necesitas?',
  'Me siento solo': 'Entiendo que te sientas solo. Recuerda que estoy aquí para escucharte y acompañarte.',
  'Tengo una duda': 'Adelante, cuéntame tu duda. Haré mi mejor esfuerzo para ayudarte.'
};

export const sendMessage = async (message) => {
  // Si está en modo mock, devolver respuesta predefinida
  if (IS_MOCK) {
    const mockResponse = mockResponses[message] || 'Lo siento, no entendí completamente tu mensaje.';
    return { response: mockResponse };
  }

  try {
    const response = await axios.post(`${API_URL}${CONVERSATION_ENDPOINT}`, { message }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error en la conversación:', error.response ? error.response.data : error.message);
    return { 
      response: 'Lo siento, hubo un problema al procesar tu mensaje. Intenta de nuevo más tarde.' 
    };
  }
};
