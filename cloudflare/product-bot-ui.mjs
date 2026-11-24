const COPY = {
  en: { open: "Open Adigun BOT", close: "Close Adigun BOT", title: "Adigun BOT", intro: "Ask about this CAD workspace or electrical drawing concepts. I cannot see or edit your drawing.", placeholder: "Ask about a tool or concept…", send: "Send", thinking: "Thinking…", error: "The copilot is unavailable right now. Try again shortly.", you: "You", bot: "Adigun BOT" },
  de: { open: "Adigun BOT öffnen", close: "Adigun BOT schließen", title: "Adigun BOT", intro: "Frage zu diesem CAD-Arbeitsbereich oder zu elektrischen Zeichnungen. Ich kann deine Zeichnung nicht sehen oder bearbeiten.", placeholder: "Frage zu einem Werkzeug oder Konzept…", send: "Senden", thinking: "Denke nach…", error: "Der Copilot ist gerade nicht verfügbar. Bitte versuche es später erneut.", you: "Du", bot: "Adigun BOT" },
  yo: { open: "Ṣí Adigun BOT", close: "Pa Adigun BOT", title: "Adigun BOT", intro: "Béèrè nípa ibi iṣẹ́ CAD yìí tàbí àwòrán iná. N kò lè rí tàbí tún àwòrán rẹ ṣe.", placeholder: "Béèrè nípa irinṣẹ́ tàbí èrò…", send: "Ránṣẹ́", thinking: "Mo ń ronú…", error: "Olùrànlọ́wọ́ kò sí báyìí. Gbìyànjú lẹ́ẹ̀kan sí i.", you: "Ìwọ", bot: "Adigun BOT" },
  pcm: { open: "Open Adigun BOT", close: "Close Adigun BOT", title: "Adigun BOT", intro: "Ask about this CAD workspace or electrical drawing. I no fit see or edit your drawing.", placeholder: "Ask about tool or idea…", send: "Send", thinking: "I dey think…", error: "The copilot no dey available now. Try again small time.", you: "You", bot: "Adigun BOT" },
};

const languagePicker = document.querySelector("#cadLanguage");
const language = () => COPY[languagePicker?.value || document.documentElement.lang] ? (languagePicker?.value || document.documentElement.lang) : "en";
const copy = () => COPY[language()];
const root = document.createElement("section");
root.className = "adigun-bot";
root.innerHTML = `
  <button class="adigun-bot-launch" type="button" aria-expanded="false" aria-controls="adigun-bot-panel">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v3m-6 3h12a2 2 0 0 1 2 2v7H4v-7a2 2 0 0 1 2-2Zm-1 6h.01M17 14h.01M9 18v2m6-2v2M8 20h8"/><path d="M9 13h.01M15 13h.01"/></svg><span>Adigun BOT</span>
  </button>
  <aside class="adigun-bot-panel" id="adigun-bot-panel" hidden aria-label="Adigun BOT">
    <header><strong data-title></strong><button type="button" data-close aria-label="Close">×</button></header>
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
let messages = [];
let busy = false;

function updateCopy() {
  const text = copy();
  launcher.setAttribute("aria-label", panel.hidden ? text.open : text.close);
  root.querySelector("[data-title]").textContent = text.title;
  root.querySelector("[data-intro]").textContent = text.intro;
  root.querySelector("[data-label]").textContent = text.placeholder;
  root.querySelector("[data-send]").textContent = text.send;
  input.placeholder = text.placeholder;
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
  panel.hidden = !open;
  launcher.setAttribute("aria-expanded", String(open));
  updateCopy();
  if (open) input.focus();
}

launcher.addEventListener("click", () => toggle(panel.hidden));
root.querySelector("[data-close]").addEventListener("click", () => toggle(false));
languagePicker?.addEventListener("change", updateCopy);
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

