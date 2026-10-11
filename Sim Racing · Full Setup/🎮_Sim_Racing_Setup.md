---
cssclasses: [task-board]
---

```dataviewjs
/* ═══════════════════════════════════════════════════════
   🏎️ SIM RACING SETUP — редактируемая сборка с ценами
═══════════════════════════════════════════════════════ */

const SK = "sim_racing_v1";

const DEFAULTS = [
  { cat:"⚙️ Основа руля",        brand:"MOZA",     name:"R9 V3 Direct Drive Wheelbase",  url:"https://www.dns-shop.ru/product/analog/c2c7915a12d8d582/baza-rula-moza-r9-v3-direct-drive-wheelbase-cernyj/", price:"", shop:"DNS" },
  { cat:"🎯 Руль",                brand:"MOZA",     name:"CS V2P Steering Wheel",          url:"https://www.dns-shop.ru/product/46ce0d6d90d7d21a/rulevoe-koleso-moza-ss-v2p/",                               price:"", shop:"DNS" },
  { cat:"🦶 Педали",              brand:"MOZA",     name:"SR-P Pedals — Тормоз + Газ",     url:"https://www.dns-shop.ru/product/fa02628d13e3ed20/pedalnyj-blok-moza-sr-p/",                                  price:"", shop:"DNS" },
  { cat:"🦶 Педали",              brand:"MOZA",     name:"SR-P Clutch Pedal — Сцепление",  url:"https://www.dns-shop.ru/product/560e2df92c93a69e/pedalnyj-blok-moza-crp2/",                                  price:"", shop:"DNS" },
  { cat:"🔧 Коробка передач",     brand:"MOZA",     name:"SGP Sequential Shifter",         url:"https://www.dns-shop.ru/product/c0385c7bdaa8ed20/korobka-peredac-moza-sgp/",                                  price:"", shop:"DNS" },
  { cat:"🚨 Ручник",              brand:"MOZA",     name:"HBP Handbrake",                  url:"https://www.dns-shop.ru/product/97bb0d0a0a5ded20/rucnoj-tormoz-moza-hbp-handbrake/",                         price:"", shop:"DNS" },
  { cat:"🪑 Кокпит",              brand:"GameSTUL", name:"DUAL Universal Cockpit",         url:"https://gamestul.ru/shop/tproduct/483426557-902385033141-universalnii-kokpit-gamestul-dual",                  price:"", shop:"gamestul.ru" },
];

function loadData() {
  try { const s = localStorage.getItem(SK); if (s) return JSON.parse(s); } catch(_) {}
  return DEFAULTS.map(d => ({ ...d }));
}
function saveData(arr) {
  try { localStorage.setItem(SK, JSON.stringify(arr)); } catch(_) {}
}

let data = loadData();

/* ── CSS ── */
{
  let s = document.getElementById("sr2-css");
  if (!s) { s = document.createElement("style"); s.id = "sr2-css"; document.head.appendChild(s); }
  s.textContent = `
    .sr2-root { font-family: system-ui, sans-serif; padding: 4px 0 48px; }

    .sr2-header { margin-bottom: 28px; }
    .sr2-sup { font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8f0000;margin-bottom:8px; }
    .sr2-header h1 { font-size:28px;font-weight:800;color:#e0e0e0;letter-spacing:-0.02em;margin:0;line-height:1.15; }
    .sr2-header h1 span { color:#8f0000; }
    .sr2-line { width:40px;height:2px;background:#8f0000;border-radius:2px;margin-top:14px; }

    .sr2-cat-label { font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#3a3a3a;margin:22px 0 8px 2px; }

    /* ── Карточка ── */
    .sr2-card { background:#1a1a1a;border:1px solid #2e2e2e;border-left:3px solid #8f0000;border-radius:10px;margin-bottom:7px;overflow:hidden;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s; }
    .sr2-card:hover { background:#1e1e1e;box-shadow:0 2px 14px rgba(143,0,0,0.14); }
    .sr2-card-main { display:flex;align-items:center;gap:14px;padding:14px 14px 14px 16px; }
    .sr2-card-body { flex:1;min-width:0;cursor:pointer; }
    .sr2-card-brand { font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#555;margin-bottom:3px; }
    .sr2-card-name  { font-size:14px;font-weight:600;color:#e0e0e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .sr2-card-right { display:flex;align-items:center;gap:8px;flex-shrink:0; }

    .sr2-price-display { font-size:13px;font-weight:700;color:#e0e0e0;min-width:70px;text-align:right; }
    .sr2-price-display.empty { color:#333;font-weight:400;font-size:11px; }

    .sr2-shop-btn { font-size:10px;font-weight:600;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:6px;padding:5px 11px;cursor:pointer;white-space:nowrap;transition:background 0.14s,border-color 0.14s,color 0.14s; }
    .sr2-shop-btn:hover { background:#2a0000;border-color:#8f0000;color:#cc2222; }
    .sr2-shop-btn:empty { display:none; }

    .sr2-icon-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;font-size:13px;padding:4px 7px;cursor:pointer;transition:color 0.14s,border-color 0.14s,background 0.14s;line-height:1;color:#3a3a3a; }
    .sr2-icon-btn:hover { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .sr2-icon-btn.active { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .sr2-icon-btn.del:hover { color:#cc2222;border-color:#cc2222;background:#1a0000; }

    /* ── Панель редактирования ── */
    .sr2-edit-panel { display:none;background:#141414;border-top:1px solid #2a2a2a;padding:14px 16px;gap:10px;flex-direction:column; }
    .sr2-edit-panel.open { display:flex; }
    .sr2-edit-row { display:flex;gap:8px;align-items:center;flex-wrap:wrap; }
    .sr2-edit-label { font-size:10px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.1em;min-width:60px; }
    .sr2-input { flex:1;background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 10px;outline:none;font-family:system-ui,sans-serif;min-width:0;transition:border-color 0.14s; }
    .sr2-input:focus { border-color:#8f0000;background:#1a0000; }
    .sr2-input.price-input { max-width:120px; }
    .sr2-panel-btns { display:flex;gap:8px;justify-content:flex-end; }
    .sr2-save-btn { background:#8f0000;border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:700;padding:6px 16px;cursor:pointer;letter-spacing:0.06em;transition:background 0.14s; }
    .sr2-save-btn:hover { background:#b30000; }
    .sr2-cancel-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;color:#555;font-size:11px;font-weight:600;padding:6px 14px;cursor:pointer;transition:background 0.14s,color 0.14s; }
    .sr2-cancel-btn:hover { background:#1e1e1e;color:#e0e0e0; }

    /* ── Кнопка добавления ── */
    .sr2-add-wrap { margin-top:20px; }
    .sr2-add-toggle {
      display:flex;align-items:center;gap:8px;
      background:#141414;border:1px dashed #2e2e2e;border-radius:10px;
      padding:12px 16px;cursor:pointer;color:#3a3a3a;font-size:12px;font-weight:600;
      transition:border-color 0.15s,color 0.15s,background 0.15s;
      user-select:none;
    }
    .sr2-add-toggle:hover { border-color:#8f0000;color:#8f0000;background:#1a0000; }
    .sr2-add-toggle .plus { font-size:18px;line-height:1;font-weight:300; }

    .sr2-add-form { display:none;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:16px;margin-top:8px;gap:10px;flex-direction:column; }
    .sr2-add-form.open { display:flex; }
    .sr2-add-form-title { font-size:11px;font-weight:700;color:#8f0000;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:2px; }

    /* ── Футер ── */
    .sr2-footer { margin-top:32px;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap; }
    .sr2-footer-lbl { font-size:11px;color:#444;margin-bottom:4px; }
    .sr2-total { font-size:24px;font-weight:800;color:#e0e0e0;letter-spacing:-0.03em; }
    .sr2-total span { font-size:13px;font-weight:400;color:#555;margin-left:4px; }
    .sr2-total.zero { color:#333;font-size:14px;font-weight:400; }
    .sr2-footer-badge { font-size:10px;font-weight:700;letter-spacing:0.08em;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:20px;padding:5px 14px; }
    .sr2-hint { font-size:10px;color:#2a2a2a;margin-top:4px; }
    .sr2-count-val { font-size:24px;font-weight:800;color:#e0e0e0;letter-spacing:-0.03em; }
    .sr2-count-val span { font-size:13px;font-weight:400;color:#555;margin-left:4px; }
  `;
}

/* ── ROOT ── */
const root = dv.el("div","",{ cls:"sr2-root" });

/* ── Заголовок ── */
const hdr = root.createEl("div",{ cls:"sr2-header" });
hdr.createEl("div",{ cls:"sr2-sup", text:"Sim Racing · Full Setup" });
const h1 = hdr.createEl("h1");
h1.innerHTML = `Игровая зона <span>на руле</span>`;
hdr.createEl("div",{ cls:"sr2-line" });

/* ── Контейнер карточек (перерисовывается при добавлении) ── */
const cardsWrap = root.createEl("div");

let totalEl   = null;
let countEl   = null;
let badgeEl   = null;

/* ── Считаем итог ── */
function calcTotal() {
  return data.reduce((s, item) => {
    const v = parseFloat((item.price||"").replace(/\s/g,"").replace(",","."));
    return s + (isNaN(v) || v <= 0 ? 0 : v);
  }, 0);
}
function refreshFooter() {
  if (totalEl) {
    const sum = calcTotal();
    if (sum === 0) {
      totalEl.className = "sr2-total zero";
      totalEl.textContent = "Введите цены в карточках";
    } else {
      totalEl.className = "sr2-total";
      totalEl.innerHTML = `${sum.toLocaleString("ru-RU")} <span>₽</span>`;
    }
  }
  if (countEl) countEl.innerHTML = `${data.length} <span>позиций</span>`;
  if (badgeEl) badgeEl.textContent = `🏆 Комплектация: ${data.length} поз.`;
}

/* ── Одна карточка ── */
function makeCard(item, idx) {
  const wrap = document.createElement("div");

  const card = wrap.createEl ? wrap.createEl("div",{cls:"sr2-card"}) : (() => {
    const d = document.createElement("div"); d.className = "sr2-card"; wrap.appendChild(d); return d;
  })();

  const main = document.createElement("div"); main.className = "sr2-card-main"; card.appendChild(main);

  const body = document.createElement("div"); body.className = "sr2-card-body";
  body.addEventListener("click", () => item.url && window.open(item.url,"_blank"));
  const brandEl = document.createElement("div"); brandEl.className = "sr2-card-brand"; brandEl.textContent = item.brand;
  const nameEl  = document.createElement("div"); nameEl.className  = "sr2-card-name";  nameEl.textContent = item.name;
  body.appendChild(brandEl); body.appendChild(nameEl); main.appendChild(body);

  const right = document.createElement("div"); right.className = "sr2-card-right"; main.appendChild(right);

  const priceDisplay = document.createElement("div");
  if (item.price) {
    priceDisplay.className = "sr2-price-display";
    priceDisplay.textContent = `${parseFloat(item.price).toLocaleString("ru-RU")} ₽`;
  } else {
    priceDisplay.className = "sr2-price-display empty";
    priceDisplay.textContent = "цена?";
  }
  right.appendChild(priceDisplay);

  if (item.url) {
    const shopBtn = document.createElement("div"); shopBtn.className = "sr2-shop-btn";
    shopBtn.textContent = (item.shop||"→") + " →";
    shopBtn.addEventListener("click", () => window.open(item.url,"_blank"));
    right.appendChild(shopBtn);
  }

  const editBtn = document.createElement("div"); editBtn.className = "sr2-icon-btn"; editBtn.textContent = "✏️"; right.appendChild(editBtn);
  const delBtn  = document.createElement("div"); delBtn.className  = "sr2-icon-btn del"; delBtn.textContent = "🗑️"; right.appendChild(delBtn);

  /* ── Панель редактирования ── */
  const panel = document.createElement("div"); panel.className = "sr2-edit-panel"; card.appendChild(panel);

  function mkRow(label, inputEl) {
    const row = document.createElement("div"); row.className = "sr2-edit-row";
    const lbl = document.createElement("div"); lbl.className = "sr2-edit-label"; lbl.textContent = label;
    row.appendChild(lbl); row.appendChild(inputEl); panel.appendChild(row);
  }

  const catInput   = document.createElement("input"); catInput.className   = "sr2-input"; catInput.type="text"; catInput.value = item.cat||""; catInput.placeholder = "Категория (с эмодзи)";
  const brandInput = document.createElement("input"); brandInput.className = "sr2-input"; brandInput.type="text"; brandInput.value = item.brand||""; brandInput.placeholder = "Бренд";
  const nameInput  = document.createElement("input"); nameInput.className  = "sr2-input"; nameInput.type="text"; nameInput.value = item.name||""; nameInput.placeholder = "Название";
  const urlInput   = document.createElement("input"); urlInput.className   = "sr2-input"; urlInput.type="text"; urlInput.value = item.url||""; urlInput.placeholder = "https://...";
  const shopInput  = document.createElement("input"); shopInput.className  = "sr2-input"; shopInput.type="text"; shopInput.value = item.shop||""; shopInput.placeholder = "DNS / ozon.ru / ...";
  const priceInput = document.createElement("input"); priceInput.className = "sr2-input price-input"; priceInput.type="number"; priceInput.value = item.price||""; priceInput.placeholder = "25990";

  mkRow("Категория", catInput);
  mkRow("Бренд",     brandInput);
  mkRow("Название",  nameInput);
  mkRow("Ссылка",    urlInput);
  mkRow("Магазин",   shopInput);
  mkRow("Цена ₽",    priceInput);

  const btns = document.createElement("div"); btns.className = "sr2-panel-btns"; panel.appendChild(btns);
  const cancelBtn = document.createElement("button"); cancelBtn.className = "sr2-cancel-btn"; cancelBtn.textContent = "Отмена"; btns.appendChild(cancelBtn);
  const saveBtn   = document.createElement("button"); saveBtn.className   = "sr2-save-btn";   saveBtn.textContent = "Сохранить"; btns.appendChild(saveBtn);

  editBtn.addEventListener("click", e => {
    e.stopPropagation();
    const open = panel.classList.toggle("open");
    editBtn.classList.toggle("active", open);
  });
  cancelBtn.addEventListener("click", () => {
    panel.classList.remove("open"); editBtn.classList.remove("active");
  });
  saveBtn.addEventListener("click", () => {
    data[idx].cat   = catInput.value.trim()   || item.cat;
    data[idx].brand = brandInput.value.trim() || item.brand;
    data[idx].name  = nameInput.value.trim()  || item.name;
    data[idx].url   = urlInput.value.trim();
    data[idx].shop  = shopInput.value.trim();
    data[idx].price = priceInput.value.trim();
    saveData(data);
    renderCards();
    refreshFooter();
  });
  delBtn.addEventListener("click", () => {
    if (!confirm(`Удалить «${item.name}»?`)) return;
    data.splice(idx, 1);
    saveData(data);
    renderCards();
    refreshFooter();
  });

  return wrap.firstChild || card;
}

/* ── Рендер всех карточек ── */
function renderCards() {
  cardsWrap.empty ? cardsWrap.empty() : (cardsWrap.innerHTML = "");
  let lastCat = null;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.cat !== lastCat) {
      const lbl = document.createElement("div"); lbl.className = "sr2-cat-label"; lbl.textContent = item.cat;
      cardsWrap.appendChild(lbl);
      lastCat = item.cat;
    }
    cardsWrap.appendChild(makeCard(item, i));
  }
}

renderCards();

/* ── Кнопка + форма добавления ── */
const addWrap   = root.createEl("div",{ cls:"sr2-add-wrap" });
const addToggle = addWrap.createEl("div",{ cls:"sr2-add-toggle" });
addToggle.innerHTML = `<span class="plus">+</span> Добавить товар`;

const addForm = addWrap.createEl("div",{ cls:"sr2-add-form" });
addForm.createEl("div",{ cls:"sr2-add-form-title", text:"Новый товар" });

function mkAddRow(label, placeholder, type="text", small=false) {
  const row = addForm.createEl("div",{ cls:"sr2-edit-row" });
  row.createEl("div",{ cls:"sr2-edit-label", text:label });
  const inp = row.createEl("input",{ cls: small ? "sr2-input price-input" : "sr2-input" });
  inp.type = type; inp.placeholder = placeholder;
  return inp;
}
const aCat   = mkAddRow("Категория", "🪑 Кокпит");
const aBrand = mkAddRow("Бренд",     "MOZA");
const aName  = mkAddRow("Название",  "Название товара");
const aUrl   = mkAddRow("Ссылка",    "https://...");
const aShop  = mkAddRow("Магазин",   "DNS");
const aPrice = mkAddRow("Цена ₽",    "25990", "number", true);

const addBtns   = addForm.createEl("div",{ cls:"sr2-panel-btns" });
const addCancel = addBtns.createEl("button",{ cls:"sr2-cancel-btn", text:"Отмена" });
const addSave   = addBtns.createEl("button",{ cls:"sr2-save-btn",   text:"Добавить" });

addToggle.addEventListener("click", () => {
  const open = addForm.classList.toggle("open");
  addToggle.style.borderStyle = open ? "solid" : "dashed";
  addToggle.style.borderColor = open ? "#8f0000" : "";
  addToggle.style.color       = open ? "#8f0000" : "";
});
addCancel.addEventListener("click", () => {
  addForm.classList.remove("open");
  addToggle.style.cssText = "";
});
addSave.addEventListener("click", () => {
  const name = aName.value.trim();
  if (!name) { aName.style.borderColor="#8f0000"; aName.focus(); return; }
  data.push({
    cat:   aCat.value.trim()   || "📦 Другое",
    brand: aBrand.value.trim() || "",
    name,
    url:   aUrl.value.trim(),
    shop:  aShop.value.trim()  || "→",
    price: aPrice.value.trim(),
  });
  saveData(data);
  renderCards();
  refreshFooter();
  [aCat,aBrand,aName,aUrl,aShop,aPrice].forEach(i => i.value = "");
  addForm.classList.remove("open");
  addToggle.style.cssText = "";
});

/* ── Футер ── */
const footer = root.createEl("div",{ cls:"sr2-footer" });
const fl = footer.createEl("div");
fl.createEl("div",{ cls:"sr2-footer-lbl", text:"Итого по сборке" });
totalEl = fl.createEl("div");
fl.createEl("div",{ cls:"sr2-hint", text:"Цены вводи через ✏️ на каждой карточке" });

const fc = footer.createEl("div");
fc.createEl("div",{ cls:"sr2-footer-lbl", text:"Компонентов" });
countEl = fc.createEl("div",{ cls:"sr2-count-val" });

badgeEl = footer.createEl("div",{ cls:"sr2-footer-badge" });

refreshFooter();
```
