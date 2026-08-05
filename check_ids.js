const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const ids = ['ppCover', 'ppLogo', 'ppName', 'ppCategory', 'ppDesc', 'ppCvContainer', 'ppServicesGrid', 'ppContactBtn', 'ppProjectsGrid'];
ids.forEach(id => {
    console.log(id, html.includes('id="' + id + '"') || html.includes("id='" + id + "'"));
});
