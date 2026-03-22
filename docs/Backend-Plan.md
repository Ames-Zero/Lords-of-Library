# Backend Plan — ArxiSwipe

> Project: Tinder-for-arXiv demo  
> Stack: Python, FastAPI, MongoDB Atlas, deployed on Render  
> Folder: `backend/`
> branch name : `init/backend`

---

## Folder Structure

```
backend/
├── .env                    # secrets (never commit this)
├── .env.example            # template for secrets
├── requirements.txt
├── main.py                 # FastAPI app entry point
├── config.py               # loads env vars
├── database.py             # MongoDB connection
├── models.py               # Pydantic request/response models
├── routers/
│   ├── feed.py             # GET /feed/next
│   ├── swipe.py            # POST /swipe
│   ├── saved.py            # GET /saved
│   └── connections.py      # GET /connections (static)
├── recommender/
│   └── linucb.py           # LinUCB algorithm (core logic)
└── scripts/
    └── load_papers.py      # one-time script to load ~1000 papers from Kaggle JSON into MongoDB
```

---

## Step 1 — Project Setup

1. Create `backend/` folder.
2. Create `requirements.txt` with:
   - `fastapi`
   - `uvicorn`
   - `pymongo`
   - `python-dotenv`
   - `numpy` (for LinUCB matrix math)
   - `pydantic`
3. Create `.env.example`:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
   DB_NAME=arxiswipe
   ```
4. Create `.env` (never commit) with real values.

---

## Step 2 — Config and Database

**`config.py`**
- Use `python-dotenv` to load `.env`.
- Export `MONGO_URI` and `DB_NAME` as constants.

**`database.py`**
- Create a single `MongoClient` using `MONGO_URI`.
- Expose helper functions to get collections:
  - `get_papers_collection()`
  - `get_swipes_collection()`
  - `get_saved_collection()`
  - `get_bandit_collection()`

---

## Step 3 — Load Papers from Kaggle Dataset (One-Time Script)

**`scripts/load_papers.py`**

This script is run ONCE locally before the demo. It is NOT part of the API runtime.
The arXiv API is never called at runtime.

### Download the Dataset

1. Install the Kaggle CLI and set up your API key:
   ```bash
   pip install kaggle
   # Place your kaggle.json API key in ~/.kaggle/kaggle.json
   ```
2. Download the Cornell arXiv dataset:
   ```bash
   kaggle datasets download --unzip Cornell-University/arxiv -p ./data
   ```
   This produces: `./data/arxiv-metadata-oai-snapshot.json` (~4GB, newline-delimited JSON).

### Script Logic

1. Open `arxiv-metadata-oai-snapshot.json` and **stream line by line** (never load the full file into memory).
2. For each line, parse as JSON.
3. Filter: only keep papers whose `categories` field contains at least one of: `cs.CL`, `cs.LG`, `cs.AI`, `stat.ML`.
4. Stop once **1000 papers** have been collected.
5. For each paper, map Kaggle fields → MongoDB document:

| Kaggle field | MongoDB field | Notes |
|---|---|---|
| `id` | `_id` | arxiv ID, used as primary key |
| `title` | `title` | strip whitespace/newlines |
| `abstract` | `abstract` | strip whitespace/newlines |
| `authors_parsed` | `authors` | flatten to list of `"Firstname Lastname"` strings |
| `categories` | `categories` | split space-separated string into list |
| first token of `categories` | `primary_category` | e.g. `"cs.CL"` |
| `update_date` | `published_at` | parse as datetime |
| constructed | `arxiv_url` | `"https://arxiv.org/abs/<id>"` |
| constructed | `pdf_url` | `"https://arxiv.org/pdf/<id>"` |

6. Upsert each document into the `papers` collection keyed on `_id`.
7. Print progress every 100 papers.

Run once locally:
```bash
python scripts/load_papers.py
```

---

## Step 4 — LinUCB Algorithm

**`recommender/linucb.py`**

This is the core of the backend. Keep it simple and well-commented.

### Feature Vector

For each paper, build a feature vector from:
- One-hot encoding of `primary_category` across 4 categories: `cs.CL`, `cs.LG`, `cs.AI`, `stat.ML` → 4 dims.
- Recency: single float = `1 / (1 + days_since_published)` → 1 dim.
- Title length bucket: short (<8 words) / medium (8–15) / long (>15) → 3 dims one-hot.

Total feature dimension `d = 8`.

### LinUCB State

Stored as a single document in the `bandit_state` MongoDB collection:
```json
{
  "_id": "demo_user",
  "A": [[...], ...],   // d x d matrix — initialized as identity matrix
  "b": [...],          // d-dim vector — initialized as zeros
  "alpha": 1.0,
  "feature_dim": 8
}
```

### Functions to Implement

- `load_state(db)` → load `A`, `b`, `alpha` from MongoDB. If no document exists, initialize with identity matrix and zero vector and save it.
- `save_state(db, A, b)` → persist updated `A` and `b` back to MongoDB.
- `get_feature_vector(paper)` → return numpy array of shape `(d,)` from a paper document.
- `score_papers(papers, A, b, alpha)` → compute LinUCB score for each paper and return list sorted by score descending.
- `update(A, b, feature_vec, reward)` → LinUCB update:
  - `A = A + outer(feature_vec, feature_vec)`
  - `b = b + reward * feature_vec`

### LinUCB Score Formula

For a paper with feature vector `x` (shape `d`):

```
A_inv  = inverse(A)
theta  = A_inv @ b
sigma  = sqrt(x.T @ A_inv @ x)
score  = theta.T @ x  +  alpha * sigma
```

Papers are ranked by `score` descending.

---

## Step 5 — Pydantic Models

**`models.py`**

- `SwipeRequest`: `paper_id: str`, `direction: Literal["left", "right"]`
- `PaperOut`: `id`, `title`, `abstract`, `authors`, `primary_category`, `categories`, `published_at`, `arxiv_url`, `pdf_url`
- `SavedPaperOut`: same as `PaperOut` + `saved_at`
- `ConnectionOut`: `name`, `bio`, `topics: list[str]`

---

## Step 6 — API Routers

### `routers/feed.py` — GET /feed/next

1. Load LinUCB state from MongoDB.
2. Fetch all papers from `papers` collection.
3. Fetch `paper_id`s already swiped by `demo_user` from `swipes` collection.
4. Exclude already-swiped papers from candidates.
5. Compute LinUCB scores for all remaining candidates.
6. Return top 20 papers sorted by score as list of `PaperOut`.

### `routers/swipe.py` — POST /swipe

Request body: `SwipeRequest`

1. Insert swipe event into `swipes`:
   ```json
   { "user_id": "demo_user", "paper_id": "...", "direction": "left/right", "timestamp": now }
   ```
2. If direction is `"right"`, upsert into `saved_papers`:
   ```json
   { "user_id": "demo_user", "paper_id": "...", "saved_at": now }
   ```
3. Load current LinUCB state from MongoDB.
4. Fetch the paper document, compute its feature vector.
5. Set reward = `1` if right, `0` if left.
6. Run LinUCB update on `A` and `b`.
7. Save updated state back to MongoDB.
8. Return `{ "status": "ok" }`.

### `routers/saved.py` — GET /saved

1. Query `saved_papers` for `demo_user`, sorted by `saved_at` descending.
2. For each saved `paper_id`, fetch full paper metadata from `papers`.
3. Return list of `SavedPaperOut`.

### `routers/connections.py` — GET /connections

Return a hardcoded list of 4–5 static user profiles as `ConnectionOut`.
No database calls needed here.

---

## Step 7 — Main App Entry Point

**`main.py`**

- Create FastAPI app instance.
- Add CORS middleware (allow all origins for the demo).
- Include all routers with their prefixes:
  - `/feed`
  - `/swipe`
  - `/saved`
  - `/connections`
- Add a root health check: `GET /` returns `{ "status": "ok" }`.

---

## Step 8 — Deploy to Render(explain instruction to user, he will do it on his end)

1. Push the `backend/` folder to your GitHub repo. make sure to commit and push all changes to the 'init/backend' branch.
2. In the Render dashboard, create a new **Web Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
3. Under **Environment Variables**, add:
   - `MONGO_URI` → your MongoDB Atlas connection string
   - `DB_NAME` → `arxiswipe`
4. Deploy. Render provides a public URL like `https://arxiswipe-backend.onrender.com`.

