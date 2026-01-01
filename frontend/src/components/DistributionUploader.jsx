// frontend/src/components/DistributionUploader.jsx
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';

export default function DistributionUploader() {
  const [file, setFile] = useState(null);
  const [year, setYear] = useState('');
  const [status, setStatus] = useState(null);

  const auth = getAuth();

  async function handleUpload(e) {
    e.preventDefault();
    setStatus('Uploading...');
    if (!file) { setStatus('Please pick a file'); return; }
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const idToken = await user.getIdToken(/* forceRefresh */ true);
      const form = new FormData();
      form.append('file', file);
      if (year) form.append('year', year);

      const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/admin/upload-distribution`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`
        },
        body: form
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || 'Upload failed');
      setStatus(`Success: ${JSON.stringify(json)}`);
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h3>Upload Distribution (CSV or JSON)</h3>
      <form onSubmit={handleUpload}>
        <div>
          <label>Year (optional if file contains year):</label><br />
          <input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" />
        </div>
        <div style={{ marginTop: 8 }}>
          <input type="file" accept=".csv,.json" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Upload</button>
        </div>
      </form>
      {status && <pre style={{ whiteSpace: 'pre-wrap' }}>{status}</pre>}
    </div>
  );
}
