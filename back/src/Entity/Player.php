<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\PlayerRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PlayerRepository::class)]
#[ORM\Table(name: 'players')]
#[ORM\HasLifecycleCallbacks]
class Player
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    /**
     * Unique player handle / username (e.g. "player1").
     */
    #[ORM\Column(type: Types::STRING, length: 64, unique: true)]
    private string $name;

    // ─── Currency ───────────────────────────────────────────────────────────

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 1000])]
    private int $coins = 1000;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $diamonds = 0;

    // ─── Progression ─────────────────────────────────────────────────────────

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 1])]
    private int $level = 1;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $xp = 0;

    // ─── Inventory ───────────────────────────────────────────────────────────

    /**
     * JSON map: {"wheat": 3, "corn": 1, ...}
     *
     * @var array<string, int>
     */
    #[ORM\Column(type: Types::JSON, options: ['default' => '{}'])]
    private array $seeds = [];

    // ─── Farm state ──────────────────────────────────────────────────────────

    /**
     * Full farm grid serialised as JSON.
     * Stored as a raw JSON column so we never lose precision on any nested data.
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $farm = null;

    // ─── Tutorial ─────────────────────────────────────────────────────────────

    /**
     * JSON object tracking tutorial completion: {"welcomeShown": true, "firstPlant": true, ...}
     *
     * @var array<string, bool>
     */
    #[ORM\Column(name: 'tutorial_progress', type: Types::JSON, nullable: true)]
    private ?array $tutorialProgress = null;

    // ─── Storage ──────────────────────────────────────────────────────────────

    /**
     * Serialised silo + barn storage state.
     * Shape: { "silo": { level, capacity, items, totalStored, purchased, ... }, "barn": { ... } }
     *
     * @var array<string, mixed>|null
     */
    #[ORM\Column(name: 'storage', type: Types::JSON, nullable: true)]
    private ?array $storage = null;

    // ─── Timestamps ──────────────────────────────────────────────────────────

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ─── Getters / setters ───────────────────────────────────────────────────

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getCoins(): int
    {
        return $this->coins;
    }

    public function setCoins(int $coins): static
    {
        $this->coins = max(0, $coins);

        return $this;
    }

    public function getDiamonds(): int
    {
        return $this->diamonds;
    }

    public function setDiamonds(int $diamonds): static
    {
        $this->diamonds = max(0, $diamonds);

        return $this;
    }

    public function getLevel(): int
    {
        return $this->level;
    }

    public function setLevel(int $level): static
    {
        $this->level = max(1, $level);

        return $this;
    }

    public function getXp(): int
    {
        return $this->xp;
    }

    public function setXp(int $xp): static
    {
        $this->xp = max(0, $xp);

        return $this;
    }

    /**
     * @return array<string, int>
     */
    public function getSeeds(): array
    {
        return $this->seeds;
    }

    /**
     * @param array<string, int> $seeds
     */
    public function setSeeds(array $seeds): static
    {
        $this->seeds = $seeds;

        return $this;
    }

    public function getFarm(): ?array
    {
        return $this->farm;
    }

    public function setFarm(?array $farm): static
    {
        $this->farm = $farm;

        return $this;
    }

    /**
     * @return array<string, bool>
     */
    public function getTutorialProgress(): array
    {
        return $this->tutorialProgress ?? [];
    }

    /**
     * @param array<string, bool> $tutorialProgress
     */
    public function setTutorialProgress(array $tutorialProgress): static
    {
        $this->tutorialProgress = $tutorialProgress;

        return $this;
    }

    public function markTutorialStep(string $step): void
    {
        if ($this->tutorialProgress === null) {
            $this->tutorialProgress = [];
        }
        $this->tutorialProgress[$step] = true;
    }

    public function hasTutorialStep(string $step): bool
    {
        return ($this->tutorialProgress[$step] ?? false) === true;
    }

    // ─── Storage getters / setters ────────────────────────────────────────────

    /**
     * @return array<string, mixed>
     */
    public function getStorage(): array
    {
        return $this->storage ?? [];
    }

    /**
     * @param array<string, mixed>|null $storage
     */
    public function setStorage(?array $storage): static
    {
        $this->storage = $storage;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // ─── Serialisation helper ────────────────────────────────────────────────

    /**
     * Returns the full game state as an array (used in API responses).
     *
     * @return array<string, mixed>
     */
    public function toState(): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'coins'            => $this->coins,
            'diamonds'         => $this->diamonds,
            'level'            => $this->level,
            'xp'               => $this->xp,
            'seeds'            => $this->seeds,
            'farm'             => $this->farm,
            'tutorialProgress' => $this->tutorialProgress,
            'storage'          => $this->storage,
            'updatedAt'        => $this->updatedAt->format(\DateTimeInterface::ATOM),
            'createdAt'        => $this->createdAt->format(\DateTimeInterface::ATOM),
        ];
    }
}
