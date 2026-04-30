const STORAGE_KEY = "reading-wpm-library";
const SETTINGS_KEY = "reading-wpm-settings";
const DRAFT_KEY = "reading-wpm-draft";

const defaults = {
  chunkSize: 1,
  fontSize: 72,
  wpm: 300
};

const elements = {
  textTitle: document.querySelector("#text-title"),
  textInput: document.querySelector("#text-input"),
  newDraftButton: document.querySelector("#new-draft-btn"),
  saveTextButton: document.querySelector("#save-text-btn"),
  startFromEditorButton: document.querySelector("#start-from-editor-btn"),
  savedTexts: document.querySelector("#saved-texts"),
  savedTextTemplate: document.querySelector("#saved-text-template"),
  draftWordCount: document.querySelector("#draft-word-count"),
  selectedTextLabel: document.querySelector("#selected-text-label"),
  libraryCount: document.querySelector("#library-count"),
  readerStatus: document.querySelector("#reader-status"),
  readerActiveTitle: document.querySelector("#reader-active-title"),
  readerWord: document.querySelector("#reader-word"),
  readerSubtext: document.querySelector("#reader-subtext"),
  progressFill: document.querySelector("#progress-fill"),
  progressLabel: document.querySelector("#progress-label"),
  wpmRange: document.querySelector("#wpm-range"),
  wpmInput: document.querySelector("#wpm-input"),
  wpmValue: document.querySelector("#wpm-value"),
  fontRange: document.querySelector("#font-range"),
  fontInput: document.querySelector("#font-input"),
  fontValue: document.querySelector("#font-value"),
  chunkValue: document.querySelector("#chunk-value"),
  chunkButtons: Array.from(document.querySelectorAll(".segment-button")),
  startButton: document.querySelector("#start-btn"),
  pauseButton: document.querySelector("#pause-btn"),
  resetButton: document.querySelector("#reset-btn"),
  focusOverlay: document.querySelector("#focus-overlay"),
  focusTitle: document.querySelector("#focus-title"),
  focusWord: document.querySelector("#focus-word"),
  focusMeta: document.querySelector("#focus-meta")
};

const settings = loadFromStorage(SETTINGS_KEY, defaults);
const initialDraft = loadFromStorage(DRAFT_KEY, {
  body: "",
  selectedId: null,
  title: ""
});

const state = {
  chunkSize: clampNumber(settings.chunkSize, 1, 3, defaults.chunkSize),
  completed: false,
  currentIndex: 0,
  hasStarted: false,
  isReading: false,
  selectedId: null,
  sourceText: "",
  sourceTitle: "",
  texts: loadFromStorage(STORAGE_KEY, []),
  timerId: null,
  wpm: clampNumber(settings.wpm, 50, 1000, defaults.wpm),
  fontSize: clampNumber(settings.fontSize, 36, 132, defaults.fontSize),
  words: []
};

hydrateEditor();
syncSettingsInputs();
renderLibrary();
renderDraftMeta();

if (state.words.length) {
  renderReader();
} else {
  clearReader();
}

bindEvents();

function bindEvents() {
  elements.textTitle.addEventListener("input", handleDraftInput);
  elements.textInput.addEventListener("input", handleDraftInput);
  elements.newDraftButton.addEventListener("click", createNewDraft);
  elements.saveTextButton.addEventListener("click", saveText);
  elements.startFromEditorButton.addEventListener("click", startReading);
  elements.startButton.addEventListener("click", startReading);
  elements.pauseButton.addEventListener("click", pauseReading);
  elements.resetButton.addEventListener("click", resetReading);

  elements.wpmRange.addEventListener("input", () => setWpm(elements.wpmRange.value));
  elements.wpmInput.addEventListener("input", () => setWpm(elements.wpmInput.value));
  elements.fontRange.addEventListener("input", () => setFontSize(elements.fontRange.value));
  elements.fontInput.addEventListener("input", () => setFontSize(elements.fontInput.value));

  elements.chunkButtons.forEach((button) => {
    button.addEventListener("click", () => setChunkSize(button.dataset.chunkSize));
  });

  window.addEventListener("keydown", handleKeyboardShortcuts);
}

