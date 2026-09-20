<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Player;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Player>
 */
class PlayerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Player::class);
    }

    /**
     * Find a player by their unique name handle.
     */
    public function findByName(string $name): ?Player
    {
        return $this->findOneBy(['name' => $name]);
    }

    /**
     * Find or create a player by name.
     * Returns [Player, bool $isNew].
     *
     * @return array{0: Player, 1: bool}
     */
    public function findOrCreate(string $name): array
    {
        $player = $this->findByName($name);

        if ($player === null) {
            $player = new Player($name);

            return [$player, true];
        }

        return [$player, false];
    }

    /**
     * Persist and flush a Player entity.
     */
    public function save(Player $player, bool $flush = true): void
    {
        $em = $this->getEntityManager();
        $em->persist($player);

        if ($flush) {
            $em->flush();
        }
    }

    /**
     * Remove a Player entity.
     */
    public function remove(Player $player, bool $flush = true): void
    {
        $em = $this->getEntityManager();
        $em->remove($player);

        if ($flush) {
            $em->flush();
        }
    }
}
