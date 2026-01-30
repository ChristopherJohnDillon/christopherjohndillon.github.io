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
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Playwright not installed. Run:")
    print("  pip install playwright")
    print("  playwright install chromium")
    exit(1)


async def generate_pdf():
    # Paths
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    cv_html = repo_root / "cv" / "index.html"
    output_pdf = repo_root / "cv" / "Christopher_Dillon.pdf"

    if not cv_html.exists():
        print(f"Error: CV HTML not found at {cv_html}")
        return

    print(f"Generating PDF from: {cv_html}")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load the HTML file directly
        await page.goto(f"file://{cv_html.absolute()}")

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
