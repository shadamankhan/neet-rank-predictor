import React from 'react';
import LegalLayout from '../components/LegalLayout';

const ContactUs = () => {
    return (
        <LegalLayout title="Contact Us">
            <p>
                Have questions about the rank predictor? Need help understanding the counselling process? We're here to help!
            </p>

            <div style={{ marginTop: '30px', padding: '20px', background: '#f0f4ff', borderRadius: '8px' }}>
                <h3>Get in Touch</h3>
                <p><strong>Email:</strong> support@myneetpredictor.com (Example)</p>
                <p><strong>Available Hours:</strong> Monday - Saturday, 10:00 AM - 6:00 PM (IST)</p>
            </div>

            <h3 style={{ marginTop: '40px' }}>Frequently Asked Questions</h3>
            <p>
                <strong>Q: Is the prediction 100% accurate?</strong><br />
                A: Predictions are based on historical trends. While we strive for accuracy, actual cutoffs vary each year depending on paper difficulty and the number of applicants.
            </p>
            <p>
                <strong>Q: Do you offer paid counselling?</strong><br />
                A: Currently, our platform is focused on providing data-driven tools. We do not offer paid agent services.
            </p>
        </LegalLayout>
    );
};

export default ContactUs;
