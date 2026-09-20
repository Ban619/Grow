<?php
require 'vendor/autoload.php';

try {
    $pdo = new PDO('mysql:host=127.0.0.1:3306;dbname=grow', 'root', '');
    $stmt = $pdo->query('DESCRIBE players');
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Players table columns:\n";
    foreach($cols as $col) {
        echo $col['Field'] . ' - ' . $col['Type'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