function hydrateEditor() {
  const firstSavedText = state.texts[0] || null;
  const selectedText =
    initialDraft.selectedId && state.texts.find((text) => text.id === initialDraft.selectedId);

  if (initialDraft.body.trim() || initialDraft.title.trim()) {
    state.selectedId = selectedText ? selectedText.id : null;
    elements.textTitle.value = initialDraft.title;
    elements.textInput.value = initialDraft.body;

    if (initialDraft.body.trim()) {
      prepareSession(
        normalizeTitle(initialDraft.title, initialDraft.body),
        initialDraft.body
      );
    }

    return;
  }

  if (selectedText) {
    loadTextIntoEditor(selectedText.id);
    return;
  }

  if (firstSavedText) {
    loadTextIntoEditor(firstSavedText.id);
  }
}

function handleDraftInput() {
  renderDraftMeta();
  persistDraft();
}

function createNewDraft() {
  pauseAndClearTimer();
  state.selectedId = null;
  state.completed = false;
  state.currentIndex = 0;
  state.hasStarted = false;
  state.isReading = false;
  state.sourceText = "";
  state.sourceTitle = "";
  state.words = [];
  elements.textTitle.value = "";
  elements.textInput.value = "";
  clearReader();
  renderLibrary();
  renderDraftMeta();
  persistDraft();
}

function saveText() {
  const body = elements.textInput.value.trim();

  if (!body) {
    updateStatus("Add some text first", "error");
    return;
  }

  const title = normalizeTitle(elements.textTitle.value, body);
  const now = new Date().toISOString();

  if (state.selectedId) {
    state.texts = state.texts.map((text) =>
      text.id === state.selectedId
        ? {
            ...text,
            body,
            title,
            updatedAt: now
          }
        : text
    );
  } else {
    const newText = {
      body,
      createdAt: now,
      id: crypto.randomUUID(),
      title,
      updatedAt: now
    };
    state.selectedId = newText.id;
    state.texts.unshift(newText);
  }

  sortTexts();
  elements.textTitle.value = title;
  persistLibrary();
  persistDraft();
  renderLibrary();
  renderDraftMeta();

  if (!state.isReading && !state.hasStarted) {
    prepareSession(title, body);
  }

  updateStatus("Saved locally", "idle");
}

function loadTextIntoEditor(id) {
  const selectedText = state.texts.find((text) => text.id === id);

  if (!selectedText) {
    return;
  }

  state.selectedId = selectedText.id;
  elements.textTitle.value = selectedText.title;
  elements.textInput.value = selectedText.body;
  prepareSession(selectedText.title, selectedText.body);
  renderLibrary();
  renderDraftMeta();
  persistDraft();
}

function deleteText(id) {
  const textToDelete = state.texts.find((text) => text.id === id);

  if (!textToDelete) {
    return;
  }

  state.texts = state.texts.filter((text) => text.id !== id);

  if (state.selectedId === id) {
    state.selectedId = null;
  }

  persistLibrary();
  renderLibrary();

  if (elements.textInput.value.trim() === textToDelete.body.trim()) {
    createNewDraft();
  } else {
    renderDraftMeta();
    persistDraft();
  }
}

function startReading() {
  const body = elements.textInput.value.trim();

  if (!body) {
    updateStatus("Add some text first", "error");
    return;
  }

  const title = normalizeTitle(elements.textTitle.value, body);
  const isNewText = body !== state.sourceText;

  if (!state.words.length || isNewText || state.completed) {
    prepareSession(title, body);
  }

  state.completed = false;
  state.hasStarted = true;
  state.isReading = true;
  updateStatus("Reading", "reading");
  renderReader();
  scheduleAdvance();
}

function pauseReading() {
  if (!state.words.length || !state.hasStarted || state.completed || !state.isReading) {
    return;
  }

  pauseAndClearTimer();
  state.isReading = false;
  updateStatus("Paused", "paused");
  renderReader();
}

function togglePlayback() {
  if (!state.words.length && elements.textInput.value.trim()) {
    startReading();
    return;
  }

  if (!state.words.length) {
    return;
  }

  if (state.isReading) {
    pauseReading();
    return;
  }

  startReading();
}

function resetReading() {
  const body = elements.textInput.value.trim();

  if (!body) {
    createNewDraft();
    return;
  }

  prepareSession(normalizeTitle(elements.textTitle.value, body), body);
  updateStatus("Ready", "idle");
  renderReader();
}

function prepareSession(title, body) {
  pauseAndClearTimer();
  state.words = splitWords(body);
  state.currentIndex = 0;
  state.completed = false;
  state.hasStarted = false;
  state.isReading = false;
  state.sourceText = body;
  state.sourceTitle = title;
  renderReader();
}

