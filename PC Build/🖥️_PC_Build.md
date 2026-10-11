---
cssclasses: [task-board]
---

```dataviewjs
/* ═══════════════════════════════════════════════════════
   🖥️ PC BUILD — редактируемая сборка с ценами
═══════════════════════════════════════════════════════ */

const SK = "pc_build_v1";

const DEFAULTS = [
  { cat:"🖥️ Видеокарта",        brand:"Palit",    name:"GeForce RTX 5070 Infinity 3", url:"https://www.dns-shop.ru/product/b58aaa7e00a9d582/videokarta-palit-geforce-rtx-5070-infinity-3-ne75070019k9-gb2050s/", price:"", shop:"DNS" },
  { cat:"🧠 Процессор",          brand:"AMD",      name:"Ryzen 7 9800X3D OEM",          url:"https://www.dns-shop.ru/product/104767799cdfd582/processor-amd-ryzen-7-9800x3d-oem/",                               price:"", shop:"DNS" },
  { cat:"📋 Материнская плата",  brand:"MSI",      name:"MAG B850 TOMAHAWK MAX WIFI",   url:"https://www.dns-shop.ru/product/0e99e58235ead582/materinskaa-plata-msi-mag-b850-tomahawk-max-wifi/",                  price:"", shop:"DNS" },
  { cat:"💾 Оперативная память", brand:"ADATA",    name:"XPG Lancer Blade 32 ГБ",       url:"https://www.dns-shop.ru/product/bee7ed0131b5ed20/operativnaa-pamat-adata-xpg-lancer-blade-ax5u6000c3016g-dtlabbk-32-gb/", price:"", shop:"DNS" },
  { cat:"💿 Накопитель",         brand:"Kingston", name:"KC3000 1024 ГБ M.2 NVMe",      url:"https://www.dns-shop.ru/product/d843b8c700d5ed20/1024-gb-m2-nvme-nakopitel-kingston-kc3000-skc3000s1024g/",          price:"", shop:"DNS" },
  { cat:"⚡ Блок питания",        brand:"MONTECH",  name:"TITAN GOLD 850",               url:"https://www.dns-shop.ru/product/3afea3be698fed20/blok-pitania-montech-titan-gold-850-tis0124-cernyj/",               price:"", shop:"DNS" },
  { cat:"❄️ Охлаждение",         brand:"ARCTIC",   name:"Liquid Freezer III Pro 360",   url:"https://www.dns-shop.ru/product/f643aeb111f7c3ee/sistema-ohlazdenia-arctic-liquid-freezer-iii-pro-360-cernaa/",       price:"", shop:"DNS" },
  { cat:"🗃️ Корпус",             brand:"Cougar",   name:"Duoface Pro RGB",              url:"https://www.dns-shop.ru/product/d1a3848c5f26ed20/korpus-cougar-duoface-pro-rgb-cgr-5ad1b-rgb-cernyj/",               price:"", shop:"DNS" },
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
  let s = document.getElementById("pcb-css");
  if (!s) { s = document.createElement("style"); s.id = "pcb-css"; document.head.appendChild(s); }
  s.textContent = `
    .pcb-root { font-family: system-ui, sans-serif; padding: 4px 0 48px; }

    .pcb-header { margin-bottom: 28px; }
    .pcb-sup { font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8f0000;margin-bottom:8px; }
    .pcb-header h1 { font-size:28px;font-weight:800;color:#e0e0e0;letter-spacing:-0.02em;margin:0;line-height:1.15; }
    .pcb-header h1 span { color:#8f0000; }
    .pcb-line { width:40px;height:2px;background:#8f0000;border-radius:2px;margin-top:14px; }

    .pcb-cat-label { font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#3a3a3a;margin:22px 0 8px 2px; }

    .pcb-card { background:#1a1a1a;border:1px solid #2e2e2e;border-left:3px solid #8f0000;border-radius:10px;margin-bottom:7px;overflow:hidden;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s; }
    .pcb-card:hover { background:#1e1e1e;box-shadow:0 2px 14px rgba(143,0,0,0.14); }
    .pcb-card-main { display:flex;align-items:center;gap:14px;padding:14px 14px 14px 16px; }
    .pcb-card-body { flex:1;min-width:0;cursor:pointer; }
    .pcb-card-brand { font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#555;margin-bottom:3px; }
    .pcb-card-name  { font-size:14px;font-weight:600;color:#e0e0e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .pcb-card-right { display:flex;align-items:center;gap:8px;flex-shrink:0; }

    .pcb-price-display { font-size:13px;font-weight:700;color:#e0e0e0;min-width:70px;text-align:right; }
    .pcb-price-display.empty { color:#333;font-weight:400;font-size:11px; }

    .pcb-shop-btn { font-size:10px;font-weight:600;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:6px;padding:5px 11px;cursor:pointer;white-space:nowrap;transition:background 0.14s,border-color 0.14s,color 0.14s; }
    .pcb-shop-btn:hover { background:#2a0000;border-color:#8f0000;color:#cc2222; }
    .pcb-shop-btn:empty { display:none; }

    .pcb-icon-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;font-size:13px;padding:4px 7px;cursor:pointer;transition:color 0.14s,border-color 0.14s,background 0.14s;line-height:1;color:#3a3a3a; }
    .pcb-icon-btn:hover { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .pcb-icon-btn.active { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .pcb-icon-btn.del:hover { color:#cc2222;border-color:#cc2222;background:#1a0000; }

    .pcb-edit-panel { display:none;background:#141414;border-top:1px solid #2a2a2a;padding:14px 16px;gap:10px;flex-direction:column; }
    .pcb-edit-panel.open { display:flex; }
    .pcb-edit-row { display:flex;gap:8px;align-items:center;flex-wrap:wrap; }
    .pcb-edit-label { font-size:10px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.1em;min-width:60px; }
    .pcb-input { flex:1;background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 10px;outline:none;font-family:system-ui,sans-serif;min-width:0;transition:border-color 0.14s; }
    .pcb-input:focus { border-color:#8f0000;background:#1a0000; }
    .pcb-input.price-input { max-width:120px; }
    .pcb-panel-btns { display:flex;gap:8px;justify-content:flex-end; }
    .pcb-save-btn { background:#8f0000;border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:700;padding:6px 16px;cursor:pointer;letter-spacing:0.06em;transition:background 0.14s; }
    .pcb-save-btn:hover { background:#b30000; }
    .pcb-cancel-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;color:#555;font-size:11px;font-weight:600;padding:6px 14px;cursor:pointer;transition:background 0.14s,color 0.14s; }
    .pcb-cancel-btn:hover { background:#1e1e1e;color:#e0e0e0; }

    .pcb-add-wrap { margin-top:20px; }
    .pcb-add-toggle { display:flex;align-items:center;gap:8px;background:#141414;border:1px dashed #2e2e2e;border-radius:10px;padding:12px 16px;cursor:pointer;color:#3a3a3a;font-size:12px;font-weight:600;transition:border-color 0.15s,color 0.15s,background 0.15s;user-select:none; }
    .pcb-add-toggle:hover { border-color:#8f0000;color:#8f0000;background:#1a0000; }
    .pcb-add-toggle .plus { font-size:18px;line-height:1;font-weight:300; }
    .pcb-add-form { display:none;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:16px;margin-top:8px;gap:10px;flex-direction:column; }
    .pcb-add-form.open { display:flex; }
    .pcb-add-form-title { font-size:11px;font-weight:700;color:#8f0000;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:2px; }

    .pcb-footer { margin-top:32px;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap; }
    .pcb-footer-lbl { font-size:11px;color:#444;margin-bottom:4px; }
    .pcb-total { font-size:24px;font-weight:800;color:#e0e0e0;letter-spacing:-0.03em; }
    .pcb-total span { font-size:13px;font-weight:400;color:#555;margin-left:4px; }
    .pcb-total.zero { color:#333;font-size:14px;font-weight:400; }
    .pcb-footer-badge { font-size:10px;font-weight:700;letter-spacing:0.08em;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:20px;padding:5px 14px; }
    .pcb-hint { font-size:10px;color:#2a2a2a;margin-top:4px; }
    .pcb-count-val { font-size:24px;font-weight:800;color:#e0e0e0;letter-spacing:-0.03em; }
    .pcb-count-val span { font-size:13px;font-weight:400;color:#555;margin-left:4px; }
  `;
}

/* ── ROOT ── */
const root = dv.el("div","",{ cls:"pcb-root" });

/* ── Заголовок ── */
const hdr = root.createEl("div",{ cls:"pcb-header" });
hdr.createEl("div",{ cls:"pcb-sup", text:"PC Build · DNS" });
const h1 = hdr.createEl("h1");
h1.innerHTML = `Моя <span>будущая</span> сборка`;
hdr.createEl("div",{ cls:"pcb-line" });

/* ── Контейнер карточек ── */
const cardsWrap = root.createEl("div");

let totalEl = null;
let countEl = null;
let badgeEl = null;

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
      totalEl.className = "pcb-total zero";
      totalEl.textContent = "Введите цены в карточках";
    } else {
      totalEl.className = "pcb-total";
      totalEl.innerHTML = `${sum.toLocaleString("ru-RU")} <span>₽</span>`;
    }
  }
  if (countEl) countEl.innerHTML = `${data.length} <span>позиций</span>`;
  if (badgeEl) badgeEl.textContent = `🖥️ Сборка: ${data.length} поз.`;
}

/* ── Одна карточка ── */
function makeCard(item, idx) {
  const card = document.createElement("div"); card.className = "pcb-card";

  const main = document.createElement("div"); main.className = "pcb-card-main"; card.appendChild(main);

  const body = document.createElement("div"); body.className = "pcb-card-body";
  body.addEventListener("click", () => item.url && window.open(item.url,"_blank"));
  const brandEl = document.createElement("div"); brandEl.className = "pcb-card-brand"; brandEl.textContent = item.brand;
  const nameEl  = document.createElement("div"); nameEl.className  = "pcb-card-name";  nameEl.textContent = item.name;
  body.appendChild(brandEl); body.appendChild(nameEl); main.appendChild(body);

  const right = document.createElement("div"); right.className = "pcb-card-right"; main.appendChild(right);

  const priceDisplay = document.createElement("div");
  priceDisplay.className = item.price ? "pcb-price-display" : "pcb-price-display empty";
  priceDisplay.textContent = item.price ? `${parseFloat(item.price).toLocaleString("ru-RU")} ₽` : "цена?";
  right.appendChild(priceDisplay);

  if (item.url) {
    const shopBtn = document.createElement("div"); shopBtn.className = "pcb-shop-btn";
    shopBtn.textContent = (item.shop||"→") + " →";
    shopBtn.addEventListener("click", () => window.open(item.url,"_blank"));
    right.appendChild(shopBtn);
  }

  const editBtn = document.createElement("div"); editBtn.className = "pcb-icon-btn"; editBtn.textContent = "✏️"; right.appendChild(editBtn);
  const delBtn  = document.createElement("div"); delBtn.className  = "pcb-icon-btn del"; delBtn.textContent = "🗑️"; right.appendChild(delBtn);

  /* ── Панель редактирования ── */
  const panel = document.createElement("div"); panel.className = "pcb-edit-panel"; card.appendChild(panel);

  function mkRow(label, inputEl) {
    const row = document.createElement("div"); row.className = "pcb-edit-row";
    const lbl = document.createElement("div"); lbl.className = "pcb-edit-label"; lbl.textContent = label;
    row.appendChild(lbl); row.appendChild(inputEl); panel.appendChild(row);
  }

  const catInput   = document.createElement("input"); catInput.className   = "pcb-input"; catInput.type="text"; catInput.value = item.cat||""; catInput.placeholder = "Категория (с эмодзи)";
  const brandInput = document.createElement("input"); brandInput.className = "pcb-input"; brandInput.type="text"; brandInput.value = item.brand||""; brandInput.placeholder = "Бренд";
  const nameInput  = document.createElement("input"); nameInput.className  = "pcb-input"; nameInput.type="text"; nameInput.value = item.name||""; nameInput.placeholder = "Название";
  const urlInput   = document.createElement("input"); urlInput.className   = "pcb-input"; urlInput.type="text"; urlInput.value = item.url||""; urlInput.placeholder = "https://...";
  const shopInput  = document.createElement("input"); shopInput.className  = "pcb-input"; shopInput.type="text"; shopInput.value = item.shop||""; shopInput.placeholder = "DNS / ozon.ru / ...";
  const priceInput = document.createElement("input"); priceInput.className = "pcb-input price-input"; priceInput.type="number"; priceInput.value = item.price||""; priceInput.placeholder = "89990";

  mkRow("Категория", catInput);
  mkRow("Бренд",     brandInput);
  mkRow("Название",  nameInput);
  mkRow("Ссылка",    urlInput);
  mkRow("Магазин",   shopInput);
  mkRow("Цена ₽",    priceInput);

  const btns = document.createElement("div"); btns.className = "pcb-panel-btns"; panel.appendChild(btns);
  const cancelBtn = document.createElement("button"); cancelBtn.className = "pcb-cancel-btn"; cancelBtn.textContent = "Отмена"; btns.appendChild(cancelBtn);
  const saveBtn   = document.createElement("button"); saveBtn.className   = "pcb-save-btn";   saveBtn.textContent = "Сохранить"; btns.appendChild(saveBtn);

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

  return card;
}

/* ── Рендер всех карточек ── */
function renderCards() {
  cardsWrap.innerHTML = "";
  let lastCat = null;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.cat !== lastCat) {
      const lbl = document.createElement("div"); lbl.className = "pcb-cat-label"; lbl.textContent = item.cat;
      cardsWrap.appendChild(lbl);
      lastCat = item.cat;
    }
    cardsWrap.appendChild(makeCard(item, i));
  }
}

renderCards();

/* ── Кнопка + форма добавления ── */
const addWrap   = root.createEl("div",{ cls:"pcb-add-wrap" });
const addToggle = addWrap.createEl("div",{ cls:"pcb-add-toggle" });
addToggle.innerHTML = `<span class="plus">+</span> Добавить компонент`;

const addForm = addWrap.createEl("div",{ cls:"pcb-add-form" });
addForm.createEl("div",{ cls:"pcb-add-form-title", text:"Новый компонент" });

function mkAddRow(label, placeholder, type="text", small=false) {
  const row = addForm.createEl("div",{ cls:"pcb-edit-row" });
  row.createEl("div",{ cls:"pcb-edit-label", text:label });
  const inp = row.createEl("input",{ cls: small ? "pcb-input price-input" : "pcb-input" });
  inp.type = type; inp.placeholder = placeholder;
  return inp;
}
const aCat   = mkAddRow("Категория", "🗃️ Корпус");
const aBrand = mkAddRow("Бренд",     "Название бренда");
const aName  = mkAddRow("Название",  "Название компонента");
const aUrl   = mkAddRow("Ссылка",    "https://...");
const aShop  = mkAddRow("Магазин",   "DNS");
const aPrice = mkAddRow("Цена ₽",    "89990", "number", true);

const addBtns   = addForm.createEl("div",{ cls:"pcb-panel-btns" });
const addCancel = addBtns.createEl("button",{ cls:"pcb-cancel-btn", text:"Отмена" });
const addSave   = addBtns.createEl("button",{ cls:"pcb-save-btn",   text:"Добавить" });

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
const footer = root.createEl("div",{ cls:"pcb-footer" });
const fl = footer.createEl("div");
fl.createEl("div",{ cls:"pcb-footer-lbl", text:"Итого по сборке" });
totalEl = fl.createEl("div");
fl.createEl("div",{ cls:"pcb-hint", text:"Цены вводи через ✏️ на каждой карточке" });

const fc = footer.createEl("div");
fc.createEl("div",{ cls:"pcb-footer-lbl", text:"Компонентов" });
countEl = fc.createEl("div",{ cls:"pcb-count-val" });

badgeEl = footer.createEl("div",{ cls:"pcb-footer-badge" });

refreshFooter();
```
