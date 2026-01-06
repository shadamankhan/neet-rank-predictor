import React, { useState, useEffect } from 'react';
import Joyride, { EVENTS, STATUS } from 'react-joyride';

const AdminTourGuide = ({ run, setRun }) => {
    const steps = [
        {
            target: 'body',
            placement: 'center',
            title: 'Welcome to the Admin Console! 🚀',
            content: 'This is your command center for managing the NEET Rank Predictor platform. Let\'s show you around.',
            disableBeacon: true,
        },
        {
            target: '#nav-item-dashboard',
            content: 'This is your main Dashboard. Get a quick overview of system stats, active users, and recent activities.',
        },
        {
            target: '#nav-item-test-series',
            content: 'Manage the Test Series here. Create new tests, organize subjects, and schedule exams for students.',
        },
        {
            target: '#nav-item-question-bank',
            content: 'The heart of your content. Upload questions, manage the database, and organize them by chapters and difficulty.',
        },
        {
            target: '#nav-item-students',
            content: 'View and manage student profiles, track their performance, and handle account-related actions.',
        },
        {
            target: '#nav-item-user-queries',
            content: 'Respond to student queries and support tickets directly from here.',
        },
        {
            target: '#nav-item-ai-test-generator',
            content: 'Use our AI capabilities to automatically generate balanced test papers from the Question Bank.',
        },
        {
            target: '#admin-user-profile',
            content: 'View your profile details here. Remember to sign out when you are done accessing the console.',
        },
        {
            target: '#btn-start-tour',
            content: 'Need a refresher? improved Click this button anytime to take this tour again!',
        }
    ];

    const handleJoyrideCallback = (data) => {
        const { status, type } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            scrollToFirstStep={true}
            showStepsProgress={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#2563eb', // Blue-600 to match theme
                    zIndex: 10000,
                    arrowColor: '#fff',
                    backgroundColor: '#fff',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    textColor: '#333',
                    width: 400,
                },
                tooltip: {
                    fontSize: '14px',
                    borderRadius: '8px',
                },
                buttonNext: {
                    backgroundColor: '#2563eb',
                },
                buttonBack: {
                    color: '#6b7280',
                    marginRight: 10,
                }
            }}
            locale={{
                last: 'Finish',
                skip: 'Skip',
            }}
        />
    );
};

export default AdminTourGuide;
