#!/bin/bash
# Script to run backend tests with various options

set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BACKEND_DIR"

echo "================================"
echo "Lords-of-library Backend Test Runner"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${YELLOW}pytest not found. Installing dependencies...${NC}"
    pip install -r requirements.txt
fi

# Parse arguments
TEST_MODE="${1:-all}"

case "$TEST_MODE" in
    all)
        echo -e "${GREEN}Running all tests...${NC}"
        pytest test/ -v
        ;;
    quick)
        echo -e "${GREEN}Running quick smoke tests...${NC}"
        pytest test/test_endpoints.py::TestHealthCheck -v
        pytest test/test_endpoints.py::TestConnectionsEndpoints -v
        ;;
    feed)
        echo -e "${GREEN}Running feed endpoint tests...${NC}"
        pytest test/test_endpoints.py::TestFeedEndpoints -v
        ;;
    swipe)
        echo -e "${GREEN}Running swipe endpoint tests...${NC}"
        pytest test/test_endpoints.py::TestSwipeEndpoints -v
        ;;
    saved)
        echo -e "${GREEN}Running saved endpoint tests...${NC}"
        pytest test/test_endpoints.py::TestSavedEndpoints -v
        ;;
    connections)
        echo -e "${GREEN}Running connections endpoint tests...${NC}"
        pytest test/test_endpoints.py::TestConnectionsEndpoints -v
        ;;
    integration)
        echo -e "${GREEN}Running integration tests...${NC}"
        pytest test/test_endpoints.py::TestEndpointIntegration -v
        ;;
    coverage)
        echo -e "${GREEN}Running tests with coverage report...${NC}"
        if ! command -v coverage &> /dev/null; then
            pip install pytest-cov
        fi
        pytest test/ --cov=. --cov-report=html --cov-report=term-missing
        echo -e "${GREEN}Coverage report generated in htmlcov/index.html${NC}"
        ;;
    parallel)
        echo -e "${GREEN}Running tests in parallel...${NC}"
        if ! command -v pytest-xdist &> /dev/null; then
            pip install pytest-xdist
        fi
        pytest test/ -n auto -v
        ;;
    watch)
        echo -e "${GREEN}Running tests in watch mode...${NC}"
        if ! command -v pytest-watch &> /dev/null; then
            pip install pytest-watch
        fi
        ptw test/
        ;;
    health)
        echo -e "${GREEN}Running health check test...${NC}"
        pytest test/test_endpoints.py::TestHealthCheck::test_health_check_returns_ok -v
        ;;
    *)
        echo -e "${RED}Unknown test mode: $TEST_MODE${NC}"
        echo ""
        echo "Usage: $0 [mode]"
        echo ""
        echo "Available modes:"
        echo "  all          - Run all tests"
        echo "  quick        - Run quick smoke tests (health + connections)"
        echo "  feed         - Run feed endpoint tests only"
        echo "  swipe        - Run swipe endpoint tests only"
        echo "  saved        - Run saved endpoint tests only"
        echo "  connections  - Run connections endpoint tests only"
        echo "  integration  - Run integration tests"
        echo "  coverage     - Run with coverage report"
        echo "  parallel     - Run tests in parallel"
        echo "  watch        - Run in watch mode (auto-rerun on changes)"
        echo "  health       - Run health check only"
        echo ""
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tests passed!${NC}"
else
    echo -e "${RED}✗ Tests failed!${NC}"
    exit 1
fi
