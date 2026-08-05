const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');
const badTextStart = js.indexOf('/ /   T a b o o g a');
const badTextStart2 = js.indexOf('\0/\0/\0 \0 \0T\0a\0b\0o\0o\0g\0a'); // UTF-16 representation

let cutoff = -1;
if (badTextStart !== -1) cutoff = badTextStart;
else if (badTextStart2 !== -1) cutoff = badTextStart2;
else {
    // find the end of renderBlueprints
    cutoff = js.lastIndexOf('}\n} \n\0') !== -1 ? js.lastIndexOf('}\n} \n\0') : -1;
    if (cutoff === -1) {
       // fallback search
       cutoff = js.indexOf('    }\n}\n\0/');
       if (cutoff === -1) {
           const match = js.match(/grid\.appendChild\(el\);\s*}\s*}/);
           if (match) cutoff = match.index + match[0].length;
       }
    }
}

if (cutoff !== -1) {
    console.log("Found cutoff at index", cutoff);
    js = js.substring(0, cutoff);
    
    // Also remove that bad replace_file_content that injected serverIP in the middle of nowhere
    js = js.replace("const serverIP = '192.168.1.79';\r\n    const seenId = localStorage.getItem('last_seen_update');", "const seenId = localStorage.getItem('last_seen_update');");
    
    // Read the correct network_sync.js
    let networkSync = fs.readFileSync('network_sync.js', 'utf8');
    // Ensure networkSync uses the correct IP
    networkSync = networkSync.replace(/const serverIP = window.location.hostname;/g, "const serverIP = '192.168.1.79';");
    networkSync = networkSync.replace(/window.taboogaSync = new NetworkSync\(`http:\/\/\${serverIP}:3000`\);/g, "window.taboogaSync = new NetworkSync('http://192.168.1.79:3000');");
    
    // Append properly
    js = js + '\n\n' + networkSync;
    
    fs.writeFileSync('script.js', js, 'utf8');
    console.log("Successfully fixed script.js encoding and appended network_sync.");
} else {
    console.log("Could not find cutoff point.");
}
