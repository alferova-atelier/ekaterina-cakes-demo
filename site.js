"use strict";

const byId = (id) => document.getElementById(id);
const pathFor = (image) => "assets/" + image;
const groupLabels = { wedding: "Свадебный торт", party: "Праздничный торт", kids: "Детский торт", dessert: "Меренговый рулет" };
const fillings = {
  vanilla: { name: "Ваниль и малина", layers: "Ванильный бисквит, сливочный крем, малиновая прослойка." },
  chocolate: { name: "Шоколад и вишня", layers: "Шоколадный бисквит, шоколадный крем, вишнёвая прослойка." },
  lemon: { name: "Лимон и сливки", layers: "Светлый бисквит, сливочный крем, лимонная прослойка." }
};
const viewer = byId("viewer");
const lightbox = byId("lightbox");
const form = byId("order-form");
const type = byId("order-type");
const taste = byId("order-taste");
const cards = byId("work-grid");
const filters = document.querySelectorAll("[data-filter]");
let category = "all";
let expanded = false;
let viewedWork = null;
let selectedWork = null;
let viewedPhoto = null;
let trigger = null;

function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text) el.textContent = text;
  return el;
}

for (const work of collection) {
  const button = makeElement("button", "work");
  button.type = "button";
  button.dataset.id = work.id;
  button.dataset.group = work.group;
  button.dataset.open = work.id;
  button.setAttribute("aria-label", "Рассмотреть работу «" + work.name + "»");
  const frame = makeElement("span", "work-frame");
  const photo = document.createElement("img");
  photo.src = pathFor(work.cover);
  photo.alt = work.alt;
  photo.loading = "lazy";
  frame.append(photo, document.querySelector(".detail-link svg").cloneNode(true));
  button.append(frame, makeElement("span", "work-name", work.name), makeElement("span", "work-category", groupLabels[work.group]));
  cards.append(button);
}

function refreshCollection() {
  let matches = 0;
  let shown = 0;
  for (const card of cards.children) {
    const matchesCategory = category === "all" || card.dataset.group === category;
    if (matchesCategory) matches++;
    card.hidden = !matchesCategory || (category === "all" && !expanded && matches > 4);
    if (!card.hidden) shown++;
  }
  filters.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === category)));
  const more = byId("more");
  more.hidden = shown === matches;
  more.textContent = "Показать ещё (" + (matches - shown) + ")";
  byId("collection-status").textContent = "Показано " + shown + " из " + matches;
}
filters.forEach((button) => button.addEventListener("click", () => {
  category = button.dataset.filter;
  expanded = false;
  refreshCollection();
}));
byId("more").addEventListener("click", () => {
  const firstNew = cards.querySelector("[hidden]");
  expanded = true;
  refreshCollection();
  firstNew?.focus();
});
refreshCollection();

function showPhoto(photo, index) {
  viewedPhoto = photo;
  byId("viewer-photo").src = pathFor(photo.file);
  byId("viewer-photo").alt = photo.alt;
  Array.from(byId("photo-switch").children).forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
}
function openWork(work, opener) {
  trigger = opener;
  viewedWork = work;
  byId("viewer-title").textContent = work.name;
  byId("viewer-category").textContent = groupLabels[work.group];
  byId("viewer-description").textContent = work.description;
  const views = work.views || [{ file: work.cover, alt: work.alt }];
  const switcher = byId("photo-switch");
  switcher.replaceChildren();
  switcher.hidden = views.length < 2;
  if (!switcher.hidden) {
    views.forEach((photo, index) => {
      const button = makeElement("button", "", photo.label);
      button.type = "button";
      button.addEventListener("click", () => showPhoto(photo, index));
      switcher.append(button);
    });
  }
  showPhoto(views[0], 0);
  viewer.showModal();
  viewer.scrollTop = 0;
  byId("viewer-title").focus({ preventScroll: true });
}
document.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => {
  openWork(collection.find((work) => work.id === button.dataset.open), button);
}));
byId("enlarge").addEventListener("click", () => {
  byId("large-photo").src = pathFor(viewedPhoto.file);
  byId("large-photo").alt = viewedPhoto.alt;
  byId("lightbox-title").textContent = viewedWork.name + (viewedPhoto.label ? " · " + viewedPhoto.label : "");
  lightbox.showModal();
  byId("lightbox-close").focus();
});
byId("lightbox-close").addEventListener("click", () => lightbox.close());
byId("viewer-close").addEventListener("click", () => viewer.close());
for (const dialog of [viewer, lightbox]) {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
}
viewer.addEventListener("close", () => trigger?.focus({ preventScroll: true }));

