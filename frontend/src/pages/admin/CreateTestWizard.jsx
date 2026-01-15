import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth'; // Ensure you have this import
import axios from 'axios'; // Or use your api instance
import QuestionBrowser from '../../components/admin/QuestionBrowser';
import SmartGeneratorModal from '../../components/admin/SmartGeneratorModal';
import { COACHING_PRESETS } from '../../data/CoachingPresets';
import { getApiBase } from '../../apiConfig';

// Helper to get token (if api.js doesn't handle it for this specific route, or strictly using axios)
const getAuthToken = async () => {
    const auth = getAuth();
    if (auth.currentUser) return await auth.currentUser.getIdToken();
    return null;
};


// Helper to safely render option content
const renderOptionText = (text) => {
    if (typeof text === 'string' || typeof text === 'number') return text;
    return "Complex Content"; // Fallback for other types
};

export default function CreateTestWizard() {
    const navigate = useNavigate();
    const { testId } = useParams();
    const isEditMode = !!testId;

    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        type: 'free', // mock, chapter, previous_year
        duration: 180, // minutes
        totalMarks: 720,
        startDate: '',
        endDate: '',
        instructions: '',
        price: 0,
        isPremium: false,
        status: 'Draft',
        questions: [] // Array of selected question objects
    });
    const [showBrowser, setShowBrowser] = useState(false);
    const [showSmartGen, setShowSmartGen] = useState(false);

    // Manual Question State
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualQ, setManualQ] = useState({
        question: '',
        options: ['', '', '', ''],
        answer: 0,
        explanation: '',
        subject: 'Physics'
    });

    // Coaching Preset State
    const [selectedPreset, setSelectedPreset] = useState(null);

    const handlePresetSelect = (presetId) => {
        if (!presetId) {
            setSelectedPreset(null);
            return;
        }
        const preset = COACHING_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setSelectedPreset(preset);
            // Auto-fill form data
            setFormData(prev => ({
                ...prev,
                title: preset.title + " (Coaching Style)",
                type: 'chapter',
                instructions: `• COACHING STYLE TEST BLOCK\n• Focus: ${preset.description}\n• Questions selected logically for concept linking.\n• Standard NEET marking (+4/-1).`,
                duration: 60, // Default 1 hour for block tests
            }));

            // Auto-fill title config basics
            setTitleConfig(prev => ({
                ...prev,
                subject: preset.subject,
                topic: preset.searchTags.join(', '), // Just for display
                typeLabel: 'Chapter Test'
            }));
        }
    };

    // Auto-calculate marks based on question count
    useEffect(() => {
        setFormData(prev => {
            const calculatedMarks = prev.questions.length * 4;
            // Only update if different to avoid potential loops or unnecessary renders
            if (prev.totalMarks !== calculatedMarks && prev.questions.length > 0) {
                return { ...prev, totalMarks: calculatedMarks };
            }
            return prev;
        });
    }, [formData.questions.length]);

    useEffect(() => {
        if (isEditMode) {
            fetchTestDetails();
        }
    }, [testId]);

    const fetchTestDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${getApiBase()}/api/test-series/${testId}`);
            if (res.data.ok) {
                const test = res.data.test;
                setFormData({
                    title: test.title,
                    type: test.type,
                    duration: test.duration,
                    totalMarks: test.totalMarks,
                    startDate: test.startDate || '',
                    endDate: test.endDate || '',
                    instructions: test.instructions || '',
                    price: test.price || 0,
                    isPremium: test.isPremium || false,
                    status: test.status || 'Draft',
                    questions: test.questions || []
                });
            } else {
                alert('Failed to load test details');
                navigate('/admin/tests');
            }
        } catch (err) {
            console.error(err);
            alert('Error loading test');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Test Details' },
        { number: 2, title: 'Configuration' },
        { number: 3, title: 'Questions' },
        { number: 4, title: 'Review' }
    ];

    const handleNext = () => {
        // Validation for Step 1
        if (currentStep === 1) {
            const isTopicRequired = ['Chapter Test', 'NCERT Line by Line', 'PYQ Test'].includes(titleConfig.typeLabel);
            if (isTopicRequired && !titleConfig.topic && titleConfig.subject !== 'Full') {
                alert("Topic is required for Chapter/NCERT tests! Please select or type a topic.");
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleAddQuestions = (newQuestions, sourceChapters = []) => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, ...newQuestions],
            totalMarks: (prev.questions.length + newQuestions.length) * 4
        }));

        // Auto-fill Topic if it's a Chapter Test or similar, and we have source info
        if (sourceChapters.length > 0) {
            setTitleConfig(prev => {
                const currentTopics = prev.topic ? prev.topic.split(', ').map(t => t.trim()) : [];
                const newTopics = sourceChapters.filter(c => !currentTopics.includes(c)); // Avoid duplicates

                if (newTopics.length > 0) {
                    const updatedTopic = currentTopics.concat(newTopics).join(', ');
                    return { ...prev, topic: updatedTopic };
                }
                return prev;
            });
        }

        setShowBrowser(false);
    };

    const removeQuestion = (index) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
            totalMarks: (prev.questions.length - 1) * 4
        }));
    };

    const saveManualQuestion = () => {
        if (!manualQ.question || manualQ.options.some(o => !o)) {
            alert('Please fill all fields');
            return;
        }

        const newQuestion = {
            id: Date.now(), // Temp ID
            question: manualQ.question,
            options: manualQ.options,
            answer: manualQ.answer,
            explanation: manualQ.explanation,
            subject: manualQ.subject
        };

        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion],
            totalMarks: (prev.questions.length + 1) * 4
        }));
        setShowManualEntry(false);
        setManualQ({
            question: '',
            options: ['', '', '', ''],
            answer: 0,
            explanation: '',
            subject: 'Physics'
        });
    };

    const handlePublish = async () => {
        setSubmitting(true);
        try {
            const token = await getAuthToken();
            let res;

            if (isEditMode) {
                res = await axios.put(`${getApiBase()}/api/test-series/${testId}`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                res = await axios.post(`${getApiBase()}/api/test-series`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (res.data.ok) {
                alert(isEditMode ? 'Test updated successfully!' : 'Test created successfully!');
                navigate('/admin/tests');
            } else {
                alert('Failed to save test: ' + res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error saving test. Check console for details.');
        } finally {
            setSubmitting(false);
        }
    };

    const SUBJECT_TOPICS = {
        'Physics': [
            'Electrostatics', 'Current Electricity', 'Kinematics', 'Laws of Motion',
            'Work, Energy & Power', 'Modern Physics', 'Semiconductors'
        ],
        'Chemistry (Physical)': [
            'Thermodynamics', 'Chemical Kinetics', 'Electrochemistry', 'Equilibrium', 'Solutions'
        ],
        'Chemistry (Organic)': [
            'Hydrocarbons', 'Alcohols, Phenols & Ethers', 'Aldehydes & Ketones', 'Amines', 'Haloalkanes & Haloarenes'
        ],
        'Chemistry (Inorganic)': [
            'Periodic Table', 'Chemical Bonding', 'Coordination Compounds', 'd & f Block Elements', 'p Block Elements'
        ],
        'Botany': [
            'Living World', 'Biological Classification', 'Plant Kingdom', 'Morphology of Flowering Plants',
            'Anatomy of Flowering Plants', 'Photosynthesis', 'Respiration in Plants'
        ],
        'Zoology': [
            'Animal Kingdom', 'Structural Organisation in Animals', 'Human Physiology', 'Biomolecules',
            'Neural Control & Coordination', 'Reproductive Health'
        ]
    };

    const [titleConfig, setTitleConfig] = useState({
        exam: 'NEET 2026',
        subject: 'Physics',
        topic: '',
        typeLabel: 'Full Syllabus Mock Test',
        number: '01'
    });

    // Auto-generate Title
    useEffect(() => {
        if (!isEditMode && !selectedPreset) { // Only auto-generate for new tests and if NO PRESET is selected
            const { exam, subject, topic, typeLabel, number } = titleConfig;
            let parts = [exam];

            if (subject !== 'Full') parts.push(subject);
            if (topic) parts.push(topic);

            parts.push(typeLabel);
            parts.push(number);

            const autoTitle = parts.join(' – ');
            setFormData(prev => ({ ...prev, title: autoTitle }));
        }
    }, [titleConfig, isEditMode, selectedPreset]);

    const INSTRUCTION_TEMPLATES = {
        'full_mock': `• This is a NEET 2026 Full Syllabus Mock Test based on latest NCERT.\n• Total Questions: 180 | Total Marks: 720\n• Time Duration: 3 Hours\n• Negative marking is applicable as per NEET pattern.\n• Each correct answer carries +4 marks.\n• Each incorrect answer carries -1 mark.\n• No marks will be deducted for unattempted questions.\n• Calculator, mobile phone, or any external aid is not allowed.\n• Attempt the test in one sitting for best performance analysis.`,
        'chapter': `• This is a Chapter-wise Test strictly based on NCERT.\n• Questions are selected as per NEET examination pattern.\n• Focus on accuracy rather than speed.\n• Negative marking is applicable.\n• Ideal for concept strengthening and revision.`,
        'ncert_line': `• This test is strictly based on NCERT line-by-line concepts.\n• Questions include direct statements, factual traps, and NCERT-based assertions.\n• Recommended to attempt after reading NCERT thoroughly.\n• High scoring but concept-sensitive test.`,
        'free': `• This is a FREE test provided for practice and self-evaluation.\n• Level: NEET standard\n• Attempt this test seriously to understand your current preparation level.\n• Performance analytics will be available after submission.`
    };

    const applyTemplate = (key) => {
        if (INSTRUCTION_TEMPLATES[key]) {
            setFormData(prev => ({ ...prev, instructions: INSTRUCTION_TEMPLATES[key] }));
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Test' : 'Create New Test'}</h1>
                    <p className="text-gray-500">Follow the steps to {isEditMode ? 'update' : 'configure'} and publish a new test.</p>
                </div>
                <button onClick={() => navigate('/admin/tests')} className="text-gray-500 hover:text-gray-700 font-medium">
                    Cancel
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                    {steps.map((step) => (
                        <div key={step.number} className="flex flex-col items-center bg-gray-50 px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= step.number ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'
                                }`}>
                                {step.number}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${currentStep >= step.number ? 'text-blue-700' : 'text-gray-400'}`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Basic Information</h2>

                        {/* 0. Coaching Preset Selector (NEW) */}
                        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 mb-4">
                            <label className="block text-sm font-bold text-purple-800 mb-2">🎓 Coaching Style Presets (Recommended)</label>
                            <p className="text-xs text-purple-600 mb-3">Select a pre-configured block of chapters exactly like big coaching institutes.</p>
                            <select
                                className="w-full p-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                                onChange={(e) => handlePresetSelect(e.target.value)}
                            >
                                <option value="">-- Select a Logical Chapter Block --</option>
                                <optgroup label="Class 11 Biology">
                                    {COACHING_PRESETS.filter(p => p.id.includes('c11-bio')).map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Class 11 Physics">
                                    {COACHING_PRESETS.filter(p => p.id.includes('c11-phy')).map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Class 11 Chemistry">
                                    {COACHING_PRESETS.filter(p => p.id.includes('c11-chem')).map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Class 12 Biology">
                                    {COACHING_PRESETS.filter(p => p.id.includes('c12-bio')).map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Class 12 Physics">
                                    {COACHING_PRESETS.filter(p => p.id.includes('c12-phy')).map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Class 12 Chemistry">
                                    {COACHING_PRESETS.filter(p => p.id.includes('c12-chem')).map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* 1. Smart Title Generator */}
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                            <label className="block text-sm font-bold text-blue-800 mb-3">🛠️ Smart Title Builder</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="col-span-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Exam</label>
                                    <select
                                        className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
                                        value={titleConfig.exam}
                                        onChange={e => setTitleConfig({ ...titleConfig, exam: e.target.value })}
                                    >
                                        <option>NEET 2026</option>
                                        <option>NEET 2027</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Subject</label>
                                    <select
                                        className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
                                        value={titleConfig.subject}
                                        onChange={e => setTitleConfig({ ...titleConfig, subject: e.target.value })}
                                    >
                                        <option value="Full">Full Syllabus (All)</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry (Physical)">Chemistry (Physical)</option>
                                        <option value="Chemistry (Organic)">Chemistry (Organic)</option>
                                        <option value="Chemistry (Inorganic)">Chemistry (Inorganic)</option>
                                        <option value="Botany">Botany</option>
                                        <option value="Zoology">Zoology</option>
                                    </select>
                                </div>
                                <div className="col-span-1 md:col-span-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Test Type</label>
                                    <select
                                        className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
                                        value={titleConfig.typeLabel}
                                        onChange={e => setTitleConfig({ ...titleConfig, typeLabel: e.target.value })}
                                    >
                                        <option>Full Syllabus Mock Test</option>
                                        <option>Chapter Test</option>
                                        <option>NCERT Line by Line</option>
                                        <option>PYQ Test</option>
                                        <option>Part Syllabus Test</option>
                                    </select>
                                </div>
                                <div className="col-span-1 md:col-span-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Test No</label>
                                    <select
                                        className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
                                        value={titleConfig.number}
                                        onChange={e => setTitleConfig({ ...titleConfig, number: e.target.value })}
                                    >
                                        {[...Array(50)].map((_, i) => (
                                            <option key={i} value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Topic Input with Datalist */}
                                <div className="col-span-2 md:col-span-1 relative">
                                    <label className="text-xs font-semibold text-gray-500 uppercase flex justify-between">
                                        Topic
                                        {['Chapter Test', 'NCERT Line by Line', 'PYQ Test'].includes(titleConfig.typeLabel) && titleConfig.subject !== 'Full' && (
                                            <span className="text-red-500 text-[10px]">*REQ</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        list="topic-suggestions"
                                        className={`w-full text-sm p-2 border rounded-lg focus:ring-blue-500 ${titleConfig.typeLabel === 'Full Syllabus Mock Test' || titleConfig.subject === 'Full' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                                        placeholder={titleConfig.subject === 'Full' ? 'N/A' : "Type or Select Topic"}
                                        value={titleConfig.topic}
                                        disabled={titleConfig.typeLabel === 'Full Syllabus Mock Test' || titleConfig.subject === 'Full'}
                                        onChange={e => setTitleConfig({ ...titleConfig, topic: e.target.value })}
                                    />
                                    <datalist id="topic-suggestions">
                                        {SUBJECT_TOPICS[titleConfig.subject]?.map((topic, i) => (
                                            <option key={i} value={topic} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* Title Preview/Edit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Generated Title <span className="text-gray-400 text-xs">(Auto-filled)</span></label>
                            <input
                                type="text"
                                className="w-full p-2.5 border border-gray-300 bg-gray-50 font-semibold text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Generated Title will appear here..."
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System Test Type (Logic)</label>
                                <select
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="free">Free Test</option>
                                    <option value="chapter">Chapter Wise Test</option>
                                    <option value="part">Part Syllabus Test</option>
                                    <option value="mock">Full Mock Test</option>
                                    <option value="pyq">PYQ + Trend Analysis</option>
                                </select>
                            </div>
                        </div>

                        {/* Instruction Template */}
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-sm font-medium text-gray-700">Instructions</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-600 font-bold uppercase">Load Template:</span>
                                    <button onClick={() => applyTemplate('full_mock')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border">Full Mock</button>
                                    <button onClick={() => applyTemplate('chapter')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border">Chapter</button>
                                    <button onClick={() => applyTemplate('ncert_line')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border">NCERT</button>
                                    <button onClick={() => applyTemplate('free')} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded border border-green-200">Free Test</button>
                                </div>
                            </div>
                            <textarea
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                rows="8"
                                placeholder="Enter instructions manually or select a template above..."
                                value={formData.instructions}
                                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                            ></textarea>
                            <p className="text-xs text-gray-400 mt-1 text-right">You can edit the text after loading a template.</p>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Test Configuration</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.totalMarks}
                                    onChange={e => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0 for Free"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPremium}
                                        onChange={e => setFormData({ ...formData, isPremium: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900 font-medium">Is Premium / Paid Test?</span>
                                </label>
                            </div>
                        </div>


                        {/* Status Toggle */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Test Status</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="Draft"
                                        checked={formData.status === 'Draft'}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-gray-700">Draft (Hidden)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="Live"
                                        checked={formData.status === 'Live'}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-gray-700">Live (Visible)</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <p className="text-sm text-blue-800">Advanced marking schemes (+4/-1) are automatically applied based on test type.</p>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-800">Selected Questions</h3>
                                <p className="text-sm text-gray-500">{formData.questions.length} questions added</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowManualEntry(true)}
                                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    Manual Entry
                                </button>
                                <button
                                    onClick={() => setShowBrowser(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    Browse Bank
                                </button>
                                <button
                                    onClick={() => setShowSmartGen(true)}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-purple-200"
                                >
                                    <span>⚡</span> Quick Generate
                                </button>
                            </div>
                        </div>

                        {formData.questions.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-gray-400">No questions added yet. Click "Add Questions" to browse the bank.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.questions.map((q, idx) => (
                                    <div key={idx} className="bg-white border border-gray-200 p-4 rounded-lg flex gap-4 group hover:border-blue-300 transition">
                                        <div className="flex flex-col gap-1">
                                            <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded h-fit w-fit">Q{idx + 1}</div>
                                            {q.subject && (
                                                <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase w-fit ${q.subject === 'Physics' ? 'bg-purple-100 text-purple-700' :
                                                    q.subject === 'Chemistry' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {q.subject.substring(0, 3)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-800 font-medium line-clamp-2">{q.question}</p>
                                            <div className="flex gap-2 mt-2">
                                                {q.options?.map((opt, oIdx) => {
                                                    const optText = (typeof opt === 'object' && opt.text) ? opt.text : opt;
                                                    return (
                                                        <span key={oIdx} className={`text-xs px-2 py-0.5 rounded border ${q.answer === oIdx ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                            {renderOptionText(optText)}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeQuestion(idx)}
                                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition p-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Review & Publish</h2>
                        <div className="bg-gray-50 p-6 rounded-xl space-y-3">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Title</span>
                                <span className="font-bold text-gray-900">{formData.title || 'Untitled Test'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Type</span>
                                <span className="font-medium text-gray-900 capitalize">{formData.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Duration</span>
                                <span className="font-medium text-gray-900">{formData.duration} mins</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer / Actions */}
            <div className="mt-8 flex justify-between">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`px-6 py-2.5 rounded-lg font-medium transition ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                    Previous
                </button>

                {currentStep < 4 ? (
                    <button
                        onClick={handleNext}
                        className="px-6 py-2.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
                    >
                        Next Step
                    </button>
                ) : (
                    <button
                        onClick={handlePublish}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 shadow-sm transition flex items-center gap-2"
                    >
                        {submitting ? 'Publishing...' : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {isEditMode ? 'Update Test' : 'Publish Test'}
                            </>
                        )}
                    </button>
                )}

            </div>
            {/* Modal for Question Browser */}
            {
                showBrowser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800">Select Questions from Bank</h3>
                                <button onClick={() => setShowBrowser(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden p-4 bg-gray-50">
                                <QuestionBrowser
                                    mode="select"
                                    onAddQuestions={handleAddQuestions}
                                    preSelectedSubject={titleConfig.subject}
                                    preSelectedChapters={selectedPreset ? selectedPreset.searchTags : []}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal for Manual Question Entry */}
            {
                showManualEntry && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col animate-scale-up max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <h3 className="font-bold text-lg text-gray-800">Add Manual Question</h3>
                                <button onClick={() => setShowManualEntry(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        rows="3"
                                        placeholder="Type your question here..."
                                        value={manualQ.question}
                                        onChange={e => setManualQ({ ...manualQ, question: e.target.value })}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={manualQ.subject}
                                        onChange={e => setManualQ({ ...manualQ, subject: e.target.value })}
                                    >
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Botany">Botany</option>
                                        <option value="Zoology">Zoology</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">Options</label>
                                    {manualQ.options.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={manualQ.answer === idx}
                                                onChange={() => setManualQ({ ...manualQ, answer: idx })}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                className={`flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${manualQ.answer === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                                                placeholder={`Option ${idx + 1}`}
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...manualQ.options];
                                                    newOpts[idx] = e.target.value;
                                                    setManualQ({ ...manualQ, options: newOpts });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        rows="2"
                                        placeholder="Explain the answer..."
                                        value={manualQ.explanation}
                                        onChange={e => setManualQ({ ...manualQ, explanation: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowManualEntry(false)}
                                        className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveManualQuestion}
                                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm"
                                    >
                                        Add Question
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <SmartGeneratorModal
                isOpen={showSmartGen}
                onClose={() => setShowSmartGen(false)}
                onGenerate={handleAddQuestions}
            />
        </div>
    );
}
