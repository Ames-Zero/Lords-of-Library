# ArXiv Swipe Recommender Demo – Technical Product Requirements

## 1. Overview

This document describes the technical product requirements for a progressive web application (PWA) that lets a user swipe through scientific papers from arXiv in a Tinder-like interface, with a bandit-based recommender (LinUCB) adapting recommendations based on swipe feedback.

The scope of this version is a single-user demo backed by a fixed corpus of approximately 1000 preloaded arXiv papers stored in MongoDB. There is no authentication or multi-user support in this version.

## 2. Goals and Non‑Goals

### 2.1 Goals

- Provide a mobile-friendly swipe interface for research papers (“Tinder for papers”).
- Demonstrate a contextual bandit (LinUCB-style) recommender that updates preferences based on swipe interactions.
- Persist swipes and saved papers so the user can revisit them.
- Showcase a simple “connections” tab (even if backed by static data) to hint at social/discovery features.
- Architect the system so it can later be extended to multiple users and live arXiv ingestion with minimal redesign.

### 2.2 Non‑Goals (for this demo)

- No user accounts, signup, or authentication.
- No real-time ingestion from the arXiv API during normal app usage.
- No full-text search, citation counts, or advanced analytics.
- No real networking between multiple users (connections may be static or mocked).

## 3. User Experience and Flows

### 3.1 Primary User Persona

- Single demo persona, representing a researcher or grad student interested in a subset of arXiv categories (for example, machine learning and NLP).

### 3.2 Core Flows

#### 3.2.1 Onboarding (Optional for Demo)

- User is presented with a brief onboarding screen explaining the concept.
- User optionally selects topic interests from a list of arXiv categories (e.g., cs.CL, cs.LG, cs.AI, stat.ML).
- The app stores these initial interests locally and optionally sends them to the backend to initialize the bandit state.

#### 3.2.2 Swipe Feed

- The swipe screen displays a stack of paper cards.
- Each card shows:
  - Title.
  - Authors (truncated list with “+N more” for long author lists).
  - Primary and secondary categories.
  - Publication date.
  - Abstract snippet with an expandable section for full abstract.
  - Links to view the paper on arXiv and open the PDF.
- User interactions:
  - Swipe right or tap a “Save” button to save the paper and signal interest.
  - Swipe left or tap a “Skip” button to discard the paper.
  - Optional middle action like “More info” opens a detailed view, but this is not required for the demo.
- The frontend optimistically updates the card stack (next card slides in) and sends the swipe event to the backend.

#### 3.2.3 Saved Papers Tab

- Displays a list of papers the user has swiped right on.
- Supports basic sorting (by saved date or publication date).
- Tapping a paper opens a detail view or navigates directly to the arXiv page.

#### 3.2.4 Connections Tab

- Shows a list of “similar readers” with:
  - Display name or alias.
  - A short bio or tag line.
  - A set of topic tags indicating their interests.
- For the demo, this can be backed by static data or a simple API that returns a fixed list.
- No messaging or follow functionality is required.

## 4. System Architecture

### 4.1 High-Level Components

- **Frontend**
  - Next.js (React) with shadcn UI components.
  - Deployed on Vercel.
  - PWA capabilities (manifest, basic service worker for assets).
- **Backend**
  - FastAPI application in Python.
  - Deployed on Render.
  - Exposes REST endpoints consumed by the frontend.
- **Database**
  - MongoDB Atlas cluster.
  - Stores preloaded papers, swipe events, saved papers, and bandit state.

### 4.2 Runtime Data Flow (Single User)

1. Frontend requests a batch of recommended papers from the backend.
2. Backend queries MongoDB for candidate papers (from the preloaded corpus), filters out papers already swiped, and scores candidates using LinUCB.
3. Backend returns a batch of top-ranked papers to the frontend.
4. User swipes on a paper; frontend sends a swipe event to the backend.
5. Backend logs the swipe, updates the bandit state, and may precompute updated scores for the next request.

For the demo, all interactions are associated with a single logical user identifier (e.g., "demo_user").

## 5. Data Model

### 5.1 Papers Collection (`papers`)

Stores metadata and optional precomputed features for approximately 1000 arXiv papers.

