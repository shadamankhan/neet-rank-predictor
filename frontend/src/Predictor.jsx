import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { predictServer, savePrediction, searchColleges, fetchCollegeStats } from "./api";
import { auth } from "./firebase";
import { useAuth } from "./useAuth";
import PredictionHistory from "./components/PredictionHistory";
import ProbabilityMeter from "./components/ProbabilityMeter";
import RankTrendChart from "./components/RankTrendChart";
import FeeSlider from "./components/FeeSlider";
import SEO from "./components/SEO";

// Styles for Glassmorphism and Animations
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '"Inter", sans-serif',
    color: '#333',
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '40px',
    color: 'white',
    textAlign: 'center',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(118, 75, 162, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  },
  inputGroup: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    padding: '20px',
    borderRadius: '15px',
    display: 'inline-flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '20px',
    border: '1px solid rgba(255,255,255,0.3)',
    position: 'relative',
    zIndex: 10
  },
  input: {
    padding: '12px 20px',
    borderRadius: '30px',
    border: '2px solid transparent',
    fontSize: '20px',
    width: '140px',
    textAlign: 'center',
    outline: 'none',
    fontWeight: 'bold',
    color: '#333',
    background: 'white',
    cursor: 'text',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  inputFocus: {
    border: '2px solid #764ba2'
  },
  button: {
    padding: '12px 30px',
    borderRadius: '30px',
    border: 'none',
    background: '#fff',
    color: '#764ba2',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  resultCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
    marginBottom: '30px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    alignItems: 'start'
  },
  statBox: {
    textAlign: 'center',
    padding: '20px',
    borderRadius: '15px',
    background: '#f8f9fa',
    border: '1px solid #eee'
  },
  rankDisplay: {
    fontSize: '3rem',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '10px 0'
  },
  collegeList: {
    marginTop: '20px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  collegeItem: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

export default function Predictor() {
  const { user } = useAuth();
  const location = useLocation();
  const [score, setScore] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);

  // Initialize from location state if available only once
  useEffect(() => {
    if (location.state && location.state.score) {
      const passedScore = location.state.score;
      setScore(passedScore);
      // Automatically trigger prediction with the passed score
      handlePredict(passedScore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFeeChange = React.useCallback((maxFee) => {
    if (collegeOptions.length > 0) {
      setFilteredColleges(collegeOptions.filter(c => (c.fee || 0) <= maxFee));
    }
  }, [collegeOptions]);

  async function handlePredict(scoreOverride) {
    // Check if scoreOverride is a valid number/string (and not an Event object from onClick)
    const isOverride = scoreOverride && (typeof scoreOverride === 'string' || typeof scoreOverride === 'number');
    const currentScore = isOverride ? scoreOverride : score;

    if (!currentScore || currentScore > 720 || currentScore < 0) return alert("Please enter a valid score (0-720)");
    setLoading(true);
    try {
      const res = await predictServer({ score: currentScore, year: 2026 }); // Explicitly pass 2026
      setResult(res);

      if (res.predictedRank) {
        // Save to history if user is logged in
        if (user) {
          user.getIdToken().then(token => {
            savePrediction({
              score: currentScore,
              rank: res.predictedRank,
              type: 'prediction'
            }, token).catch(e => console.error("Save history failed", e));
          });
        }

        if (typeof searchColleges === 'function') {
          // Use 'GN' to match backend default
          try {
            const cRes = await searchColleges({ rank: res.predictedRank, category: 'GN' });
            if (cRes && cRes.ok) {
              setCollegeOptions(cRes.results);
              setFilteredColleges(cRes.results.filter(c => (c.fee || 0) <= 1500000));
            }
          } catch (err) {
            console.error("College fetch failed", err);
          }
        } else {
          console.warn("searchColleges API is not available");
        }
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <SEO
        title="NEET Rank Predictor 2026 - AI Analysis"
        description="Enter your expected score and determine your NEET 2026 Rank instantly. Get detailed college predictions based on your performance."
      />

      {/* Hero Section */}
      <div style={styles.hero}>
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>NEET 2026 Rank Predictor</h1>
        <p style={{ opacity: 0.9, marginTop: '10px' }}>
          Get the most accurate rank estimate for NEET 2026 based on historical trends.
        </p>

        <div style={styles.inputGroup}>
          <input
            type="number"
            style={styles.input}
            placeholder="Score"
            value={score}
            onChange={e => setScore(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePredict()}
          />
          <button
            style={{ ...styles.button, transform: loading ? 'scale(0.95)' : 'scale(1)' }}
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Predict 2026 Rank"}
          </button>
        </div>
      </div>

      {result && (
        <div style={styles.resultCard}>

          {/* Left: Main Prediction */}
          <div>
            <div style={styles.statBox}>
              <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '5px' }}>Predicted Rank (2026 Estimate)</div>
              <div style={styles.rankDisplay}>
                {result.rankDisplay || result.predictedRank}
              </div>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                Score: <strong>{result.score}</strong>
              </p>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>What this means?</h4>
              <div style={{ lineHeight: '1.6', color: '#555' }}>

                <div style={{ background: '#f0f4ff', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
                  {result.predictedRank < 25000 && (
                    <span>
                      <strong>Excellent Chance:</strong> You are in a safe zone for Government MBBS seats through both All India (15%) and State Quotas (85%).
                    </span>
                  )}
                  {result.predictedRank >= 25000 && result.predictedRank < 60000 && (
                    <span>
                      <strong>Borderline Zone:</strong> Govt seats are possible in low-cutoff states or specific categories. You have strong options in top Private/Deemed colleges.
                    </span>
                  )}
                  {result.predictedRank >= 60000 && result.predictedRank < 150000 && (
                    <span>
                      <strong>Private/Deemed Zone:</strong> Govt MBBS is unlikely. You should focus on good Private Medical Colleges or Deemed Universities.
                    </span>
                  )}
                  {result.predictedRank >= 150000 && (
                    <span>
                      <strong>Challenging for MBBS:</strong> Merit seats are difficult. Explore Deemed Universities (Management Quota) or consider BDS/BAMS/Veterinary options.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Charts & Analysis */}
          <div>
            {/* Rank Trend Chart */}
            <RankTrendChart history={result.history} />

            {/* Simple Fee Filter / College Preview */}
            <div style={{ marginTop: '20px' }}>
              <FeeSlider rank={result.predictedRank} results={collegeOptions} onFilter={handleFeeChange} />

              <h4 style={{ marginBottom: '10px', marginTop: '20px' }}>Potential Colleges ({filteredColleges.length})</h4>
              {filteredColleges.length > 0 ? (
                <div style={styles.collegeList}>
                  {filteredColleges.slice(0, 50).map((c, i) => (
                    <div key={i} style={styles.collegeItem}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{c.college_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {c.state} • Cutoff: {c.closing_rank}
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: (c.closing_rank - result.predictedRank > 2000) ? '#d4edda' : '#fff3cd',
                            color: (c.closing_rank - result.predictedRank > 2000) ? '#155724' : '#856404',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}>
                            {(c.closing_rank - result.predictedRank > 2000) ? 'High' : 'Med'}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {c.feeDisplay || "Fee N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#888' }}>Enter a valid score to see college options.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* History Section */}
      <div style={{ opacity: 0.7 }}>
        <PredictionHistory refreshSignal={loading ? 1 : 0} />
      </div>

    </div>
  );
}
