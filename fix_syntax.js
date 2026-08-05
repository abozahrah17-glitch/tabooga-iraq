const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');
let lines = js.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
    // Fix the literal `\n` at line 5356
    if (lines[i] === '\\n') {
        lines[i] = '';
    }
    
    // Fix the broken regex replaces
    // For example: `${user.desc ? user.desc.replace(/\` followed by next line `/g, '<br>') : '---'}`
    if (lines[i].includes('replace(/\\') && !lines[i].includes('/g')) {
        // Look at the next line to see if it's the second half of the regex
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('/g,')) {
            // Re-combine them
            lines[i] = lines[i].replace(/replace\(\/\\$/, "replace(/\\n") + lines[i+1].trim();
            lines[i+1] = '';
        }
    }
}

fs.writeFileSync('script.js', lines.join('\n'), 'utf8');
console.log("Syntax fixed.");
