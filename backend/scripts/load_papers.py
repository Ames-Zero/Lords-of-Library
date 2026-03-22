#!/usr/bin/env python3
"""
One-time script to load arXiv papers from metadata JSON into MongoDB.
Run locally only, never deploy to Render.

Usage:
    1. Download arxiv-metadata-oai-snapshot.json from Kaggle
    2. Extract to backend/data/arxiv-metadata-oai-snapshot.json
    3. Run this script: python scripts/load_papers.py
    
Metadata fields:
    - id: ArXiv ID
    - authors: Authors (comma-separated string)
    - title: Paper title
    - abstract: Paper abstract
    - categories: ArXiv categories/tags
"""

import json
import os
import sys
from datetime import datetime
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import MONGO_URI, DB_NAME, CATEGORIES

# Target categories
TARGET_CATEGORIES = set(CATEGORIES)

def parse_authors(authors_str):
    """
    Parse authors from comma-separated string.
    Expected format: "Author One, Author Two, Author Three"
    Returns list of author names.
    """
    if not authors_str:
        return []
    
    # Split by comma and strip whitespace
    authors = [author.strip() for author in authors_str.split(',')]
    return [author for author in authors if author]  # Filter empty strings

def parse_date(date_str):
    """
    Parse date string to datetime.
    Formats: YYYY-MM-DD, YYYYMMDD, or ISO format
    Returns None if parsing fails.
    """
    if not date_str:
        return None
    try:
        # Format: YYYY-MM-DD
        if '-' in date_str:
            return datetime.fromisoformat(date_str)
        # Format: YYYYMMDD
        elif len(date_str) == 8 and date_str.isdigit():
            return datetime.strptime(date_str, "%Y%m%d")
        else:
            return datetime.fromisoformat(date_str)
    except:
        return None

def should_include_paper(categories_str):
    """Check if paper has at least one target category."""
    if not categories_str:
        return False
    
    paper_categories = set(categories_str.split())
    return bool(paper_categories & TARGET_CATEGORIES)

def get_primary_category(categories_str):
    """Get primary category (first one in the string)."""
    if not categories_str:
        return "cs.CL"
    
    categories = categories_str.split()
    return categories[0] if categories else "cs.CL"

def load_papers_from_kaggle(dataset_path, max_papers=1000):
    """
    Load papers from Kaggle JSON file and insert into MongoDB.
    
    Args:
        dataset_path: Path to arxiv-metadata-oai-snapshot.json
        max_papers: Maximum number of papers to load (default 1000)
    """
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    
    # Verify connection
    try:
        client.admin.command('ping')
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return False
    
    db = client[DB_NAME]
    papers_collection = db["papers"]
    
    print(f"Connecting to MongoDB: {DB_NAME}")
    print(f"Target categories: {TARGET_CATEGORIES}")
    print(f"Loading papers from: {dataset_path}")
    print(f"Max papers to load: {max_papers}\n")
    
    # Create indexes
    print("Creating indexes...")
    papers_collection.create_index([("primary_category", 1), ("published_at", -1)])
    print("Indexes created.\n")
    
    loaded_count = 0
    skipped_count = 0
    
    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                if loaded_count >= max_papers:
                    print(f"\nReached max papers limit ({max_papers}). Stopping.")
                    break
                
                try:
                    paper_data = json.loads(line)
                    
                    # Check if paper has target categories
                    categories_str = paper_data.get("categories", "")
                    if not should_include_paper(categories_str):
                        skipped_count += 1
                        continue
                    
                    # Parse paper data
                    arxiv_id = paper_data.get("id")
                    if not arxiv_id:
                        continue
                    
                    paper_doc = {
                        "_id": arxiv_id,
                        "title": paper_data.get("title", "").strip(),
                        "abstract": paper_data.get("abstract", "").strip(),
                        "authors": parse_authors(paper_data.get("authors", "")),
                        "categories": categories_str.split(),
                        "primary_category": get_primary_category(categories_str),
                        "published_at": parse_date(paper_data.get("update_date")) or datetime.now(),
                        "arxiv_url": f"https://arxiv.org/abs/{arxiv_id}",
                        "pdf_url": f"https://arxiv.org/pdf/{arxiv_id}",
                        "submitter": paper_data.get("submitter", ""),
                        "comments": paper_data.get("comments", ""),
                        "journal_ref": paper_data.get("journal-ref", ""),
                        "doi": paper_data.get("doi", "")
                    }
                    
                    # Upsert into MongoDB
                    papers_collection.update_one(
                        {"_id": arxiv_id},
                        {"$set": paper_doc},
                        upsert=True
                    )
                    
                    loaded_count += 1
                    
                    # Print progress every 100 papers
                    if loaded_count % 100 == 0:
                        print(f"Loaded {loaded_count} papers (skipped {skipped_count})")
                
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    print(f"Error processing line {line_num}: {e}")
                    continue
        
        print(f"\n✓ Successfully loaded {loaded_count} papers into collection '{DB_NAME}.papers'")
        print(f"  Skipped: {skipped_count} papers (no matching categories)")
        
    except FileNotFoundError:
        print(f"Error: Dataset file not found at {dataset_path}")
        print("Please download the dataset first:")
        print("  kaggle datasets download --unzip Cornell-University/arxiv -p ./data")
        return False
    
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    finally:
        client.close()
    
    return True

if __name__ == "__main__":
    # Default dataset path
    dataset_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
        "arxiv-metadata-oai-snapshot.json"
    )
    
    # Allow custom path as argument
    if len(sys.argv) > 1:
        dataset_path = sys.argv[1]
    
    dataset_path = os.path.abspath(dataset_path)
    
    success = load_papers_from_kaggle(dataset_path, max_papers=1000)
    sys.exit(0 if success else 1)
