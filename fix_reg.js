const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');
let lines = js.split(/\r?\n/);

let inReg = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function openRegistration(')) {
        inReg = true;
    }
    if (inReg && lines[i].includes('value="mat"')) {
        if (!lines[i-1].includes('value="tech"')) {
            const spaces = lines[i].match(/^\s*/)[0];
            const techOption = spaces + "<option value=\"tech\" ${type === 'tech' ? 'selected' : ''}>فني</option>";
            const elecOption = spaces + "<option value=\"elec\" ${type === 'elec' ? 'selected' : ''}>كهربائي</option>";
            const carpOption = spaces + "<option value=\"carp\" ${type === 'carp' ? 'selected' : ''}>نجار</option>";
            lines.splice(i, 0, techOption, elecOption, carpOption);
            break;
        }
    }
}

fs.writeFileSync('script.js', lines.join('\n'), 'utf8');
console.log("Fixed openRegistration missing categories");
