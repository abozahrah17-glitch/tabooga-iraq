const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Insert a script at the very top of <head> to forcefully unregister service workers
const unregisterScript = `
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('ServiceWorker unregistered');
                }
            });
        }
    </script>
`;

if (!html.includes('registration.unregister()')) {
    html = html.replace('<head>', '<head>\n' + unregisterScript);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Added ServiceWorker unregister script to index.html");
}
