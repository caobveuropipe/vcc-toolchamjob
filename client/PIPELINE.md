# Project Development Pipeline

This document outlines the workflow for developing, testing, and deploying the **Module Hiệu Suất** project using `npm` and `clasp`.

## Prerequisites

1.  **Node.js**: Ensure Node.js is installed on your machine.
2.  **Dependencies**: Run `npm install` to install the required tools (specifically `@google/clasp`).

## Available Commands

We have configured several `npm` scripts to streamline your workflow. You can run these from your terminal.

| Command | Description |
| :--- | :--- |
| `npm run status` | Checks which files have local changes that differ from the server. |
| `npm run push` | Uploads your local files to the Google Apps Script server. |
| `npm run watch` | Automatically uploads files whenever you save a change. Great for active development. |
| `npm run pull` | Downloads the latest files from the server (useful if someone else edited online). |
| `npm run version` | Creates a new immutable version of the script. |
| `npm run deploy` | Deploys the current version as a web app or executable. |

## Recommended Workflow

1.  **Start Development**:
    - Run `npm run watch` to start the auto-uploader.
    - Make changes to your `.html`, `.js`, or `.gs` files.
    - The watcher will automatically push them to the script editor.

2.  **Verify & Test**:
    -Refresh the Google Apps Script editor or your Web App to see changes.

3.  **Deployment**:
    - Once satisfied with changes, stop the watcher (Ctrl+C).
    - Run `npm run version` to snapshot your code.
    - Run `npm run deploy` to publish the new version.

## Project Structure

- **.clasp.json**: Configuration file linking this folder to the Google Apps Script project ID.
- **package.json**: Manages dependencies and defines the scripts listed above.
