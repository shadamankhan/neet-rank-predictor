import React from 'react';
import LegalLayout from '../components/LegalLayout';

const PrivacyPolicy = () => {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="January 1, 2026">
            <p>
                Your privacy is important to us. It is My NEET College Predictor's policy to respect your privacy regarding any information we may collect from you across our website.
            </p>

            <h3>1. Information We Collect</h3>
            <p>
                We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
                <ul>
                    <li><strong>NEET Score data:</strong> Used solely to generate predictions.</li>
                    <li><strong>Email address:</strong> Used for authentication and account management.</li>
                </ul>
            </p>

            <h3>2. How We Use Information</h3>
            <p>
                We use the collected information to:
                <ul>
                    <li>Provide rank and college prediction services.</li>
                    <li>Improve user experience and website performance.</li>
                    <li>Communicate with you regarding updates or support.</li>
                </ul>
            </p>

            <h3>3. Data Security</h3>
            <p>
                We protect your data within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.
            </p>

            <h3>4. Third-Party Links</h3>
            <p>
                Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites.
            </p>
        </LegalLayout>
    );
};

export default PrivacyPolicy;
