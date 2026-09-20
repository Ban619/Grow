<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\PrivateMessage;
use App\Repository\PrivateMessageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Direct messaging API.
 *
 * Endpoints:
 *   POST /api/dm/send                  – Send a direct message
 *   GET  /api/dm/conversations         – Get all conversation partners
 *   GET  /api/dm/{playerName}/messages – Get messages with a specific player
 *   POST /api/dm/{messageId}/read      – Mark message as read
 *   GET  /api/dm/unread               – Get unread message count
 */
#[Route('/api/dm', name: 'api_dm_')]
class DirectMessageController extends AbstractController
{
    public function __construct(
        private readonly PrivateMessageRepository $messages,
        private readonly EntityManagerInterface $em,
        private readonly HubInterface $hub,
    ) {
    }

    /**
     * Send a direct message.
     *
     * POST /api/dm/send
     * Body: {
     *   "from": "player1",
     *   "to": "player2",
     *   "message": "Hello!"
     * }
     */
    #[Route('/send', name: 'send', methods: ['POST'])]
    public function send(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), associative: true);

        if (!is_array($data) || !isset($data['from']) || !isset($data['to']) || !isset($data['message'])) {
            return $this->json(['error' => 'Missing required fields: from, to, message'], Response::HTTP_BAD_REQUEST);
        }

        $from = trim($data['from']);
        $to = trim($data['to']);
        $text = trim($data['message']);

        if (empty($from) || empty($to) || empty($text)) {
            return $this->json(['error' => 'Fields cannot be empty'], Response::HTTP_BAD_REQUEST);
        }

        if ($from === $to) {
            return $this->json(['error' => 'Cannot send message to yourself'], Response::HTTP_BAD_REQUEST);
        }

        // Create and persist the message
        $msg = new PrivateMessage();
        $msg->setSenderName($from);
        $msg->setRecipientName($to);
        $msg->setMessage($text);
        $msg->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($msg);
        $this->em->flush();

        // Broadcast via Mercure to both players
        $update = new Update(
            topic: "dm/{$to}",
            data: json_encode([
                'id' => $msg->getId(),
                'from' => $from,
                'to' => $to,
                'message' => $text,
                'createdAt' => $msg->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'isRead' => false,
            ]),
            private: true,
        );

        $this->hub->publish($update);

        return $this->json([
            'success' => true,
            'id' => $msg->getId(),
            'createdAt' => $msg->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }

    /**
     * Get all conversation partners and their last message.
     *
     * GET /api/dm/conversations?player=player1
     */
    #[Route('/conversations', name: 'conversations', methods: ['GET'])]
    public function conversations(Request $request): JsonResponse
    {
        $player = $request->query->get('player');

        if (!$player || !\is_string($player)) {
            return $this->json(['error' => 'Missing required query param: player'], Response::HTTP_BAD_REQUEST);
        }

        $partners = $this->messages->findConversationPartners(trim($player));

        return $this->json([
            'ok' => true,
            'conversations' => $partners,
        ]);
    }

    /**
     * Get all messages between two players.
     *
     * GET /api/dm/{playerName}/messages?with=otherPlayer
     */
    #[Route('/{playerName}/messages', name: 'messages', methods: ['GET'])]
    public function messages(string $playerName, Request $request): JsonResponse
    {
        $withPlayer = $request->query->get('with');

        if (!$withPlayer || !\is_string($withPlayer)) {
            return $this->json(['error' => 'Missing required query param: with'], Response::HTTP_BAD_REQUEST);
        }

        $playerName = trim($playerName);
        $withPlayer = trim($withPlayer);

        if ($playerName === $withPlayer) {
            return $this->json(['error' => 'Cannot view conversation with yourself'], Response::HTTP_BAD_REQUEST);
        }

        $conversation = $this->messages->findConversation($playerName, $withPlayer);

        // Mark messages as read
        foreach ($conversation as $msg) {
            if ($msg->getRecipientName() === $playerName && !$msg->isRead()) {
                $msg->setIsRead(true);
            }
        }
        $this->em->flush();

        $formatted = array_map(fn ($msg) => [
            'id' => $msg->getId(),
            'from' => $msg->getSenderName(),
            'to' => $msg->getRecipientName(),
            'message' => $msg->getMessage(),
            'createdAt' => $msg->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'isRead' => $msg->isRead(),
        ], $conversation);

        return $this->json([
            'ok' => true,
            'messages' => $formatted,
        ]);
    }

    /**
     * Get unread message count for a player.
     *
     * GET /api/dm/unread?player=player1
     */
    #[Route('/unread', name: 'unread', methods: ['GET'])]
    public function unread(Request $request): JsonResponse
    {
        $player = $request->query->get('player');

        if (!$player || !\is_string($player)) {
            return $this->json(['error' => 'Missing required query param: player'], Response::HTTP_BAD_REQUEST);
        }

        $unreadMessages = $this->messages->findUnreadForPlayer(trim($player));

        // Group by sender
        $unreadBySender = [];
        foreach ($unreadMessages as $msg) {
            $sender = $msg->getSenderName();
            $unreadBySender[$sender] = ($unreadBySender[$sender] ?? 0) + 1;
        }

        return $this->json([
            'ok' => true,
            'unreadCount' => count($unreadMessages),
            'unreadBySender' => $unreadBySender,
        ]);
    }
}
