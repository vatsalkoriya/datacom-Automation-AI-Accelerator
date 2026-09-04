const users = [
  { id: "u1", name: "Vatsal Koriya", role: "admin" },
  { id: "u2", name: "Maya Chen", role: "employee" },
  { id: "u3", name: "Jordan Lee", role: "employee" },
  { id: "u4", name: "Priya Shah", role: "employee" },
  { id: "u5", name: "Alex Morgan", role: "employee" }
];

const seedKudos = [
  { id: "k1", senderId: "u2", recipientId: "u3", message: "Thanks for pairing with me to untangle that tricky release issue. You made it feel easy!", createdAt: Date.now() - 3600000, isVisible: true },
  { id: "k2", senderId: "u4", recipientId: "u2", message: "Your thoughtful customer demo set the whole team up for a great week. Brilliant work!", createdAt: Date.now() - 86400000, isVisible: true }
];
const state = { currentUser: users[0], kudos: loadKudos() };
const $ = (selector) => document.querySelector(selector);

function loadKudos() {
  try { return JSON.parse(localStorage.getItem("datacom-kudos") || "null") || seedKudos; }
  catch (error) { console.warn("Could not load saved kudos; using the demo feed.", error); return seedKudos; }
}
function saveKudos() { localStorage.setItem("datacom-kudos", JSON.stringify(state.kudos)); }
function user(id) { return users.find((item) => item.id === id); }
function initials(name) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2); }
function formatDate(timestamp) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(timestamp); }
function notify(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000); }

function renderUsers() {
  $("#role-select").innerHTML = users.map((item) => `<option value="${item.id}">${item.name}${item.role === "admin" ? " (Admin)" : ""}</option>`).join("");
  $("#role-select").value = state.currentUser.id;
  const colleagues = users.filter((item) => item.id !== state.currentUser.id);
  $("#recipient").innerHTML = `<option value="">Select a colleague...</option>${colleagues.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}`;
}
function renderFeed() {
  const visible = state.kudos.filter((item) => item.isVisible).sort((a, b) => b.createdAt - a.createdAt);
  $("#kudos-count").textContent = visible.length;
  $("#feed").innerHTML = visible.length ? visible.map((item) => {
    const sender = user(item.senderId); const recipient = user(item.recipientId);
    return `<article class="kudos-item"><div class="kudos-top"><div class="person"><span class="avatar">${initials(sender.name)}</span><div><strong>${sender.name}</strong><small>to ${recipient.name}</small></div></div><small>${formatDate(item.createdAt)}</small></div><p class="kudos-message">${escapeHtml(item.message)}</p></article>`;
  }).join("") : '<div class="empty">No kudos yet. Be the first to celebrate someone!</div>';
}
function renderModeration() {
  const section = $("#moderation-section"); section.classList.toggle("hidden", state.currentUser.role !== "admin");
  if (state.currentUser.role !== "admin") return;
  $("#moderation-list").innerHTML = state.kudos.length ? state.kudos.slice().sort((a, b) => b.createdAt - a.createdAt).map((item) => {
    const sender = user(item.senderId); const recipient = user(item.recipientId);
    return `<div class="moderation-row"><p><strong>${sender.name}</strong> → ${recipient.name}: ${escapeHtml(item.message)}<br><small>${item.isVisible ? "Visible" : "Hidden"}</small></p><div class="moderation-actions">${item.isVisible ? `<button class="text-button" data-action="hide" data-id="${item.id}">Hide</button>` : `<button class="text-button" data-action="restore" data-id="${item.id}">Restore</button>`}<button class="text-button danger" data-action="delete" data-id="${item.id}">Delete</button></div></div>`;
  }).join("") : '<div class="empty">The moderation queue is clear.</div>';
}
function escapeHtml(value) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }

$("#role-select").addEventListener("change", (event) => { state.currentUser = user(event.target.value); renderUsers(); renderModeration(); notify(`Now viewing as ${state.currentUser.name}`); });
$("#message").addEventListener("input", (event) => { $("#counter").textContent = `${event.target.value.length} / 500`; $("#message-error").textContent = ""; });
$("#kudos-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const recipientId = $("#recipient").value; const message = $("#message").value.trim(); const normalized = message.toLowerCase();
  let error = "";
  if (!recipientId) error = "Choose a colleague first.";
  else if (recipientId === state.currentUser.id) error = "You cannot give kudos to yourself.";
  else if (!message) error = "Write a message before sending.";
  else if (message.length > 500) error = "Keep your message under 500 characters.";
  else if (/(.)\1{7,}|https?:\/\/|buy now|free money/i.test(message)) error = "This message looks like spam.";
  else if (state.kudos.some((item) => item.senderId === state.currentUser.id && item.recipientId === recipientId && item.message.toLowerCase() === normalized)) error = "You have already sent this kudos.";
  if (error) { $("#message-error").textContent = error; return; }
  state.kudos.push({ id: `k${Date.now()}`, senderId: state.currentUser.id, recipientId, message, createdAt: Date.now(), isVisible: true });
  saveKudos(); event.target.reset(); $("#counter").textContent = "0 / 500"; renderFeed(); renderModeration(); notify("Kudos sent — nice work celebrating a colleague!"); 
});
$("#moderation-list").addEventListener("click", (event) => {
  const button = event.target.closest("button"); if (!button) return;
  const item = state.kudos.find((kudos) => kudos.id === button.dataset.id); if (!item) return;
  if (button.dataset.action === "delete" && !confirm("Permanently delete this kudos?")) return;
  if (button.dataset.action === "delete") state.kudos = state.kudos.filter((kudos) => kudos.id !== item.id);
  else item.isVisible = button.dataset.action === "restore";
  item.moderatedBy = state.currentUser.id; item.moderatedAt = Date.now(); item.reasonForModeration = button.dataset.action;
  saveKudos(); renderFeed(); renderModeration(); notify(button.dataset.action === "delete" ? "Kudos deleted." : `Kudos ${button.dataset.action}d.`);
});
renderUsers(); renderFeed(); renderModeration();
