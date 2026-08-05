
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

let stack = [];

// Simple parser
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const lineNum = i + 1;

    // Find tags
    const tags = line.match(/<\/?[\w-]+[^>]*>/g);
    if (!tags) continue;

    for (const tag of tags) {
        if (tag.startsWith('</')) {
            // Closing
            const tagName = tag.match(/<\/?([\w-]+)/)[1];
            if (['br', 'hr', 'img', 'input', 'link', 'meta'].includes(tagName)) continue;

            const last = stack.pop();
            // If we pop 'section' because we found 'div', that's a mismatch
            if (!last || last.tag !== tagName) {
                console.log(`Mismatch at line ${lineNum}: Expected closing ${last?.tag} (ID: ${last?.id}), found closing ${tagName}`);

                // If we found a closing div but expected section, we effectively closed the section in the parser's eyes IF we don't put it back.
                // But wait, if last was section, and we pop it, then it's closed.
                // So if mismatch occurs, we just log it.
            }
        } else if (!tag.endsWith('/>')) {
            // Opening
            const tagName = tag.match(/<([\w-]+)/)[1];
            if (['br', 'hr', 'img', 'input', 'link', 'meta'].includes(tagName)) continue;

            const idMatch = tag.match(/id=["']([^"']+)["']/);
            const id = idMatch ? idMatch[1] : null;

            stack.push({ tag: tagName, id: id, line: lineNum });

            if (id === 'renovation' || id === 'home' || id === 'shop') {
                console.log(`SECTION OPEN: ${id} at line ${lineNum}. Stack depth: ${stack.length}`);
            }
        }
    }

    // Check Depth at specific check points
    if (line.includes('renovForm')) {
        console.log(`CHECK POINT: renovForm at line ${lineNum}`);
        console.log(`Current Section Parent: ${stack.find(s => s.tag === 'section')?.id || 'NONE'}`);
    }
}
