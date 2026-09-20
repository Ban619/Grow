<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260619150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add private_message table and tutorial_progress to players';
    }

    public function up(Schema $schema): void
    {
        // Add tutorial_progress column to players table
        $this->addSql('ALTER TABLE players ADD tutorial_progress JSON NOT NULL DEFAULT \'{}\'');

        // Create private_message table
        $this->addSql('
            CREATE TABLE private_message (
                id INT AUTO_INCREMENT NOT NULL,
                sender_name VARCHAR(255) NOT NULL,
                recipient_name VARCHAR(255) NOT NULL,
                message LONGTEXT NOT NULL,
                created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                PRIMARY KEY(id),
                INDEX idx_sender_recipient (sender_name, recipient_name),
                INDEX idx_recipient (recipient_name),
                INDEX idx_created_at (created_at)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        ');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE private_message');
        $this->addSql('ALTER TABLE players DROP tutorial_progress');
    }
}
