<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;

/**
 * Manages player progression: XP, levels, and level-up calculations.
 * 
 * Rules:
 * - XP required to level up: `level * 100` (e.g., level 1→2 requires 100 XP, 2→3 requires 200 XP)
 * - Minimum level: 1
 * - Maximum level: no hard limit (but 99 is reasonable)
 */
class ProgressionService
{
    private const XP_PER_LEVEL_BASE = 100;
    private const MAX_LEVEL = 99;

    /**
     * Calculate XP required to reach the next level.
     *
     * @param int $currentLevel The player's current level
     * @return int XP required to level up
     */
    public function xpRequiredForNextLevel(int $currentLevel): int
    {
        return $currentLevel * self::XP_PER_LEVEL_BASE;
    }

    /**
     * Calculate level based on total XP.
     *
     * @param int $totalXp Total XP accumulated
     * @return int Calculated level
     */
    public function calculateLevel(int $totalXp): int
    {
        $level = 1;
        $xpSpent = 0;

        while ($level < self::MAX_LEVEL) {
            $xpForNext = $this->xpRequiredForNextLevel($level);
            if ($xpSpent + $xpForNext > $totalXp) {
                break;
            }
            $xpSpent += $xpForNext;
            $level++;
        }

        return $level;
    }

    /**
     * Add XP to a player and automatically handle level-ups.
     *
     * @param Player $player The player entity
     * @param int $xpAmount Amount of XP to add (can be negative for penalties)
     * @return array{xpGained: int, levelsBefore: int, levelsAfter: int, leveledUp: bool}
     */
    public function addXp(Player $player, int $xpAmount): array
    {
        $levelBefore = $player->getLevel();
        $xpBefore = $player->getXp();

        // Clamp XP to non-negative
        $newXp = \max(0, $xpBefore + $xpAmount);
        $newLevel = $this->calculateLevel($newXp);

        // Ensure minimum level is 1
        $newLevel = \max(1, $newLevel);

        $player->setXp($newXp);
        $player->setLevel($newLevel);

        $leveledUp = $newLevel > $levelBefore;

        return [
            'xpGained' => $xpAmount,
            'levelsBefore' => $levelBefore,
            'levelsAfter' => $newLevel,
            'leveledUp' => $leveledUp,
        ];
    }

    /**
     * Set a player's level and recalculate XP accordingly.
     *
     * Useful for admin operations or resetting progression.
     * XP is set to the minimum needed for that level.
     *
     * @param Player $player The player entity
     * @param int $targetLevel Target level (1-99)
     * @return void
     */
    public function setLevel(Player $player, int $targetLevel): void
    {
        $safeLevel = \max(1, \min(self::MAX_LEVEL, $targetLevel));
        $totalXp = 0;

        // Calculate minimum XP for this level
        for ($i = 1; $i < $safeLevel; $i++) {
            $totalXp += $this->xpRequiredForNextLevel($i);
        }

        $player->setLevel($safeLevel);
        $player->setXp($totalXp);
    }

    /**
     * Get progression details for a player.
     *
     * @param Player $player The player entity
     * @return array{level: int, xp: int, xpForNext: int, xpProgress: float, levelProgress: string}
     */
    public function getProgressionDetails(Player $player): array
    {
        $level = $player->getLevel();
        $xp = $player->getXp();

        // XP needed to reach this level
        $xpForThisLevel = 0;
        for ($i = 1; $i < $level; $i++) {
            $xpForThisLevel += $this->xpRequiredForNextLevel($i);
        }

        $xpForNext = $this->xpRequiredForNextLevel($level);
        $xpIntoLevel = $xp - $xpForThisLevel;
        $progressPercent = (int) \round(($xpIntoLevel / $xpForNext) * 100);

        return [
            'level' => $level,
            'xp' => $xp,
            'xpForNext' => $xpForNext,
            'xpProgress' => (float) \round(($xpIntoLevel / $xpForNext) * 100, 1),
            'levelProgress' => "{$xpIntoLevel}/{$xpForNext} XP",
        ];
    }
}
