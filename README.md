# CineMind — Personalised Movie Decision Intelligence Platform
> **Version 2.0 | B.Tech CSE Mini Project / Hackathon Project**
> Full-Stack Decision Intelligence Web Application powered by React, Tailwind CSS, Flask, SQLAlchemy, Bayesian Evidence Analysis, and Collaborative AI.

---

## 🌟 Executive Summary & Core Promise
General audience ratings do not necessarily reflect an individual's unique preferences. Viewers often struggle to compare films, assess whether a rating has sufficient sample evidence, find films matching strict time or regional language constraints, and agree on a movie to watch together as a group.

**CineMind** combines authentic movie metadata, transparent rating statistics, personalized compatibility estimates, explainable recommendation reports, natural language query extraction, spoiler-aware review consensus, and group decision support into one unified platform.

---

## 🏗️ Technology Architecture

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+), React | Responsive web pages, movie cards, search filters, modals |
| **Backend** | Python, Flask, REST API | Business logic, authentication, recommendation algorithms, API endpoints |
| **Database** | MySQL (SQLAlchemy ORM) | Stores all 25 movies, 1,890 ratings, user accounts, and watchlists |
| **AI & NLP** | Google Gemini GenAI & Rule-based NLP | Natural language movie search and AI conversational assistant |
| **Security** | Bcrypt password hashing, PyJWT tokens | User login authentication and password security |

---

## 🎯 PRD Feature Implementations

### 1. Movie Catalogue & Multi-Faceted Discovery (P0)
- **Multi-Constraint Filtering**: Instant filtering by genre, regional language (Telugu, Tamil, Malayalam, Kannada, Hindi, English), maximum runtime (mins), and minimum Bayesian rating.
- **Sorting Options**: Sort by Bayesian Evidence Score, Raw Audience Mean, Most Reviewed Count, Release Year, and Personal Compatibility.
- **Dual Metrics on Every Card**:
  - **General Rating**: Bayesian-smoothed score (e.g. `4.8★`) with sample count.
  - **Personal Match**: User compatibility percentage (e.g. `96% Match`) calibrated to user Taste DNA.

### 2. Rating Trust Analyzer & Bayesian Smoothing (P0 / P1)
- **Bayesian Smoothing Formulation**:
  $$\text{weighted\_score} = \left(\frac{v}{v + m}\right) R + \left(\frac{m}{v + m}\right) C$$
  Where:
  - $R$ = Movie raw arithmetic mean
  - $v$ = Number of verified reviews
  - $C$ = Overall catalogue benchmark mean ($\approx 3.5\text{★}$)
  - $m$ = Documented evidence constant ($m = 25$)
- **Evidence Level Labels**:
  - `Broader rating sample` ($v \ge 50$)
  - `Moderate rating sample` ($15 \le v < 50$)
  - `Limited rating evidence` ($v < 15$)
- **Statistical Uncertainty**: 95% Confidence Interval ($\pm 1.96 \cdot \frac{\text{std}}{\sqrt{v}}$).
- **1–5 Star Rating Distribution**: Breakdown of review percentages across each star rating.

### 3. Movie Taste DNA & Compatibility Engine (P1)
- **Normalized Feature Vectors**: Movies are vectorized across genres, regional language, and runtime tiers.
- **Taste Profile Inference**: User ratings and explicit onboarding choices build a continuous preference vector.
- **Cosine Compatibility**:
  $$\cos(\theta) = \frac{\vec{u} \cdot \vec{m}}{\|\vec{u}\| \cdot \|\vec{m}\|}$$
  Calibrated into an explainable 0–100% compatibility score.
- **Spectrum Visualizer**: Displays genre affinities from $-1.0$ (Avoided) to $+1.0$ (Favorite) with rating evidence confidence tiers.

### 4. Explainable Decision Report & Watch Risk (P1 / P2)
- Accessible for every movie in the catalogue:
  - **Personal Match Tier**: e.g., "94% High Match".
  - **Why It Fits**: Specific matching favorite genres, language alignment, and runtime compatibility.
  - **Watch Risk / Possible Mismatches**: Flagged runtime exceedances, lower historical affinity genres, or explicitly excluded genres.
  - **3 Similar Alternatives**: Nearest catalogue neighbors with similarity percentages.

### 5. Natural Language Movie Search (P2)
- Accepts conversational queries like:
  - *"Find a Telugu thriller under two hours with a high audience rating"*
  - *"Recommend a Malayalam mystery thriller"*
  - *"Top rated sci-fi movies"*
- Automatically parses and extracts language, genre, runtime constraints, and rating thresholds into structured catalogue filters.

### 6. Grounded CineMind Smart Assistant (P2)
- Conversational assistant strictly grounded in verified database records:
  - **Head-to-Head Comparisons**: *"Compare RRR and KGF"*
  - **Rating Reliability Inquiries**: *"Is Kantara's rating reliable?"*
  - **Taste Inquiries**: *"What are my top genres?"*