const nav = byId("navigation");
const menu = document.querySelector(".menu-toggle");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  menu.setAttribute("aria-expanded", String(open));
}
menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") { setMenu(false); menu.focus(); }
});
matchMedia("(max-width:820px)").addEventListener("change", () => setMenu(false));

function setFilling(value) {
  const filling = fillings[value];
  taste.value = value;
  for (const radio of document.querySelectorAll('input[name="taste"]')) radio.checked = radio.value === value;
  byId("flavour-plate").dataset.tone = value || "neutral";
  byId("sample-title").textContent = filling?.name || "Начинка на выбор";
  byId("sample-caption").textContent = filling?.layers || "Выберите пример, чтобы увидеть его слои.";
}
function showForm() {
  form.hidden = false;
  byId("draft").hidden = true;
  byId("draft-text").textContent = "";
}
document.querySelectorAll('input[name="taste"]').forEach((radio) => radio.addEventListener("change", () => {
  setFilling(radio.value);
  showForm();
}));
taste.addEventListener("change", () => setFilling(taste.value));

function removeSelection() {
  selectedWork = null;
  byId("chosen").hidden = true;
  byId("chosen-title").textContent = "";
  byId("chosen-photo").removeAttribute("src");
}
byId("choose-work").addEventListener("click", () => {
  selectedWork = viewedWork;
  type.value = selectedWork.group;
  byId("chosen-title").textContent = selectedWork.name;
  byId("chosen-photo").src = pathFor(selectedWork.cover);
  byId("chosen").hidden = false;
  trigger = null;
  viewer.close();
  showForm();
  location.hash = "order";
  byId("order").scrollIntoView({ block: "start" });
  byId("order-title").focus({ preventScroll: true });
});
type.addEventListener("change", () => {
  if (selectedWork && selectedWork.group !== type.value) removeSelection();
});
byId("remove-work").addEventListener("click", () => { removeSelection(); type.focus(); });

function localDateString() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}
byId("date").min = localDateString();
form.addEventListener("submit", (event) => {
  event.preventDefault();
  byId("date").min = localDateString();
  if (!form.reportValidity()) return;
  const requests = {
    wedding: "Хочу заказать свадебный торт.",
    party: "Хочу заказать торт к празднику.",
    kids: "Хочу заказать детский торт.",
    dessert: "Хочу обсудить заказ рулета или другого десерта.",
    other: "Помогите, пожалуйста, выбрать десерт к празднику."
  };
  const lines = ["Екатерина, здравствуйте!", requests[type.value], ""];
  if (selectedWork) lines.push("Мне понравилась работа «" + selectedWork.name + "» из коллекции.");
  if (byId("date").value) lines.push("Дата мероприятия — " + byId("date").value.split("-").reverse().join(".") + ".");
  if (byId("guests").value) lines.push("Количество гостей — " + byId("guests").valueAsNumber.toLocaleString("ru-RU") + ".");
  lines.push(taste.value ? "Мне понравилось сочетание «" + fillings[taste.value].name + "». Подскажите, есть ли такая начинка?" : "Начинку хочу выбрать вместе с вами.");
  const design = byId("design").value.trim();
  const comment = byId("comment").value.trim();
  if (design) lines.push("Пожелания по оформлению — " + design);
  if (comment) lines.push("Дополнительно — " + comment);
  byId("draft-text").textContent = lines.join("\n");
  form.hidden = true;
  byId("draft").hidden = false;
  byId("draft-title").focus();
});
byId("edit").addEventListener("click", () => { showForm(); type.focus(); });
window.addEventListener("pageshow", () => {
  form.reset();
  removeSelection();
  setFilling("");
  showForm();
});
