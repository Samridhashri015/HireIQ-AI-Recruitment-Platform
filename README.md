# HireIQ — AI-Powered Recruitment Screening Platform

## 1. Project Overview

HireIQ is a web-based recruitment screening platform that analyzes PDF resumes against a job description. It identifies matching and missing skills, estimates relevant experience using text patterns, calculates a match score, and provides a preliminary candidate recommendation.

## 2. Problem Statement

Manually reviewing large numbers of resumes can be time-consuming. HireIQ demonstrates how automated text extraction and rule-based matching can help recruiters organize and review applications more efficiently.

## 3. Objectives

* Extract readable text from PDF resumes.
* Identify skills relevant to a job description.
* Highlight matched and missing skills.
* Calculate a preliminary candidate match score.
* Save and rank analyzed candidate records.
* Allow users to review and delete saved candidates.

## 4. Technology Stack

**Frontend**

* React
* TypeScript
* Vite
* CSS

**Backend**

* Node.js
* Express
* Multer
* PDF.js

**Storage**

* Local JSON file (`backend/candidates.json`)

## 5. Key Features

* PDF resume upload with a 10 MB size limit.
* Resume text extraction using PDF.js.
* Rule-based skill matching using a predefined skills dictionary.
* Experience estimation using regular-expression patterns.
* Weighted candidate match scoring.
* Candidate recommendations based on score ranges.
* Persistent local candidate records.
* Candidate listing and deletion.

## 6. Scoring Method

When the job description contains identifiable required skills, the system calculates:

**Skill score:** Percentage of identified required skills found in the resume.

**Experience score:** Estimated candidate experience divided by required experience, capped at 100%.

**Final score:**

Final score = (Skill score × 0.80) + (Experience score × 0.20)

If no required skills are identified, the implementation uses the experience score as the final score.

The system uses these recommendation thresholds:

* 85–100: Strong candidate — recommend interview
* 70–84: Good candidate — review recommended
* 55–69: Potential candidate — further review required
* Below 55: Low match — consider other candidates

## 7. Project Structure

```text
recruitment-intelligence-platform/
├── frontend/
│   └── src/
├── backend/
│   ├── server.js
│   ├── candidates.json
│   └── uploads/
└── README.md
```

## 8. Running the Project Locally

### Start the backend

```bash
cd backend
npm install
npm start
```

Backend URL: `http://localhost:5001`

### Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

## 9. API Endpoints

| Method | Endpoint              | Purpose                   |
| ------ | --------------------- | ------------------------- |
| GET    | `/`                   | Check backend status      |
| POST   | `/api/analyze-resume` | Analyze a PDF resume      |
| GET    | `/api/candidates`     | Retrieve saved candidates |
| DELETE | `/api/candidates/:id` | Delete a saved candidate  |

The resume analysis endpoint expects a multipart form containing a PDF field named `resume` and a `jobDescription` field.

## 10. Limitations

* The current implementation uses predefined skills and rule-based scoring rather than a trained machine-learning model.
* Scanned PDFs without an embedded text layer require OCR, which is not currently implemented.
* Experience extraction depends on recognizable wording and may miss relevant experience.
* Skill matching does not fully understand context, proficiency, or equivalent skills.
* Candidate records are stored locally in JSON rather than in a production database.
* The recommendation is intended as decision support, not as an automated hiring decision.

## 11. Future Enhancements

* Integrate a database such as PostgreSQL or MongoDB.
* Add OCR for scanned resumes.
* Improve experience extraction and contextual skill matching.
* Add recruiter authentication and role-based access.
* Add explainable score breakdowns and downloadable reports.
* Evaluate the screening algorithm on a representative, appropriately consented dataset.

## 12. Conclusion

HireIQ demonstrates a full-stack approach to resume screening by combining a React interface, an Express API, PDF text extraction, rule-based matching, scoring, and local candidate record management. It provides a foundation for further development into a more robust recruitment-support system.
