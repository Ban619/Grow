<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260618132613 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create players table with coins, diamonds, level, xp, seeds (JSON) and farm (JSON) columns.';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE players (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(64) NOT NULL, coins INT DEFAULT 1000 NOT NULL, diamonds INT DEFAULT 0 NOT NULL, level INT DEFAULT 1 NOT NULL, xp INT DEFAULT 0 NOT NULL, seeds JSON DEFAULT \'{}\' NOT NULL, farm JSON DEFAULT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, UNIQUE INDEX UNIQ_264E43A65E237E06 (name), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE players');
    }
}
