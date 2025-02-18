<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class ConversationController extends AbstractController
{
    public function generateResponse(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $userMessage = $data['message'] ?? '';
        $apiKey = $_ENV['OPENAI_API_KEY'] ?? getenv('OPENAI_API_KEY');

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
        curl_close($ch);

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
            $assistantResponse = $mockResponses[$userMessage] ?? 'Lo siento, no pude entender completamente tu mensaje. ¿Podrías repetirlo?';

            return new JsonResponse([
                'response' => $assistantResponse
            ]);
        }

        $responseData = json_decode($response, true);
        $assistantResponse = $responseData['choices'][0]['message']['content'] ?? 'Lo siento, no pude generar una respuesta.';

        return new JsonResponse([
            'response' => $assistantResponse
        ]);
    }
}
