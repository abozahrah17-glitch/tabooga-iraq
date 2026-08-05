const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add manifest to head if missing
if (!html.includes('manifest.json')) {
    const headEnd = html.indexOf('</head>');
    const manifestTag = `\n    <!-- PWA Setup -->\n    <link rel="manifest" href="manifest.json">\n    <meta name="theme-color" content="#2563eb">\n    <meta name="mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n`;
    html = html.substring(0, headEnd) + manifestTag + html.substring(headEnd);
}

// Add service worker to body if missing
if (!html.includes('serviceWorker.register')) {
    const bodyEnd = html.indexOf('</body>');
    const swTag = `\n    <script>\n      if ('serviceWorker' in navigator) {\n        window.addEventListener('load', () => {\n          navigator.serviceWorker.register('sw.js').then(reg => {\n            console.log('SW registered:', reg);\n          }).catch(err => {\n            console.log('SW registration failed:', err);\n          });\n        });\n      }\n    </script>\n`;
    html = html.substring(0, bodyEnd) + swTag + html.substring(bodyEnd);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log("PWA settings injected into index.html");
