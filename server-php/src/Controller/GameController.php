<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\PlayerRepository;
use App\Service\CropService;
use App\Service\EconomyService;
use App\Service\ProgressionService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Game state API — matches the client calls in App.jsx:
 *
 *   GET  /api/load?player=player1        → load saved state
 *   POST /api/save                       → save full state
 *   POST /api/register                   → create a new player
 *   GET  /api/player/{id}               → fetch single player by DB id
 *   GET  /api/players                    → list all players (admin)
 *   DELETE /api/player/{id}             → delete player (admin)
 */
#[Route('/api', name: 'api_')]
class GameController extends ApiController
{
    public function __construct(
        private readonly PlayerRepository $players,
        private readonly ProgressionService $progression,
        private readonly EconomyService $economy,
        private readonly CropService $crops,
    ) {
    }

    // ─── Load ────────────────────────────────────────────────────────────────

    /**
     * Load the full game state for a named player.
     *
     * Query params:
     *   player (required) – the player's name handle
     */
    #[Route('/load', name: 'load', methods: ['GET'])]
    public function load(Request $request): JsonResponse
    {
        $playerName = $request->query->get('player');

        if (!$playerName || !\is_string($playerName)) {
            return $this->error('Missing required query param: player');
        }

        $player = $this->players->findByName(trim($playerName));

        if ($player === null) {
            return $this->json(['ok' => true, 'state' => null], Response::HTTP_OK);
        }

        return $this->json([
            'ok'    => true,
            'state' => $player->toState(),
        ]);
    }

    // ─── Save ─────────────────────────────────────────────────────────────────

    /**
     * Upsert the full game state for a named player.
     *
     * JSON body:
     * {
     *   "player": "player1",
     *   "state": {
     *     "coins": 500,
     *     "diamonds": 0,
     *     "level": 3,
     *     "xp": 120,
     *     "seeds": {"wheat": 2, "corn": 1},
     *     "farm": [[...], ...]
     *   }
     * }
     */
    #[Route('/save', name: 'save', methods: ['POST'])]
    public function save(Request $request): JsonResponse
    {
        $body = $this->parseJsonBody($request);

        if ($body === null) {
            return $this->error('Invalid JSON body');
        }

        $playerName = $body['player'] ?? null;
        $state      = $body['state']  ?? null;

        if (!\is_string($playerName) || empty($playerName)) {
            return $this->error('Missing or invalid field: player');
        }

        if (!\is_array($state)) {
            return $this->error('Missing or invalid field: state');
        }

        [$player, $isNew] = $this->players->findOrCreate(trim($playerName));

        // ─── Validate and apply economy ───────────────────────────────────────
        if (isset($state['coins']) && \is_int($state['coins'])) {
            // Validate: coins must be non-negative
            if ($state['coins'] < 0) {
                return $this->error('Invalid coins: cannot be negative', Response::HTTP_BAD_REQUEST);
            }
            $player->setCoins($state['coins']);
        }

        if (isset($state['diamonds']) && \is_int($state['diamonds'])) {
            // Validate: diamonds must be non-negative
            if ($state['diamonds'] < 0) {
                return $this->error('Invalid diamonds: cannot be negative', Response::HTTP_BAD_REQUEST);
            }
            $player->setDiamonds($state['diamonds']);
        }

        // ─── Validate and apply progression ────────────────────────────────────
        if (isset($state['xp']) && \is_int($state['xp'])) {
            // Validate: XP must be non-negative
            if ($state['xp'] < 0) {
                return $this->error('Invalid XP: cannot be negative', Response::HTTP_BAD_REQUEST);
            }
            $player->setXp($state['xp']);
        }

        // If level is provided, validate it matches XP
        if (isset($state['level']) && \is_int($state['level'])) {
            if ($state['level'] < 1 || $state['level'] > 99) {
                return $this->error('Invalid level: must be 1-99', Response::HTTP_BAD_REQUEST);
            }
            // Let progression service calculate the correct level from XP
            $calculatedLevel = $this->progression->calculateLevel($player->getXp());
            $player->setLevel($calculatedLevel);
        } else if (isset($state['xp']) && \is_int($state['xp'])) {
            // If XP changed but level not provided, recalculate level
            $calculatedLevel = $this->progression->calculateLevel($state['xp']);
            $player->setLevel($calculatedLevel);
        }

        // ─── Validate inventory ────────────────────────────────────────────────
        if (isset($state['seeds']) && \is_array($state['seeds'])) {
            // Validate: all seed counts must be non-negative integers
            $validSeeds = true;
            foreach ($state['seeds'] as $seedType => $count) {
                if (!\is_int($count) || $count < 0) {
                    $validSeeds = false;
                    break;
                }
            }
            if (!$validSeeds) {
                return $this->error('Invalid seeds: counts must be non-negative integers', Response::HTTP_BAD_REQUEST);
            }
            $player->setSeeds($state['seeds']);
        }

        // ─── Validate farm ─────────────────────────────────────────────────────
        // Farm may be null (no farm placed yet) or a 2D grid array
        if (\array_key_exists('farm', $state)) {
            if (\is_array($state['farm'])) {
                // Basic structure validation: should be array of arrays
                $validFarm = true;
                foreach ($state['farm'] as $row) {
                    if (!\is_array($row)) {
                        $validFarm = false;
                        break;
                    }
                }
                if (!$validFarm) {
                    return $this->error('Invalid farm: must be 2D array', Response::HTTP_BAD_REQUEST);
                }
                $player->setFarm($state['farm']);
            } elseif ($state['farm'] === null) {
                $player->setFarm(null);
            } else {
                return $this->error('Invalid farm: must be array or null', Response::HTTP_BAD_REQUEST);
            }
        }

        // ─── Validate and persist storage (silo / barn) ───────────────────────
        if (isset($state['storage']) && \is_array($state['storage'])) {
            $player->setStorage($state['storage']);
        }

        $this->players->save($player);

        return $this->json([
            'ok'    => true,
            'isNew' => $isNew,
            'state' => $player->toState(),
        ], $isNew ? Response::HTTP_CREATED : Response::HTTP_OK);
    }

