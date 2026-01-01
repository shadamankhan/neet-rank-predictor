import React, { useState, useRef, useEffect } from 'react';
import './AiTestGen.css';
import { useNavigate } from 'react-router-dom';

const AiTestGen = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hello! I am your NEET Mentor AI. I can help you generate personalized test papers based on your weak areas. Try saying 'I want a difficult Physics test' or 'Generate a full mock test'." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedTest, setGeneratedTest] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: input }]);
        const text = input;
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();

            if (data.ok) {
                setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);

                if (data.action && data.action.type === 'GENERATE_TEST') {
                    await generateTest(data.action.constraints);
                }
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error connecting to the server." }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "Network error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const generateTest = async (constraints) => {
        setMessages(prev => [...prev, { role: 'ai', text: "Generating your test paper... Please wait." }]);
        try {
            const response = await fetch('http://localhost:5000/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(constraints)
            });
            const data = await response.json();

            if (data.ok) {
                setGeneratedTest(data.data);
                setMessages(prev => [...prev, { role: 'ai', text: "Test generated successfully! You can review it on the right." }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "Failed to generate test. Please try again." }]);
            }
        } catch (error) {
            console.error("Gen Error:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "Error generating test." }]);
        }
    };

    const handleSaveTest = async () => {
        if (!generatedTest) return;
        setMessages(prev => [...prev, { role: 'ai', text: "Saving test to your dashboard..." }]);

        try {
            const response = await fetch('/api/ai/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generatedTest)
            });
            const data = await response.json();

            if (data.ok) {
                setMessages(prev => [...prev, { role: 'ai', text: `✅ Test Saved! You can find it in your "Test Series Dashboard" (Drafts) or Admin Panel.` }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "❌ Failed to save test." }]);
            }
        } catch (error) {
            console.error("Save Error:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to server." }]);
        }
    };


    const startTest = () => {
        if (!generatedTest) return;
        // Navigate to a test playing interface, passing the test data
        // For now, we can use local storage or state to pass data to the exam engine
        localStorage.setItem('currentAiTest', JSON.stringify(generatedTest));
        // navigate('/test-engine/ai-mode'); // TODO: Create a route for this, or reuse an existing one
        alert("Starting test functionality to be linked to Exam Engine!");
    };

    return (
        <div className="ai-test-gen-container">
            {/* Left: Chat Interface */}
            <div className="chat-section">
                <div className="chat-header">
                    <span>🤖 NEET Mentor AI</span>
                </div>
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            {msg.text}
                        </div>
                    ))}
                    {loading && <div className="message ai loading-dots">Typing</div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type your request here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn" onClick={handleSend} disabled={loading}>Send</button>
                </div>
            </div>

            {/* Right: Test Preview */}
            <div className="test-preview-section">
                {generatedTest ? (
                    <div className="test-card">
                        <h3>📄 Generated Test Paper</h3>
                        <div className="test-stats">
                            <div className="stat-item">
                                <span className="stat-label">Test ID</span>
                                <span className="stat-value">{generatedTest.test_id}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Physics</span>
                                <span className="stat-value">{generatedTest.sections.Physics?.length || 0} Qs</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Chemistry</span>
                                <span className="stat-value">{generatedTest.sections.Chemistry?.length || 0} Qs</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Biology</span>
                                <span className="stat-value">{generatedTest.sections.Biology?.length || 0} Qs</span>
                            </div>
                        </div>
                        <button className="start-test-btn" onClick={startTest}>🚀 Start Test Now</button>
                        <button className="save-test-btn" onClick={handleSaveTest}>💾 Save to Dashboard</button>
                    </div>
                ) : (
                    <div className="empty-state">
                        <img src="https://cdn-icons-png.flaticon.com/512/7486/7486831.png" alt="AI" width="100" style={{ opacity: 0.5, marginBottom: '20px' }} />
                        <p>Chat with the AI to generate a custom test paper.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiTestGen;
