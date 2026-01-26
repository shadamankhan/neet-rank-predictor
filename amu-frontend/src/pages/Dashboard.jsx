import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { getApiBase } from '../apiConfig';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/login');
            } else {
                setUser(currentUser);
                // Stub: In real app, we would fetch tests here
                // fetchTests(); 
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Welcome, {user?.displayName || user?.email?.split('@')[0]} 👋</h2>
                    <p style={{ color: '#666' }}>Complete your AMU preparation journey.</p>
                </div>
                <button className="btn-primary" onClick={() => auth.signOut()}>Logout</button>
            </div>

            <h3 style={{ marginTop: '2rem', color: 'var(--amu-primary)' }}>Recommended Tests</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Placeholder Test Card */}
                <div className="card" style={{ borderLeft: '4px solid var(--amu-primary)' }}>
                    <h4>AMU Science Mock 01</h4>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Physics, Chemistry, Biology</p>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: '#e0f2f1', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--amu-primary)' }}>Moderate</span>
                        <button className="btn-primary" style={{ padding: '0.25rem 1rem', fontSize: '0.9rem' }} onClick={() => navigate('/test/demo')}>Attempt</button>
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--amu-secondary)' }}>
                    <h4>Maths Chapter Test: Polynomials</h4>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Class 10 Syllabus</p>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: '#ffebee', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--amu-secondary)' }}>Hard</span>
                        <button className="btn-primary" style={{ padding: '0.25rem 1rem', fontSize: '0.9rem' }} onClick={() => navigate('/test/demo2')}>Attempt</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
