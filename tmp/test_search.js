const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../Backend/.env') });

const apiKey = process.env.SERPAPI_KEY;
const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

async function testSearch(searchQuery) {
    console.log(`Testing search for: "${searchQuery}"`);
    const brands = ['bershka.com', 'zara.com', 'hm.com', 'mango.com', 'pullandbear.com'];
    const siteFilter = brands.map(site => `site:${site}`).join(' OR ');
    const query = encodeURIComponent(`${searchQuery} (${siteFilter})`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error('API Error:', data.error.message);
            return;
        }

        console.log(`Results found: ${data.items ? data.items.length : 0}`);
        if (data.items) {
            data.items.slice(0, 3).forEach((item, i) => {
                console.log(`\nResult ${i + 1}:`);
                console.log(`Title: ${item.title}`);
                console.log(`Link (Image): ${item.link}`);
                console.log(`Context Link: ${item.image?.contextLink}`);
                console.log(`Display Link: ${item.displayLink}`);
            });
        } else {
            console.log('No items found. Trying broader search...');
            const broadQuery = encodeURIComponent(`${searchQuery} fashion clothes`);
            const broadUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${broadQuery}&searchType=image`;
            const broadResponse = await fetch(broadUrl);
            const broadData = await broadResponse.json();
            console.log(`Broad results found: ${broadData.items ? broadData.items.length : 0}`);
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testSearch('brown belt');
