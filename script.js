import { marked } from "marked";
import DOMPurify from "dompurify";

const els = {
  messages: document.getElementById("messages"),
  input: document.getElementById("input"),
  send: document.getElementById("send"),
  preview: document.getElementById("preview"),
  composer: document.getElementById("composer"),
  toast: document.getElementById("toast"),
  userBadge: document.getElementById("userBadge"),
};

function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("show");
  clearTimeout(els.toast._t);
  els.toast._t = setTimeout(() => els.toast.classList.remove("show"), 2000);
}

function renderPreview(text) {
  const md = `@websim ${text?.trim() || ""}`;
  const html = DOMPurify.sanitize(marked.parse(md));
  els.preview.innerHTML = html;
}

function addLocalMessage(text) {
  const wrap = document.createElement("div");
  wrap.className = "msg you";
  wrap.innerHTML = `<div class="meta">You</div><div>${DOMPurify.sanitize(text)}</div>`;
  els.messages.appendChild(wrap);
  wrap.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function hydrateUser() {
  try {
    const u = await window.websim.getCurrentUser();
    if (!u) return;
    els.userBadge.innerHTML = `
      <img alt="" src="${u.avatar_url}"/><span>@${u.username}</span>
    `;
  } catch {}
}

function setupCommentEvents() {
  window.websim.addEventListener("comment:created", (e) => {
    const c = e.comment;
    if (!c?.raw_content) return;
    showToast("Comment posted");
  });
}

els.input.addEventListener("input", () => renderPreview(els.input.value));
els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    els.composer.requestSubmit();
  }
});

els.composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;

  els.send.disabled = true;
  addLocalMessage(text);

  // Prefill native comment composer with @websim directive
  const content = `@websim ${text}`;
  try {
    await window.websim.postComment({ content });
    showToast("Opening comment composer…");
  } catch (err) {
    showToast("Couldn't open comment composer");
  } finally {
    els.send.disabled = false;
    els.input.value = "";
    renderPreview("");
  }
});

renderPreview("");
hydrateUser();
setupCommentEvents();