function clearReader() {
  pauseAndClearTimer();
  state.words = [];
  state.currentIndex = 0;
  state.completed = false;
  state.hasStarted = false;
  state.isReading = false;
  state.sourceText = "";
  state.sourceTitle = "";
  elements.readerActiveTitle.textContent = "No active text";
  elements.readerWord.textContent = "Ready";
  elements.readerWord.style.fontSize = `${state.fontSize}px`;
  elements.readerSubtext.textContent =
    "Paste or load a text, then press Start Reading.";
  elements.progressFill.style.width = "0%";
  elements.progressLabel.textContent = "0 / 0 words";
  elements.focusTitle.textContent = "No active text";
  elements.focusWord.textContent = "Ready";
  elements.focusWord.style.fontSize = `${getFocusFontSize()}px`;
  elements.focusMeta.textContent = `${state.wpm} WPM · ${formatChunkLabel(state.chunkSize)} at once · Space starts`;
  updateStatus("Ready", "idle");
  syncFocusMode();
  updateActionButtons();
}

function finishReading() {
  pauseAndClearTimer();
  state.isReading = false;
  state.completed = true;
  updateStatus("Complete", "complete");
  renderReader();
}

function scheduleAdvance() {
  pauseAndClearTimer();

  if (!state.isReading) {
    return;
  }

  state.timerId = window.setTimeout(() => {
    const nextIndex = state.currentIndex + state.chunkSize;

    if (nextIndex >= state.words.length) {
      finishReading();
      return;
    }

    state.currentIndex = nextIndex;
    renderReader();
    scheduleAdvance();
  }, getDelayMs());
}

function handleKeyboardShortcuts(event) {
  const target = event.target;
  const isEditableTarget =
    target instanceof HTMLElement &&
    (target.closest("input") || target.closest("textarea"));

  if (isEditableTarget) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    togglePlayback();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    setWpm(state.wpm + 5);
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setWpm(state.wpm - 5);
  }
}

function setWpm(rawValue) {
  state.wpm = clampNumber(rawValue, 50, 1000, defaults.wpm);
  syncSettingsInputs();
  persistSettings();
  renderReader();

  if (state.isReading) {
    scheduleAdvance();
  }
}

function setFontSize(rawValue) {
  state.fontSize = clampNumber(rawValue, 36, 132, defaults.fontSize);
  syncSettingsInputs();
  persistSettings();
  renderReader();
}

function setChunkSize(rawValue) {
  state.chunkSize = clampNumber(rawValue, 1, 3, defaults.chunkSize);
  syncSettingsInputs();
  persistSettings();
  renderReader();

  if (state.isReading) {
    scheduleAdvance();
  }
}

function syncSettingsInputs() {
  elements.wpmRange.value = String(state.wpm);
  elements.wpmInput.value = String(state.wpm);
  elements.wpmValue.textContent = `${state.wpm} WPM`;
  elements.fontRange.value = String(state.fontSize);
  elements.fontInput.value = String(state.fontSize);
  elements.fontValue.textContent = `${state.fontSize} px`;
  elements.chunkValue.textContent = formatChunkLabel(state.chunkSize);

  elements.chunkButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      Number(button.dataset.chunkSize) === state.chunkSize
    );
  });
}

function renderLibrary() {
  elements.savedTexts.innerHTML = "";
  elements.libraryCount.textContent = `${state.texts.length} saved`;

  if (!state.texts.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent =
      "No saved texts yet. Paste a text, save it once, and it will stay here on this browser.";
    elements.savedTexts.append(emptyState);
    return;
  }

  state.texts.forEach((text) => {
    const fragment = elements.savedTextTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".saved-card");
    const title = fragment.querySelector(".saved-card-title");
    const meta = fragment.querySelector(".saved-card-meta");
    const preview = fragment.querySelector(".saved-card-preview");
    const loadButton = fragment.querySelector(".load-button");
    const deleteButton = fragment.querySelector(".delete-button");

    title.textContent = text.title;
    meta.textContent = `${countWords(text.body)} words`;
    preview.textContent = text.body.slice(0, 160).trim();

    if (text.id === state.selectedId) {
      card.classList.add("selected");
    }

    loadButton.addEventListener("click", () => loadTextIntoEditor(text.id));
    deleteButton.addEventListener("click", () => deleteText(text.id));
    card.addEventListener("dblclick", () => {
      loadTextIntoEditor(text.id);
      startReading();
    });

    elements.savedTexts.append(fragment);
  });
}

function renderDraftMeta() {
  const body = elements.textInput.value;
  const title = elements.textTitle.value.trim();
  const selectedText = state.texts.find((text) => text.id === state.selectedId);

  elements.draftWordCount.textContent = `${countWords(body)} words`;
  elements.selectedTextLabel.textContent = selectedText
    ? `Editing: ${selectedText.title}`
    : title
      ? `Draft: ${title}`
      : "New draft";
}

