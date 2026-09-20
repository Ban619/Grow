<?php

declare(strict_types=1);

/**
 * Chat Mercure Integration Module
 *
 * Provides utilities for real-time chat using the Mercure protocol.
 * The frontend should use the EventSource API to subscribe to updates.
 *
 * Usage:
 *   - Browser-side: Use JavaScript EventSource to subscribe to 'chat/global' topic
 *   - Server-side: POST to /api/chat/send to broadcast messages
 */

namespace App\Sockets;

use Symfony\Component\Mercure\Update;
use Symfony\Component\Mercure\HubInterface;

class ChatMercure
{
    public function __construct(
        private readonly HubInterface $hub,
    ) {
    }

    /**
     * Publish a chat message to all connected clients.
     *
     * @param array<string, mixed> $data The message data
     * @return void
     */
    public function publishMessage(array $data): void
    {
        $update = new Update(
            topic: 'chat/global',
            data: json_encode($data),
            private: false,
        );

        $this->hub->publish($update);
    }

    /**
     * Publish a system message (e.g., player joined/left).
     *
     * @param string $message The system message
     * @return void
     */
    public function publishSystemMessage(string $message): void
    {
        $update = new Update(
            topic: 'chat/global',
            data: json_encode([
                'type' => 'system',
                'message' => $message,
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            ]),
            private: false,
        );

        $this->hub->publish($update);
    }

    /**
     * Publish a typing indicator.
     *
     * @param string $playerName The player name
     * @return void
     */
    public function publishTypingIndicator(string $playerName): void
    {
        $update = new Update(
            topic: 'chat/typing',
            data: json_encode([
                'playerName' => $playerName,
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            ]),
            private: false,
        );

        $this->hub->publish($update);
    }
}
