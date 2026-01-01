import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

export default function AdminDistributionUploader() {
    // Upload state
    const [file, setFile] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [uploading, setUploading] = useState(false);

    // List/Manage state
    const [distributions, setDistributions] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    const auth = getAuth();

    useEffect(() => {
        loadDistributions();
    }, []);

    const loadDistributions = async () => {
        setLoadingList(true);
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/distributions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.ok) {
                setDistributions(json.years || []);
            }
        } catch (e) {
            console.error("Failed to list distributions", e);
        } finally {
            setLoadingList(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return setStatus({ type: 'error', msg: 'Please select a file' });
        if (!year) return setStatus({ type: 'error', msg: 'Please enter a year' });

        setUploading(true);
        setStatus({ type: 'info', msg: 'Uploading...' });

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");

            const token = await user.getIdToken();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('year', year);
            formData.append('dataset', 'distribution');

            const res = await fetch('/api/admin/upload-distribution', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            setStatus({ type: 'success', msg: `Success! ${data.message}` });
            setFile(null);
            // Reload list 
            loadDistributions();
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: err.message || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (targetYear) => {
        if (!window.confirm(`Are you sure you want to delete the distribution for ${targetYear}?`)) return;

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");
            const token = await user.getIdToken();

            const res = await fetch(`/api/admin/distributions/${targetYear}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Delete failed");

            // refresh list
            loadDistributions();
            alert(`Deleted distribution for ${targetYear}`);
        } catch (e) {
            alert("Delete failed: " + e.message);
        }
    };

    return (
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>

            <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 8 }}>Available Distributions</h3>
                {loadingList ? (
                    <div style={{ color: '#666' }}>Loading...</div>
                ) : distributions.length === 0 ? (
                    <div style={{ color: '#666' }}>No distributions found. Upload one below.</div>
                ) : (
                    <ul style={{ paddingLeft: 20 }}>
                        {distributions.map(y => (
                            <li key={y} style={{ marginBottom: 6 }}>
                                <strong>{y}</strong>
                                <button
                                    onClick={() => handleDelete(y)}
                                    style={{
                                        marginLeft: 12,
                                        padding: '2px 8px',
                                        fontSize: 12,
                                        color: '#c62828',
                                        background: '#ffebee',
                                        border: '1px solid #ffcdd2',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 8 }}>Upload / Modify Distribution</h3>
            <p style={{ fontSize: 13, color: '#666' }}>
                Start a new upload to add a year. <br />
                <strong>To Modify:</strong> Simply upload a new file for an existing year, and it will be overwritten.
            </p>

            <details style={{ marginBottom: 16, fontSize: 13, color: '#555', border: '1px solid #eee', padding: 8, borderRadius: 4 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 500 }}>View File Format Examples</summary>
                <div style={{ marginTop: 8 }}>
                    <strong>Option 1: JSON (Recommended)</strong>
                    <pre style={{ background: '#f5f5f5', padding: 6, borderRadius: 4, margin: '4px 0' }}>
                        {`[
  { "score": 720, "count": 15 },
  { "score": 719, "count": 2 }
]`}
                    </pre>
                    <strong>Option 2: CSV</strong>
                    <pre style={{ background: '#f5f5f5', padding: 6, borderRadius: 4, margin: '4px 0' }}>
                        {`score,count
720,15
719,2
715,10`}
                    </pre>
                </div>
            </details>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Year</label>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        style={{ padding: 8, width: '100px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>File (JSON/CSV)</label>
                    <input
                        type="file"
                        accept=".json,.csv"
                        onChange={handleFileChange}
                        style={{ padding: 6 }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={uploading || !file}
                    style={{
                        padding: '10px',
                        background: uploading ? '#ccc' : '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        textAlign: 'center'
                    }}
                >
                    {uploading ? 'Uploading...' : 'Upload Distribution'}
                </button>
            </form>

            {status.msg && (
                <div style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 4,
                    background: status.type === 'error' ? '#ffebee' : status.type === 'success' ? '#e8f5e9' : '#e3f2fd',
                    color: status.type === 'error' ? '#c62828' : status.type === 'success' ? '#2e7d32' : '#1565c0'
                }}>
                    {status.msg}
                </div>
            )}
        </div>
    );
}
