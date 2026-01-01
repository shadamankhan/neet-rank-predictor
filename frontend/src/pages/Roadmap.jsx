import React, { useState } from 'react';
import './Roadmap.css';
import './StudyPlanner.css';
import { neetSyllabus } from '../data/syllabusData';

const Roadmap = () => {
  const [activeTab, setActiveTab] = useState('journey'); // 'journey' or 'planner'
  const [isParentMode, setIsParentMode] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);

  // Planner State
  const [plannerData, setPlannerData] = useState({ score: '', hours: '6' });
  const [selectedWeakChapters, setSelectedWeakChapters] = useState([]);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const toggleChapter = (chapterId) => {
    if (selectedWeakChapters.includes(chapterId)) {
      setSelectedWeakChapters(selectedWeakChapters.filter(id => id !== chapterId));
    } else {
      setSelectedWeakChapters([...selectedWeakChapters, chapterId]);
    }
  };

  const togglePhase = (index) => {
    if (expandedPhase === index) {
      setExpandedPhase(null);
    } else {
      setExpandedPhase(index);
    }
  };

  const handleGeneratePlan = () => {
    const score = parseInt(plannerData.score) || 0;
    const weeksAvailable = 12; // Assuming ~3 months default view

    let strategyLevel = "Standard";
    if (score < 400) strategyLevel = "Foundation Builder";
    else if (score < 600) strategyLevel = "Score Booster";
    else strategyLevel = "Rank Topper";

    // Generate Weekly Schedule
    const weeks = [];
    const allWeakChapters = [];

    // Flatten weak chapters data for easy access
    Object.keys(neetSyllabus).forEach(subject => {
      ["Class 11", "Class 12"].forEach(cls => {
        neetSyllabus[subject][cls].forEach(ch => {
          if (selectedWeakChapters.includes(ch.id)) {
            allWeakChapters.push({ ...ch, subject });
          }
        });
      });
    });

    // Distribute chapters across weeks
    let currentWeek = 1;
    while (allWeakChapters.length > 0 && currentWeek <= weeksAvailable) {
      const weekTasks = [];
      // Take up to 3 chapters per week for focus
      for (let i = 0; i < 3 && allWeakChapters.length > 0; i++) {
        weekTasks.push(allWeakChapters.shift());
      }
      weeks.push({
        number: currentWeek,
        focus: "Weakness Mastery",
        chapters: weekTasks
      });
      currentWeek++;
    }

    // Fill remaining weeks with standard revision if weak chapters ran out
    if (currentWeek <= weeksAvailable) {
      weeks.push({
        number: currentWeek,
        focus: "Full Syllabus Mock Tests & Analysis",
        chapters: [] // Mocks don't have specific chapters
      });
    }

    setGeneratedPlan({
      level: strategyLevel,
      dailyHours: plannerData.hours,
      schedule: weeks
    });
  };

  const phases = [
    {
      id: 1,
      title: "NEET Application Form",
      time: "Dec – Jan",
      tag: "Phase 1: Foundation",
      studentContent: {
        focus: "Fill NTA NEET UG form correctly. Choose exam city carefully. Upload correct photo/signature.",
        mistakes: ["Wrong category selection", "Blurred photo upload", "Fake certificates (Dangerous)"],
        ourHelp: "Step-by-step form filling guide & Mistake checklist."
      },
      parentContent: {
        focus: "Ensure documents are valid. Double-check category accuracy as it affects cutoff.",
        mistakes: ["Don't delay form filling", "Ensure payment confirmation"],
        ourHelp: "We provide a document checklist to avoid rejection."
      }
    },
    {
      id: 2,
      title: "Admit Card & Exam Day",
      time: "April – May",
      tag: "Phase 2: The Exam",
      studentContent: {
        focus: "Admit card + ID proof. Understanding OMR rules.",
        mistakes: ["Panicking on exam day", "Filling OMR wrong"],
        ourHelp: "Exam-day dos & don'ts video. OMR filling tips."
      },
      parentContent: {
        focus: "Support your child emotionally. Ensure logistics (travel to center) are sorted.",
        mistakes: ["Creating pressure before exam", "Reaching center late"],
        ourHelp: "Parental guidance guide for exam day."
      }
    },
    {
      id: 3,
      title: "Result & Rank Analysis",
      time: "June",
      tag: "Phase 3: Reality Check",
      studentContent: {
        focus: "Check Marks, AIR Rank, Category Rank. Understand what rank is 'safe', 'risky', or 'impossible'.",
        mistakes: ["Assuming marks = admission", "False hope based on previous years' simple marks"],
        ourHelp: "Marks vs Rank explanation. Honest reality check."
      },
      parentContent: {
        focus: "Understand that Rank matters more than Marks. Don't scold for marks, look at the rank.",
        mistakes: ["Comparing with others", "Getting mislead by agents"],
        ourHelp: "Rank meaning simplified for parents."
      }
    },
    {
      id: 4,
      title: "Counselling Registration",
      time: "June – July",
      tag: "Phase 4: Entry Point",
      studentContent: {
        focus: "Register for MCC AIQ (15%) and State Counselling (85%). Decide on Deemed Universities if budget allows.",
        mistakes: ["Missing registration deadline", "Confusing AIQ vs State domicile"],
        ourHelp: "One-page counselling comparison. Registration guide."
      },
      parentContent: {
        focus: "Arrange registration fees. Understand refundable vs non-refundable security deposit.",
        mistakes: ["Not having banking enabled for large transactions"],
        ourHelp: "Fees & refund truth explained."
      }
    },
    // ... (Referencing original content for other phases to save space if needed, but including all for completeness)
    {
      id: 5,
      title: "Choice Filling Strategy",
      time: "July",
      tag: "Phase 5: Critical Step",
      studentContent: {
        focus: "Order: Dream → Possible → Safe. Check fees, bond, and location.",
        mistakes: ["Copying others' choices", "Locking choices too early", "Not checking bond details"],
        ourHelp: "Rank-based choice filling logic. College probability meter."
      },
      parentContent: {
        focus: "Discuss budget (Fees + Hostel). Check bond years (penalty for leaving).",
        mistakes: ["Forcing random colleges", "Ignoring total distinct budget"],
        ourHelp: "Fee comparison slider. Bond explanation."
      }
    },
    {
      id: 6,
      title: "Seat Allotment Result",
      time: "August",
      tag: "Phase 6: Decision",
      studentContent: {
        focus: "Decide: Freeze (Join), Float (Upgrade), or Slide. Know when to exit safely.",
        mistakes: ["Not reporting after allotment", "Holding seat without upgrading correctly"],
        ourHelp: "Freeze/Float/Slide explained simply."
      },
      parentContent: {
        focus: "Be ready for immediate travel for reporting. Have demand drafts/cheques ready.",
        mistakes: ["Delaying decision", "Fear of losing seat"],
        ourHelp: "Real examples with ranks to help decide."
      }
    },
    {
      id: 7,
      title: "College Reporting",
      time: "August - Sept",
      tag: "Phase 7: Admission",
      studentContent: {
        focus: "Carry original ALL documents. Pay tuition + hostel fees. Sign bond.",
        mistakes: ["Missing a single original document", "Not having medical certificate"],
        ourHelp: "State-wise document checklist."
      },
      parentContent: {
        focus: "Accompany student. verify hidden charges. Ensure hostel safety.",
        mistakes: ["Not carrying enough cash/DD", "Ignoring hidden fees"],
        ourHelp: "Hidden charges alert. Reporting timeline."
      }
    },
    {
      id: 8,
      title: "Mop-Up & Final Decision",
      time: "Sept - Oct",
      tag: "Phase 8: Last Options",
      studentContent: {
        focus: "Mop-up is high risk. If no seat: Drop vs Abroad vs Allied courses.",
        mistakes: ["Waiting for stray round with low rank", "Taking bad college in panic"],
        ourHelp: "Drop decision framework. Abroad MBBS truth."
      },
      parentContent: {
        focus: "Financial warning for stray rounds (High fees). Support child's mental health if no seat.",
        mistakes: ["Paying donation to agents (Illegal)", "Blaming the child"],
        ourHelp: "Mental health support message."
      }
    }
  ];

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <h1 className="roadmap-title">NEET Guidance & Roadmap</h1>
        <p className="roadmap-subtitle">
          Master your journey from preparation to admission.
        </p>

        {/* Tabs */}
        <div className="roadmap-tabs">
          <button
            className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
            onClick={() => setActiveTab('journey')}
          >
            📅 Applications & Exam Journey
          </button>
          <button
            className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            🧠 Create Study Plan
          </button>
        </div>
      </div>

      {/* Content: Exam Journey */}
      {activeTab === 'journey' && (
        <>
          <div className="toggle-container" style={{ margin: '0 auto 2rem auto' }}>
            <span
              className={`toggle-label ${!isParentMode ? 'active' : ''}`}
              onClick={() => setIsParentMode(false)}
            >
              Student View
            </span>
            <div
              className={`mode-switch ${isParentMode ? 'parent-mode' : 'student-mode'}`}
              onClick={() => setIsParentMode(!isParentMode)}
            >
              <div className="switch-handle"></div>
            </div>
            <span
              className={`toggle-label ${isParentMode ? 'active' : ''}`}
              onClick={() => setIsParentMode(true)}
            >
              Parent View
            </span>
          </div>

          <div className="roadmap-timeline">
            {phases.map((phase, index) => (
              <div key={phase.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className={`timeline-content ${expandedPhase === index ? 'expanded' : ''}`} onClick={() => togglePhase(index)}>
                  <div className="phase-header">
                    <span className="phase-tag">{phase.tag}</span>
                    <span className="phase-time" style={{ color: '#64748b', fontWeight: 500 }}>{phase.time}</span>
                  </div>

                  <h3 className="phase-title">{phase.title}</h3>
                  {expandedPhase !== index && (
                    <p className="phase-summary">
                      {isParentMode ? phase.parentContent.focus.substring(0, 60) + "..." : phase.studentContent.focus.substring(0, 60) + "..."}
                      <span style={{ fontSize: '0.8rem', color: '#2563eb', marginLeft: '10px' }}>Read More</span>
                    </p>
                  )}

                  {expandedPhase === index && (
                    <div className="phase-details">
                      <div className={`perspective-box ${isParentMode ? 'parent' : 'student'}`}>
                        <div className="perspective-title">
                          {isParentMode ? "👨‍👩‍👦 Parent Focus:" : "🎓 Student Focus:"}
                        </div>
                        <p>{isParentMode ? phase.parentContent.focus : phase.studentContent.focus}</p>
                      </div>
                      {/* Sections for mistakes and help */}
                      <div className="detail-section" style={{ marginTop: '20px' }}>
                        <div className="detail-title">⚠️ Common Mistakes</div>
                        <ul className="detail-list">
                          {(isParentMode ? phase.parentContent.mistakes : phase.studentContent.mistakes).map((mistake, i) => (
                            <li key={i}>{mistake}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="detail-section">
                        <div className="detail-title">🤝 How We Help</div>
                        <p style={{ color: '#475569' }}>{isParentMode ? phase.parentContent.ourHelp : phase.studentContent.ourHelp}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Content: Study Planner */}
      {activeTab === 'planner' && (
        <div className="study-planner-container">
          <div className="planner-card">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 className="text-2xl font-bold text-slate-800">Professional Study Architect</h2>
              <p className="text-slate-500">Select your weak chapters below to build a syllabus-aligned roadmap.</p>
            </div>

            <div className="planner-form-grid">
              <div className="input-group">
                <label>Current/Mock Score</label>
                <input
                  type="number"
                  placeholder="e.g. 450"
                  value={plannerData.score}
                  onChange={(e) => setPlannerData({ ...plannerData, score: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Daily Study Hours</label>
                <select
                  value={plannerData.hours}
                  onChange={(e) => setPlannerData({ ...plannerData, hours: e.target.value })}
                >
                  <option value="4">4-6 Hours</option>
                  <option value="6">6-8 Hours</option>
                  <option value="8">8-10 Hours</option>
                  <option value="12">12+ Hours (Intense)</option>
                </select>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-700 mb-4">Select Weak Areas (Prioritized in Plan)</h3>
            <div className="syllabus-selector-grid">
              {Object.entries(neetSyllabus).map(([subject, classes]) => (
                <div key={subject} className="subject-column">
                  <div className="subject-title">{subject}</div>
                  {Object.entries(classes).map(([cls, chapters]) => (
                    <div key={cls} className="mb-4">
                      <div className="text-xs font-semibold text-slate-500 mb-2 uppercase">{cls}</div>
                      <div className="chapter-checkbox-list">
                        {chapters.map(ch => (
                          <div
                            key={ch.id}
                            className="chapter-item"
                            onClick={() => toggleChapter(ch.id)}
                            data-selected={selectedWeakChapters.includes(ch.id).toString()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedWeakChapters.includes(ch.id)}
                              readOnly
                            />
                            <span className="chapter-label">{ch.name}</span>
                            <span className={`chapter-weight weight-${ch.weight}`}>{ch.weight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button className="generate-btn" onClick={handleGeneratePlan}>
              <span>🚀 Build Professional Plan</span>
            </button>
          </div>

          {generatedPlan && (
            <div className="plan-results">
              <div className="plan-header">
                <div className="text-4xl mb-2">🗓️</div>
                <h3 className="text-3xl font-bold text-slate-800">Your Master Schedule</h3>
                <p className="text-slate-500 mt-2">Strategy: <span className="font-bold text-blue-600">{generatedPlan.level}</span></p>
              </div>

              <div className="timeline-container">
                {generatedPlan.schedule.map((week) => (
                  <div key={week.number} className="week-plan-card">
                    <div className="week-header">
                      <span className="week-number">Week {week.number}</span>
                      <span className="week-focus-tag">
                        {week.focus}
                      </span>
                    </div>
                    <div className="week-body">
                      {week.chapters.length > 0 ? (
                        <div>
                          <div className="class-header">PRIMARY TARGETS</div>
                          <div className="flex flex-wrap">
                            {week.chapters.map(ch => (
                              <span key={ch.id} className="task-tag priority">
                                <b>{ch.subject}:</b> {ch.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-sm italic">
                          Full Syllabus Mock Test + Detailed Analysis of errors for 3 hours.
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-400">
                        * Daily Goal: {generatedPlan.dailyHours} Hours
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Roadmap;
