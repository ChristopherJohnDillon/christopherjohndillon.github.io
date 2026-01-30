.PHONY: serve pdf install clean

# Start local Jekyll server with livereload
serve:
	bundle exec jekyll serve --livereload

# Generate CV PDF from HTML
pdf:
	python scripts/generate_cv_pdf.py

# Install dependencies
install:
	bundle install
	pip install playwright
	playwright install chromium

# Clean build artifacts
clean:
	rm -rf _site .jekyll-cache
