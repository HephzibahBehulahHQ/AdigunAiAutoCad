const COPY = {
  en: { open: "Open Adigun BOT", close: "Close Adigun BOT", title: "Adigun BOT", intro: "Ask about this CAD workspace or electrical drawing concepts. I cannot see or edit your drawing.", placeholder: "Ask about a tool or concept…", send: "Send", thinking: "Thinking…", error: "The copilot is unavailable right now. Try again shortly.", you: "You", bot: "Adigun BOT" },
  de: { open: "Adigun BOT öffnen", close: "Adigun BOT schließen", title: "Adigun BOT", intro: "Frage zu diesem CAD-Arbeitsbereich oder zu elektrischen Zeichnungen. Ich kann deine Zeichnung nicht sehen oder bearbeiten.", placeholder: "Frage zu einem Werkzeug oder Konzept…", send: "Senden", thinking: "Denke nach…", error: "Der Copilot ist gerade nicht verfügbar. Bitte versuche es später erneut.", you: "Du", bot: "Adigun BOT" },
  yo: { open: "Ṣí Adigun BOT", close: "Pa Adigun BOT", title: "Adigun BOT", intro: "Béèrè nípa ibi iṣẹ́ CAD yìí tàbí àwòrán iná. N kò lè rí tàbí tún àwòrán rẹ ṣe.", placeholder: "Béèrè nípa irinṣẹ́ tàbí èrò…", send: "Ránṣẹ́", thinking: "Mo ń ronú…", error: "Olùrànlọ́wọ́ kò sí báyìí. Gbìyànjú lẹ́ẹ̀kan sí i.", you: "Ìwọ", bot: "Adigun BOT" },
  pcm: { open: "Open Adigun BOT", close: "Close Adigun BOT", title: "Adigun BOT", intro: "Ask about this CAD workspace or electrical drawing. I no fit see or edit your drawing.", placeholder: "Ask about tool or idea…", send: "Send", thinking: "I dey think…", error: "The copilot no dey available now. Try again small time.", you: "You", bot: "Adigun BOT" },
};
const WINDOW_COPY = {
  en: { minimize: "Minimize Adigun BOT", maximize: "Maximize Adigun BOT", restore: "Restore Adigun BOT", move: "Move Adigun BOT window with arrow keys" },
  de: { minimize: "Adigun BOT minimieren", maximize: "Adigun BOT maximieren", restore: "Adigun BOT wiederherstellen", move: "Adigun BOT-Fenster mit den Pfeiltasten bewegen" },
  yo: { minimize: "Dín Adigun BOT kù", maximize: "Mú Adigun BOT tóbi", restore: "Dá Adigun BOT padà", move: "Gbe fèrèsé Adigun BOT pẹ̀lú bọ́tìnì ọfà" },
  pcm: { minimize: "Make Adigun BOT small", maximize: "Make Adigun BOT full screen", restore: "Bring Adigun BOT back", move: "Move Adigun BOT with arrow keys" },
};

const languagePicker = document.querySelector("#cadLanguage");
const language = () => COPY[languagePicker?.value || document.documentElement.lang] ? (languagePicker?.value || document.documentElement.lang) : "en";
const copy = () => COPY[language()];
const windowCopy = () => WINDOW_COPY[language()];
const WINDOW_STATE_KEY = "hb:adigun-bot-window:adigunaiautocad:v1";
function readWindowState() {
  try {
    const saved = JSON.parse(localStorage.getItem(WINDOW_STATE_KEY) || "{}");
    return {
      open: saved.open === true,
      minimized: saved.minimized === true,
      maximized: saved.maximized === true,
      left: Number.isFinite(saved.left) ? saved.left : null,
      top: Number.isFinite(saved.top) ? saved.top : null,
      width: Number.isFinite(saved.width) ? saved.width : null,
      height: Number.isFinite(saved.height) ? saved.height : null,
    };
  } catch { return { open: false, minimized: false, maximized: false, left: null, top: null, width: null, height: null }; }
}
const windowState = readWindowState();
const root = document.createElement("section");
root.className = "adigun-bot";
root.innerHTML = `
  <button class="adigun-bot-launch" type="button" aria-expanded="false" aria-controls="adigun-bot-panel">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v3m-6 3h12a2 2 0 0 1 2 2v7H4v-7a2 2 0 0 1 2-2Zm-1 6h.01M17 14h.01M9 18v2m6-2v2M8 20h8"/><path d="M9 13h.01M15 13h.01"/></svg><span>Adigun BOT</span>
  </button>
  <aside class="adigun-bot-panel" id="adigun-bot-panel" hidden role="region" aria-label="Adigun BOT">
    <header>
      <span class="adigun-bot-drag" data-drag-handle tabindex="0"><strong data-title></strong></span>
      <div class="adigun-bot-controls">
        <button type="button" data-minimize aria-label="Minimize">−</button>
        <button type="button" data-maximize aria-label="Maximize">□</button>
        <button type="button" data-close aria-label="Close">×</button>
      </div>
    </header>
    <p class="adigun-bot-intro" data-intro></p>
    <div class="adigun-bot-log" role="log" aria-live="polite" aria-relevant="additions text"></div>
    <form><label class="sr-only" data-label for="adigun-bot-input"></label><textarea id="adigun-bot-input" rows="2" maxlength="2000" required></textarea><button type="submit" data-send></button></form>
  </aside>`;
