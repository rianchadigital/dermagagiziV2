<?php
/**
 * DERMAGA GIZI - Production Server Dispatcher for Hostinger
 * Puskesmas Kepulauan Seribu Selatan
 */

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// 1. Tangani permintaan aset statis (/assets/...)
if (strpos($requestUri, '/assets/') !== false) {
    $assetName = substr($requestUri, strpos($requestUri, '/assets/') + 8);
    $assetFile = __DIR__ . '/assets/' . $assetName;
    if (!file_exists($assetFile)) {
        $assetFile = __DIR__ . '/dist/assets/' . $assetName;
    }
    
    if (file_exists($assetFile)) {
        $ext = strtolower(pathinfo($assetFile, PATHINFO_EXTENSION));
        if ($ext === 'css') {
            header('Content-Type: text/css; charset=utf-8');
        } else if ($ext === 'js') {
            header('Content-Type: application/javascript; charset=utf-8');
        } else if ($ext === 'svg') {
            header('Content-Type: image/svg+xml');
        } else if (in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'])) {
            header('Content-Type: image/' . ($ext === 'jpg' ? 'jpeg' : $ext));
        } else if (in_array($ext, ['woff', 'woff2', 'ttf', 'eot'])) {
            header('Content-Type: font/' . $ext);
        }
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($assetFile);
        exit;
    }
}

// 1.5. Tangani Permintaan Konfigurasi Global GAS (Simpan & Baca)
if (strpos($requestUri, 'save-config') !== false && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (is_array($data) && !empty($data['gasUrl'])) {
        $savedData = [
            'gasUrl' => trim($data['gasUrl']),
            'appName' => 'DERMAGA GIZI',
            'updatedAt' => date('c'),
            'status' => 'connected'
        ];
        file_put_contents(__DIR__ . '/config.json', json_encode($savedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        if (file_exists(__DIR__ . '/public')) {
            @file_put_contents(__DIR__ . '/public/config.json', json_encode($savedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => true, 'message' => 'Konfigurasi global GAS berhasil disimpan!', 'data' => $savedData]);
        exit;
    }
}

if (strpos($requestUri, 'config.json') !== false) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    if (file_exists(__DIR__ . '/config.json')) {
        readfile(__DIR__ . '/config.json');
    } else {
        echo json_encode([
            'gasUrl' => 'https://script.google.com/macros/s/AKfycbws8A6yMS1C7rCCs5afT0skv53UzH3qBpxrWwUvHmoyRQK0MDu9MmbJDpkEMHEmeQKt/exec',
            'appName' => 'DERMAGA GIZI'
        ]);
    }
    exit;
}

// 2. Bundle JavaScript dan CSS produksi terbaru
$jsFile = '/assets/index-jWwFwYDh.js';
$cssFile = '/assets/index-Be5fcQsi.css';

// Pencarian dinamis jika file bundle berganti
$searchDirs = [__DIR__ . '/dist/assets', __DIR__ . '/assets'];
foreach ($searchDirs as $dir) {
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            // Hindari file usang lama
            if (preg_match('/^index-.*\.js$/', $file) && !in_array($file, ['index-B23_s9hh.js', 'index-BCcdkYMB.js', 'index-Brtf3PTx.js'])) {
                $jsFile = '/assets/' . $file;
            }
            if (preg_match('/^index-.*\.css$/', $file)) {
                $cssFile = '/assets/' . $file;
            }
        }
    }
}

// Baca konfigurasi global untuk disuntikkan langsung ke browser
$globalConfig = [
    'gasUrl' => 'https://script.google.com/macros/s/AKfycbws8A6yMS1C7rCCs5afT0skv53UzH3qBpxrWwUvHmoyRQK0MDu9MmbJDpkEMHEmeQKt/exec',
    'appName' => 'DERMAGA GIZI'
];
if (file_exists(__DIR__ . '/config.json')) {
    $rawCfg = json_decode(file_get_contents(__DIR__ . '/config.json'), true);
    if (is_array($rawCfg) && !empty($rawCfg['gasUrl'])) {
        $globalConfig = array_merge($globalConfig, $rawCfg);
    }
}

// 3. Sajikan HTML Produksi Siap Pakai Langsung ke Browser!
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
?>
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DERMAGA GIZI - Puskesmas Kepulauan Seribu Selatan</title>
    <meta name="description" content="Dashboard Elektronik Rekap, Monitoring, dan Analisis Gizi Balita - Puskesmas Kepulauan Seribu Selatan" />
    <meta property="og:title" content="DERMAGA GIZI - Puskesmas Kepulauan Seribu Selatan" />
    <meta property="og:description" content="Sistem Monitoring, Intervensi, dan Evaluasi Balita Bermasalah Gizi Puskesmas Kepulauan Seribu Selatan" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script>
      window.__GLOBAL_CONFIG__ = <?= json_encode($globalConfig, JSON_UNESCAPED_SLASHES) ?>;
    </script>
    <?php if ($cssFile): ?>
    <link rel="stylesheet" crossorigin href="<?= htmlspecialchars($cssFile) ?>">
    <?php endif; ?>
    <?php if ($jsFile): ?>
    <script type="module" crossorigin src="<?= htmlspecialchars($jsFile) ?>"></script>
    <?php endif; ?>
  </head>
  <body class="bg-slate-50 text-slate-800 antialiased selection:bg-sky-500 selection:text-white">
    <div id="root"></div>
  </body>
</html>
<?php exit; ?>
