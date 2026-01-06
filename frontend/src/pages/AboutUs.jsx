import React from 'react';
import LegalLayout from '../components/LegalLayout';

const AboutUs = () => {
    return (
        <LegalLayout title="About Us">
            <p>
                Welcome to <strong>My NEET College Predictor</strong>, your trusted companion in the journey towards becoming a medical professional. We specifically designed this platform to help NEET aspirants like you navigate the complex landscape of medical admissions in India.
            </p>

            <h3>Our Mission</h3>
            <p>
                Our mission is to democratize access to accurate counseling data. We believe every student deserves to know their chances of admission honestly and transparently, without falling prey to misinformation or paid agents.
            </p>

            <h3>What We Do</h3>
            <p>
                We analyze years of historical data from MCC (Medical Counselling Committee) and various State Counselling Authorities. Using advanced data analytics, we provide:
            </p>
            <ul>
                <li><strong>Rank Prediction:</strong> Estimating your All India Rank based on your score.</li>
                <li><strong>College Prediction:</strong> Identifying which Government, Private, or Deemed colleges you might get.</li>
                <li><strong>Cutoff Analysis:</strong> Detailed trend analysis of closing ranks for different categories and quotas.</li>
            </ul>

            <h3>Why Trust Us?</h3>
            <p>
                We are a team of data enthusiasts and education counselors committed to student success. Our data is rigorously cleaned and updated to reflect the latest trends for NEET 2026.
            </p>
        </LegalLayout>
    );
};

export default AboutUs;
