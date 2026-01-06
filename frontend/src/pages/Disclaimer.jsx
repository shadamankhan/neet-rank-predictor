import React from 'react';
import LegalLayout from '../components/LegalLayout';

const Disclaimer = () => {
    return (
        <LegalLayout title="Disclaimer" lastUpdated="January 1, 2026">
            <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', borderRadius: '8px', marginBottom: '30px' }}>
                <strong>Important Notice:</strong> This platform is a predictive analysis tool and is NOT an official counselling website.
            </div>

            <h3>1. Predictive Nature</h3>
            <p>
                The rank, college, and cutoff predictions provided on this website are based on historical data algorithms. They are estimates intended to help students plan their counselling strategy. <strong>They are NOT guarantees of admission.</strong>
            </p>

            <h3>2. Official Data Sources</h3>
            <p>
                Final admission logic is determined solely by the Medical Counselling Committee (MCC), DGHS, and respective State Counselling Authorities. Factors such as new seat additions, reservation rule changes, and the number of applicants can significantly alter actual results compared to predictions.
            </p>

            <h3>3. User Responsibility</h3>
            <p>
                Users are advised to cross-verify all information with official information brochures and notifications released by the counselling authorities. My NEET College Predictor is not responsible for any decision made by the user based solely on these predictions.
            </p>

            <h3>4. No Legal Advice</h3>
            <p>
                The information provided here does not constitute legal or professional career counseling advice.
            </p>
        </LegalLayout>
    );
};

export default Disclaimer;
