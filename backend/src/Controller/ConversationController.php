<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;
use Monolog\Logger;

class ConversationController extends AbstractController
{
    private $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger->withName('conversation');
    }

    #[Route('/conversation', methods: ['POST', 'OPTIONS'])]
    public function generateResponse(Request $request): Response
    {
        // Manejar solicitudes OPTIONS para CORS
        if ($request->isMethod('OPTIONS')) {
            $response = new Response();
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type');
            return $response;
        }

        try {
            // Depuración de parámetros y variables de entorno
            $this->logger->error('Variables de entorno completas: ' . print_r($_ENV, true));
            $this->logger->error('Contenido de la solicitud: ' . $request->getContent());

            // Intentar obtener la clave API de diferentes formas
            $apiKeyFromEnv = $_ENV['OPENAI_API_KEY'] ?? null;
            $apiKeyFromParameter = $this->getParameter('openai_api_key') ?? null;

            $this->logger->error('Clave API desde $_ENV: ' . ($apiKeyFromEnv ? 'Presente' : 'Ausente'));
            $this->logger->error('Clave API desde parámetros: ' . ($apiKeyFromParameter ? 'Presente' : 'Ausente'));

            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['message'])) {
                $this->logger->error('Mensaje no proporcionado');
                return new JsonResponse(['error' => 'Mensaje no proporcionado'], 400);
            }

            $userMessage = $data['message'];
            
            // Obtener clave API de forma segura
            $apiKey = $apiKeyFromParameter ?? $apiKeyFromEnv;

            if (empty($apiKey)) {
                $this->logger->error('Clave API de OpenAI no configurada');
                return new JsonResponse(['error' => 'Configuración de API incorrecta'], 500);
            }

            $this->logger->error('Intentando conectar a OpenAI con clave: ' . substr($apiKey, 0, 10) . '...');

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/chat/completions');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    [
                        'role' => 'system', 
                        'content' => 'Eres CompAmiga, un asistente virtual diseñado para acompañar y ayudar a personas mayores. Sé empático, paciente y claro. Tus respuestas deben ser cortas, claras y reconfortantes.'
                    ],
                    [
                        'role' => 'user', 
                        'content' => $userMessage
                    ]
                ],
                'max_tokens' => 150,
                'temperature' => 0.7
            ]));

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            $this->logger->info('Respuesta de OpenAI - Código HTTP: ' . $httpCode);
            $this->logger->info('Respuesta de OpenAI: ' . $response);
            $this->logger->info('Error de cURL: ' . $curlError);

            // Respuestas mock predefinidas
            $mockResponses = [
                'Hola' => 'Hola, ¿cómo estás hoy? Estoy aquí para acompañarte.',
                '¿Cómo estás?' => 'Estoy bien, gracias por preguntar. ¿En qué puedo ayudarte hoy?',
                'Ayúdame' => 'Claro, estoy aquí para ayudarte. ¿Qué necesitas?',
                'Me siento solo' => 'Entiendo que te sientas solo. Recuerda que estoy aquí para escucharte y acompañarte.',
                'Tengo una duda' => 'Adelante, cuéntame tu duda. Haré mi mejor esfuerzo para ayudarte.'
            ];

            // Si la API falla, usar respuesta mock o genérica
            if ($httpCode !== 200) {
                $this->logger->error('Error en la API de OpenAI');
                $assistantResponse = $mockResponses[$userMessage] ?? 'Lo siento, no pude entender completamente tu mensaje. ¿Podrías repetirlo?';

                $response = new JsonResponse([
                    'response' => $assistantResponse
                ]);
                $response->headers->set('Access-Control-Allow-Origin', '*');
                return $response;
            }

            $responseData = json_decode($response, true);
            
            // Verificación adicional de la estructura de la respuesta
            if (!isset($responseData['choices'][0]['message']['content'])) {
                $this->logger->error('Estructura de respuesta de OpenAI inesperada');
                $assistantResponse = $mockResponses[$userMessage] ?? 'Lo siento, no pude generar una respuesta.';
            } else {
                $assistantResponse = $responseData['choices'][0]['message']['content'];
            }

            $response = new JsonResponse([
                'response' => $assistantResponse
            ]);
            $response->headers->set('Access-Control-Allow-Origin', '*');
            return $response;

        } catch (\Exception $e) {
            $this->logger->error('Error inesperado en generación de respuesta: ' . $e->getMessage());
            $this->logger->error('Traza de error: ' . $e->getTraceAsString());

            $response = new JsonResponse([
                'response' => 'Lo siento, hubo un problema interno. Intenta de nuevo más tarde.'
            ], 500);
            $response->headers->set('Access-Control-Allow-Origin', '*');
            return $response;
        }
    }
}
