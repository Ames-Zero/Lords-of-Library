# Copilot Instructions : Lords-of-Library Backend

## Project Context

You are helping build the backend for **ArxiSwipe**, a Tinder-style research paper recommender PWA.
Full technical details are in:
- `docs/ArXiv_Swipe_Recommender_Demo_Technical_Product_Requirements.md` — Technical Product Requirements Document
- `docs/Backend-Plan.md` — Step-by-step backend implementation plan

Always refer to these documents before writing or suggesting code.

---

## Stack

- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Database**: MongoDB Atlas via `pymongo`
- **ML**: NumPy only (no sklearn, no torch) — LinUCB is implemented from scratch
- **Deployment**: Render
- **Secrets**: via `.env` loaded with `python-dotenv`

---

## Core Rules

- There is **one logical user**: `"demo_user"`. No authentication, no sessions, no JWTs.
- The **arXiv API is never called at runtime**. All papers come from MongoDB, preloaded via `scripts/load_papers.py`.
- **LinUCB state** is a single MongoDB document (`bandit_state` collection, `_id = "demo_user"`). Load it at the start of every relevant request, save it after every swipe.
- Feature dimension is fixed at **`d = 8`**. Never change this without wiping the bandit state document.
- Keep all functions **small and single-purpose**. No over-engineering.

---

## Folder Structure

```
backend/
├── .env                    # never commit
├── .env.example
├── requirements.txt
├── main.py
├── config.py
├── database.py
├── models.py
├── routers/
│   ├── feed.py
│   ├── swipe.py
│   ├── saved.py
│   └── connections.py
├── recommender/
│   └── linucb.py
└── scripts/
    └── load_papers.py      # run once locally, never on Render
```

---

## LinUCB Rules

- Implement in `recommender/linucb.py` using **NumPy only**.
- Feature vector shape: `(8,)` — 4-dim category one-hot + 1-dim recency + 3-dim title length one-hot.
- Score formula: `theta.T @ x + alpha * sqrt(x.T @ A_inv @ x)` where `theta = A_inv @ b`.
- Update rule on swipe: `A += outer(x, x)`, `b += reward * x` where reward is `1` (right) or `0` (left).
- Always load state from MongoDB before scoring or updating. Always save state back after updating.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/feed/next` | Returns top 20 scored papers not yet swiped |
| POST | `/swipe` | Logs swipe, updates LinUCB state |
| GET | `/saved` | Returns right-swiped papers for demo_user |
| GET | `/connections` | Returns static list of similar users |
| GET | `/` | Health check — returns `{ "status": "ok" }` |

---

## MongoDB Collections

- `papers` — preloaded arXiv metadata (`_id` = arxiv_id)
- `swipes` — immutable swipe event log
- `saved_papers` — right-swiped papers for demo_user
- `bandit_state` — single document holding LinUCB `A` matrix and `b` vector

---

## What NOT to Do

- Do not call the arXiv API anywhere in the runtime code.
- Do not add authentication or user management.
- Do not use ML libraries (sklearn, torch, etc.) for LinUCB — NumPy only.
- Do not hardcode `MONGO_URI` or any secrets in code — always use `config.py`.
- Do not load the entire Kaggle JSON file into memory — stream it line by line (load script only).
- Do not deploy `scripts/` or the Kaggle dataset to Render.
