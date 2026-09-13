# ReadingWPM

## Overview

ReadingWPM is a lightweight browser app for paced reading practice. Paste or save a text, choose a reading speed and chunk size, and follow the focused word display without creating an account or configuring a database.

The project is a functional local prototype built with plain web technologies and a dependency-free Node.js static server.

## Features

- Adjustable reading speed from 50 to 1,000 words per minute
- One-, two-, or three-word reading chunks
- Adjustable reader font size
- Full-screen focus mode while a session is running
- Pause, resume, restart, and progress tracking
- Saved text library with titles, word counts, previews, and editing
- Automatic draft, library, and reader-setting persistence in the browser
- Responsive dark interface for desktop and smaller screens

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js built-in HTTP server
- Browser `localStorage`

No runtime packages or external services are required.

## Project Structure

```text
index.html    Page structure and controls
styles.css    Responsive layout, reader, and focus-mode styling
script.js     Reading timer, text library, settings, and keyboard controls
server.js     Small local static-file server
package.json  Project metadata and local commands
```

## Setup

Install Node.js 18 or newer. There are no npm dependencies to install.

Optionally verify the JavaScript syntax before running:

```bash
npm run check
```

## Running Locally

```bash
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in a modern browser.

## Controls

- **Start / Resume:** begin or continue the active text
- **Pause:** stop the timer at the current position
- **Reset:** return to the beginning of the active text
- **Space:** start, pause, or resume when focus is outside an input field
- **Arrow Up / Arrow Down:** change speed in 5 WPM steps
- **Words at once:** switch between one, two, or three displayed words

Double-clicking a saved text loads it and starts a reading session.

## Storage Behavior

Texts, the current draft, and reading settings are stored only in the browser's `localStorage`. The Node.js server does not receive or persist reading content. Clearing site data, switching browsers, or using another device will not carry the library across.

## Limitations

- There is no account, cloud sync, database, or multi-device library.
- Saved texts cannot currently be imported or exported.
- Progress is session-based; the app does not record reading analytics over time.
- Automated browser tests and a hosted demo are not included yet.

## Future Improvements

- Add JSON or plain-text import and export.
- Add optional reading-session history and simple progress charts.
- Add automated interaction and accessibility tests.
- Publish a hosted demo and add a short README screenshot or GIF.

## License

No repository-level license has been added. All rights remain with the author unless a license is added later.
