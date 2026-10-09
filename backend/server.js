
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5001;

const UPLOAD_DIR = path.join(__dirname, "uploads");
const CANDIDATES_FILE = path.join(__dirname, "candidates.json");

app.use(cors());
app.use(express.json());

// Create required files and folders if missing
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(CANDIDATES_FILE)) {
  fs.writeFileSync(CANDIDATES_FILE, "[]", "utf8");
}

// Resume upload configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== ".pdf") {
      return cb(new Error("Please upload a PDF resume."));
    }

    cb(null, true);
  },
});

// Skill dictionary
const SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "go",
  "rust",
  "php",
  "ruby",
  "kotlin",
  "swift",
  "html",
  "css",
  "react",
  "angular",
  "vue",
  "next.js",
  "node.js",
  "express",
  "django",
  "flask",
  "spring boot",
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "redis",
  "firebase",
  "aws",
  "azure",
  "google cloud",
  "docker",
  "kubernetes",
  "git",
  "github",
  "linux",
  "jenkins",
  "ci/cd",
  "machine learning",
  "deep learning",
  "artificial intelligence",
  "data analysis",
  "data science",
  "pandas",
  "numpy",
  "tensorflow",
  "pytorch",
  "scikit-learn",
  "rest apis",
  "graphql",
  "api",
  "figma",
  "bootstrap",
  "tailwind",
  "sass",
  "redux",
  "jest",
  "testing",
  "agile",
  "scrum",
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w+#./ -]/g, " ")
    .trim();
}

function extractSkills(text) {
  const normalized = normalizeText(text);

  return SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, "i");
    return pattern.test(normalized);
  });
}

function extractExperience(text) {
  const normalized = text.toLowerCase();

  const patterns = [
    /(\d+(?:\.\d+)?)\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience/i,
    /experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*years?/i,
    /(\d+(?:\.\d+)?)\+?\s*yrs?\s+(?:of\s+)?experience/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return Math.max(0, Number(match[1]) || 0);
    }
  }

  if (/\b(fresher|entry.level|recent graduate|no experience)\b/i.test(normalized)) {
    return 0;
  }

  return 0;
}

function extractRequiredExperience(text) {
  const normalized = text.toLowerCase();

  const patterns = [
    /(\d+(?:\.\d+)?)\+?\s*years?\s+(?:of\s+)?(?:relevant\s+|professional\s+)?experience/i,
    /experience\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\+?\s*years?/i,
    /(\d+(?:\.\d+)?)\+?\s*yrs?\s+(?:of\s+)?experience/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return Math.max(0, Number(match[1]) || 0);
    }
  }

  return 0;
}

function readCandidates() {
  try {
    const data = JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveCandidates(candidates) {
  fs.writeFileSync(
    CANDIDATES_FILE,
    JSON.stringify(candidates, null, 2),
    "utf8"
  );
}

// Health check
app.get("/", (_req, res) => {
  res.json({
    message: "HireIQ AI Recruitment Backend is running 🚀",
  });
});

// Get saved candidates, ranked by match score
app.get("/api/candidates", (_req, res) => {
  try {
    const candidates = readCandidates().sort(
      (a, b) => b.matchScore - a.matchScore
    );

    res.json(candidates);
  } catch (error) {
    console.error("LOAD CANDIDATES ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Could not load saved candidates.",
    });
  }
});

// Delete a saved candidate
app.delete("/api/candidates/:id", (req, res) => {
  try {
    const candidates = readCandidates();
    const updated = candidates.filter(
      (candidate) => candidate.id !== req.params.id
    );

    if (updated.length === candidates.length) {
      return res.status(404).json({
        success: false,
        error: "Candidate not found.",
      });
    }

    saveCandidates(updated);

    res.json({
      success: true,
      message: "Candidate deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE CANDIDATE ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Could not delete candidate.",
    });
  }
});

// Analyze an uploaded PDF resume against a job description
app.post("/api/analyze-resume", (req, res, next) => {
  upload.single("resume")(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        error: uploadError.message || "Resume upload failed.",
      });
    }

    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF resume.",
      });
    }

    const jobDescription =
      typeof req.body.jobDescription === "string"
        ? req.body.jobDescription.trim()
        : "";

    if (!jobDescription) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Please provide a job description.",
      });
    }

    // PDF.js is dynamically imported because it is an ES module.
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const fileBuffer = fs.readFileSync(req.file.path);

    const pdfData = new Uint8Array(fileBuffer);
    const pdf = await pdfjsLib.getDocument({
      data: pdfData,
    }).promise;

    let resumeText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      resumeText +=
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ") + "\n";
    }

    if (!resumeText.trim()) {
      return res.status(400).json({
        success: false,
        error:
          "No readable text was found in this PDF. If it is a scanned resume, OCR is required.",
      });
    }

    const resumeSkills = extractSkills(resumeText);
    const requiredSkills = extractSkills(jobDescription);

    const matchedSkills = requiredSkills.filter((skill) =>
      resumeSkills.includes(skill)
    );

    const missingSkills = requiredSkills.filter(
      (skill) => !resumeSkills.includes(skill)
    );

    const candidateExperience = extractExperience(resumeText);
    const requiredExperience = extractRequiredExperience(jobDescription);

    const skillScore =
      requiredSkills.length > 0
        ? (matchedSkills.length / requiredSkills.length) * 100
        : 0;

    let experienceScore = 100;

    if (requiredExperience > 0) {
      experienceScore = Math.min(
        100,
        (candidateExperience / requiredExperience) * 100
      );
    }

    const finalScore = Math.round(
      requiredSkills.length > 0
        ? skillScore * 0.8 + experienceScore * 0.2
        : experienceScore
    );

    let recommendation;

    if (finalScore >= 85) {
      recommendation = "Strong candidate — recommend interview";
    } else if (finalScore >= 70) {
      recommendation = "Good candidate — review recommended";
    } else if (finalScore >= 55) {
      recommendation = "Potential candidate — further review required";
    } else {
      recommendation = "Low match — consider other candidates";
    }

    const candidateName = path
      .basename(req.file.originalname, path.extname(req.file.originalname))
      .replace(/[_-]+/g, " ")
      .trim();

    const analysisResult = {
      success: true,
      candidateName: candidateName || "Unknown candidate",
      matchScore: finalScore,
      matchedSkills,
      missingSkills,
      resumeSkills,
      requiredSkills,
      experienceYears: candidateExperience,
      requiredExperience,
      recommendation,
      skillScore: Math.round(skillScore),
      experienceScore: Math.round(experienceScore),
      message: "Resume analyzed successfully",
    };

    // Save analysis results to candidates.json
    const candidates = readCandidates();

    const savedCandidate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      analyzedAt: new Date().toISOString(),
      ...analysisResult,
    };

    candidates.push(savedCandidate);

    candidates.sort((a, b) => b.matchScore - a.matchScore);
    saveCandidates(candidates);

    console.log("Required experience:", requiredExperience);
    console.log("Final match score:", finalScore);
    console.log("Analysis completed successfully");

    return res.json(analysisResult);
  } catch (error) {
    console.error("RESUME ANALYSIS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze resume.",
      details: error.message,
    });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Could not remove temporary upload:", cleanupError);
      }
    }
  }
});

// Handle unexpected errors
app.use((error, _req, res, _next) => {
  console.error("SERVER ERROR:", error);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    success: false,
    error: "An unexpected server error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`HireIQ backend running on http://localhost:${PORT}`);
});