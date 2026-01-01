const fetch = require('node-fetch');

async function testPredictV2() {
    console.log('Testing Predictor V2 (Category Support)...');

    // Test case: Valid score, generic category (should verify fallback or default)
    const payload = {
        year: 2024,
        score: 650,
        category: 'OBC', // This should trigger the logic to look for _OBC file
        quota: 'AI'
    };

    try {
        const response = await fetch('http://localhost:5000/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('Status:', response.status);
        if (!response.ok) {
            console.error('Error Response:', data);
            return;
        }

        console.log('Response:', JSON.stringify(data, null, 2));

        // verification logic
        if (data.category === 'OBC') {
            console.log('✅ Input Category preserved');
        } else {
            console.error('❌ Category not returned');
        }

        if (data.rankType === 'AIR') {
            console.log('✅ Correctly fell back to AIR (since distribution_2024_OBC.json does not exist yet)');
        } else if (data.rankType === 'CATEGORY_RANK') {
            console.log('✅ Found category file and returned Category Rank');
        } else {
            console.error('❌ rankType field missing or invalid:', data.rankType);
        }

    } catch (error) {
        console.error('Request failed:', error.message);
        console.log('Did you restart the server?');
    }
}

testPredictV2();
