const fs = require('fs');

let js = fs.readFileSync('network_sync.js', 'utf8');

// Replace dynamic IP with hardcoded IP for the APK
js = js.replace(/const serverIP = window.location.hostname;/g, "const serverIP = '192.168.1.79';");
js = js.replace(/window.taboogaSync = new NetworkSync\\(\`http:\\\/\\\/\${serverIP}:3000\`\\);/g, "window.taboogaSync = new NetworkSync('http://192.168.1.79:3000');");

fs.writeFileSync('network_sync.js', js, 'utf8');
console.log("Updated network_sync.js with LAN IP for APK build.");