document.body.append(root);

const launcher = root.querySelector(".adigun-bot-launch");
const panel = root.querySelector(".adigun-bot-panel");
const log = root.querySelector(".adigun-bot-log");
const input = root.querySelector("textarea");
const form = root.querySelector("form");
const header = root.querySelector("[data-drag-handle]");
const minimizeButton = root.querySelector("[data-minimize]");
const maximizeButton = root.querySelector("[data-maximize]");
let messages = [];
let busy = false;
let drag = null;
let saveTimer;

function saveWindowState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (windowState.open && !windowState.minimized && !windowState.maximized) {
      const rect = panel.getBoundingClientRect();
      Object.assign(windowState, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
    try { localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(windowState)); }
    catch { /* Window preferences remain optional when browser storage is unavailable. */ }
  }, 120);
}

function clampPosition(left, top) {
  const rect = panel.getBoundingClientRect();
  return {
    left: Math.min(Math.max(0, left), Math.max(0, innerWidth - Math.min(rect.width, 80))),
    top: Math.min(Math.max(0, top), Math.max(0, innerHeight - Math.min(rect.height, 56))),
  };
}

function applyWindowState() {
  panel.hidden = !windowState.open;
  panel.classList.toggle("is-minimized", windowState.minimized);
  panel.classList.toggle("is-maximized", windowState.maximized);
  launcher.setAttribute("aria-expanded", String(windowState.open));
  if (windowState.width) panel.style.width = `${Math.max(320, Math.min(windowState.width, innerWidth - 16))}px`;
  if (windowState.height) panel.style.height = `${Math.max(280, Math.min(windowState.height, innerHeight - 16))}px`;
  if (Number.isFinite(windowState.left) && Number.isFinite(windowState.top)) {
    const position = clampPosition(windowState.left, windowState.top);
    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }
}

function updateCopy() {
  const text = copy();
  launcher.setAttribute("aria-label", panel.hidden ? text.open : text.close);
  root.querySelector("[data-title]").textContent = text.title;
  root.querySelector("[data-intro]").textContent = text.intro;
  root.querySelector("[data-label]").textContent = text.placeholder;
  root.querySelector("[data-send]").textContent = text.send;
  input.placeholder = text.placeholder;
  minimizeButton.setAttribute("aria-label", windowCopy().minimize);
  maximizeButton.setAttribute("aria-label", windowState.maximized ? windowCopy().restore : windowCopy().maximize);
  root.querySelector("[data-close]").setAttribute("aria-label", text.close);
  header.setAttribute("aria-label", windowCopy().move);
}

function bubble(role, text) {
  const item = document.createElement("p");
  item.className = `adigun-bot-message ${role}`;
  const who = document.createElement("strong");
  who.textContent = role === "user" ? copy().you : copy().bot;
  const body = document.createElement("span");
  body.textContent = text;
  item.append(who, body);
  log.append(item);
  log.scrollTop = log.scrollHeight;
  return body;
}

