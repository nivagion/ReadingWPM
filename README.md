# ReadingWPM

A local reading-speed website for practicing word-per-minute reading with saved texts, keyboard speed controls, and a dark reader-focused interface.

## Run locally

```powershell
node server.js
```

Then open `http://127.0.0.1:3000`.

## Notes

- Texts are stored in the browser with `localStorage`, so no database setup is required.
- `ArrowUp` and `ArrowDown` adjust reading speed by `5 WPM`.
- `Space` pauses or resumes reading, and you can switch between `1`, `2`, or `3` words at once.
