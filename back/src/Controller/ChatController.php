<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ChatMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Global chat API using Mercure protocol for real-time updates.
 *
 * Endpoints:
 *   POST /api/chat/send      – Send a chat message (broadcasts via Mercure)
 *   GET  /api/chat/subscribe – Subscribe to chat updates (SSE)
 */
#[Route('/api/chat', name: 'api_chat_')]
class ChatController extends AbstractController
{
    public function __construct(
        private readonly HubInterface $hub,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Send a global chat message.
     *
     * POST /api/chat/send
     * Body: {
     *   "playerName": "string",
     *   "message": "string"
     * }
     */
    #[Route('/send', name: 'send', methods: ['POST'])]
    public function send(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), associative: true);

        if (!isset($data['playerName']) || !isset($data['message'])) {
            return $this->json(['error' => 'Missing playerName or message'], Response::HTTP_BAD_REQUEST);
        }

        $playerName = trim($data['playerName']);
        $messageText = trim($data['message']);

        if (empty($playerName) || empty($messageText)) {
            return $this->json(['error' => 'Player name and message cannot be empty'], Response::HTTP_BAD_REQUEST);
        }

        // Create and persist the chat message
        $chatMessage = new ChatMessage();
        $chatMessage->setPlayerName($playerName);
        $chatMessage->setMessage($messageText);
        $chatMessage->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($chatMessage);
        $this->em->flush();

        // Broadcast the message via Mercure
        $update = new Update(
            topic: 'chat/global',
            data: json_encode([
                'id' => $chatMessage->getId(),
                'playerName' => $chatMessage->getPlayerName(),
                'message' => $chatMessage->getMessage(),
                'createdAt' => $chatMessage->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ]),
            private: false,
        );

        $this->hub->publish($update);

        return $this->json([
            'success' => true,
            'id' => $chatMessage->getId(),
            'createdAt' => $chatMessage->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }

    /**
     * Health check for the chat service.
     */
    #[Route('/health', name: 'health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return $this->json(['status' => 'ok']);
    }
}
