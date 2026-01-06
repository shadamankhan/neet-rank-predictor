import React from 'react';
import LegalLayout from '../components/LegalLayout';

const TermsConditions = () => {
    return (
        <LegalLayout title="Terms & Conditions" lastUpdated="January 1, 2026">
            <p>
                Welcome to My NEET College Predictor. By accessing our website, you agree to be bound by these Terms and Conditions. Please read them carefully.
            </p>

            <h3>1. Use of Service</h3>
            <p>
                Our services are provided for educational and informational purposes only. You must not use our platform for any illegal or unauthorized purpose.
            </p>

            <h3>2. Accuracy of Information</h3>
            <p>
                While we strive to provide accurate and up-to-date information regarding NEET ranks, cutoffs, and college data, we make no warranties or representations about the completeness or accuracy of this data. Official sources (MCC, State Authorities) should always be verified.
            </p>

            <h3>3. User Accounts</h3>
            <p>
                If you create an account, you are responsible for maintaining the security of your account and for all activities that occur under the account.
            </p>

            <h3>4. Limitation of Liability</h3>
            <p>
                My NEET College Predictor shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>

            <h3>5. Changes to Terms</h3>
            <p>
                We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new terms on this site.
            </p>
        </LegalLayout>
    );
};

export default TermsConditions;
