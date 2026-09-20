<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\PlayerRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Tutorial progress tracking API.
 *
 * Endpoints:
 *   GET  /api/tutorial/status     – Get tutorial progress for a player
 *   POST /api/tutorial/mark-step  – Mark a tutorial step as complete
 */
#[Route('/api/tutorial', name: 'api_tutorial_')]
class TutorialController extends AbstractController
{
    public function __construct(
        private readonly PlayerRepository $players,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Get tutorial progress for a player.
     *
     * GET /api/tutorial/status?player=player1
     */
    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(Request $request): JsonResponse
    {
        try {
            $playerName = $request->query->get('player');

            if (!$playerName || !\is_string($playerName)) {
                return $this->json(['error' => 'Missing required query param: player'], Response::HTTP_BAD_REQUEST);
            }

            $player = $this->players->findByName(trim($playerName));

            if ($player === null) {
                return $this->json([
                    'ok' => true,
                    'tutorialProgress' => [],
                ]);
            }

            return $this->json([
                'ok' => true,
                'tutorialProgress' => $player->getTutorialProgress(),
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Server error: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Mark a tutorial step as complete.
     *
     * POST /api/tutorial/mark-step
     * Body: {
     *   "player": "player1",
     *   "step": "welcomeShown" or "firstPlant" or "firstHarvest" etc
     * }
     *
     * Tutorial steps:
     * - welcomeShown: Initial welcome modal shown
     * - firstPlant: First seed planted
     * - firstHarvest: First crop harvested
     * - firstBuilding: First building placed
     * - tutorialComplete: Full tutorial finished
     */
    #[Route('/mark-step', name: 'mark_step', methods: ['POST'])]
    public function markStep(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), associative: true);

            if (!is_array($data) || !isset($data['player']) || !isset($data['step'])) {
                return $this->json(['error' => 'Missing required fields: player, step'], Response::HTTP_BAD_REQUEST);
            }

            $playerName = trim($data['player']);
            $step = trim($data['step']);

            if (empty($playerName) || empty($step)) {
                return $this->json(['error' => 'Fields cannot be empty'], Response::HTTP_BAD_REQUEST);
            }

            // Valid tutorial steps
            $validSteps = ['welcomeShown', 'firstPlant', 'firstHarvest', 'firstBuilding', 'tutorialComplete'];

            if (!in_array($step, $validSteps, true)) {
                return $this->json(['error' => "Invalid tutorial step: {$step}"], Response::HTTP_BAD_REQUEST);
            }

            $player = $this->players->findByName($playerName);

            if ($player === null) {
                return $this->json(['error' => 'Player not found'], Response::HTTP_NOT_FOUND);
            }

            $player->markTutorialStep($step);
            $this->em->flush();

            return $this->json([
                'ok' => true,
                'step' => $step,
                'tutorialProgress' => $player->getTutorialProgress(),
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Server error: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
