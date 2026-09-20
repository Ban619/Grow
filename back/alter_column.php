<?php
require 'vendor/autoload.php';

try {
    $pdo = new PDO('mysql:host=127.0.0.1:3306;dbname=grow', 'root', '');
    $pdo->exec('ALTER TABLE players MODIFY tutorial_progress JSON NULL DEFAULT NULL');
    echo "Column modified successfully\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
