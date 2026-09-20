<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Shared helpers for all API controllers.
 */
abstract class ApiController extends AbstractController
{
    // ─── Response helpers ────────────────────────────────────────────────────

    /**
     * Return a successful JSON payload.
     *
     * @param array<string, mixed> $data
     */
    protected function ok(array $data = [], int $status = Response::HTTP_OK): JsonResponse
    {
        return $this->json(['ok' => true, ...$data], $status);
    }

    /**
     * Return an error JSON payload.
     */
    protected function error(string $message, int $status = Response::HTTP_BAD_REQUEST): JsonResponse
    {
        return $this->json(['ok' => false, 'error' => $message], $status);
    }

    /**
     * Return a 404 JSON payload.
     */
    protected function notFound(string $message = 'Not found'): JsonResponse
    {
        return $this->error($message, Response::HTTP_NOT_FOUND);
    }
}
