const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

function removeDuplicateSection(id) {
    const firstIdx = html.indexOf('id="' + id + '"');
    if (firstIdx !== -1) {
        const secondIdx = html.indexOf('id="' + id + '"', firstIdx + 1);
        if (secondIdx !== -1) {
            // Find the start of the section tag
            const sectionStart = html.lastIndexOf('<section', secondIdx);
            // Find the end of the section tag
            const sectionEnd = html.indexOf('</section>', sectionStart) + 10;
            
            // Remove the duplicate block
            console.log("Removing duplicate for", id, "from", sectionStart, "to", sectionEnd);
            html = html.substring(0, sectionStart) + html.substring(sectionEnd);
            return true;
        }
    }
    return false;
}

if (removeDuplicateSection('merchant-profile')) {
    removeDuplicateSection('pros'); // Call again for pros after string shifted
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Successfully removed duplicates.");
} else {
    console.log("No duplicates found.");
}