- `_id`: string (arxiv_id).
- `title`: string.
- `abstract`: string.
- `authors`: array of strings.
- `primary_category`: string (e.g., "cs.CL").
- `categories`: array of strings (all arXiv categories assigned to the paper).
- `published_at`: datetime.
- `updated_at`: datetime (optional).
- `arxiv_url`: string.
- `pdf_url`: string.
- `feature_vector`: optional array of floats (precomputed vector for bandit, if used).
- `category_vector`: optional array or object encoding one-hot/multi-hot category representation.

Recommended indexes:

- Index on `primary_category` and `published_at` (compound) for retrieving recent papers in relevant categories.
- Optional text index on `title` or `abstract` for basic search (not required for demo).

### 5.2 Swipes Collection (`swipes`)

Immutable log of user swipe events.

- `_id`: ObjectId.
- `user_id`: string (for demo, a constant like "demo_user").
- `paper_id`: string (arxiv_id, referencing `papers._id`).
- `direction`: string enum (`"right"` or `"left"`).
- `timestamp`: datetime.

Indexes:

- Compound index on (`user_id`, `paper_id`) to quickly determine whether the user has already swiped a paper.

### 5.3 Saved Papers Collection (`saved_papers`)

Stores which papers have been saved (right-swiped) by the demo user.

- `_id`: ObjectId.
- `user_id`: string ("demo_user").
- `paper_id`: string (arxiv_id).
- `saved_at`: datetime.

Indexes:

- Index on `user_id`.
- Optional compound index on (`user_id`, `saved_at`) for efficient sorting.

### 5.4 Bandit State Collection (`bandit_state`)

Stores the parameters for the single-user LinUCB model.

- `_id`: string (e.g., "demo_user").
- `A`: 2D matrix serialized as a nested list or flattened array.
- `b`: 1D vector as a list of floats.
- `alpha`: float (exploration parameter).
- `feature_dim`: integer (dimension of feature vectors).
- `updated_at`: datetime.

The backend loads this state at startup (or on first access) and updates it after each swipe. For a small demo, it is acceptable to read/write this document synchronously on each update.

## 6. Recommendation Logic (LinUCB)

### 6.1 Feature Design (Demo Version)

Because the demo uses a single logical user, most of the context will come from paper features, optionally combined with some static user characteristics.

Paper features may include:

- Category encoding: one-hot or multi-hot representation of primary and secondary categories.
- Recency: transformed publication age (for example, log of days since publication, or binned recency features).
- Basic text-derived signals:
  - Length of the title and abstract.
  - Presence of key terms (e.g., "transformer", "survey", "graph").
- Optional embedding vector from a small language model if available.

User context features (for the demo) can be minimal:

- A fixed vector encoding the demo persona’s initial interests (the categories selected during onboarding, or a hard-coded vector if onboarding is skipped).

The final feature vector for each paper is a concatenation of paper features and user context features.

### 6.2 LinUCB Scoring

For each candidate paper with feature vector \( x \):

- Compute expected reward \( \hat{r} \) as a linear function of \( x \) with the current parameter estimate.
- Compute an uncertainty term based on the inverse of \( A \) and \( x \).
- Total score is \( \hat{r} + \alpha \cdot \text{uncertainty} \), where \( \alpha \) is a tunable exploration parameter.

Papers are ranked by this score, optionally with basic diversity or freshness constraints (for example, do not show too many papers from the same category consecutively).

### 6.3 Bandit Updates from Swipes

On each swipe event:

- If direction is `"right"`, treat the reward as 1.
- If direction is `"left"`, treat the reward as 0 (or optionally ignore left swipes if a simpler behavior is desired).
- Use the paper’s feature vector and the reward to update \( A \) and \( b \) for LinUCB.
- Persist the updated bandit state back to MongoDB.

Because this is a demo and the feature dimension is modest, updates can be performed synchronously on each swipe.

## 7. Backend API Specification

### 7.1 Base Assumptions

- All endpoints are unauthenticated for the demo.
- The backend assumes a single logical `user_id` (e.g., "demo_user").

### 7.2 Endpoints

#### 7.2.1 Get Next Recommendations

- **Method**: GET
- **Path**: `/feed/next`
- **Query Parameters**:
  - `limit` (optional, default 20): number of papers to return.
- **Behavior**:
  - Determine the set of candidate papers:
    - From the `papers` collection.
    - Exclude papers already swiped by `demo_user`.
  - Compute LinUCB scores for each candidate using the current bandit state.
  - Sort candidates by score and apply any diversity or freshness rules.
  - Return the top `limit` papers.

#### 7.2.2 Submit Swipe

