<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;
use DateTimeImmutable;

/**
 * Manages crop lifecycle: planting, growth stages, harvesting, and timing.
 * 
 * Crop Types:
 * - wheat:    20 coins to buy, 10 coins harvest, grows in 3 minutes (180s)
 * - corn:     40 coins to buy, 25 coins harvest, grows in 5 minutes (300s)
 * - berry:    30 coins to buy, 20 coins harvest, grows in 4 minutes (240s)
 * - pumpkin: 100 coins to buy, 75 coins harvest, grows in 8 minutes (480s)
 * 
 * Growth stages:
 * 0 = Seed (just planted)
 * 1 = Sprout (25% grown)
 * 2 = Young (50% grown)
 * 3 = Mature (75% grown)
 * 4 = Ready (100% grown, can harvest)
 */
class CropService
{
    private const CROP_DEFINITIONS = [
        'wheat' => [
            'cost' => 20,
            'harvest' => 10,
            'growTime' => 180,  // 3 minutes
            'xpReward' => 25,
        ],
        'corn' => [
            'cost' => 40,
            'harvest' => 25,
            'growTime' => 300,  // 5 minutes
            'xpReward' => 50,
        ],
        'berry' => [
            'cost' => 30,
            'harvest' => 20,
            'growTime' => 240,  // 4 minutes
            'xpReward' => 40,
        ],
        'pumpkin' => [
            'cost' => 100,
            'harvest' => 75,
            'growTime' => 480,  // 8 minutes
            'xpReward' => 100,
        ],
    ];

    /**
     * Seasonal crops: variant crops that appear during specific seasons.
     * Season map: 0 = winter, 1 = spring, 2 = summer, 3 = autumn
     * Month to season: Dec-Feb (0), Mar-May (1), Jun-Aug (2), Sep-Nov (3)
     */
    private const SEASONAL_CROPS = [
        'winter' => [  // Dec, Jan, Feb - season 0
            'snowwheat' => [
                'baseCrop' => 'wheat',
                'cost' => 25,
                'harvest' => 15,
                'growTime' => 120,  // 2 minutes - faster
                'xpReward' => 30,
                'description' => 'Cold-resistant wheat',
            ],
            'icepumpkin' => [
                'baseCrop' => 'pumpkin',
                'cost' => 120,
                'harvest' => 90,
                'growTime' => 400,  // slightly faster
                'xpReward' => 120,
                'description' => 'Seasonal winter pumpkin',
            ],
        ],
        'spring' => [  // Mar, Apr, May - season 1
            'tulip' => [
                'baseCrop' => 'berry',
                'cost' => 35,
                'harvest' => 30,
                'growTime' => 200,  // faster growth
                'xpReward' => 50,
                'description' => 'Spring flower crop',
            ],
            'springcorn' => [
                'baseCrop' => 'corn',
                'cost' => 45,
                'harvest' => 35,
                'growTime' => 250,
                'xpReward' => 60,
                'description' => 'Spring variety corn',
            ],
        ],
        'summer' => [  // Jun, Jul, Aug - season 2
            'sunflower' => [
                'baseCrop' => 'berry',
                'cost' => 40,
                'harvest' => 35,
                'growTime' => 180,
                'xpReward' => 55,
                'description' => 'Sun-loving summer flower',
            ],
            'honeydew' => [
                'baseCrop' => 'pumpkin',
                'cost' => 110,
                'harvest' => 85,
                'growTime' => 360,
                'xpReward' => 110,
                'description' => 'Sweet summer melon',
            ],
        ],
        'autumn' => [  // Sep, Oct, Nov - season 3
            'pumpkinpatch' => [
                'baseCrop' => 'pumpkin',
                'cost' => 95,
                'harvest' => 70,
                'growTime' => 420,
                'xpReward' => 95,
                'description' => 'Prime autumn pumpkin',
            ],
            'harvestwheat' => [
                'baseCrop' => 'wheat',
                'cost' => 18,
                'harvest' => 12,
                'growTime' => 150,
                'xpReward' => 28,
                'description' => 'Abundant autumn wheat',
            ],
        ],
    ];

    private const GROWTH_STAGES = [0 => 'seed', 1 => 'sprout', 2 => 'young', 3 => 'mature', 4 => 'ready'];

    /**
     * Get crop definition by type.
     *
     * @param string $cropType The crop type (wheat, corn, berry, pumpkin)
     * @return array|null Crop definition or null if not found
     */
    public function getCropDefinition(string $cropType): ?array
    {
        return self::CROP_DEFINITIONS[$cropType] ?? null;
    }

    /**
     * Get all available crop types.
     *
     * @return array<string, array> All crop definitions keyed by type
     */
    public function getAllCrops(): array
    {
        return self::CROP_DEFINITIONS;
    }