    // ─── Register ─────────────────────────────────────────────────────────────

    /**
     * Explicitly create a new player (no-op if already exists → returns existing).
     *
     * JSON body: { "name": "player1" }
     */
    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $body = $this->parseJsonBody($request);

        if ($body === null) {
            return $this->error('Invalid JSON body');
        }

        $name = $body['name'] ?? null;

        if (!\is_string($name) || empty(trim((string) $name))) {
            return $this->error('Missing or invalid field: name');
        }

        [$player, $isNew] = $this->players->findOrCreate(trim((string) $name));

        if ($isNew) {
            $this->players->save($player);
        }

        return $this->json([
            'ok'    => true,
            'isNew' => $isNew,
            'state' => $player->toState(),
        ], $isNew ? Response::HTTP_CREATED : Response::HTTP_OK);
    }

    // ─── Single player ────────────────────────────────────────────────────────

    /**
     * Fetch a player by their database integer ID.
     */
    #[Route('/player/{id}', name: 'player_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getPlayer(int $id): JsonResponse
    {
        $player = $this->players->find($id);

        if ($player === null) {
            return $this->notFound("Player #{$id} not found");
        }

        return $this->json(['ok' => true, 'state' => $player->toState()]);
    }

    // ─── Delete player ────────────────────────────────────────────────────────

    /**
     * Delete a player permanently (admin use).
     */
    #[Route('/player/{id}', name: 'player_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deletePlayer(int $id): JsonResponse
    {
        $player = $this->players->find($id);

        if ($player === null) {
            return $this->notFound("Player #{$id} not found");
        }

        $this->players->remove($player);

        return $this->json(['ok' => true, 'deleted' => $id]);
    }

    // ─── List players ─────────────────────────────────────────────────────────

    /**
     * List all players (for admin / debugging).
     *
     * Query params:
     *   limit (default 50)
     *   offset (default 0)
     */
    #[Route('/players', name: 'players_list', methods: ['GET'])]
    public function listPlayers(Request $request): JsonResponse
    {
        $limit  = max(1, min(200, (int) ($request->query->get('limit', 50))));
        $offset = max(0, (int) ($request->query->get('offset', 0)));

        $total   = $this->players->count([]);
        $players = $this->players->findBy([], ['id' => 'ASC'], $limit, $offset);

        return $this->json([
            'ok'     => true,
            'total'  => $total,
            'limit'  => $limit,
            'offset' => $offset,
            'items'  => array_map(fn ($p) => $p->toState(), $players),
        ]);
    }

    // ─── Game Operations ──────────────────────────────────────────────────────

    /**
     * Get player progression details (level, XP, progress).
     *
     * Query params:
     *   player (required) – the player's name handle
     */
    #[Route('/progression', name: 'progression', methods: ['GET'])]
    public function getProgression(Request $request): JsonResponse
    {
        $playerName = $request->query->get('player');

        if (!$playerName || !\is_string($playerName)) {
            return $this->error('Missing required query param: player');
        }

        $player = $this->players->findByName(trim($playerName));

        if ($player === null) {
            return $this->notFound("Player '{$playerName}' not found");
        }

        $details = $this->progression->getProgressionDetails($player);

        return $this->json([
            'ok' => true,
            'progression' => $details,
        ]);
    }

    /**
     * Get player economy status (coins, diamonds).
     *
     * Query params:
     *   player (required) – the player's name handle
     */
    #[Route('/economy', name: 'economy', methods: ['GET'])]
    public function getEconomy(Request $request): JsonResponse
    {
        $playerName = $request->query->get('player');

        if (!$playerName || !\is_string($playerName)) {
            return $this->error('Missing required query param: player');
        }

        $player = $this->players->findByName(trim($playerName));

        if ($player === null) {
            return $this->notFound("Player '{$playerName}' not found");
        }

        $status = $this->economy->getEconomyStatus($player);

        return $this->json([
            'ok' => true,
            'economy' => $status,
        ]);
    }

    /**
     * Get farm status (crops growing, ready to harvest, etc.).
     *
     * Query params:
     *   player (required) – the player's name handle
     */
    #[Route('/farm/status', name: 'farm_status', methods: ['GET'])]
    public function getFarmStatus(Request $request): JsonResponse
    {
        $playerName = $request->query->get('player');

        if (!$playerName || !\is_string($playerName)) {
            return $this->error('Missing required query param: player');
        }

        $player = $this->players->findByName(trim($playerName));

        if ($player === null) {
            return $this->notFound("Player '{$playerName}' not found");
        }

        $farm = $player->getFarm();
        if (!$farm || !\is_array($farm)) {
            return $this->json(['ok' => true, 'farm' => null]);
        }

        $status = $this->crops->getFarmStatus($farm);

        return $this->json([
            'ok' => true,
            'farm' => $status,
        ]);
    }

    /**
     * Buy seeds and add to inventory.
     *
     * JSON body:
     * {
     *   "player": "player1",
     *   "cropType": "wheat",
     *   "quantity": 5
     * }
     *
     * Deducts coins and adds seeds to inventory.
     */
    #[Route('/seeds/buy', name: 'seeds_buy', methods: ['POST'])]
    public function buySeed(Request $request): JsonResponse
    {
        $body = $this->parseJsonBody($request);

        if ($body === null) {
            return $this->error('Invalid JSON body');
        }

        $playerName = $body['player'] ?? null;
        $cropType = $body['cropType'] ?? null;
        $quantity = $body['quantity'] ?? 1;

        if (!\is_string($playerName) || empty($playerName)) {
            return $this->error('Missing or invalid field: player');
        }

        if (!\is_string($cropType) || empty($cropType)) {
            return $this->error('Missing or invalid field: cropType');
        }

        if (!\is_int($quantity) || $quantity <= 0) {
            return $this->error('Invalid field: quantity must be positive integer');
        }

        $player = $this->players->findByName(trim($playerName));

        if ($player === null) {
            return $this->notFound("Player '{$playerName}' not found");
        }

        // Validate crop type
        $cropDef = $this->crops->getCropDefinition($cropType);
        if ($cropDef === null) {
            return $this->error("Unknown crop type: {$cropType}");
        }

        // Calculate total cost
        $totalCost = $cropDef['cost'] * $quantity;

        // Attempt purchase
        $purchaseResult = $this->economy->purchase(
            $player,
            $totalCost,
            0,
            "buy_seeds_{$cropType}_x{$quantity}"
        );

        if (!$purchaseResult['success']) {
            return $this->json([
                'ok' => false,
                'error' => $purchaseResult['message'],
            ], Response::HTTP_BAD_REQUEST);
        }

        // Add seeds to inventory
        $seeds = $player->getSeeds();
        $seeds[$cropType] = ($seeds[$cropType] ?? 0) + $quantity;
        $player->setSeeds($seeds);

        $this->players->save($player);

        return $this->json([
            'ok' => true,
            'message' => "Purchased {$quantity}x {$cropType} seeds for {$totalCost} coins",
            'coins' => $player->getCoins(),
            'seeds' => $seeds,
        ]);
    }

    /**
     * Harvest a crop at a specific farm cell and collect rewards.
     *
     * JSON body:
     * {
     *   "player": "player1",
     *   "row": 2,
     *   "col": 3
     * }
     *
     * Rewards coins and XP if crop is ready.
     */
    #[Route('/farm/harvest', name: 'farm_harvest', methods: ['POST'])]
    public function harvestCrop(Request $request): JsonResponse
    {
        $body = $this->parseJsonBody($request);

        if ($body === null) {
            return $this->error('Invalid JSON body');
        }

        $playerName = $body['player'] ?? null;
        $row = $body['row'] ?? null;
        $col = $body['col'] ?? null;

        if (!\is_string($playerName) || empty($playerName)) {
            return $this->error('Missing or invalid field: player');
        }

        if (!\is_int($row) || !\is_int($col) || $row < 0 || $col < 0) {
            return $this->error('Invalid fields: row and col must be non-negative integers');
        }

        $player = $this->players->findByName(trim($playerName));

        if ($player === null) {
            return $this->notFound("Player '{$playerName}' not found");
        }

        $farm = $player->getFarm();
        if (!$farm || !\is_array($farm) || !isset($farm[$row][$col])) {
            return $this->error('Invalid cell: no crop at this location');
        }

        $cell = $farm[$row][$col];
        if (!\is_array($cell) || !isset($cell['plantedItem'])) {
            return $this->error('No crop planted at this cell');
        }

        $cropData = $cell['placedItem'] ?? $cell['plantedItem'] ?? null;
        if ($cropData === null) {
            return $this->error('No crop data at this cell');
        }

        // Attempt harvest
        $harvestResult = $this->crops->harvest($cropData);

        if (!$harvestResult['success']) {
            return $this->json([
                'ok' => false,
                'error' => $harvestResult['message'],
            ], Response::HTTP_BAD_REQUEST);
        }

        // Apply rewards
        $this->economy->addCoins($player, $harvestResult['coinsRewarded'], 'crop_harvest');
        $progressionResult = $this->progression->addXp($player, $harvestResult['xpRewarded']);

        // Clear the cell — remove the crop object from whichever key it used
        unset($farm[$row][$col]['placedItem']);
        unset($farm[$row][$col]['plantedItem']); // legacy key, remove both to be safe
        $player->setFarm($farm);

        $this->players->save($player);

        return $this->json([
            'ok' => true,
            'message' => $harvestResult['message'],
            'coins' => $player->getCoins(),
            'xp' => $player->getXp(),
            'level' => $player->getLevel(),
            'leveledUp' => $progressionResult['leveledUp'],
        ]);
    }

    // ─── Health check ─────────────────────────────────────────────────────────

    /**
     * Get all available crops for the current season.
     *
     * Returns both regular crops and seasonal variants.
     */
    #[Route('/crops/seasonal', name: 'crops_seasonal', methods: ['GET'])]
    public function getSeasonalCrops(): JsonResponse
    {
        $available = $this->crops->getAvailableCrops();

        return $this->json([
            'ok' => true,
            'season' => $available['season'],
            'seasonName' => $available['seasonName'],
            'crops' => $available['crops'],
        ]);
    }

    /**
     * Simple liveness probe — useful for the frontend to detect whether the
     * PHP backend is reachable before attempting a full load/save.
     */
    #[Route('/health', name: 'health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return $this->json(['ok' => true, 'service' => 'grow-php', 'ts' => time()]);
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * Decode the request body as JSON.
     *
     * Returns null when the body is missing or unparseable.
     *
     * @return array<string, mixed>|null
     */
    private function parseJsonBody(Request $request): ?array
    {
        $content = $request->getContent();

        if (empty($content)) {
            return null;
        }

        try {
            /** @var array<string, mixed>|null $data */
            $data = json_decode($content, associative: true, flags: \JSON_THROW_ON_ERROR);

            return \is_array($data) ? $data : null;
        } catch (\JsonException) {
            return null;
        }
    }
}
