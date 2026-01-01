import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiBase } from '../apiConfig';
import './ChemistryPyq.css'; // We'll create a basic CSS file for this

const ChemistryPyq = () => {
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const response = await axios.get(`${getApiBase()}/api/chemistry-pyq`);
                if (response.data.ok) {
                    setChapters(response.data.chapters);
                } else {
                    setError('Failed to load chapters');
                }
            } catch (err) {
                console.error(err);
                setError('Error connecting to server');
            } finally {
                setLoading(false);
            }
        };

        fetchChapters();
    }, []);

    const handleStartTest = (fileName) => {
        navigate(`/chemistry-pyq/test/${encodeURIComponent(fileName)}`);
    };

    if (loading) return <div className="loading-container">Loading Chapters...</div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="chemistry-pyq-container">
            <div className="header-section">
                <h1>Chemistry Previous Year Questions (MCQ Test)</h1>
                <p>Select a chapter to practice questions. Use the built-in OMR sheet to mark your answers.</p>
            </div>

            <div className="chapters-grid">
                {chapters.map((chapter) => (
                    <div key={chapter.fileName} className="chapter-card">
                        <div className="icon-wrapper">
                            🧪
                        </div>
                        <h3>{chapter.displayName}</h3>
                        <button
                            className="start-btn"
                            onClick={() => handleStartTest(chapter.fileName)}
                        >
                            Start Test
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChemistryPyq;
