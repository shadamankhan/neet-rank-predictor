const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

// Initialize OpenAI (Lazy Init)
let openai;
const getOpenAI = () => {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is missing in .env");
        }
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
};

// Paths
const UPLOAD_DIR = path.join(__dirname, '../data/tutorials');
fs.ensureDirSync(UPLOAD_DIR);

// Helper: Get Paths
const getPaths = (id) => ({
    dir: path.join(UPLOAD_DIR, id),
    screen: path.join(UPLOAD_DIR, id, 'screen.webm'),
    voice: path.join(UPLOAD_DIR, id, 'voice.mp3'),
    final: path.join(UPLOAD_DIR, id, 'final.mp4'),
    script: path.join(UPLOAD_DIR, id, 'script.json'),
    meta: path.join(UPLOAD_DIR, id, 'meta.json'),
    overlayDir: path.join(UPLOAD_DIR, id, 'overlays')
});

// Helper: Get Font Path (Cross-Platform)
const getFontPath = () => {
    if (process.platform === 'win32') return 'C:/Windows/Fonts/arial.ttf';

    // Linux (Render/Docker)
    const candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSans.ttf'
    ];

    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return null; // Let FFmpeg try default or fail gracefully
};

// 1. Upload Screen Recording
exports.uploadScreen = async (req, res) => {
    try {
        const id = uuidv4();
        const { dir, screen, meta } = getPaths(id);

        await fs.ensureDir(dir);

        // Move uploaded file to destination
        await fs.move(req.file.path, screen);

        // Create Metadata
        const metadata = {
            id,
            title: req.body.title || "Untitled Tutorial",
            createdAt: new Date(),
            status: "SCREEN_UPLOADED",
            voiceMode: "AI"
        };
        await fs.writeJson(meta, metadata);

        res.json({ success: true, id, message: "Screen uploaded successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Generate Script (AI)
exports.generateScript = async (req, res) => {
    try {
        const { id } = req.body;
        const { meta, script } = getPaths(id);

        if (!fs.existsSync(meta)) return res.status(404).json({ success: false, message: "Tutorial not found" });

        // Placeholder for real video analysis (would require frame extraction)
        // For MVP, we use the title/context provided
        const metadata = await fs.readJson(meta);
        const prompt = `
        You are a NEET mentor. Generate a spoken tutorial script for a video titled "${metadata.title}".
        Explain step-by-step what the student is typically seeing in such a tool.
        Use simple Hinglish.
        Tone: calm, motivating.
        Audience: NEET UG aspirants.
        Format: JSON array of objects with "start" (seconds, approximate), "end", and "text".
        Generate 3-5 segments for a 30-second video.
        `;

        const ai = getOpenAI();
        const response = await ai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        const generatedContent = JSON.parse(response.choices[0].message.content);
        const scriptData = generatedContent.script || generatedContent.segments || []; // Adapt based on AI output

        await fs.writeJson(script, scriptData);

        // Update Status
        metadata.status = "SCRIPT_READY";
        await fs.writeJson(meta, metadata);

        res.json({ success: true, script: scriptData });

    } catch (err) {
        // Fallback mock for dev without API Key
        if (err.status === 401 || err.message.includes("OPENAI_API_KEY is missing")) {
            console.warn("⚠️ OpenAI Key missing or invalid. Using Mock Script.");

            // Pool of varied mock scripts for consistent testing
            const mockVariations = [
                [
                    { start: 0, end: 5, text: "Swagat hai aapka NEET College Predictor mein." },
                    { start: 5, end: 12, text: "Sabse pehle apna Rank aur Category select karein." },
                    { start: 12, end: 20, text: "Ab 'Predict' button dabayein aur apne colleges dekhein." }
                ],
                [
                    { start: 0, end: 4, text: "Is tutorial mein hum Rank Analysis samjhenge." },
                    { start: 4, end: 10, text: "Menu se 'Detailed Analysis' option chunen." },
                    { start: 10, end: 18, text: "Yahan aap pichhle saalon ke cutoff trends dekh sakte hain." }
                ],
                [
                    { start: 0, end: 5, text: "Hello students! Aaj hum Counseling process dekhenge." },
                    { start: 5, end: 12, text: "Counseling tab par click karke apne documents upload karein." },
                    { start: 12, end: 20, text: "Verify hone ke baad aap choice filling start kar sakte hain." }
                ]
            ];

            // Pick a random script to simulate AI "generation"
            const mockScript = mockVariations[Math.floor(Math.random() * mockVariations.length)];
            res.json({ success: true, script: mockScript, note: "Mock Data (API Key Missing)" });
        } else {
            console.error(err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};

// 3. Generate Voice (AI)
exports.generateVoice = async (req, res) => {
    try {
        const { id, scriptLines } = req.body;
        const { meta, voice } = getPaths(id);

        if (!fs.existsSync(meta)) return res.status(404).json({ success: false, message: "Tutorial not found" });

        // 1. Prepare Text
        const textToSpeak = scriptLines.map(s => s.text).join(" ... "); // Add pauses

        // 2. Call OpenAI TTS
        try {
            const ai = getOpenAI();
            const mp3 = await ai.audio.speech.create({
                model: "tts-1",
                voice: "alloy",
                input: textToSpeak,
            });

            // 3. Save File
            const buffer = Buffer.from(await mp3.arrayBuffer());
            await fs.writeFile(voice, buffer);

            // 4. Update Metadata
            const metadata = await fs.readJson(meta);
            metadata.status = "VOICE_READY";
            metadata.voiceMode = "AI";
            await fs.writeJson(meta, metadata);

            res.json({ success: true, message: "AI Voice generated successfully!" });

        } catch (apiErr) {
            // FALLBACK: If API Key missing, generate valid silent/dummy MP3 using Buffer
            if (apiErr.message.includes("OPENAI_API_KEY is missing") || apiErr.status === 401) {
                console.warn("⚠️ OpenAI Key missing. Generating Mock Voice (Test Tone) using Buffer.");

                // Generate 5 second Sine Wave (440Hz) manually
                const sampleRate = 44100;
                const duration = 5;
                const numChannels = 1;
                const frequency = 440; // A4
                const bytesPerSample = 2; // 16-bit
                const byteRate = sampleRate * numChannels * bytesPerSample;
                const dataSize = duration * byteRate;
                const buffer = Buffer.alloc(44 + dataSize);

                // Write WAV Header
                buffer.write('RIFF', 0);
                buffer.writeUInt32LE(36 + dataSize, 4); // ChunkSize
                buffer.write('WAVE', 8);
                buffer.write('fmt ', 12);
                buffer.writeUInt32LE(16, 16); // Subchunk1Size
                buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
                buffer.writeUInt16LE(numChannels, 22);
                buffer.writeUInt32LE(sampleRate, 24);
                buffer.writeUInt32LE(byteRate, 28);
                buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
                buffer.writeUInt16LE(16, 34); // BitsPerSample
                buffer.write('data', 36);
                buffer.writeUInt32LE(dataSize, 40);

                // Write Sine Wave Data
                const amplitude = 32000; // Max ~32767
                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
                    buffer.writeInt16LE(Math.floor(sample), 44 + (i * 2));
                }

                await fs.writeFile(voice, buffer); // Save as voice.mp3 (technically WAV, but ffmpeg handles it)

                const metadata = await fs.readJson(meta);
                metadata.status = "VOICE_READY";
                metadata.voiceMode = "MOCK";
                await fs.writeJson(meta, metadata);

                return res.json({ success: true, message: "Mock Voice Generated (Sine Tone)" });
            }
            throw apiErr; // Rethrow other errors
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Upload Voice (Manual)
exports.uploadVoice = async (req, res) => {
    try {
        const { id } = req.body;
        // Basic check
        if (!id) return res.status(400).json({ success: false, message: "Missing Tutorial ID" });

        const { meta, voice } = getPaths(id);

        if (!req.file) return res.status(400).json({ success: false, message: "No audio file uploaded" });

        // Move uploaded file
        await fs.move(req.file.path, voice, { overwrite: true });

        // Update Metadata
        const metadata = await fs.readJson(meta).catch(() => ({}));
        metadata.status = "VOICE_READY";
        metadata.voiceMode = "MANUAL";
        await fs.writeJson(meta, metadata);

        res.json({ success: true, message: "Voice uploaded successfully" });

    } catch (err) {
        console.error("Voice Upload Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Upload Overlay Image
exports.uploadOverlay = async (req, res) => {
    try {
        const { id } = req.body;
        // Basic check
        if (!id || !req.file) return res.status(400).json({ success: false, message: "Missing ID or file" });

        const { overlayDir } = getPaths(id);
        await fs.ensureDir(overlayDir);

        const ext = path.extname(req.file.originalname) || '.png';
        const fileName = `${Date.now()}_${uuidv4()}${ext}`;
        const filePath = path.join(overlayDir, fileName);

        await fs.move(req.file.path, filePath);

        // Return relative path so frontend can use it if needed, or just status
        // Frontend will likely track these locally and send metadata to /sync
        res.json({ success: true, url: `/data/tutorials/${id}/overlays/${fileName}`, fileName });
    } catch (err) {
        console.error("Overlay Upload Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Sync Video & Audio (FFmpeg) with Overlays (Scaled & Positioned)
exports.syncTutorial = async (req, res) => {
    try {
        const { id, overlays: overlayData = [], trimStart, trimEnd, previewWidth, previewHeight } = req.body;
        const { screen, voice, final, meta, overlayDir } = getPaths(id);

        if (!fs.existsSync(screen) || !fs.existsSync(voice)) {
            return res.status(400).json({ success: false, message: "Missing screen or voice file" });
        }

        // 1. Get Video Metadata for Scaling
        const videoMeta = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(screen, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
            });
        });
        const videoStream = videoMeta.streams.find(s => s.codec_type === 'video');
        const videoW = videoStream ? videoStream.width : 1280;
        const videoH = videoStream ? videoStream.height : 720;

        // Calculate Scale Factors (Video / Preview)
        const pW = parseFloat(previewWidth) || 1280;
        const pH = parseFloat(previewHeight) || 720;
        const scaleX = videoW / pW;
        const scaleY = videoH / pH;

        // 2. Build FFmpeg Command
        await new Promise((resolve, reject) => {
            let command = ffmpeg().input(screen);

            // Trim Logic
            const start = parseFloat(trimStart) || 0;
            const end = parseFloat(trimEnd) || 0;
            if (start > 0) command.seekInput(start);

            command.input(voice);

            let complexFilter = [];
            let lastStream = '0:v'; // Start with video
            let inputCount = 2; // 0=screen, 1=voice, 2+=overlays

            // Filter Valid Overlays
            const validOverlays = overlayData.filter(o => (o.type === 'text' && o.text) || (o.type === 'image' && o.fileName));

            // Prepare Inputs for Images
            validOverlays.forEach(ov => {
                if (ov.type === 'image') {
                    const ovPath = path.join(overlayDir, ov.fileName);
                    if (fs.existsSync(ovPath)) {
                        command.input(ovPath);
                        ov.inputIdx = inputCount++;
                    } else {
                        ov.inputIdx = -1; // Skip missing files
                    }
                }
            });

            // Build Filter Chain
            validOverlays.forEach((ov, idx) => {
                if (ov.type === 'image' && ov.inputIdx === -1) return;

                const nextStream = (idx === validOverlays.length - 1) ? 'outv' : `tmp${idx}`;

                // Calculate Scaled Coordinates & Size
                // Ensure w/h are even to prevent encoding errors (optional but good practice)
                const w = Math.floor((ov.width || 200) * scaleX);
                const h = Math.floor((ov.height || 150) * scaleY);
                const x = Math.floor((ov.x || 0) * scaleX);
                const y = Math.floor((ov.y || 0) * scaleY);

                const startTime = Math.max(0, parseFloat(ov.time) - start);
                const endTime = startTime + 5; // Default 5s duration

                if (ov.type === 'image') {
                    // 1. Scale Image Input
                    // 2. Overlay
                    const scaledStream = `scaled${idx}`;
                    complexFilter.push({
                        filter: 'scale',
                        options: `${w}:${h}`,
                        inputs: [`${ov.inputIdx}:v`],
                        outputs: [scaledStream]
                    });

                    complexFilter.push({
                        filter: 'overlay',
                        options: {
                            x: x,
                            y: y,
                            enable: `between(t,${startTime},${endTime})`
                        },
                        inputs: [lastStream, scaledStream],
                        outputs: [nextStream]
                    });
                } else if (ov.type === 'text') {
                    // Drawtext
                    // Note: 'fontsize' and 'x','y' need scaling
                    // Font file needed for Windows usually. Try standard Arial.
                    const fontSize = Math.floor((parseInt(ov.style?.fontSize) || 24) * scaleY);

                    // Simple text sanitation
                    const safeText = ov.text.replace(/:/g, '\\:').replace(/'/g, '');

                    complexFilter.push({
                        filter: 'drawtext',
                        options: {
                            text: safeText,
                            fontfile: getFontPath() || 'Arial', // Fallback
                            fontsize: fontSize,
                            fontcolor: 'white',
                            x: x,
                            y: y,
                            box: 1, // Add background box
                            boxcolor: 'black@0.5',
                            boxborderw: 5,
                            enable: `between(t,${startTime},${endTime})`
                        },
                        inputs: [lastStream],
                        outputs: [nextStream]
                    });
                }

                lastStream = nextStream;
            });

            // Final Output Options
            const outputOptions = [
                '-c:a aac',
                '-preset fast',
                '-y'
            ];

            if (validOverlays.length > 0) {
                outputOptions.push('-map', '[outv]');
                outputOptions.push('-map', '1:a');
            } else {
                outputOptions.push('-map', '0:v');
                outputOptions.push('-map', '1:a');
            }
            outputOptions.push('-c:v', 'libx264');

            if (end > start) {
                command.duration(end - start);
            } else {
                outputOptions.push('-shortest');
            }

            if (complexFilter.length > 0) {
                command.complexFilter(complexFilter);
            }

            command
                .outputOptions(outputOptions)
                .save(final)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error("FFmpeg Error:", err);
                    reject(new Error(`Video encoding failed: ${err.message}`));
                });
        });

        // Update Metadata
        const metadata = await fs.readJson(meta);
        metadata.status = "SYNCED";
        metadata.finalUrl = `/data/tutorials/${id}/final.mp4`;
        await fs.writeJson(meta, metadata);

        res.json({ success: true, url: metadata.finalUrl });

    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
