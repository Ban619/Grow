# Grow — PHP/Symfony Backend (`server-php`)

## Stack
| Layer | Technology |
|-------|-----------|
| Framework | Symfony 8.1 |
| ORM | Doctrine ORM 3 + Migrations |
| Database | MySQL 8.0 (local) / PostgreSQL 16 (Docker) |
| CORS | NelmioCorsBundle |
| Real-time Chat | Mercure Protocol + HubInterface |

---

## Prerequisites
- **PHP 8.4+** with `pdo_mysql` extension
- **MySQL 8.0** running locally on port 3306 (or adjust `DATABASE_URL`)
- **Composer** (dependency manager)

---

## Quick start (local)

```bash
# 1. Install dependencies (already done)
composer install

# 2. Create the database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS grow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Run migrations
php bin/console doctrine:migrations:migrate --no-interaction

# 4. Start the built-in PHP server
php -S 127.0.0.1:8080 -t public/
```

The API is now available at **http://127.0.0.1:8080/api/…**

---

## API Endpoints

### Game State
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/load?player=<name>` | Load a player's full game state |
| `POST` | `/api/save` | Upsert a player's game state |
| `POST` | `/api/register` | Explicitly create a new player |
| `GET` | `/api/player/{id}` | Fetch player by database ID |
| `DELETE` | `/api/player/{id}` | Delete a player |
| `GET` | `/api/players` | List all players (paginated) |

### Global Chat (Mercure Protocol)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat/send` | Send a global chat message |
| `GET` | `/api/chat/health` | Check chat service status |
| `SSE` | `/.well-known/mercure?topic=chat/global` | Subscribe to chat messages (Mercure) |

**See [MERCURE_CHAT.md](MERCURE_CHAT.md) for detailed chat integration guide.**

### `POST /api/save` — request body
```json
{
  "player": "player1",
  "state": {
    "coins": 1500,
    "diamonds": 3,
    "level": 2,
    "xp": 75,
    "seeds": { "wheat": 5, "corn": 2, "berry": 1, "pumpkin": 0 },
    "farm": null
  }
}
```

### `POST /api/register` — request body
```json
{ "name": "player1" }
```

---

## Database schema

Table: **`players`**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | INT AUTO_INCREMENT | — | Primary key |
| `name` | VARCHAR(64) UNIQUE | — | Player handle |
| `coins` | INT | 1000 | In-game currency |
| `diamonds` | INT | 0 | Premium currency |
| `level` | INT | 1 | Player level |
| `xp` | INT | 0 | Experience points |
| `seeds` | JSON | `{}` | Seed inventory map |
| `farm` | JSON (nullable) | NULL | Full 2D farm grid |
| `createdAt` | DATETIME | — | First save timestamp |
| `updatedAt` | DATETIME | — | Last save timestamp |

---

## Client proxy
The Vite dev client (`client/`) proxies all `/api/*` requests to `http://127.0.0.1:8080` via `vite.config.js`.

---

## Docker (PostgreSQL)
A `compose.yaml` is provided to spin up a PostgreSQL container. Update `DATABASE_URL` in `.env` to the Postgres DSN if you prefer that path:
```
DATABASE_URL="postgresql://app:!ChangeMe!@127.0.0.1:5432/grow?serverVersion=16&charset=utf8"
```
Then run `docker compose up -d` before running migrations.
