<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\PrivateMessage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PrivateMessage>
 */
class PrivateMessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PrivateMessage::class);
    }

    /**
     * Find all messages between two players (both directions).
     *
     * @param string $player1
     * @param string $player2
     * @return PrivateMessage[]
     */
    public function findConversation(string $player1, string $player2): array
    {
        return $this->createQueryBuilder('pm')
            ->where('(pm.senderName = :p1 AND pm.recipientName = :p2) OR (pm.senderName = :p2 AND pm.recipientName = :p1)')
            ->setParameter('p1', $player1)
            ->setParameter('p2', $player2)
            ->orderBy('pm.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all unread messages for a player.
     *
     * @param string $playerName
     * @return PrivateMessage[]
     */
    public function findUnreadForPlayer(string $playerName): array
    {
        return $this->createQueryBuilder('pm')
            ->where('pm.recipientName = :player AND pm.isRead = false')
            ->setParameter('player', $playerName)
            ->orderBy('pm.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Get list of unique conversation partners for a player.
     *
     * @param string $playerName
     * @return array{playerName: string, lastMessage: string, createdAt: \DateTimeImmutable, unreadCount: int}[]
     */
    public function findConversationPartners(string $playerName): array
    {
        $qb = $this->createQueryBuilder('pm');

        // Subquery to get latest message from each conversation
        $subquery = $this->createQueryBuilder('pm2')
            ->select('MAX(pm2.id)')
            ->where('(pm2.senderName = :player AND pm2.recipientName = pm.senderName) OR (pm2.recipientName = :player AND pm2.senderName = pm.senderName)')
            ->groupBy('CASE WHEN pm2.senderName = :player THEN pm2.recipientName ELSE pm2.senderName END');

        $results = $qb
            ->where("pm.id IN ({$subquery->getDQL()})")
            ->setParameter('player', $playerName)
            ->orderBy('pm.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        // Format results
        $partners = [];
        $seen = [];
        foreach ($results as $msg) {
            $partner = $msg->getSenderName() === $playerName ? $msg->getRecipientName() : $msg->getSenderName();
            if (isset($seen[$partner])) {
                continue;
            }
            $seen[$partner] = true;

            $partners[] = [
                'playerName' => $partner,
                'lastMessage' => substr($msg->getMessage(), 0, 50),
                'createdAt' => $msg->getCreatedAt(),
                'unreadCount' => count($this->createQueryBuilder('pm3')
                    ->where('pm3.senderName = :partner AND pm3.recipientName = :player AND pm3.isRead = false')
                    ->setParameters(['partner' => $partner, 'player' => $playerName])
                    ->getQuery()
                    ->getResult()),
            ];
        }

        return $partners;
    }
}
