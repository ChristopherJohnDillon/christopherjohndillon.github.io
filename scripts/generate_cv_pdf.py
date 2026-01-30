#!/usr/bin/env python3
"""
Generate PDF from CV HTML page using Playwright (headless Chrome).

Usage:
    python scripts/generate_cv_pdf.py

Requirements:
    pip install playwright
    playwright install chromium
"""

import asyncio
import os
import subprocess
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Playwright not installed. Run:")
    print("  pip install playwright")
    print("  playwright install chromium")
    exit(1)

# Live site URL
LIVE_CV_URL = "https://christopherjohndillon.com/cv/"


async def generate_pdf():
    # Paths
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    output_pdf = repo_root / "cv" / "Christopher_Dillon.pdf"

    # Check if running in CI (GitHub Actions)
    is_ci = os.environ.get("CI") == "true" or os.environ.get("GITHUB_ACTIONS") == "true"

    if is_ci:
        # In CI, fetch from the live deployed site
        cv_url = LIVE_CV_URL
        print(f"Running in CI - fetching from live site: {cv_url}")
    else:
        # Locally, use the built site
        cv_html_built = repo_root / "_site" / "cv" / "index.html"
        cv_html_source = repo_root / "cv" / "index.html"

        # Build the site first if _site doesn't exist or is outdated
        if not cv_html_built.exists() or cv_html_source.stat().st_mtime > cv_html_built.stat().st_mtime:
            print("Building Jekyll site...")
            subprocess.run(["bundle", "exec", "jekyll", "build"], cwd=repo_root, check=True)

        if not cv_html_built.exists():
            print(f"Error: Built CV HTML not found at {cv_html_built}")
            return

        cv_url = f"file://{cv_html_built.absolute()}"
        print(f"Generating PDF from: {cv_html_built}")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load the CV page
        await page.goto(cv_url, wait_until="networkidle")

        # Wait for fonts to load
        await page.wait_for_timeout(1000)

        # Generate PDF
        await page.pdf(
            path=str(output_pdf),
            format="A4",
            margin={
                "top": "0.5in",
                "right": "0.5in",
                "bottom": "0.5in",
                "left": "0.5in"
            },
            print_background=True,
        )

        await browser.close()

    print(f"PDF generated: {output_pdf}")
    print(f"Size: {output_pdf.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    asyncio.run(generate_pdf())
