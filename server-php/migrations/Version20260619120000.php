<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260619120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create chat_message table for Mercure-based global chat.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE chat_message (id INT AUTO_INCREMENT NOT NULL, player_name VARCHAR(255) NOT NULL, message LONGTEXT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY (id), INDEX created_at_idx (created_at)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE chat_message');
    }
}
