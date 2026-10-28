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

// 2. Jika ada file dist/index.html fisik, sajikan langsung
if (file_exists(__DIR__ . '/dist/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile(__DIR__ . '/dist/index.html');
    exit;
}

// 3. Cari file bundle JavaScript dan CSS terbaru berdasarkan waktu modifikasi (filemtime)
$jsFile = '';
$cssFile = '';
$latestJsTime = 0;
$latestCssTime = 0;

$searchDirs = [__DIR__ . '/dist/assets', __DIR__ . '/assets'];
foreach ($searchDirs as $dir) {
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            $filePath = $dir . '/' . $file;
            if (is_file($filePath)) {
                $mtime = filemtime($filePath);
                if (preg_match('/^index-.*\.js$/', $file) && $mtime > $latestJsTime) {
                    $latestJsTime = $mtime;
                    $jsFile = '/assets/' . $file;
                }
                if (preg_match('/^index-.*\.css$/', $file) && $mtime > $latestCssTime) {
                    $latestCssTime = $mtime;
                    $cssFile = '/assets/' . $file;
                }
            }
        }
    }
}

// 4. Sajikan HTML Produksi Siap Pakai Langsung ke Browser!
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
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
