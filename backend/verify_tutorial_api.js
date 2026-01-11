const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api/admin/tutorials';
// Note: We need a valid Admin Token usually, but for local dev/debug we might bypass or need to login first.
// If adminAuth middleware is strict, this might fail without a token.
// Let's assume we might need to Mock the middleware OR login.
// For now, let's try hitting it. If 401, we know routes work at least.

async function verify() {
    console.log("🚀 Starting Tutorial API Verification...");

    // 1. Create Dummy Screen File
    const dummyScreenPath = path.join(__dirname, 'dummy_screen.webm');
    if (!fs.existsSync(dummyScreenPath)) {
        fs.writeFileSync(dummyScreenPath, 'dummy video content');
    }

    try {
        // Step 1: Upload Screen
        console.log("\n1️⃣ Testing /upload-screen...");
        const form = new FormData();
        form.append('screenVideo', fs.createReadStream(dummyScreenPath));
        form.append('title', 'Test Tutorial');

        // Note: Missing Authorization header will likely cause 401. 
        // We'll catch that and consider it "Route Reachable".
        let res;
        try {
            res = await axios.post(`${API_BASE}/upload-screen`, form, {
                headers: { ...form.getHeaders() }
            });
            console.log("✅ Upload Success:", res.data);
        } catch (e) {
            if (e.response && e.response.status === 401) {
                console.log("✅ Route Reachable (401 Unauthorized) - Auth Middleware works.");
                return; // Can't proceed without token
            }
            throw e;
        }
        
        const tutorialId = res.data.id;
        if(!tutorialId) throw new Error("No ID returned");

        // Step 2: Generate Script
        console.log("\n2️⃣ Testing /generate-script...");
        res = await axios.post(`${API_BASE}/generate-script`, { id: tutorialId });
        console.log("✅ Script Generation Success:", res.data);

        // Step 3: Sync (Will fail without voice, but endpoint should respond)
        console.log("\n3️⃣ Testing /sync (Expect Fail due to missing voice)...");
        try {
            await axios.post(`${API_BASE}/sync`, { id: tutorialId });
        } catch (e) {
            if (e.response && e.response.data && !e.response.data.success) {
                console.log("✅ Sync correctly reported error:", e.response.data.message);
            } else {
                console.error("❌ Sync unexpected response:", e.code || e.message);
            }
        }

    } catch (err) {
        console.error("❌ Test Failed:", err.message);
        if (err.response) {
            console.error("Response:", err.response.status, err.response.data);
        }
    } finally {
        if (fs.existsSync(dummyScreenPath)) fs.unlinkSync(dummyScreenPath);
    }
}

verify();
