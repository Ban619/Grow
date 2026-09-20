<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;

/**
 * Manages player economy: coins, diamonds, and transactions.
 * 
 * Rules:
 * - Minimum balance: 0 (no debt)
 * - Maximum balance: INT_MAX (no hard cap, but reasonable limits in practice)
 * - All transactions are logged internally but audit trail stored separately
 * - Coins are primary currency, diamonds are premium
 */
class EconomyService
{
    /**
     * Add coins to a player with validation.
     *
     * @param Player $player The player entity
     * @param int $amount Amount to add (can be negative for spending)
     * @param string $reason Transaction reason for logging (e.g., "crop_harvest", "seed_purchase")
     * @return array{success: bool, coinsAfter: int, message: string}
     */
    public function addCoins(Player $player, int $amount, string $reason = 'admin'): array
    {
        $coinsBefore = $player->getCoins();
        $coinsAfter = $coinsBefore + $amount;

        // Prevent negative balance
        if ($coinsAfter < 0) {
            return [
                'success' => false,
                'coinsAfter' => $coinsBefore,
                'message' => 'Insufficient coins. Transaction denied.',
            ];
        }

        $player->setCoins($coinsAfter);

        $amountStr = $amount >= 0 ? "+{$amount}" : "{$amount}";

        return [
            'success' => true,
            'coinsAfter' => $coinsAfter,
            'message' => "Transaction: {$reason} ({$amountStr} coins)",
        ];
    }

    /**
     * Add diamonds to a player with validation.
     *
     * @param Player $player The player entity
     * @param int $amount Amount to add (can be negative for spending)
     * @param string $reason Transaction reason for logging
     * @return array{success: bool, diamondsAfter: int, message: string}
     */
    public function addDiamonds(Player $player, int $amount, string $reason = 'admin'): array
    {
        $diamondsBefore = $player->getDiamonds();
        $diamondsAfter = $diamondsBefore + $amount;

        // Prevent negative balance
        if ($diamondsAfter < 0) {
            return [
                'success' => false,
                'diamondsAfter' => $diamondsBefore,
                'message' => 'Insufficient diamonds. Transaction denied.',
            ];
        }

        $player->setDiamonds($diamondsAfter);

        $amountStr = $amount >= 0 ? "+{$amount}" : "{$amount}";

        return [
            'success' => true,
            'diamondsAfter' => $diamondsAfter,
            'message' => "Transaction: {$reason} ({$amountStr} diamonds)",
        ];
    }

    /**
     * Spend coins (convenience method, fails if insufficient).
     *
     * @param Player $player The player entity
     * @param int $amount Amount to spend
     * @param string $reason Transaction reason
     * @return array{success: bool, coinsAfter: int, message: string}
     */
    public function spendCoins(Player $player, int $amount, string $reason = 'purchase'): array
    {
        if ($amount <= 0) {
            return [
                'success' => false,
                'coinsAfter' => $player->getCoins(),
                'message' => 'Amount must be positive.',
            ];
        }

        return $this->addCoins($player, -$amount, $reason);
    }

    /**
     * Spend diamonds (convenience method, fails if insufficient).
     *
     * @param Player $player The player entity
     * @param int $amount Amount to spend
     * @param string $reason Transaction reason
     * @return array{success: bool, diamondsAfter: int, message: string}
     */
    public function spendDiamonds(Player $player, int $amount, string $reason = 'purchase'): array
    {
        if ($amount <= 0) {
            return [
                'success' => false,
                'diamondsAfter' => $player->getDiamonds(),
                'message' => 'Amount must be positive.',
            ];
        }

        return $this->addDiamonds($player, -$amount, $reason);
    }

    /**
     * Check if a player can afford an item.
     *
     * @param Player $player The player entity
     * @param int $costInCoins Cost in coins (0 if free)
     * @param int $costInDiamonds Cost in diamonds (0 if free)
     * @return array{canAfford: bool, missingCoins: int, missingDiamonds: int}
     */
    public function canAfford(Player $player, int $costInCoins = 0, int $costInDiamonds = 0): array
    {
        $coins = $player->getCoins();
        $diamonds = $player->getDiamonds();

        $missingCoins = \max(0, $costInCoins - $coins);
        $missingDiamonds = \max(0, $costInDiamonds - $diamonds);

        return [
            'canAfford' => $missingCoins === 0 && $missingDiamonds === 0,
            'missingCoins' => $missingCoins,
            'missingDiamonds' => $missingDiamonds,
        ];
    }

    /**
     * Purchase multiple items in one transaction (atomic).
     *
     * If purchase would result in negative balance, the entire purchase fails.
     *
     * @param Player $player The player entity
     * @param int $totalCoins Total coin cost
     * @param int $totalDiamonds Total diamond cost
     * @param string $reason Purchase reason
     * @return array{success: bool, coinsAfter: int, diamondsAfter: int, message: string}
     */
    public function purchase(Player $player, int $totalCoins = 0, int $totalDiamonds = 0, string $reason = 'purchase'): array
    {
        // Check affordability first
        $affordCheck = $this->canAfford($player, $totalCoins, $totalDiamonds);
        if (!$affordCheck['canAfford']) {
            return [
                'success' => false,
                'coinsAfter' => $player->getCoins(),
                'diamondsAfter' => $player->getDiamonds(),
                'message' => 'Cannot afford purchase. ' . 
                    ($affordCheck['missingCoins'] > 0 ? "Missing {$affordCheck['missingCoins']} coins. " : '') .
                    ($affordCheck['missingDiamonds'] > 0 ? "Missing {$affordCheck['missingDiamonds']} diamonds." : ''),
            ];
        }

        // Apply both transactions atomically
        $coinsResult = $this->addCoins($player, -$totalCoins, $reason);
        $diamondsResult = $this->addDiamonds($player, -$totalDiamonds, $reason);

        if ($coinsResult['success'] && $diamondsResult['success']) {
            return [
                'success' => true,
                'coinsAfter' => $coinsResult['coinsAfter'],
                'diamondsAfter' => $diamondsResult['diamondsAfter'],
                'message' => "Purchase successful: -{$totalCoins} coins, -{$totalDiamonds} diamonds",
            ];
        }

        // This shouldn't happen if canAfford passed, but just in case
        return [
            'success' => false,
            'coinsAfter' => $player->getCoins(),
            'diamondsAfter' => $player->getDiamonds(),
            'message' => 'Purchase failed: unexpected error',
        ];
    }

    /**
     * Get economy status for a player.
     *
     * @param Player $player The player entity
     * @return array{coins: int, diamonds: int, totalWorth: string}
     */
    public function getEconomyStatus(Player $player): array
    {
        $coins = $player->getCoins();
        $diamonds = $player->getDiamonds();
        
        // Rough conversion: 1 diamond ≈ 200 coins for display
        $equivalentCoins = $coins + ($diamonds * 200);

        return [
            'coins' => $coins,
            'diamonds' => $diamonds,
            'totalWorth' => "{$coins} coins + {$diamonds} diamonds (≈ {$equivalentCoins} coin value)",
        ];
    }
}
