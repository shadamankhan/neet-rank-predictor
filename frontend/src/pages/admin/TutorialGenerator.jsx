import React, { useState, useRef, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getApiBase } from '../../apiConfig'; // Import API helper
import { useAuth } from '../../useAuth'; // Import Auth Hook

const API_BASE = getApiBase();
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import 'pdfjs-dist/build/pdf.worker.mjs'; // Ensure worker is bundled or available

// Set worker source logic - for Vite dev, CDN is safest or use a local copy
// For now, let's try the CDN approach using the version from the lib
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const TutorialGenerator = () => {
    const { user } = useAuth();

    // State: Project
    const [projectTitle, setProjectTitle] = useState("New NEET Tutorial");
    const [status, setStatus] = useState("DRAFT");
    const [voiceMode, setVoiceMode] = useState("AI");
    const [tutorialId, setTutorialId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingLineId, setEditingLineId] = useState(null); // Track which line is being edited
    const [editBuffer, setEditBuffer] = useState(""); // Buffer for edit text

    // Progress Tracking
    const [hasScreen, setHasScreen] = useState(false);
    const [hasVoice, setHasVoice] = useState(false);

    // State: Recording & Media
    // State: Recording & Media
    const [isRecording, setIsRecording] = useState(false);
    const [mediaStream, setMediaStream] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [videoUrl, setVideoUrl] = useState(null);
    const [voiceUrl, setVoiceUrl] = useState(null); // URL for previewing voice
    // Editing State
    const [trimRange, setTrimRange] = useState([0, 0]); // [start, end]
    const [overlays, setOverlays] = useState([]); // [{type: 'image', url: '', time: 0}]
    const [selectedTool, setSelectedTool] = useState(null); // 'TRIM', 'OVERLAY', etc.
    const videoRef = useRef(null); // Main playback video
    const videoPreviewRef = useRef(null); // Live preview
    const audioRef = useRef(null); // Hidden audio player for sync
    const mediaRecorderRef = useRef(null);
    const voiceInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const pdfInputRef = useRef(null);

    // --- Media Handlers ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !tutorialId) return alert(tutorialId ? "Select a file." : "Upload screen recording first.");

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const formData = new FormData();
            formData.append('id', tutorialId);
            formData.append('overlayImage', file);

            const res = await fetch(`${API_BASE}/api/admin/tutorials/upload-overlay`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                // Add to overlays list with default time (current playback time)
                setOverlays(prev => [
                    ...prev,
                    {
                        type: 'image',
                        url: `${API_BASE}${data.url}`, // Backend returns relative path
                        fileName: data.fileName,
                        time: currentTime, // Default to current head position
                        id: Date.now()
                    }
                ]);
                alert("✅ Image Added! Drag functionality coming soon.");
            } else {
                alert("Upload failed: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !tutorialId) return alert(tutorialId ? "Select a PDF." : "Upload screen recording first.");

        setLoading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // Limit to first 5 pages to avoid massive processing
            const numPages = Math.min(pdf.numPages, 5);
            const images = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                // Convert to blob and upload
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const token = await user.getIdToken();
                const formData = new FormData();
                formData.append('id', tutorialId);
                formData.append('overlayImage', blob, `page_${i}.png`);

                const res = await fetch(`${API_BASE}/api/admin/tutorials/upload-overlay`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    images.push({
                        type: 'image',
                        url: `${API_BASE}${data.url}`,
                        fileName: data.fileName,
                        time: currentTime + (i - 1) * 5, // Stagger every 5 seconds
                        id: Date.now() + i
                    });
                }
            }

            setOverlays(prev => [...prev, ...images]);
            alert(`✅ Added ${images.length} pages from PDF!`);

        } catch (err) {
            console.error("PDF Error:", err);
            alert("PDF Error: " + err.message);
        } finally {
            setLoading(false);
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };


    // State: Timeline & Playback
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timelineRef = useRef(null);

    // State: Script
    const [scriptLines, setScriptLines] = useState([]);
    const activeLineRef = useRef(null);

    // --- Script Actions ---
    const handleDeleteScriptLine = (idToDelete) => {
        if (window.confirm("Delete this line?")) {
            setScriptLines(prev => prev.filter(line => line.id !== idToDelete));
        }
    };

    const startEditing = (line) => {
        setEditingLineId(line.id);
        setEditBuffer(line.text);
    };

    const saveEditing = (id) => {
        setScriptLines(prev => prev.map(line =>
            line.id === id ? { ...line, text: editBuffer } : line
        ));
        setEditingLineId(null);
    };

    const cancelEditing = () => {
        setEditingLineId(null);
        setEditBuffer("");
    };

    // --- Helpers ---
    const formatTime = (time) => {
        if (!time || isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // --- Effects ---
    // Sync active script line
    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentTime]);

    // Sync Audio with Video
    useEffect(() => {
        if (!videoRef.current || !audioRef.current) return;

        const onPlay = () => audioRef.current.play();
        const onPause = () => audioRef.current.pause();
        const onSeek = () => { audioRef.current.currentTime = videoRef.current.currentTime; };

        const vid = videoRef.current;
        vid.addEventListener('play', onPlay);
        vid.addEventListener('pause', onPause);
        vid.addEventListener('seeking', onSeek);
        vid.addEventListener('seeked', onSeek);

        return () => {
            vid.removeEventListener('play', onPlay);
            vid.removeEventListener('pause', onPause);
            vid.removeEventListener('seeking', onSeek);
            vid.removeEventListener('seeked', onSeek);
        };
    }, [videoUrl, voiceUrl]);

    // --- Actions ---

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: "screen" },
                audio: false,
            });

            setMediaStream(stream);
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
                videoPreviewRef.current.play();
            }

            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
            mediaRecorderRef.current = recorder;

            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
                setRecordedChunks(chunks);
                stream.getTracks().forEach(track => track.stop());
                if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
                setStatus("RECORDED");
            };

            recorder.start();
            setIsRecording(true);

        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Could not start screen recording: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleUpload = async () => {
        if (!recordedChunks.length) return alert("No recording to upload!");
        if (!user) return alert("Login required.");

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('screenVideo', blob, 'screen.webm');
            formData.append('title', projectTitle);

            const res = await fetch(`${API_BASE}/api/admin/tutorials/upload-screen`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setTutorialId(data.id);
                setHasScreen(true);
                setStatus("SCREEN_UPLOADED");
                alert("✅ Uploaded!");
            } else {
                alert("Upload failed: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateScript = async () => {
        if (!tutorialId) return alert("Upload screen first.");
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_BASE}/api/admin/tutorials/generate-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id: tutorialId })
            });
            const data = await res.json();
            if (data.success) {
                const formattedScript = (data.script || []).map((line, idx) => ({ ...line, id: idx }));
                setScriptLines(formattedScript);
                setStatus("SCRIPT_READY");
                alert("✅ Script generated!");
            } else {
                alert("Generation failed: " + data.message);
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAIVoiceGenerate = async () => {
        if (!tutorialId || !scriptLines.length) return alert("Script needed.");
        setLoading(true);
        setVoiceMode('AI');
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_BASE}/api/admin/tutorials/generate-voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id: tutorialId, scriptLines })
            });
            const data = await res.json();
            if (data.success) {
                setHasVoice(true);
                // Force cache bust to ensure new audio plays
                setVoiceUrl(`${API_BASE}/data/tutorials/${tutorialId}/voice.mp3?t=${Date.now()}`);
                setStatus("VOICE_READY");
                alert("✅ Voice Generated!");
            } else {
                alert("Failed: " + data.message);
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleVoiceUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !tutorialId) return;

        setLoading(true);
        setVoiceMode('MANUAL');
        try {
            const token = await user.getIdToken();
            const formData = new FormData();
            formData.append('voiceAudio', file); // Matches backend 'upload.single("voiceAudio")'
            formData.append('id', tutorialId);

            const res = await fetch(`${API_BASE}/api/admin/tutorials/upload-voice`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setHasVoice(true);
                // Force cache bust
                setVoiceUrl(`${API_BASE}/data/tutorials/${tutorialId}/voice.mp3?t=${Date.now()}`);
                setStatus("VOICE_READY");
                alert("✅ Manual Voice Uploaded!");
            } else {
                alert("Upload failed: " + data.message);
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
            // Reset input
            if (voiceInputRef.current) voiceInputRef.current.value = '';
        }
    };

    const handleSync = async () => {
        if (!hasScreen || !hasVoice) return alert("Need screen and voice.");
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const timeoutId = setTimeout(() => {
                if (loading) alert("Processing is taking a while, hold on...");
            }, 10000);

            const res = await fetch(`${API_BASE}/api/admin/tutorials/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    id: tutorialId,
                    trimStart: trimRange[0],
                    trimEnd: trimRange[1],
                    overlays: overlays // Send overlay config
                })
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data.success) {
                setStatus("SYNCED");
                setVideoUrl(`${API_BASE}${data.url}`);
                alert("🎉 Video Synced!");
            } else {
                alert("Sync failed: " + data.message);
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Timeline Interaction ---
    const handleTimelineClick = (e) => {
        if (!videoRef.current || !duration) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width);
        const newTime = percent * duration;
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200 overflow-y-auto font-sans">

            {/* 1. Header: Dark & sleek */}
            <header className="bg-[#252526] border-b border-[#3e3e42] px-6 py-3 flex justify-between items-center shadow-md z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.location.href = '/admin'}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3e3e42] hover:bg-[#4e4e52] text-gray-400 hover:text-white transition-colors"
                        title="Back to Admin Console"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                    <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="text-lg font-bold text-gray-100 bg-transparent border-none focus:ring-0 placeholder-gray-500"
                        placeholder="Untitled Project"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Indicators (Clickable Shortcuts) */}
                    <div className="flex bg-[#333333] rounded-md p-1 mr-4 gap-1">
                        <StatusBadge
                            active={hasScreen}
                            label="Screen"
                            icon="📺"
                            onClick={() => !hasScreen && !isRecording && startRecording()}
                        />
                        <StatusBadge
                            active={hasVoice}
                            label="Voice"
                            icon="🎙️"
                            onClick={() => !hasVoice && voiceInputRef.current?.click()}
                        />
                        <StatusBadge
                            active={status === "SYNCED"}
                            label="Synced"
                            icon="✨"
                            onClick={handleSync}
                        />
                    </div>

                    <ActionButton
                        primary
                        onClick={handleSync}
                        disabled={loading} // Only disable if processing
                        loading={loading}
                        label="Export Video"
                    />
                </div>
            </header>

            {/* 2. Main Workspace */}
            <div className="flex-1 flex flex-col md:flex-row overflow-visible">

                {/* Left: Script Panel */}
                <aside className="w-full md:w-80 bg-[#252526] border-r border-[#3e3e42] flex flex-col z-10 shadow-xl min-h-[300px] md:min-h-auto">
                    <div className="p-4 border-b border-[#3e3e42] flex justify-between items-center bg-[#2d2d30]">
                        <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Script / Transcripts</h3>
                        <button
                            onClick={handleGenerateScript}
                            disabled={loading} // Only disable if processing
                            className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/50 px-2 py-1 rounded hover:bg-indigo-500/20 transition-all"
                        >
                            Generate AI
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
                        {scriptLines.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center p-4">
                                <span className="text-2xl mb-2">📝</span>
                                <p className="text-sm">No script yet.</p>
                                <p className="text-xs opacity-60">Record screen first, then generate.</p>
                            </div>
                        )}
                        {scriptLines.map((line) => {
                            const isActive = currentTime >= line.start && currentTime <= line.end;
                            const isEditing = editingLineId === line.id;

                            return (
                                <div
                                    key={line.id}
                                    ref={isActive ? activeLineRef : null}
                                    className={`p-3 rounded-lg border text-sm transition-all duration-300 relative group ${isActive
                                        ? 'bg-indigo-900/30 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] transform scale-[1.02]'
                                        : 'bg-[#1e1e1e] border-[#3e3e42] hover:border-gray-500'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-500 text-white' : 'bg-[#333] text-gray-400'}`}>
                                                {formatTime(line.start)} - {formatTime(line.end)}
                                            </span>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
                                                👤 {line.speaker || 'AI'}
                                            </span>
                                        </div>

                                        {/* Actions: Edit / Delete */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    if (videoRef.current) {
                                                        videoRef.current.currentTime = line.start;
                                                        videoRef.current.play();
                                                        setIsPlaying(true);
                                                    }
                                                }}
                                                className="p-1 hover:bg-green-500/20 rounded text-gray-400 hover:text-green-400"
                                                title="Play Segment"
                                            >
                                                ▶️
                                            </button>
                                            {!isEditing && (
                                                <>
                                                    <button onClick={() => startEditing(line)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Edit">
                                                        ✏️
                                                    </button>
                                                    <button onClick={() => handleDeleteScriptLine(line.id)} className="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400" title="Delete">
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <textarea
                                                className="w-full bg-[#111] text-gray-200 p-2 rounded border border-gray-600 focus:outline-none focus:border-indigo-500 text-xs"
                                                rows={3}
                                                value={editBuffer}
                                                onChange={(e) => setEditBuffer(e.target.value)}
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={cancelEditing} className="text-xs px-2 py-1 text-gray-400 hover:text-white">Cancel</button>
                                                <button onClick={() => saveEditing(line.id)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-300 leading-relaxed font-light">{line.text}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </aside>

                {/* Center: Stage */}
                <main className="flex-1 flex flex-col relative bg-[#1e1e1e] overflow-visible min-h-[500px]">
                    <div className="flex-1 flex items-center justify-center p-2 bg-[#121212]">
                        <div className="relative w-full h-full max-h-full flex items-center justify-center overflow-hidden rounded-md shadow-2xl ring-1 ring-white/10 group">

                            {/* LIVE PREVIEW (Recording) */}
                            <video
                                ref={videoPreviewRef}
                                muted
                                className={`w-full h-full object-cover ${isRecording ? 'block' : 'hidden'}`}
                            />

                            {/* Overlays Layer */}
                            {!isRecording && overlays.map(ov => (
                                <div key={ov.id} className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                                    <img src={ov.url} className="max-w-[50%] max-h-[50%] border-2 border-indigo-500 shadow-xl" alt="Overlay" />
                                </div>
                            ))}

                            {/* PLAYBACK (Edited) */}
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                className={`w-full h-full object-contain ${!isRecording && videoUrl ? 'block' : 'hidden'}`}
                                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                                onEnded={() => setIsPlaying(false)}
                                onClick={togglePlay}
                            />
                            {/* Hidden Audio Player for Preview Sync */}
                            <audio ref={audioRef} src={voiceUrl} />

                            {/* EMPTY STATE */}
                            {!isRecording && !videoUrl && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                    <button
                                        onClick={startRecording}
                                        className="group/btn relative flex flex-col items-center gap-4 transition-all hover:scale-105"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-[#252526] border border-[#3e3e42] flex items-center justify-center group-hover/btn:border-red-500/50 group-hover/btn:shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all">
                                            <div className="w-8 h-8 bg-red-500 rounded-full" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-300 font-medium text-lg">Start Recording</p>
                                            <p className="text-sm text-gray-500">Click to capture screen</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* OVERLAY CONTROLS */}
                            {videoUrl && !isRecording && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 pointer-events-none">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-white/20 transition-all" onClick={togglePlay}>
                                        {isPlaying ? (
                                            <span className="text-3xl">⏸️</span>
                                        ) : (
                                            <span className="text-3xl ml-1">▶️</span>
                                        )}
                                    </div>

                                    {/* NEW: Prominent Upload Button */}
                                    {status === "RECORDED" && (
                                        <button
                                            onClick={handleUpload}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold shadow-lg pointer-events-auto animate-bounce flex items-center gap-2"
                                        >
                                            <span>Upload Screen</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Recording Indicator */}
                            {isRecording && (
                                <div className="absolute top-6 right-6 flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                                    <span className="font-mono font-bold text-white tracking-widest">REC</span>
                                    <button onClick={stopRecording} className="ml-2 bg-white text-black text-xs font-bold px-2 py-1 rounded hover:bg-gray-200">STOP</button>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Toolbar */}
                    <div className="bg-[#252526] border-t border-[#3e3e42] flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10">
                        {/* Tool Specific Controls (Trim Slider) */}
                        {selectedTool === 'TRIM' && duration > 0 && (
                            <div className="h-12 bg-[#1e1e1e] border-b border-[#3e3e42] flex items-center px-6 gap-4 animate-slide-up">
                                <span className="text-xs text-gray-400 font-mono">TRIM START</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    value={trimRange[0]}
                                    onChange={(e) => setTrimRange([parseFloat(e.target.value), trimRange[1]])}
                                    className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <span className="text-xs font-mono text-indigo-400">{formatTime(trimRange[0])}</span>

                                <div className="w-px h-6 bg-gray-700 mx-2" />

                                <span className="text-xs text-gray-400 font-mono">TRIM END</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    value={trimRange[1] || duration}
                                    onChange={(e) => setTrimRange([trimRange[0], parseFloat(e.target.value)])}
                                    className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <span className="text-xs font-mono text-indigo-400">{formatTime(trimRange[1] || duration)}</span>
                            </div>
                        )}

                        <div className="h-16 flex items-center justify-between px-6">

                            {/* Left: Media Controls */}
                            <div className="flex items-center gap-2">
                                <ToolbarBtn
                                    label="Upload Screen"
                                    icon="📤"
                                    onClick={handleUpload}
                                    disabled={!recordedChunks.length}
                                    active={status === "SCREEN_UPLOADED"}
                                />
                            </div>

                            {/* Center: Editing Tools */}
                            <div className="flex items-center gap-1 bg-[#1e1e1e] p-1 rounded-lg border border-[#3e3e42]">
                                <ToolbarBtn
                                    label="Trim Video"
                                    icon="✂️"
                                    onClick={() => {
                                        if (selectedTool !== 'TRIM') {
                                            setTrimRange([0, duration]);
                                            setSelectedTool('TRIM');
                                        } else {
                                            setSelectedTool(null);
                                        }
                                    }}
                                    active={selectedTool === 'TRIM'}
                                    disabled={!videoUrl}
                                />
                                <div className="w-px h-6 bg-gray-700 mx-1" />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <ToolbarBtn
                                    label="Add Image"
                                    icon="🖼️"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!videoUrl}
                                />
                                <ToolbarBtn
                                    label="Add PDF"
                                    icon="📄"
                                    onClick={() => pdfInputRef.current?.click()}
                                    disabled={!videoUrl}
                                />
                                <input
                                    type="file"
                                    ref={pdfInputRef}
                                    className="hidden"
                                    accept="application/pdf"
                                    onChange={handlePdfUpload}
                                />
                            </div>

                            {/* Right: Audio Controls */}
                            <div className="flex items-center gap-2">
                                {/* Hidden Input for Manual Voice */}
                                <input
                                    type="file"
                                    ref={voiceInputRef}
                                    className="hidden"
                                    accept="audio/*"
                                    onChange={handleVoiceUpload}
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (!tutorialId) return alert("Please upload screen recording first.");
                                            voiceInputRef.current?.click();
                                        }}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium rounded border border-blue-600/30 transition-all"
                                    >
                                        <span>🎤 Upload Voice</span>
                                    </button>
                                    <button
                                        onClick={handleAIVoiceGenerate}
                                        disabled={!scriptLines.length || loading}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 text-xs font-medium rounded border border-purple-600/30 transition-all"
                                    >
                                        <span>✨ Generate AI Voice</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* 3. PREMIUM TIMELINE */}
            <footer className="h-32 bg-[#1e1e1e] border-t border-[#3e3e42] flex flex-col select-none transition-all duration-300">
                {/* Time Ruler */}
                <div className="h-8 bg-[#252526] border-b border-[#3e3e42] flex items-center px-4 text-[10px] text-gray-500 font-mono select-none">
                    <span className="w-24 text-right pr-4 text-gray-400">00:00</span>
                    {/* Simplified Ruler Marks */}
                    <div className="flex-1 flex justify-between px-2">
                        {[...Array(10)].map((_, i) => <span key={i}>|</span>)}
                    </div>
                    <span className="w-24 pl-4 text-gray-400">{formatTime(duration)}</span>
                </div>

                {/* Tracks Container */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative" ref={timelineRef} onClick={handleTimelineClick}>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                    >
                        <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-red-500 transform rotate-45" />
                    </div>

                    <div className="px-4 py-4 space-y-3 relative">
                        {/* Track 1: Video */}
                        <div className="flex items-center gap-4 h-12 group">
                            <div className="w-24 flex flex-col items-end justify-center text-xs text-gray-400 font-medium">
                                <span>Video 1</span>
                                <span className="text-[9px] opacity-50">SCREEN</span>
                            </div>
                            <div className="flex-1 bg-[#2d2d30] rounded-md h-full relative overflow-hidden ring-1 ring-white/5 border border-transparent group-hover:border-indigo-500/30 transition-all cursor-pointer">
                                {hasScreen && (
                                    <div className="absolute inset-0 bg-indigo-900/40 w-full flex items-center justify-center">
                                        {/* Simulated content bars */}
                                        <div className="flex gap-1 w-full h-full opacity-30">
                                            {[...Array(20)].map((_, i) => (
                                                <div key={i} className="flex-1 bg-indigo-500/20 m-0.5 rounded-sm" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Track 2: Audio */}
                        <div className="flex items-center gap-4 h-12 group">
                            <div className="w-24 flex flex-col items-end justify-center text-xs text-gray-400 font-medium">
                                <span>Audio 1</span>
                                <span className="text-[9px] opacity-50">VOICE</span>
                            </div>
                            <div className="flex-1 bg-[#2d2d30] rounded-md h-full relative overflow-hidden ring-1 ring-white/5 border border-transparent group-hover:border-purple-500/30 transition-all cursor-pointer">
                                {hasVoice && (
                                    <div className="absolute inset-0 bg-purple-900/40 w-full flex items-center items-end pb-1">
                                        {/* Simulated Waveform */}
                                        <div className="flex items-end gap-[2px] w-full h-2/3 px-1 opacity-60">
                                            {[...Array(100)].map((_, i) => (
                                                <div key={i} className="flex-1 bg-purple-400 rounded-t-sm" style={{ height: `${Math.random() * 100}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// --- Sub-Components ---

const StatusBadge = ({ active, label, icon, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer hover:bg-white/5
        ${active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
    >
        <span>{icon}</span>
        <span>{label}</span>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />}
    </div>
);

const ToolbarBtn = ({ label, icon, onClick, disabled, loading, active }) => (
    <button
        onClick={onClick}
        disabled={loading || disabled} // Only disable if loading
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : ''}
            ${disabled
                ? 'opacity-40 cursor-not-allowed text-gray-500' // Increased visibility
                : !active && 'hover:bg-[#3e3e42] text-gray-300 hover:text-white active:scale-95'
            }`}
    >
        {loading ? <span className="animate-spin">⏳</span> : <span>{icon}</span>}
        <span>{label}</span>
    </button>
);

const ActionButton = ({ onClick, disabled, loading, label }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-2 rounded-lg text-sm font-bold tracking-wide shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    >
        <span className="relative z-10 flex items-center gap-2">
            {loading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : "🚀"}
            {loading ? "Processing..." : label}
        </span>
    </button>
);

export default TutorialGenerator;