function renderReader() {
  elements.readerWord.style.fontSize = `${state.fontSize}px`;
  elements.focusWord.style.fontSize = `${getFocusFontSize()}px`;

  if (!state.words.length) {
    clearReader();
    return;
  }

  const displayChunk = getDisplayChunk();
  const progressCount =
    state.hasStarted || state.completed
      ? Math.min(state.currentIndex + state.chunkSize, state.words.length)
      : 0;
  const progressPercent = state.words.length
    ? (progressCount / state.words.length) * 100
    : 0;

  elements.readerActiveTitle.textContent = state.sourceTitle;
  elements.readerWord.textContent = displayChunk;
  elements.progressFill.style.width = `${progressPercent}%`;
  elements.progressLabel.textContent = `${progressCount} / ${state.words.length} words`;

  elements.focusTitle.textContent = state.sourceTitle;
  elements.focusWord.textContent = displayChunk;
  elements.focusMeta.textContent = getFocusMeta();

  if (state.completed) {
    elements.readerSubtext.textContent =
      "Finished. Press Start to go again, or change the chunk size before the next pass.";
  } else if (!state.hasStarted) {
    elements.readerSubtext.textContent =
      "Your text is loaded and ready. Press Start or Space when you want the first timed pass.";
  } else if (state.isReading) {
    elements.readerSubtext.textContent =
      "Reading live. Use Up and Down for speed, and Space to pause instantly.";
  } else {
    elements.readerSubtext.textContent =
      "Paused. Press Start or Space to continue from this point, or Reset to begin again.";
  }

  syncFocusMode();
  updateActionButtons();
}

function updateStatus(label, stateName) {
  elements.readerStatus.textContent = label;
  elements.readerStatus.dataset.state = stateName;
}

function updateActionButtons() {
  if (state.completed) {
    elements.startButton.textContent = "Restart";
  } else if (state.hasStarted && !state.isReading) {
    elements.startButton.textContent = "Resume";
  } else {
    elements.startButton.textContent = "Start";
  }

  elements.pauseButton.disabled = !state.isReading;
  elements.resetButton.disabled = !state.words.length;
}

function syncFocusMode() {
  const showFocusMode = state.isReading;
  elements.focusOverlay.classList.toggle("is-visible", showFocusMode);
  elements.focusOverlay.setAttribute("aria-hidden", String(!showFocusMode));
  document.body.classList.toggle("focus-mode-active", showFocusMode);
}

function persistLibrary() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.texts));
}

function persistSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      chunkSize: state.chunkSize,
      fontSize: state.fontSize,
      wpm: state.wpm
    })
  );
}

function persistDraft() {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      body: elements.textInput.value,
      selectedId: state.selectedId,
      title: elements.textTitle.value
    })
  );
}

function pauseAndClearTimer() {
  if (state.timerId) {
    window.clearTimeout(state.timerId);
    state.timerId = null;
  }
}

function sortTexts() {
  state.texts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function getDelayMs() {
  const chunkLength = Math.max(
    1,
    state.words.slice(state.currentIndex, state.currentIndex + state.chunkSize).length
  );

  return Math.max(60, Math.round((60000 * chunkLength) / state.wpm));
}

function getDisplayChunk() {
  return state.words
    .slice(state.currentIndex, state.currentIndex + state.chunkSize)
    .join(" ");
}

function getFocusMeta() {
  const actionLabel = state.isReading
    ? "Space pauses"
    : state.hasStarted && !state.completed
      ? "Space resumes"
      : "Space starts";

  return `${state.wpm} WPM · ${formatChunkLabel(state.chunkSize)} at once · ${actionLabel}`;
}

function getFocusFontSize() {
  return Math.min(Math.round(state.fontSize * 1.18), 168);
}

function formatChunkLabel(chunkSize) {
  return chunkSize === 1 ? "1 word" : `${chunkSize} words`;
}

function normalizeTitle(rawTitle, body) {
  const trimmedTitle = rawTitle.trim();

  if (trimmedTitle) {
    return trimmedTitle;
  }

  const words = splitWords(body).slice(0, 4);
  return words.length ? words.join(" ") : "Untitled text";
}

function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function countWords(text) {
  return splitWords(text).length;
}

function clampNumber(rawValue, min, max, fallback) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function loadFromStorage(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    return fallback;
  }
}
