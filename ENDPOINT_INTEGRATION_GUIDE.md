# Backend Endpoint Integration Guide

## Overview
The Lords-of-Library backend provides a set of FastAPI endpoints that the frontend consumes through a Next.js proxy layer. All requests go through `/api/[...path]` which forwards to `http://localhost:8000`.

---

## Backend Endpoints Reference

### 1. **Health Check**
- **Endpoint**: `GET /`
- **URL in Frontend**: `/api/`
- **Purpose**: Verify backend is running
- **Request**: None
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```
- **Integration**: Can be used in `checkBackendHealth()` from `client-api.ts`

---

### 2. **Get Feed (Next Papers)**
- **Endpoint**: `GET /feed/next`
- **URL in Frontend**: `/api/feed/next`
- **Purpose**: Fetch top 20 scored papers not yet swiped by the user
- **Request**: None (GET request)
- **Response**: Array of `PaperOut` objects
  ```json
  [
    {
      "id": "2401.12345",
      "title": "Deep Learning for NLP",
      "abstract": "...",
      "authors": ["Alice", "Bob"],
      "primaryCategory": "cs.LG",
      "categories": ["cs.LG", "stat.ML"],
      "publishedAt": "2024-01-15T10:30:00",
      "arxivUrl": "https://arxiv.org/abs/2401.12345",
      "pdfUrl": "https://arxiv.org/pdf/2401.12345"
    }
  ]
  ```
- **How LinUCB Works**:
  - Loads current LinUCB state from MongoDB
  - Scores all unreviewed papers using LinUCB algorithm
  - Returns top 20 by score
- **Integration**: `fetchNextPapers()` in `client-api.ts`
- **Frontend Usage**: [Main page](src/app/page.tsx) - Automatically fetches on mount and refreshes feed

---

### 3. **Log Swipe**
- **Endpoint**: `POST /swipe`
- **URL in Frontend**: `/api/swipe`
- **Purpose**: Record user swipe and update recommendation algorithm state
- **Request**:
  ```json
  {
    "paper_id": "2401.12345",
    "direction": "left" | "right"
  }
  ```
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```
- **Backend Side Effects**:
  - Records swipe event in `swipes` collection (immutable log)
  - If direction is "right", saves to `saved_papers` collection
  - Updates LinUCB bandit state (`A` matrix and `b` vector)
  - LinUCB update formula:
    - Compute feature vector from paper (8-dim: category one-hot + recency + title length one-hot)
    - Reward = 1 for right swipe, 0 for left swipe
    - `A_new = A + x ⊗ x`
    - `b_new = b + reward * x`
    - Save updated state back to MongoDB
- **Integration**: `logSwipe(paperId, direction)` in `client-api.ts`
- **Frontend Usage**: [Main page](src/app/page.tsx) - Automatically called when swipe gesture completes

---

### 4. **Get Saved Papers**
- **Endpoint**: `GET /saved`
- **URL in Frontend**: `/api/saved`
- **Purpose**: Fetch all right-swiped (saved) papers for the user
- **Request**: None (GET request)
- **Response**: Array of `SavedPaperOut` objects (extends Paper with `savedAt`)
  ```json
  [
    {
      "id": "2401.12345",
      "title": "Deep Learning for NLP",
      "abstract": "...",
      "authors": ["Alice", "Bob"],
      "primaryCategory": "cs.LG",
      "categories": ["cs.LG", "stat.ML"],
      "publishedAt": "2024-01-15T10:30:00",
      "arxivUrl": "https://arxiv.org/abs/2401.12345",
      "pdfUrl": "https://arxiv.org/pdf/2401.12345",
      "savedAt": "2024-01-20T15:45:00"
    }
  ]
  ```
- **Sorting**: Results are sorted by `savedAt` descending (newest first)
- **Integration**: `fetchSavedPapers()` in `client-api.ts`
- **Frontend Usage**: [Saved page](src/app/saved/page.tsx) - Fetches on page load with loading states

---

### 5. **Get Connections**
- **Endpoint**: `GET /connections`
- **URL in Frontend**: `/api/connections`
- **Purpose**: Get list of similar researchers (static list)
- **Request**: None (GET request)
- **Response**: Array of `ConnectionOut` objects
  ```json
  [
    {
      "name": "Dr. Alice Chen",
      "bio": "ML researcher focused on NLP and transfer learning",
      "topics": ["NLP", "Transfer Learning", "Transformers"]
    }
  ]
  ```
- **Integration**: `getConnectionProfiles()` in [api.ts](src/lib/api.ts) (server-side) or via direct fetch
- **Frontend Usage**: [Connections page](src/app/connections/page.tsx) - Server-side fetch with fallback to mock data

---

## Frontend Integration Architecture

### Files Added/Modified

