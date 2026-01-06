import React from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';

const TourGuide = ({ run, setRun }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    // Ordered list of steps with route metadata
    const allSteps = [
        {
            target: 'body',
            placement: 'center',
            title: 'Welcome to NEET Rank Predictor! 🎓',
            content: 'Let us take you on a quick tour to help you get the maximum benefit from our tools. It will only take a minute!',
            disableBeacon: true,
            route: '/'
        },
        // Navbar Steps (Desktop Only)
        ...(isDesktop ? [
            {
                target: '#nav-predictor',
                content: 'Here you can predict your NEET 2026 Rank, College chances, and Cutoffs based on your score.',
                route: '/'
            },
            {
                target: '#nav-college-finder',
                content: 'Use the College Finder to search for Government, Private, and Deemed medical colleges by state and quota.',
                route: '/'
            },
            {
                target: '#nav-test-series',
                content: 'Access our high-quality Test Series to practice and improve your score.',
                route: '/'
            },
            {
                target: '#nav-state-data',
                content: 'Explore detailed cutoff and fee data for private medical colleges in various states.',
                route: '/'
            },
            {
                target: '#nav-ask-expert',
                content: 'Stuck or confused? Click here to ask our experts directly for guidance.',
                route: '/'
            },
            {
                target: '#nav-theme-toggle',
                content: 'Customize the look and feel of the site with our Theme Manager.',
                route: '/'
            },
        ] : []),
        // Home Actions
        {
            target: '#hero-predict-btn',
            content: 'Ready to start? Click here to jump straight into the Rank Predictor tool!',
            route: '/'
        },
        // Predictor Page
        {
            target: '#predictor-input-score',
            content: 'Enter your expected NEET score here. Be honest for the best results!',
            route: '/neet-rank-predictor'
        },
        {
            target: '#predictor-btn-submit',
            content: 'Click here to generate your detailed Rank & College report immediately.',
            route: '/neet-rank-predictor'
        },
        // College Finder Page
        {
            target: '#college-finder-form',
            content: 'Looking for specific colleges? Use this form to filter by State, Quota, and Category.',
            route: '/state-quota-college-finder'
        }
    ];

    const handleJoyrideCallback = (data) => {
        const { action, index, status, type, lifecycle } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('hasSeenTour', 'true');
            return;
        }

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
            const nextStep = allSteps[nextStepIndex];

            if (nextStep && nextStep.route && location.pathname !== nextStep.route) {
                navigate(nextStep.route);
                // Need to let the component re-render on the new route
            }
        }
    };

    return (
        <Joyride
            steps={allSteps}
            run={run}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#2563eb',
                    zIndex: 10000,
                },
            }}
            // Important to keep the tour alive during route transitions
            disableCloseOnEsc={true}
            disableOverlayClose={true}
        />
    );
};



export default TourGuide;
