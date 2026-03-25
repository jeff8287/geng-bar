#!/usr/bin/env python
"""Run the scraper from project root.

Usage (from any directory):
    python /path/to/cocktail/run_scraper.py --source all --limit 50
    python /path/to/cocktail/run_scraper.py --source liquor_com --limit 50
    python /path/to/cocktail/run_scraper.py --dry-run
"""
import sys
from pathlib import Path

# Ensure the project root and backend/ are on sys.path so that both
# 'scraper' and 'app.database' are importable regardless of cwd.
root = Path(__file__).parent
sys.path.insert(0, str(root / "backend"))
sys.path.insert(0, str(root))

from scraper.main import main

main()
