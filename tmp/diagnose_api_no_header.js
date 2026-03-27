const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
}

loadEnv(path.join(__dirname, '../Backend/.env'));

const apiKey = process.env.SERPAPI_KEY;
const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

async function diagnose() {
    console.log('--- API Diagnostics (No Header) ---');
    console.log('API Key:', apiKey ? '***' + apiKey.slice(-4) : 'MISSING');
    console.log('Search Engine ID (CX):', cx);
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=test&searchType=image`;

    console.log('\nTesting request...');
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.log('\n--- ERROR RECEIVED FROM GOOGLE ---');
            console.log(JSON.stringify(data.error, null, 2));
        } else {
            console.log('\n--- SUCCESS! ---');
            console.log(`Received ${data.items ? data.items.length : 0} items.`);
        }
    } catch (err) {
        console.error('Network error:', err.message);
    }
}

diagnose();
