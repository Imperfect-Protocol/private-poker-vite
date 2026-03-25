<?php
// router.php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$documentRoot = $_SERVER['DOCUMENT_ROOT'];
$filePath = $documentRoot . $path;

// 1. If the file physically exists in /dist, serve it directly
if (file_exists($filePath) && is_file($filePath)) {
    return false;
}

// 2. SPA Fallback: If the file is not found (like /lobby/1), serve index.html
include $documentRoot . '/index.html';