function toggle(open) {
  windowState.open = open;
  if (open) windowState.minimized = false;
  applyWindowState();
  updateCopy();
  if (open) input.focus();
  else launcher.focus();
  saveWindowState();
}

launcher.addEventListener("click", () => {
  if (panel.hidden) toggle(true);
  else if (windowState.minimized) {
    windowState.minimized = false;
    applyWindowState();
    updateCopy();
    input.focus();
    saveWindowState();
  } else toggle(false);
});
minimizeButton.addEventListener("click", () => {
  windowState.minimized = !windowState.minimized;
  applyWindowState();
  updateCopy();
  saveWindowState();
  if (!windowState.minimized) input.focus();
});
maximizeButton.addEventListener("click", () => {
  windowState.maximized = !windowState.maximized;
  applyWindowState();
  updateCopy();
  saveWindowState();
});
root.querySelector("[data-close]").addEventListener("click", () => toggle(false));
languagePicker?.addEventListener("change", updateCopy);
panel.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !panel.hidden) {
    event.preventDefault();
    toggle(false);
  }
});
header.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || event.target.closest("button") || windowState.maximized) return;
  const rect = panel.getBoundingClientRect();
  drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  header.setPointerCapture(event.pointerId);
  event.preventDefault();
});
header.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const position = clampPosition(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  panel.style.left = `${position.left}px`;
  panel.style.top = `${position.top}px`;
});
function finishDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag = null;
  saveWindowState();
}
header.addEventListener("pointerup", finishDrag);
header.addEventListener("pointercancel", finishDrag);
header.addEventListener("keydown", (event) => {
  const delta = event.shiftKey ? 50 : 20;
  const movement = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] }[event.key];
  if (!movement || panel.hidden || windowState.maximized) return;
  event.preventDefault();
  const rect = panel.getBoundingClientRect();
  const position = clampPosition(rect.left + movement[0], rect.top + movement[1]);
  panel.style.left = `${position.left}px`;
  panel.style.top = `${position.top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  saveWindowState();
});
let resizeObserver;
if ("ResizeObserver" in window) {
  resizeObserver = new ResizeObserver(() => { if (!panel.hidden && !windowState.maximized && !windowState.minimized) saveWindowState(); });
  resizeObserver.observe(panel);
}
window.addEventListener("resize", () => {
  if (panel.hidden || windowState.maximized) return;
  const rect = panel.getBoundingClientRect();
  const position = clampPosition(rect.left, rect.top);
  panel.style.left = `${position.left}px`;
  panel.style.top = `${position.top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  saveWindowState();
});
window.addEventListener("pagehide", () => {
  clearTimeout(saveTimer);
  if (windowState.open && !windowState.minimized && !windowState.maximized) {
    const rect = panel.getBoundingClientRect();
    Object.assign(windowState, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  }
  try { localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(windowState)); } catch { /* Optional persistence. */ }
  resizeObserver?.disconnect();
});
applyWindowState();
updateCopy();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  busy = true;
  input.value = "";
  messages.push({ role: "user", content: text });
  bubble("user", text);
  const answer = bubble("assistant", copy().thinking);
  form.querySelector("button[type=submit]").disabled = true;
  try {
    const response = await fetch("/api/bot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages, language: language() }),
    });
    if (!response.ok) throw new Error("unavailable");
    const type = response.headers.get("content-type") || "";
    if (type.includes("text/event-stream") && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const item = JSON.parse(payload);
            result += item.response || item.delta || item.choices?.[0]?.delta?.content || "";
            answer.textContent = result;
          } catch { /* Ignore non-JSON stream keepalives. */ }
        }
        if (done) break;
      }
      if (!answer.textContent || answer.textContent === copy().thinking) throw new Error("empty-response");
      messages.push({ role: "assistant", content: answer.textContent });
    } else {
      const payload = await response.json();
      if (!payload.answer) throw new Error("empty-response");
      answer.textContent = payload.answer;
      messages.push({ role: "assistant", content: payload.answer });
    }
    messages = messages.slice(-10);
  } catch {
    answer.textContent = copy().error;
    messages.pop();
  } finally {
    busy = false;
    form.querySelector("button[type=submit]").disabled = false;
    input.focus();
  }
});

