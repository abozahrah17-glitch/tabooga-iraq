const fs = require('fs');

const buffer = fs.readFileSync('script.js');
const js = buffer.toString('utf8');

// The corrupted text is at the end of the file.
// We can find the last valid function: renderBlueprints
const targetStr = "grid.appendChild(el);";
const lastIndex = js.lastIndexOf(targetStr);

if (lastIndex !== -1) {
    // We expect `        });\n    }\n}\n` after this. Let's just find the last closing brace after `grid.appendChild(el);` within a small window.
    let cutoff = lastIndex + targetStr.length;
    let bracesFound = 0;
    while(cutoff < js.length && bracesFound < 3) {
        if (js[cutoff] === '}') {
            bracesFound++;
        }
        cutoff++;
    }
    
    let cleanJs = js.substring(0, cutoff);
    
    // Remove the bad replace from earlier
    cleanJs = cleanJs.replace("const serverIP = '192.168.1.79';\r\n    const seenId = localStorage.getItem('last_seen_update');", "const seenId = localStorage.getItem('last_seen_update');");
    cleanJs = cleanJs.replace("const serverIP = '192.168.1.79';\n    const seenId = localStorage.getItem('last_seen_update');", "const seenId = localStorage.getItem('last_seen_update');");
    
    let networkSync = fs.readFileSync('network_sync.js', 'utf8');
    networkSync = networkSync.replace(/const serverIP = window.location.hostname;/g, "const serverIP = '192.168.1.79';");
    networkSync = networkSync.replace(/window.taboogaSync = new NetworkSync\(`http:\/\/\${serverIP}:3000`\);/g, "window.taboogaSync = new NetworkSync('http://192.168.1.79:3000');");
    
    cleanJs += '\n\n' + networkSync;
    
    fs.writeFileSync('script.js', cleanJs, 'utf8');
    console.log("Successfully fixed script.js");
} else {
    console.log("Could not find grid.appendChild(el);");
}
