# Backend API Tests

Comprehensive test suite for the ArxiSwipe backend API using pytest and httpx.

## Running Tests

### Install Dependencies
```bash
pip install -r ../requirements.txt
```

### Run All Tests
```bash
pytest -v
```

### Run Specific Test Class
```bash
pytest test_endpoints.py::TestHealthCheck -v
```

### Run Specific Test
```bash
pytest test_endpoints.py::TestFeedEndpoints::test_feed_next_returns_papers -v
```

### Run with Coverage Report
```bash
pip install pytest-cov
pytest --cov=. --cov-report=html
```

### Run Tests in Parallel (faster)
```bash
pip install pytest-xdist
pytest -n auto
```

## Test Structure

### `conftest.py`
Pytest configuration file containing:
- `mock_database`: Mocks MongoDB collections with sample data
- `client`: FastAPI TestClient with mocked database
- `sample_paper` and `sample_papers`: Fixtures for test data

### `test_endpoints.py`
Test cases organized by endpoint:

#### **TestHealthCheck**
- `test_health_check_returns_ok`: Verify health endpoint returns status="ok"
- `test_health_check_response_format`: Check response format

#### **TestFeedEndpoints**
- `test_feed_next_returns_papers`: Verify papers are returned
- `test_feed_next_excludes_swiped_papers`: Check swiped papers are excluded
- `test_feed_next_returns_valid_paper_structure`: Validate paper schema
- `test_feed_next_returns_at_most_20_papers`: Verify pagination limit
- `test_feed_next_includes_arxiv_urls`: Check ArXiv URLs present

#### **TestSwipeEndpoints**
- `test_swipe_left_creates_entry`: Left swipe logging
- `test_swipe_right_creates_entry`: Right swipe logging
- `test_swipe_invalid_direction_fails`: Validation of direction field
- `test_swipe_missing_fields_fail`: Required field validation
- `test_swipe_updates_linucb_state`: LinUCB state update verification
- `test_multiple_swipes_on_same_paper`: Allow multiple swipes on same paper

#### **TestSavedEndpoints**
- `test_saved_returns_list`: Verify list response
- `test_saved_initially_empty`: New user has no saved papers
- `test_saved_contains_right_swiped_papers`: Right swipes appear in saved
- `test_saved_does_not_contain_left_swiped`: Left swipes don't appear
- `test_saved_papers_have_save_time`: Timestamp verification
- `test_saved_are_sorted_by_timestamp_desc`: Sorting verification

#### **TestConnectionsEndpoints**
- `test_connections_returns_list`: List response
- `test_connections_returns_non_empty_list`: Non-empty verification
- `test_connection_has_required_fields`: Schema validation
- `test_connection_topics_are_strings`: Data type validation

#### **TestEndpointIntegration**
- `test_full_user_journey`: Complete workflow test
- `test_swipe_different_directions`: Test mixed swipe directions
- `test_multiple_swipes_workflow`: Sequential swipes

#### **TestErrorHandling**
- `test_nonexistent_paper_swipe`: Handle missing papers
- `test_empty_paper_id`: Validation error handling
- `test_concurrent_operations`: Multiple operations

#### **TestResponseStatus**
- `test_all_endpoints_return_valid_status`: HTTP status verification
- `test_post_endpoints_require_json`: JSON body requirement
- `test_invalid_methods_not_allowed`: HTTP method validation

## Sample Data

The test suite uses 5 mock papers:
- **paper_001**: Deep Learning Fundamentals
- **paper_002**: Neural Networks for NLP
- **paper_003**: Computer Vision Advances
- **paper_004**: Reinforcement Learning: Theory and Practice
- **paper_005**: Transformers and Attention

All papers include:
- Title, abstract, authors
- Primary category and categories
- Published date, ArXiv URL, PDF URL
- Mock feature vectors for LinUCB testing

## Mock Database

The mock database implements MongoDB collection interface:
- `find()`: Query documents
- `find_one()`: Get single document
- `insert_one()`: Create document
- `update_one()`: Update document (with upsert)
- `delete_many()`: Delete multiple documents

## Mocking Strategy

All MongoDB operations are mocked using in-memory dictionaries. No actual database connection is required.

Database functions are patched:
- `database.get_papers_collection()`
- `database.get_swipes_collection()`
- `database.get_saved_collection()`
- `database.get_bandit_collection()`
- `database.close_connection()`

## Continuous Integration

To add to CI/CD pipeline before main merges, add to your GitHub Actions:

```yaml
- name: Run backend tests
  run: |
    cd backend
    pip install -r requirements.txt
    pytest --tb=short
```

## Test Coverage

Current test coverage:
- ✅ All 5 endpoints
- ✅ Request validation
- ✅ Response schema
- ✅ Error handling
- ✅ Integration workflows
- ✅ Edge cases
- ✅ HTTP status codes

## Future Improvements

- [ ] Add performance/load tests
- [ ] Test LinUCB scoring algorithm in detail
- [ ] Add stress tests for concurrent users
- [ ] Mock external API calls
- [ ] Database transaction tests
