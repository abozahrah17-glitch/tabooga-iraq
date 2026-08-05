const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The first occurrence of id="pro-profile" should be renamed to id="market"
const firstOccur = html.indexOf('id="pro-profile"');
const secondOccur = html.indexOf('id="pro-profile"', firstOccur + 1);

if (firstOccur !== -1 && secondOccur !== -1) {
    // Replace the first occurrence
    html = html.substring(0, firstOccur) + 'id="market"' + html.substring(firstOccur + 'id="pro-profile"'.length);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Renamed the first duplicate pro-profile back to market.");
} else {
    console.log("Error: Expected 2 occurrences, found something else.");
}