#### New Files
- **`frontend/src/lib/client-api.ts`**: Browser-side API client
  - `fetchNextPapers()`: Get feed
  - `logSwipe()`: Log swipe action
  - `fetchSavedPapers()`: Get saved papers
  - `checkBackendHealth()`: Health check
  - Includes data transformation from backend response to frontend `Paper` type

#### Modified Files
- **`backend/models.py`**: 
  - Added Pydantic `Config` with `by_alias` serialization
  - Added `Field` aliases for snake_case → camelCase conversion
  - Fields with aliases:
    - `primary_category` → `primaryCategory`
    - `published_at` → `publishedAt`
    - `arxiv_url` → `arxivUrl`
    - `pdf_url` → `pdfUrl`
    - `saved_at` → `savedAt`

- **`backend/routers/feed.py`**: Added response model type hints for proper JSON serialization

- **`backend/routers/saved.py`**: Added response model type hints for proper JSON serialization

- **`frontend/src/app/page.tsx`**: 
  - Added state for papers fetched from backend
  - Added `useEffect` to fetch papers on mount with fallback to mock data
  - Updated `handleSwipe` to log swipes to backend
  - Added error handling with graceful fallback

- **`frontend/src/app/saved/page.tsx`**: 
  - Made component client-side (`"use client"`)
  - Added state management for loading/error
  - Integrated `fetchSavedPapers()`
  - Added loading skeleton and empty state

---

## Data Flow

### Feed Generation Flow
```
1. User visits app
   ↓
2. Frontend calls GET /api/feed/next
   ↓
3. Backend endpoint:
   - Loads LinUCB state from MongoDB
   - Fetches all papers from papers collection
   - Gets user's swiped paper IDs from swipes collection
   - Filters out swiped papers
   - Scores remaining papers using LinUCB
   - Returns top 20 papers
   ↓
4. Frontend displays papers (with fallback to mock data if request fails)
```

### Swipe Recording Flow
```
1. User completes swipe gesture
   ↓
2. Frontend calls POST /api/swipe with {paper_id, direction}
   ↓
3. Backend updates:
   - Inserts record into swipes collection
   - If right swipe: inserts/updates saved_papers collection
   - Loads current LinUCB state
   - Computes paper feature vector
   - Updates A and b matrices
   - Saves updated state
   ↓
4. Frontend moves to next card
```

---

## Error Handling

### Frontend Error Handling
- All API functions have try-catch blocks
- Errors are logged to console
- Failed requests gracefully fall back to mock data
- Error messages displayed to user when appropriate
- Network failures don't crash the app

### Backend Considerations
- All endpoints use `DEMO_USER` constant for user identification
- No authentication required (demo only)
- MongoDB connection errors should return 500
- Invalid paper IDs in swipe requests are silently ignored

---

## Field Name Conversions

### Backend → Frontend Conversion
The backend returns snake_case field names in JSON, but frontend expects camelCase:

| Backend (JSON) | Frontend Type | Purpose |
|---|---|---|
| `primary_category` | `primaryCategory` | ArXiv category code |
| `published_at` | `publishedAt` | Publication timestamp |
| `arxiv_url` | `arxivUrl` | Link to arXiv abstract |
| `pdf_url` | `pdfUrl` | Link to PDF |
| `saved_at` | `savedAt` | When paper was saved |

This conversion is handled in `client-api.ts` `transformPaper()` function.

---

## Testing Endpoints

### Using curl (from command line)
```bash
# Health check
curl http://localhost:8000/

# Get next papers
curl http://localhost:8000/feed/next

# Log a swipe
curl -X POST http://localhost:8000/swipe \
  -H "Content-Type: application/json" \
  -d '{"paper_id": "2401.12345", "direction": "right"}'

# Get saved papers
curl http://localhost:8000/saved

# Get connections
curl http://localhost:8000/connections
```

### From Frontend (in browser console)
```javascript
// Test with client-api functions
import { fetchNextPapers, logSwipe, fetchSavedPapers, checkBackendHealth } from "@/lib/client-api";

// Check backend
await checkBackendHealth();

// Fetch feed
const papers = await fetchNextPapers();
console.log(papers);

// Log a swipe (use actual paper ID)
await logSwipe(papers[0].id, "right");

// Fetch saved
const saved = await fetchSavedPapers();
console.log(saved);
```

---

## Environment Variables
- Backend: Connection uses `http://localhost:8000`
- Frontend proxy: `/api/[...path]` → `http://localhost:8000`
- Can be modified in [backend-api.ts](src/lib/backend-api.ts)

---

## Current Integration Status

✅ **Completed**
- Health check endpoint available
- Feed endpoint integrated with pagination
- Swipe logging integrated with LinUCB updates
- Saved papers endpoint integrated
- Connections endpoint available
- Field name conversion (snake_case ↔ camelCase)
- Error handling and fallbacks
- Loading states and skeleton UI

**Future Enhancements**
- Add `/user/me` endpoint for user profile
- Implement topic-based filtering on backend
- Add pagination/infinite scroll
- Add recommendation explanations (why was this paper recommended?)