    /**
     * Check if a crop type exists.
     *
     * @param string $cropType The crop type to check
     * @return bool True if crop exists
     */
    public function isValidCropType(string $cropType): bool
    {
        return isset(self::CROP_DEFINITIONS[$cropType]);
    }

    /**
     * Get the current season (0=winter, 1=spring, 2=summer, 3=autumn).
     * Based on the current month.
     *
     * @param \DateTimeImmutable|null $date Optional date to use (defaults to now)
     * @return int Season number (0-3)
     */
    public function getCurrentSeason(\DateTimeImmutable $date = null): int
    {
        if ($date === null) {
            $date = new DateTimeImmutable();
        }

        $month = (int)$date->format('n');  // 1-12

        // Winter: Dec(12), Jan(1), Feb(2) = season 0
        // Spring: Mar(3), Apr(4), May(5) = season 1
        // Summer: Jun(6), Jul(7), Aug(8) = season 2
        // Autumn: Sep(9), Oct(10), Nov(11) = season 3
        return match ($month) {
            12, 1, 2 => 0,      // Winter
            3, 4, 5 => 1,       // Spring
            6, 7, 8 => 2,       // Summer
            9, 10, 11 => 3,     // Autumn
            default => 0,       // Fallback
        };
    }

    /**
     * Get the season name.
     *
     * @param int $seasonNumber Season number (0-3)
     * @return string Season name
     */
    public function getSeasonName(int $seasonNumber): string
    {
        return ['Winter', 'Spring', 'Summer', 'Autumn'][$seasonNumber] ?? 'Unknown';
    }

    /**
     * Get seasonal crops available in the current season.
     * Includes both regular crops and seasonal variants.
     *
     * @param \DateTimeImmutable|null $date Optional date to use (defaults to now)
     * @return array<string, array> All crops available this season
     */
    public function getSeasonalCrops(\DateTimeImmutable $date = null): array
    {
        $season = $this->getCurrentSeason($date);
        $seasonName = $this->getSeasonName($season);

        // Combine regular crops with seasonal variants
        $crops = self::CROP_DEFINITIONS;

        // Add seasonal variants
        if (isset(self::SEASONAL_CROPS[strtolower($seasonName)])) {
            $seasonal = self::SEASONAL_CROPS[strtolower($seasonName)];
            foreach ($seasonal as $cropName => $definition) {
                $crops[$cropName] = [
                    'cost' => $definition['cost'],
                    'harvest' => $definition['harvest'],
                    'growTime' => $definition['growTime'],
                    'xpReward' => $definition['xpReward'],
                    'seasonal' => true,
                    'season' => strtolower($seasonName),
                    'description' => $definition['description'] ?? '',
                ];
            }
        }

        return $crops;
    }

    /**
     * Get available crops for the current season with season info.
     *
     * @param \DateTimeImmutable|null $date Optional date to use
     * @return array{season: int, seasonName: string, crops: array<string, array>}
     */
    public function getAvailableCrops(\DateTimeImmutable $date = null): array
    {
        $season = $this->getCurrentSeason($date);
        $seasonName = $this->getSeasonName($season);

        return [
            'season' => $season,
            'seasonName' => $seasonName,
            'crops' => $this->getSeasonalCrops($date),
        ];
    }

