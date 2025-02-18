<?php

namespace App\Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ConversationControllerTest extends WebTestCase
{
    public function testGenerateResponse()
    {
        $client = static::createClient();

        $client->request(
            'POST', 
            '/conversation', 
            [], 
            [], 
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['message' => 'Hola, ¿cómo estás?'])
        );

        $response = $client->getResponse();
        
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        
        $this->assertArrayHasKey('response', $responseData);
        $this->assertNotEmpty($responseData['response']);
    }
}
