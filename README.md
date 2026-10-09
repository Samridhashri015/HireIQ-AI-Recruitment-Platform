# HireIQ — AI-Powered Recruitment Intelligence Platform

HireIQ is a web-based recruitment platform that helps recruiters evaluate resumes against job descriptions, identify relevant skills, calculate candidate match scores, and organize candidates in a screening pipeline.

## Features

* **Resume screening:** Upload PDF resumes for analysis.
* **Skill matching:** Identify matched and missing skills based on a job description.
* **Candidate scoring:** Calculate a match score using skills and experience.
* **Recruitment recommendations:** Generate a screening recommendation from the analysis.
* **Candidate pipeline:** View saved candidate analyses and remove candidates when needed.
* **Dashboard:** Review screening results through a centralized interface.

## Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* CSS

**Backend**

* Node.js
* Express.js
* Multer
* PDF.js

**Data Storage**

* Local JSON file for saved candidate analyses

## Project Structure

```text
recruitment-intelligence-platform/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

* Node.js and npm
* Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd recruitment-intelligence-platform
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your GitHub repository URL.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Start the backend

```bash
node server.js
```

The backend runs at:

`http://localhost:5001`

### 4. Start the frontend

Open a second terminal window and run:

```bash
cd /Users/samridhashri/Desktop/recruitment-intelligence-platform/frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## API Endpoints

| Method | Endpoint              | Purpose                                        |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/`                   | Backend health check                           |
| POST   | `/api/analyze-resume` | Analyze a PDF resume against a job description |
| GET    | `/api/candidates`     | Retrieve saved candidate analyses              |
| DELETE | `/api/candidates/:id` | Delete a saved candidate                       |

## Current Limitations

* Supports text-based PDF resumes; scanned PDFs may require OCR.
* Skill extraction uses a predefined skill dictionary.
* Match scores are heuristic indicators, not validated hiring assessments.
* Candidate data is stored locally in a JSON file.
* Authentication and production-grade data protection are not yet implemented.

## Future Enhancements

* Add OCR and DOCX resume support.
* Integrate semantic matching using NLP or embedding models.
* Add recruiter authentication and role-based access control.
* Introduce a production database.
* Add explainable scoring and candidate comparison.
* Deploy the application with secure configuration and privacy controls.

## Disclaimer

HireIQ is a recruitment-support prototype. Its scores and recommendations should not be used as the sole basis for hiring decisions. Recruiters should review candidates fairly and independently.

---

**Built as a final-year project exploring recruitment automation and full-stack web development.**