    /**
     * Plant a seed on the farm (in a farm cell).
     * Supports both regular and seasonal crops.
     *
     * Creates a crop object ready to be stored in the farm grid.
     *
     * @param string $cropType The crop type to plant
     * @return array{crop: string, stage: int, plantedAt: string, readyAt: string}|null Crop object or null if invalid
     */
    public function plantSeed(string $cropType): ?array
    {
        // Check if it's a regular crop
        $def = self::CROP_DEFINITIONS[$cropType] ?? null;

        // Check if it's a seasonal crop
        if ($def === null) {
            foreach (self::SEASONAL_CROPS as $seasonalList) {
                if (isset($seasonalList[$cropType])) {
                    $def = $seasonalList[$cropType];
                    break;
                }
            }
        }

        if ($def === null) {
            return null;
        }

        $now = new DateTimeImmutable();
        $growTime = $def['growTime'];
        $readyAt = $now->modify("+{$growTime} seconds");

        return [
            'crop' => $cropType,
            'stage' => 0,  // Seed
            'plantedAt' => $now->format(\DateTimeInterface::ATOM),
            'readyAt' => $readyAt->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * Calculate current growth stage based on elapsed time.
     *
     * @param array $cropData The crop data from farm cell (must have 'crop', 'plantedAt', 'readyAt')
     * @return array{crop: string, stage: int, stageName: string, progress: float, elapsed: int, totalTime: int, isReady: bool}
     */
    public function getGrowthStatus(array $cropData): array
    {
        $cropType = $cropData['crop'] ?? null;
        $plantedAt = $cropData['plantedAt'] ?? null;
        $readyAt = $cropData['readyAt'] ?? null;

        if (!$cropType || !$this->isValidCropType($cropType)) {
            return [
                'crop' => $cropType,
                'stage' => -1,
                'stageName' => 'invalid',
                'progress' => 0.0,
                'elapsed' => 0,
                'totalTime' => 0,
                'isReady' => false,
            ];
        }

        $def = self::CROP_DEFINITIONS[$cropType];
        $totalTime = $def['growTime'];

        try {
            $planted = new DateTimeImmutable($plantedAt);
            $ready = new DateTimeImmutable($readyAt);
            $now = new DateTimeImmutable();
        } catch (\Exception $e) {
            return [
                'crop' => $cropType,
                'stage' => 0,
                'stageName' => 'seed',
                'progress' => 0.0,
                'elapsed' => 0,
                'totalTime' => $totalTime,
                'isReady' => false,
            ];
        }

        $elapsed = (int) $now->getTimestamp() - (int) $planted->getTimestamp();
        $elapsed = \max(0, $elapsed);  // Clamp to non-negative

        if ($now >= $ready) {
            // Fully grown
            $stage = 4;
            $progress = 100.0;
            $isReady = true;
        } else {
            // Calculate stage based on progress
            $progress = ($elapsed / $totalTime) * 100;
            
            if ($progress < 25) {
                $stage = 0;  // Seed
            } elseif ($progress < 50) {
                $stage = 1;  // Sprout
            } elseif ($progress < 75) {
                $stage = 2;  // Young
            } else {
                $stage = 3;  // Mature
            }

            $isReady = false;
        }

        $stageName = self::GROWTH_STAGES[$stage] ?? 'unknown';

        return [
            'crop' => $cropType,
            'stage' => $stage,
            'stageName' => $stageName,
            'progress' => (float) \round($progress, 1),
            'elapsed' => $elapsed,
            'totalTime' => $totalTime,
            'isReady' => $isReady,
        ];
    }

    /**
     * Harvest a ready crop and return rewards.
     *
     * @param array $cropData The crop data to harvest
     * @return array{success: bool, coinsRewarded: int, xpRewarded: int, message: string}
     */
    public function harvest(array $cropData): array
    {
        $status = $this->getGrowthStatus($cropData);

        if (!$status['isReady']) {
            return [
                'success' => false,
                'coinsRewarded' => 0,
                'xpRewarded' => 0,
                'message' => "Crop not ready. Progress: {$status['progress']}%",
            ];
        }

        $cropType = $status['crop'];
        $def = self::CROP_DEFINITIONS[$cropType];

        return [
            'success' => true,
            'coinsRewarded' => $def['harvest'],
            'xpRewarded' => $def['xpReward'],
            'message' => "Harvested {$cropType}: +{$def['harvest']} coins, +{$def['xpReward']} XP",
        ];
    }

    /**
     * Get a human-readable message for crop progress.
     *
     * @param array $cropData The crop data
     * @return string Human-readable status
     */
    public function getProgressMessage(array $cropData): string
    {
        $status = $this->getGrowthStatus($cropData);
        $cropType = $status['crop'];
        $stageName = $status['stageName'];
        $progress = $status['progress'];

        if ($status['isReady']) {
            return "✅ Ready to harvest!";
        }

        $remaining = 100 - $progress;
        return "{$stageName}: {$progress}% grown ({$remaining}% remaining)";
    }

    /**
     * Get all crops in a farm grid and their statuses.
     *
     * @param array $farmGrid The farm grid from Player entity
     * @return array{totalCrops: int, ready: int, growing: int, cropsByType: array}
     */
    public function getFarmStatus(array $farmGrid): array
    {
        $totalCrops = 0;
        $readyCount = 0;
        $growingCount = 0;
        $cropsByType = [];

        foreach ($farmGrid as $row) {
            foreach ($row as $cell) {
                if (!isset($cell['plantedItem']) || !\is_array($cell['plantedItem'])) {
                    continue;
                }

                $crop = $cell['plantedItem'];
                if (!isset($crop['crop'])) {
                    continue;
                }

                $totalCrops++;
                $status = $this->getGrowthStatus($crop);
                $cropType = $status['crop'];

                if (!isset($cropsByType[$cropType])) {
                    $cropsByType[$cropType] = ['ready' => 0, 'growing' => 0];
                }

                if ($status['isReady']) {
                    $readyCount++;
                    $cropsByType[$cropType]['ready']++;
                } else {
                    $growingCount++;
                    $cropsByType[$cropType]['growing']++;
                }
            }
        }

        return [
            'totalCrops' => $totalCrops,
            'ready' => $readyCount,
            'growing' => $growingCount,
            'cropsByType' => $cropsByType,
        ];
    }
}
