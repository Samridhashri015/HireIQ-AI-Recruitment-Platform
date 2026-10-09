
import {
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import "./App.css";

const API_URL = "http://localhost:5001";

type AnalysisResult = {
  success: boolean;
  candidateName: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  resumeSkills: string[];
  requiredSkills: string[];
  experienceYears: number;
  requiredExperience: number;
  recommendation: string;
  skillScore: number;
  experienceScore: number;
  message: string;
};

type SavedCandidate = AnalysisResult & {
  id: string;
  analyzedAt?: string;
};

function App() {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const loadCandidates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/candidates`);

      if (!response.ok) {
        throw new Error("Unable to load saved candidates.");
      }

      const data: SavedCandidate[] = await response.json();

      const ranked = [...data].sort(
        (a, b) => b.matchScore - a.matchScore
      );

      setSavedCandidates(ranked);
    } catch (err) {
      console.error("Candidate loading error:", err);
      setError(
        "Cannot connect to the backend. Make sure the HireIQ server is running on port 5001."
      );
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    void loadCandidates();
  }, []);

  const handleResumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF resume. The current backend supports PDF files.");
      setResume(null);
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The resume must be smaller than 10 MB.");
      setResume(null);
      event.target.value = "";
      return;
    }

    setResume(file);
    setError("");
    setSuccessMessage("");
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please drop a PDF resume.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The resume must be smaller than 10 MB.");
      return;
    }

    setResume(file);
    setError("");
    setSuccessMessage("");
  };

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setAnalysis(null);

    if (!resume) {
      setError("Please upload a PDF resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description first.");
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDescription", jobDescription.trim());

      const response = await fetch(`${API_URL}/api/analyze-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resume analysis failed.");
      }

      setAnalysis(data as AnalysisResult);
      setSuccessMessage("Analysis complete! Candidate results have been saved.");

      // Refresh the ranked candidate pipeline from the backend.
      await loadCandidates();

      // Bring the results into view.
      window.setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the resume."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved candidate?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_URL}/api/candidates/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete candidate.");
      }

      setSavedCandidates((previous) =>
        previous.filter((candidate) => candidate.id !== id)
      );

      setSuccessMessage("Candidate deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete candidate."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearForm = () => {
    setResume(null);
    setJobDescription("");
    setAnalysis(null);
    setError("");
    setSuccessMessage("");
  };

  const averageScore =
    savedCandidates.length > 0
      ? Math.round(
          savedCandidates.reduce(
            (total, candidate) => total + candidate.matchScore,
            0
          ) / savedCandidates.length
        )
      : 0;

  const strongCandidates = savedCandidates.filter(
    (candidate) => candidate.matchScore >= 85
  ).length;

  const getScoreClass = (score: number) => {
    if (score >= 85) return "score-high";
    if (score >= 70) return "score-good";
    if (score >= 55) return "score-medium";
    return "score-low";
  };

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "C";

  return (
    <div className="hireiq-app">
      <header className="navbar">
        <a
          className="brand"
          href="#home"
          onClick={() => setActiveTab("dashboard")}
        >
          <span className="brand-icon">H</span>
          <span>
            <strong>HireIQ</strong>
            <small>RECRUITMENT INTELLIGENCE</small>
          </span>
        </a>

        <nav className="nav-links">
          <a
            className={activeTab === "dashboard" ? "active" : ""}
            href="#home"
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </a>
          <a
            className={activeTab === "candidates" ? "active" : ""}
            href="#candidates"
            onClick={() => setActiveTab("candidates")}
          >
            Candidates
          </a>
          <a
            className={activeTab === "analytics" ? "active" : ""}
            href="#analytics"
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </a>
        </nav>

        <a className="nav-cta" href="#analyzer">
          + Analyze resume
        </a>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" />
              AI-POWERED RECRUITMENT
            </span>

            <h1>
              Hire smarter.
              <br />
              <span>Find your next great hire.</span>
            </h1>

            <p>
              Screen resumes, discover relevant skills, and rank candidates
              against your job requirements — all in one place.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#analyzer">
                ✦ Start screening <span>→</span>
              </a>
              <a className="secondary-button" href="#candidates">
                View candidates
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span> Transparent skill matching
              <span>✓</span> Human-reviewed recommendations
            </div>
          </div>

          <div className="hero-visual" aria-label="Recruitment overview">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />

            <div className="visual-card visual-card-main">
              <div className="visual-card-top">
                <span className="mini-icon">✦</span>
                <span>Candidate intelligence</span>
                <span className="live-label">LIVE</span>
              </div>
              <div className="visual-score-row">
                <div>
                  <small>Illustrative match score</small>
                  <h2>92%</h2>
                  <span className="visual-subtitle">Strong skill alignment</span>
                </div>
                <div className="visual-circle">✓</div>
              </div>
              <div className="visual-progress">
                <span />
              </div>
              <div className="visual-skills">
                <span>React</span>
                <span>TypeScript</span>
                <span>Node.js</span>
              </div>
            </div>

            <div className="floating-card floating-card-top">
              <span className="floating-icon purple">✦</span>
              <div>
                <strong>Skill matching</strong>
                <small>Resume vs. job requirements</small>
              </div>
            </div>

            <div className="floating-card floating-card-bottom">
              <span className="floating-icon green">✓</span>
              <div>
                <strong>Candidate pipeline</strong>
                <small>Ranked by match score</small>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-grid" id="analytics">
          <article className="stat-card">
            <div className="stat-icon purple-bg">♙</div>
            <div>
              <span>Total analyzed candidates</span>
              <strong>{loadingCandidates ? "…" : savedCandidates.length}</strong>
              <small>Saved analysis records</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon green-bg">✓</div>
            <div>
              <span>Strong matches</span>
              <strong>{loadingCandidates ? "…" : strongCandidates}</strong>
              <small>Scores of 85% or higher</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon blue-bg">◎</div>
            <div>
              <span>Average match score</span>
              <strong>{loadingCandidates ? "…" : `${averageScore}%`}</strong>
              <small>Across saved candidates</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange-bg">↗</div>
            <div>
              <span>Review recommended</span>
              <strong>
                {loadingCandidates
                  ? "…"
                  : savedCandidates.filter(
                      (candidate) =>
                        candidate.matchScore >= 55 &&
                        candidate.matchScore < 85
                    ).length}
              </strong>
              <small>Human review suggested</small>
            </div>
          </article>
        </section>

        <section className="analyzer-section section-block" id="analyzer">
          <div className="section-heading">
            <span className="eyebrow">AI RESUME SCREENING</span>
            <h2>Analyze a candidate</h2>
            <p>
              Upload a resume and provide the job description to generate a
              skill-based candidate match.
            </p>
          </div>

          <form className="analyzer-form" onSubmit={handleAnalyze}>
            <div className="analyzer-grid">
              <section className="input-panel">
                <div className="panel-heading">
                  <span className="panel-icon upload-icon">↑</span>
                  <div>
                    <h3>Candidate Resume</h3>
                    <p>Upload a PDF document</p>
                  </div>
                </div>

                <label
                  className={`upload-zone ${dragging ? "dragging" : ""} ${
                    resume ? "has-file" : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeChange}
                  />

                  {resume ? (
                    <>
                      <span className="upload-symbol file-symbol">PDF</span>
                      <strong>{resume.name}</strong>
                      <small>
                        {(resume.size / (1024 * 1024)).toFixed(2)} MB
                      </small>
                      <span className="file-ready">✓ Ready to analyze</span>
                      <button
                        type="button"
                        className="remove-file"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setResume(null);
                        }}
                      >
                        Remove file ×
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="upload-symbol">↑</span>
                      <strong>Drop your resume here</strong>
                      <span className="upload-browse">
                        or <u>browse files</u>
                      </span>
                      <small>PDF format · Maximum file size: 10 MB</small>
                    </>
                  )}
                </label>
              </section>

              <section className="input-panel">
                <div className="panel-heading">
                  <span className="panel-icon jd-icon">JD</span>
                  <div>
                    <h3>Job Description</h3>
                    <p>Define the requirements for this role</p>
                  </div>
                </div>

                <textarea
                  className="job-description"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder={`Paste the job description here...

Example:
We are looking for a React Developer with experience in TypeScript, JavaScript, Node.js, SQL and REST APIs.`}
                  rows={10}
                />

                <div className="textarea-footer">
                  <span>
                    {jobDescription.trim().length} characters
                  </span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      setJobDescription(
                        "We are looking for a React Developer with 2 years of experience.\n\nRequired skills:\n- React\n- JavaScript\n- TypeScript\n- Node.js\n- SQL\n- REST APIs\n- Git\n- HTML\n- CSS\n\nThe candidate should have experience building responsive web applications and integrating backend APIs."
                      )
                    }
                  >
                    Use sample
                  </button>
                </div>
              </section>
            </div>

            {error && (
              <div className="notice notice-error" role="alert">
                <span>!</span>
                <p>{error}</p>
                <button type="button" onClick={() => setError("")}>
                  ×
                </button>
              </div>
            )}

            {successMessage && (
              <div className="notice notice-success" role="status">
                <span>✓</span>
                <p>{successMessage}</p>
                <button
                  type="button"
                  onClick={() => setSuccessMessage("")}
                >
                  ×
                </button>
              </div>
            )}

            <div className="analyze-actions">
              <button
                className="primary-button analyze-button"
                type="submit"
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <span className="spinner" /> Analyzing resume…
                  </>
                ) : (
                  <>✦ Analyze Candidate <span>→</span></>
                )}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={clearForm}
                disabled={analyzing}
              >
                Clear form
              </button>

              <small>🔒 Resume files are processed by your local backend.</small>
            </div>
          </form>
        </section>

        {analysis && (
          <section className="results-section section-block" id="results">
            <div className="section-heading">
              <span className="eyebrow">AI ANALYSIS COMPLETE</span>
              <h2>Candidate intelligence</h2>
              <p>
                Results for <strong>{analysis.candidateName}</strong>. Use this
                match as a screening aid alongside human review.
              </p>
            </div>

            <div className="results-grid">
              <article className="result-card match-card">
                <span className="result-label">OVERALL MATCH</span>
                <strong className="big-score">{analysis.matchScore}%</strong>
                <div className="match-track">
                  <span
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, analysis.matchScore)
                      )}%`,
                    }}
                  />
                </div>
                <p>
                  {analysis.matchScore >= 85
                    ? "Strong skill alignment. Review the evidence before proceeding."
                    : analysis.matchScore >= 70
                    ? "Good alignment, with some areas to review."
                    : analysis.matchScore >= 55
                    ? "Potential match. Additional review is recommended."
                    : "Lower detected alignment. Consider the full application."}
                </p>
              </article>

              <article className="result-card">
                <div className="result-card-heading">
                  <span className="result-icon green-bg">✓</span>
                  <div>
                    <span className="result-label">MATCHED SKILLS</span>
                    <strong>{analysis.matchedSkills.length} skills</strong>
                  </div>
                </div>
                <div className="skill-tags">
                  {analysis.matchedSkills.length > 0 ? (
                    analysis.matchedSkills.map((skill) => (
                      <span className="skill-tag matched" key={skill}>
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <p className="empty-message">
                      No required skills were detected as matched.
                    </p>
                  )}
                </div>
              </article>

              <article className="result-card">
                <div className="result-card-heading">
                  <span className="result-icon orange-bg">!</span>
                  <div>
                    <span className="result-label">SKILLS TO REVIEW</span>
                    <strong>{analysis.missingSkills.length} skills</strong>
                  </div>
                </div>
                <div className="skill-tags">
                  {analysis.missingSkills.length > 0 ? (
                    analysis.missingSkills.map((skill) => (
                      <span className="skill-tag missing" key={skill}>
                        ! {skill}
                      </span>
                    ))
                  ) : (
                    <p className="empty-message">
                      All detected required skills matched.
                    </p>
                  )}
                </div>
              </article>

              <article className="result-card experience-card">
                <span className="result-label">EXPERIENCE CHECK</span>
                <div className="experience-numbers">
                  <div>
                    <strong>{analysis.experienceYears}</strong>
                    <small>Detected years</small>
                  </div>
                  <span>/</span>
                  <div>
                    <strong>{analysis.requiredExperience}</strong>
                    <small>Required years</small>
                  </div>
                </div>
                <div className="score-breakdown">
                  <div>
                    <span>Skill score</span>
                    <strong>{analysis.skillScore}%</strong>
                  </div>
                  <div className="mini-track">
                    <span
                      style={{
                        width: `${Math.min(100, analysis.skillScore)}%`,
                      }}
                    />
                  </div>
                  <div>
                    <span>Experience score</span>
                    <strong>{analysis.experienceScore}%</strong>
                  </div>
                  <div className="mini-track">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          analysis.experienceScore
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </article>

              <article className="result-card recommendation-card">
                <span className="result-icon purple-bg">✦</span>
                <div>
                  <span className="result-label">RECOMMENDATION</span>
                  <h3>{analysis.recommendation}</h3>
                  <p>
                    This rule-based score supports screening; it does not
                    determine candidate suitability on its own.
                  </p>
                </div>
              </article>
            </div>

            <div className="results-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  void loadCandidates();
                  document
                    .getElementById("candidates")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View saved candidates →
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={clearForm}
              >
                Analyze another resume
              </button>
            </div>
          </section>
        )}

        <section className="candidates-section section-block" id="candidates">
          <div className="section-heading section-heading-row">
            <div>
              <span className="eyebrow">CANDIDATE PIPELINE</span>
              <h2>Top candidates</h2>
              <p>
                Saved candidate analyses, ranked by match score.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button refresh-button"
              onClick={() => {
                setLoadingCandidates(true);
                void loadCandidates();
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {error && !analysis && (
            <div className="notice notice-error" role="alert">
              <span>!</span>
              <p>{error}</p>
              <button type="button" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}

          {loadingCandidates ? (
            <div className="empty-state">
              <span className="spinner" />
              <p>Loading saved candidates…</p>
            </div>
          ) : savedCandidates.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">♙</span>
              <h3>No saved candidates yet</h3>
              <p>
                Analyze a resume to add the first candidate to your pipeline.
              </p>
              <a className="primary-button" href="#analyzer">
                Analyze your first resume →
              </a>
            </div>
          ) : (
            <>
              <div className="candidate-table-wrap">
                <table className="candidate-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Match score</th>
                      <th>Matched skills</th>
                      <th>Recommendation</th>
                      <th>Analyzed</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedCandidates.map((candidate, index) => (
                      <tr key={candidate.id}>
                        <td>
                          <div className="candidate-identity">
                            <span className="candidate-avatar">
                              {getInitials(candidate.candidateName)}
                            </span>
                            <div>
                              <strong>{candidate.candidateName}</strong>
                              <small>Candidate #{index + 1}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`score-pill ${getScoreClass(
                              candidate.matchScore
                            )}`}
                          >
                            {candidate.matchScore}%
                          </span>
                        </td>
                        <td>
                          <span className="skill-count">
                            {candidate.matchedSkills?.length ?? 0} matched
                          </span>
                          <small className="table-subtext">
                            {candidate.missingSkills?.length ?? 0} to review
                          </small>
                        </td>
                        <td>
                          <span className="recommendation-text">
                            {candidate.recommendation}
                          </span>
                        </td>
                        <td>
                          {candidate.analyzedAt
                            ? new Date(candidate.analyzedAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <button
                            className="delete-button"
                            type="button"
                            disabled={deletingId === candidate.id}
                            onClick={() => {
                              void handleDeleteCandidate(candidate.id);
                            }}
                            aria-label={`Delete ${candidate.candidateName}`}
                          >
                            {deletingId === candidate.id
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="table-footer">
                Showing {savedCandidates.length} saved{" "}
                {savedCandidates.length === 1 ? "candidate" : "candidates"}.
                Scores are screening estimates, not hiring decisions.
              </p>
            </>
          )}
        </section>

        <section className="features-section section-block">
          <div className="section-heading">
            <span className="eyebrow">BUILT FOR BETTER SCREENING</span>
            <h2>Recruitment intelligence, simplified</h2>
            <p>
              Useful screening tools that help recruiters organize information
              and focus their reviews.
            </p>
          </div>

          <div className="features-grid">
            <article className="feature-card">
              <span className="feature-icon purple-bg">✦</span>
              <h3>Skill-based matching</h3>
              <p>
                Compare detected resume skills against requirements from the
                job description.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-icon blue-bg">↗</span>
              <h3>Ranked pipeline</h3>
              <p>
                Keep analysis records in one place and sort candidates by
                their calculated match scores.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-icon green-bg">✓</span>
              <h3>Review support</h3>
              <p>
                See matched skills, potential gaps, and a recommendation to
                support a human-led review.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">H</span>
          <span>
            <strong>HireIQ</strong>
            <small>RECRUITMENT INTELLIGENCE</small>
          </span>
        </a>
        <p>
          Built to support thoughtful, skill-based recruitment. Final
          decisions belong to people.
        </p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  );
}

export default App;