- **Method**: POST
- **Path**: `/swipe`
- **Request Body** (JSON):
  - `paper_id`: string.
  - `direction`: string enum (`"right"` or `"left"`).
- **Behavior**:
  - Log the swipe in the `swipes` collection.
  - If `direction` is `"right"`:
    - Insert a document into `saved_papers` for this `paper_id` if one does not already exist.
  - Compute the feature vector for `paper_id`.
  - Update the LinUCB bandit state using the reward (1 for right, 0 for left).
  - Persist the updated bandit state.
- **Response**:
  - Status of the operation (success/failure).

#### 7.2.3 Get Saved Papers

- **Method**: GET
- **Path**: `/saved`
- **Query Parameters**:
  - `sort` (optional, values `"saved_at"` or `"published_at"`, default `"saved_at"`).
- **Behavior**:
  - Query `saved_papers` for the demo user.
  - Join with `papers` collection to fetch metadata.
  - Sort according to the query parameter.
  - Return the list of saved papers.

#### 7.2.4 Connections (Static or Mocked)

- **Method**: GET
- **Path**: `/connections`
- **Behavior**:
  - Returns a static or simple list of “similar readers,” each with:
    - `name` or `alias`.
    - `bio`.
    - `topics`: list of strings.
  - May be implemented as a static JSON response for the demo.

## 8. Frontend Requirements

### 8.1 Technology Stack

- Next.js (latest stable) with App Router (or Pages Router if preferred for simplicity).
- shadcn UI for card components, buttons, lists, tabs, and layout.
- Deployed on Vercel with PWA configuration (manifest.json, icons, basic service worker).

### 8.2 Pages and Components

- **`/` (Home / Swipe)**:
  - Swipe card stack.
  - Actions for left/right swipe via gestures and buttons.
  - Uses `/feed/next` to fetch batches of papers.
- **`/saved`**:
  - List view of saved papers.
  - Calls `/saved` endpoint.
- **`/connections`**:
  - List of “similar readers” rendered from `/connections` endpoint or inline static data.
- **Shared Components**:
  - Layout with navigation tabs (Swipe, Saved, Connections).
  - Paper card component with title, authors, categories, abstract snippet, and action buttons.

### 8.3 State Management and Prefetching

- Maintain a local queue of upcoming papers fetched from `/feed/next`.
- When the local queue size falls below a threshold, trigger another fetch to keep the swipe experience smooth.
- Basic error handling and loading states for network calls.

## 9. PWA Behavior

- Installable PWA with app icon and name configured via manifest.
- Basic offline behavior:
  - Offline access to the app shell (layout, static assets).
  - Network retries for API requests; full offline reading is not required.

## 10. Data Ingestion for Demo Corpus

### 10.1 Offline Preloading Process

- A separate script or notebook (not part of the runtime backend) will:
  - Call the arXiv API or scrape data for selected categories to collect approximately 1000 papers.[^1]
  - Transform the JSON/XML feed into documents matching the `papers` collection schema.
  - Optionally compute feature vectors (category encoding, text embeddings) and store them.
  - Insert or upsert these documents into the MongoDB Atlas cluster.

During the demo, the backend only reads from MongoDB and does not call the arXiv API.

### 10.2 Corpus Composition Guidelines

- Focus on a small number of closely related categories (for example, cs.CL, cs.LG, cs.AI, stat.ML) to create a coherent experience.
- Include both recent and moderately older papers to make the feed feel realistic.

## 11. Observability and Debugging (Nice-to-Have)

For better demo reliability and debugging:

- Log all swipe events with timestamps to console and/or a log sink.
- Expose a simple admin/debug endpoint (optional) to:
  - Inspect current bandit state (or key statistics like number of right/left swipes).
  - Reset the bandit state and swipe history for the demo user.

## 12. Future Extensions (Beyond Demo)

The architecture is designed so that the following enhancements can be added later without major redesign:

- Multi-user support with authentication and per-user or per-segment bandit models.
- Scheduled ingestion worker that periodically pulls new papers from the arXiv API and updates the `papers` collection.[^1]
- More advanced feature representations using text embeddings and citation-based signals.
- Real user similarity computation for the connections tab based on overlapping saved papers and topic vectors.
- A/B testing different bandit algorithms and UI variants.

---

## References

1. [arxiv API documentation - Lukas Schwab](https://lukasschwab.me/arxiv.py/arxiv.html)