- Directly renders interactive Decision Report shortcuts in chat responses without hallucinating unrecorded facts.

### 7. Head-to-Head Movie Comparison (P1)
- Side-by-side matrix comparing 2 or 3 movies simultaneously across:
  - Bayesian Evidence Score & Raw Mean
  - Sample Size & Evidence Reliability
  - 95% Confidence Interval Margin
  - Personal Compatibility %
  - Runtime, Language, and Synopsis.

### 8. Spoiler-Aware Review Summarizer (P2)
- Synthesizes common praise themes and critical debate areas.
- **Spoiler Shield**: Spoilers are blurred and flagged with an interactive toggle to protect the viewer's experience.

### 9. Group Movie Decision Maker & Voting (P2)
- **Room Codes**: 6-character alphanumeric room codes (e.g. `CM8942`).
- **Configurable Fairness Objectives**:
  - `Consensus First (Avoid Mismatch)`: Egalitarian optimization minimizing individual dissatisfaction so no member is stuck with an unliked film.
  - `Best Average Match`: Utilitarian optimization maximizing total room satisfaction.
- **Live Voting & Countdown**: Participants upvote or veto candidates in real-time.

### 10. Regional Indian Cinema Analytics (P2)
- Dedicated comparative analytics for **Telugu, Tamil, Malayalam, Kannada, Hindi, and Global** cinema.
- Compares titles volume, Bayesian score averages, film runtimes, and genre distributions with clear data provenance disclosure.

### 11. Admin Dashboard & Catalogue Management (P3)
- Protected by backend and frontend admin role verification (`admin@cinemind.com`).
- Add, edit, and delete movie records.
- Missing metadata audit monitor (posters, runtimes, overviews).
- Audit trail logging all administrative actions.

### 12. Security & Strong Password Policy (P1 / P3)
- Enforces 8+ characters, uppercase letter, lowercase letter, number, special character, and rejection of breached passwords.
- Real-time animated password strength meter (Weak, Moderate, Strong, Very Strong).
- Passwords salted and hashed with **Bcrypt**; never logged or returned in plaintext.
- Authentication powered by **JSON Web Tokens (JWT)**.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.15 installed)
- **Node.js v18+** (Node.js v24 installed)
- **npm v9+**

### 1. Backend Setup & Run
```bash
cd c:\Users\navan\Documents\CineMind\backend
.\venv\Scripts\python run.py
```
> The backend server starts at **`http://127.0.0.1:5000`**.
> On first launch, the database automatically initializes with authentic MovieLens benchmarks, regional Indian films, simulated ratings, reviews, and test accounts.

### 2. Frontend Setup & Run
```bash
cd c:\Users\navan\Documents\CineMind\frontend
npm run dev
```
> The frontend application starts at **`http://localhost:3000`**.

---

## 🔑 Pre-Configured Demo Accounts

For instant hackathon demonstration and testing, use the quick-fill buttons on the Sign In modal or credentials below:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Demo Viewer** | `viewer@cinemind.com` | `Viewer@12345` | Pre-seeded with 9 ratings, Taste DNA (Sci-Fi, Thriller), and 3 watchlist titles |
| **Admin** | `admin@cinemind.com` | `Admin@12345` | Full catalogue CRUD access, data quality monitor, and audit log access |

---

## 📁 Repository Structure
```
CineMind/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask App Factory, CORS, Blueprints, Auto-seeder
│   │   ├── config.py            # SQLite/MySQL, JWT, Bayesian m=25 config
│   │   ├── models/              # SQLAlchemy schema (User, Movie, Rating, Group, Review, Audit)
│   │   ├── routes/              # Modular Blueprints (auth, movies, user, search, assistant, groups, analytics, admin)
│   │   └── services/            # Bayesian Trust, Cosine Recommender, NL Parser, Assistant, Group Decision
│   ├── requirements.txt         # Backend Python dependencies
│   └── run.py                   # Server startup entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, AuthModal, OnboardingModal, DecisionReportModal
│   │   ├── context/             # AuthContext (JWT session, Watchlist state)
│   │   ├── pages/               # Discover, TasteProfile, Compare, Assistant, GroupDecision, RegionalAnalytics, Admin
│   │   ├── services/            # Axios/Fetch API client
│   │   ├── App.jsx              # Routing & Modal coordinators
│   │   └── index.css            # Tailwind CSS v4 styling & glassmorphism
│   ├── package.json             # React 19, Tailwind v4, Lucide Icons, Vite
│   └── vite.config.js           # Vite config with /api proxy to Flask
└── README.md                    # Comprehensive documentation
```

---

## 📜 Product Principles & Attribution
- **Honesty in Recommendations**: Recommendation scores are estimates, not infallible guarantees.
- **Sample Evidence Visibility**: Low sample sizes are transparently flagged as `Limited rating evidence`.
- **Benchmark Provenance**: Benchmark rating data is attributed to the MovieLens research dataset; Indian regional cinema metadata is verified against real industry records.
