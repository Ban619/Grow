<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260619062459 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fix tutorial_progress column to be nullable';
    }

    public function up(Schema $schema): void
    {
        // Change tutorial_progress to be nullable with NULL default
        $this->addSql('ALTER TABLE players MODIFY tutorial_progress JSON NULL DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // Revert to non-nullable with empty object default
        $this->addSql('ALTER TABLE players MODIFY tutorial_progress JSON NOT NULL DEFAULT \'{}\'');
    }
}