> Note: The Kaggle dataset and `scripts/load_papers.py` are run locally only. Do NOT deploy the `scripts/` folder or the dataset to Render.

---

## Step 9 — Secrets Management

| File | Purpose | Committed to Git? |
|---|---|---|
| `.env` | Real secrets for local development | ❌ Never |
| `.env.example` | Template showing required key names | ✅ Yes |

Add `.env` to `.gitignore`.  
On Render, secrets are set via the dashboard Environment Variables panel — never hardcoded in code.

---

## Step 10 — MongoDB Indexes (Run Once After Loading)

After running the load script, create these indexes (can be added at the bottom of `load_papers.py`):

```
papers:        compound index on (primary_category, published_at)
swipes:        compound index on (user_id, paper_id)
saved_papers:  compound index on (user_id, saved_at)
```

---

## Implementation Order

| # | Task |
|---|---|
| 1 | Set up `backend/` folder, `requirements.txt`, `.env` |
| 2 | Implement `config.py` and `database.py` |
| 3 | Download Kaggle dataset, run `scripts/load_papers.py` to populate MongoDB |
| 4 | Implement `recommender/linucb.py` fully (feature vector, scoring, update) |
| 5 | Define all Pydantic models in `models.py` |
| 6 | Implement routers one by one: `feed` → `swipe` → `saved` → `connections` |
| 7 | Wire everything together in `main.py` |
| 8 | Test locally: `uvicorn main:app --reload` |
| 9 | Push to GitHub, deploy on Render, set env vars |
| 10 | Verify MongoDB indexes exist |

---

## Key Rules

- The Kaggle dataset is downloaded and processed ONCE via `scripts/load_papers.py`. Never at runtime.
- The arXiv API is never called anywhere in this project.
- There is ONE logical user: `"demo_user"`. No auth, no sessions.
- LinUCB state is a single MongoDB document, loaded and saved on every swipe.
- Feature dimension is fixed at `d = 8`. Do not change this without wiping and re-initializing the bandit state document.
- Keep functions small and single-purpose. No over-engineering.
