import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChemistryPyq.css'; // Reuse existing CSS

import { getApiBase } from '../apiConfig';
const ChemistryPyqPdf = () => {
    const navigate = useNavigate();
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                // Fetch from the new PDF endpoint
                const response = await axios.get(`${getApiBase()}/api/chemistry-pyq/pdfs`);
                if (response.data.ok) {
                    setChapters(response.data.chapters);
                } else {
                    setError('Failed to load PDF list');
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

    const handleViewPdf = (url) => {
        // Open PDF in new tab. URL is like /data/quizzes/file.pdf, need full localhost URL
        const fullUrl = `${getApiBase()}${url}`;
        window.open(fullUrl, '_blank');
    };

    if (loading) return <div className="loading-container">Loading PDFs...</div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="chemistry-pyq-container">
            <div className="header-section">
                <h1>Chemistry PYQs (PDF Download)</h1>
                <p>Browse and download clean PDF versions of previous year questions.</p>
            </div>

            <div className="chapters-grid">
                {chapters.map((chapter) => (
                    <div key={chapter.fileName} className="chapter-card">
                        <div className="icon-wrapper">
                            📄
                        </div>
                        {/* Remove .pdf extension for display if present (already handled in backend but good to be safe) */}
                        <h3>{chapter.displayName}</h3>
                        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="start-btn"
                                onClick={() => navigate(`/chemistry-pyq-pdf/test/${chapter.fileName}`)}
                                style={{ flex: 1, backgroundColor: '#3b82f6' }}
                            >
                                Take Test
                            </button>
                            <button
                                className="view-btn"
                                onClick={() => handleViewPdf(chapter.url)}
                                style={{
                                    padding: '10px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                                title="Download PDF"
                            >
                                📄
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChemistryPyqPdf;
