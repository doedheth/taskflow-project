# PDF Conversion Instructions

This workflow guides you through converting a Markdown file (which may contain Mermaid diagrams) into a high-quality PDF.

## Context
The user wants to convert a specific Markdown file to PDF. The environment has `md-to-pdf` installed, which supports Mermaid rendering out of the box (via Puppeteer).

## Steps

### 1. File Selection
- Ask the user which Markdown file they would like to convert if it hasn't been specified.
- Verify the file exists.

### 2. Validation
- Check the Markdown content for Mermaid blocks (fenced with ` ```mermaid `).
- Ensure the Mermaid syntax is valid (optional but recommended if conversion fails).

### 3. Execution
- Run the `md-to-pdf` command.
- Standard usage: `md-to-pdf [path-to-file]`
- The output file will typically be created in the same directory with a `.pdf` extension.

### 4. Verification
- Confirm the PDF file was created successfully.
- Inform the user of the location of the generated PDF.

## Troubleshooting
- If Mermaid diagrams don't render, ensure the Mermaid blocks are properly closed.
- If the tool fails, check if there are any Puppeteer-related errors (often related to sandbox or missing dependencies on some systems, though `md-to-pdf` usually handles this).
