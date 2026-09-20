<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Adds storage (silo/barn) JSON column and tutorial_progress column to the players table.
 */
final class Version20260717000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add storage JSON column and tutorial_progress JSON column to players table.';
    }

    public function up(Schema $schema): void
    {
        // Add tutorial_progress column if it doesn't already exist
        $this->addSql("
            ALTER TABLE players
            ADD COLUMN IF NOT EXISTS tutorial_progress JSON DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS storage JSON DEFAULT NULL
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE players DROP COLUMN IF EXISTS storage');
        $this->addSql('ALTER TABLE players DROP COLUMN IF EXISTS tutorial_progress');
    }
}
