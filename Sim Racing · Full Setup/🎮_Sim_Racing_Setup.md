---
cssclasses: [task-board]
---

```dataviewjs
/* ═══════════════════════════════════════════════════════
   🏎️ SIM RACING SETUP — цены, наличие, история, бюджет
   Данные: Sim Racing · Full Setup/.board-data.json
═══════════════════════════════════════════════════════ */
(async () => {

const DATA_FILE = "Sim Racing · Full Setup/.board-data.json";

const STATUS = {
  in:     { icon:"🟢", label:"В наличии",     chip:"#2e7d32", bg:"#0d1f0e" },
  order:  { icon:"🟡", label:"Под заказ",     chip:"#8a6d00", bg:"#1f1a00" },
  out:    { icon:"🔴", label:"Нет в наличии", chip:"#8f0000", bg:"#1f0000" },
  bought: { icon:"✅", label:"Куплено",       chip:"#5a5a5a", bg:"#161616" },
};
const STATUS_ORDER = ["in","order","out","bought"];

const DEFAULTS = [
  { cat:"⚙️ Основа руля",        brand:"MOZA",     name:"R9 V3 Direct Drive Wheelbase", url:"https://www.dns-shop.ru/product/c2c7915a12d8d582/baza-rula-moza-r9-v3-direct-drive-wheelbase-cernyj/", shop:"DNS" },
  { cat:"🎯 Руль",                brand:"MOZA",     name:"CS V2P Steering Wheel",         url:"https://www.dns-shop.ru/product/46ce0d6d90d7d21a/rulevoe-koleso-moza-ss-v2p/",                                shop:"DNS" },
  { cat:"🦶 Педали",              brand:"MOZA",     name:"SR-P Pedals — Тормоз + Газ",    url:"https://www.dns-shop.ru/product/fa02628d13e3ed20/pedalnyj-blok-moza-sr-p/",                                   shop:"DNS" },
  { cat:"🦶 Педали",              brand:"MOZA",     name:"SR-P Clutch Pedal — Сцепление", url:"https://www.dns-shop.ru/product/560e2df92c93a69e/pedalnyj-blok-moza-crp2/",                                   shop:"DNS" },
  { cat:"🔧 Коробка передач",     brand:"MOZA",     name:"SGP Sequential Shifter",        url:"https://www.dns-shop.ru/product/c0385c7bdaa8ed20/korobka-peredac-moza-sgp/",                                   shop:"DNS" },
  { cat:"🚨 Ручник",              brand:"MOZA",     name:"HBP Handbrake",                 url:"https://www.dns-shop.ru/product/97bb0d0a0a5ded20/rucnoj-tormoz-moza-hbp-handbrake/",                          shop:"DNS" },
  { cat:"🪑 Кокпит",              brand:"GameSTUL", name:"DUAL Universal Cockpit",        url:"https://gamestul.ru/shop/tproduct/483426557-902385033141-universalnii-kokpit-gamestul-dual",                   shop:"gamestul.ru" },
];

const EMPTY = () => ({ cat:"", brand:"", name:"", url:"", shop:"", price:"", priceDate:"", hist:[], altPrice:"", altShop:"", status:"in", note:"" });

/* ── Хранилище: JSON-файл в vault (переносится на Windows и в бэкап) ── */
let data = { items:[], budget:"" };

async function loadData() {
  try {
    const raw = await app.vault.adapter.read(DATA_FILE);
    const j = JSON.parse(raw);
    if (j && Array.isArray(j.items)) { data = j; return; }
  } catch(_) {}
  /* файла нет — миграция из старого localStorage, иначе дефолты */
  let items = DEFAULTS.map(d => ({ ...EMPTY(), ...d }));
  try {
    const s = localStorage.getItem("sim_racing_v1");
    if (s) { const a = JSON.parse(s); if (Array.isArray(a) && a.length) items = a.map(d => ({ ...EMPTY(), ...d })); }
  } catch(_) {}
  data = { items, budget:"" };
  await saveData();
}
async function saveData() {
  try { await app.vault.adapter.write(DATA_FILE, JSON.stringify(data, null, 1)); }
  catch(e) { console.error("sr save:", e); }
}
await loadData();
const items = data.items;

/* ── Утилиты ── */
const num = v => { const n = parseFloat(String(v||"").replace(/\s/g,"").replace(",",".")); return isNaN(n) || n < 0 ? 0 : n; };
const fmt = n => n.toLocaleString("ru-RU");
const today = () => new Date().toISOString().slice(0,10);
function ago(dateStr) {
  if (!dateStr) return "";
  const d = Math.floor((Date.now() - new Date(dateStr+"T00:00:00").getTime()) / 86400000);
  if (isNaN(d) || d < 0) return "только что";
  if (d === 0) return "сегодня";
  if (d === 1) return "вчера";
  if (d < 7) return `${d} дн. назад`;
  if (d < 31) return `${Math.floor(d/7)} нед. назад`;
  return `${Math.floor(d/30)} мес. назад`;
}

/* ── Фильтры / сортировка (не сохраняются) ── */
let filterMode = "all";   // all | todo | bought
let sortMode   = "none";  // none | asc | desc

/* ── CSS ── */
{
  let s = document.getElementById("sr-css");
  if (!s) { s = document.createElement("style"); s.id = "sr-css"; document.head.appendChild(s); }
  s.textContent = `
    .sr-root { font-family: system-ui, sans-serif; padding: 4px 0 48px; }

    .sr-header { margin-bottom: 20px; }
    .sr-sup { font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8f0000;margin-bottom:8px; }
    .sr-header h1 { font-size:28px;font-weight:800;color:#e0e0e0;letter-spacing:-0.02em;margin:0;line-height:1.15; }
    .sr-header h1 span { color:#8f0000; }
    .sr-line { width:40px;height:2px;background:#8f0000;border-radius:2px;margin-top:14px; }

    /* фильтры */
    .sr-toolbar { display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;align-items:center; }
    .sr-fchip { font-size:11px;font-weight:600;color:#444;background:#141414;border:1px solid #2a2a2a;border-radius:20px;padding:5px 14px;cursor:pointer;user-select:none;transition:color 0.14s,border-color 0.14s,background 0.14s; }
    .sr-fchip:hover { color:#e0e0e0;border-color:#3a3a3a; }
    .sr-fchip.active { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .sr-sort { margin-left:auto;background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#888;font-size:11px;padding:5px 8px;outline:none;font-family:system-ui,sans-serif;cursor:pointer; }

    .sr-cat-label { font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#3a3a3a;margin:22px 0 8px 2px; }

    /* карточка */
    .sr-card { background:#1a1a1a;border:1px solid #2e2e2e;border-left:3px solid #8f0000;border-radius:10px;margin-bottom:7px;overflow:hidden;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s,opacity 0.2s; }
    .sr-card:hover { background:#1e1e1e;box-shadow:0 2px 14px rgba(143,0,0,0.14); }
    .sr-card.bought { opacity:0.55; }
    .sr-card.bought:hover { opacity:0.85; }
    .sr-card-main { display:flex;align-items:center;gap:14px;padding:13px 14px 13px 16px; }
    .sr-card-body { flex:1;min-width:0;cursor:pointer; }
    .sr-card-brand { font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#555;margin-bottom:3px; }
    .sr-card-name  { font-size:14px;font-weight:600;color:#e0e0e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .sr-card-meta  { display:flex;align-items:center;gap:8px;margin-top:5px;font-size:10.5px;color:#555;flex-wrap:wrap; }
    .sr-card-note  { font-size:10.5px;color:#665;font-style:italic;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .sr-card-right { display:flex;align-items:center;gap:8px;flex-shrink:0; }

    .sr-status-chip { display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;border-radius:12px;padding:2px 9px;cursor:pointer;user-select:none;border:1px solid transparent;transition:border-color 0.14s; }
    .sr-status-chip:hover { border-color:currentColor; }

    .sr-delta-up   { color:#8f0000;font-weight:700; }
    .sr-delta-down { color:#2e7d32;font-weight:700; }
    .sr-minlbl { color:#444; }

    .sr-price-block { text-align:right; }
    .sr-price-display { font-size:13px;font-weight:700;color:#e0e0e0;white-space:nowrap; }
    .sr-price-display.empty { color:#333;font-weight:400;font-size:11px; }
    .sr-price-date { font-size:9px;color:#444;margin-top:2px;white-space:nowrap; }

    .sr-shop-btn { font-size:10px;font-weight:600;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:6px;padding:5px 11px;cursor:pointer;white-space:nowrap;transition:background 0.14s,border-color 0.14s,color 0.14s; }
    .sr-shop-btn:hover { background:#2a0000;border-color:#8f0000;color:#cc2222; }
    .sr-shop-btn:empty { display:none; }

    .sr-icon-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;font-size:13px;padding:4px 7px;cursor:pointer;transition:color 0.14s,border-color 0.14s,background 0.14s;line-height:1;color:#3a3a3a; }
    .sr-icon-btn:hover { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .sr-icon-btn.active { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .sr-icon-btn.del:hover { color:#cc2222;border-color:#cc2222;background:#1a0000; }

    /* панель редактирования */
    .sr-edit-panel { display:none;background:#141414;border-top:1px solid #2a2a2a;padding:14px 16px;gap:10px;flex-direction:column; }
    .sr-edit-panel.open { display:flex; }
    .sr-edit-row { display:flex;gap:8px;align-items:center;flex-wrap:wrap; }
    .sr-edit-label { font-size:10px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.1em;min-width:80px; }
    .sr-input { flex:1;background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 10px;outline:none;font-family:system-ui,sans-serif;min-width:0;transition:border-color 0.14s; }
    .sr-input:focus { border-color:#8f0000;background:#1a0000; }
    .sr-input.price-input { max-width:110px; }
    .sr-select { background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 8px;outline:none;font-family:system-ui,sans-serif;cursor:pointer; }
    .sr-select:focus { border-color:#8f0000; }
    .sr-panel-btns { display:flex;gap:8px;justify-content:flex-end; }
    .sr-save-btn { background:#8f0000;border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:700;padding:6px 16px;cursor:pointer;letter-spacing:0.06em;transition:background 0.14s; }
    .sr-save-btn:hover { background:#b30000; }
    .sr-cancel-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;color:#555;font-size:11px;font-weight:600;padding:6px 14px;cursor:pointer;transition:background 0.14s,color 0.14s; }
    .sr-cancel-btn:hover { background:#1e1e1e;color:#e0e0e0; }

    /* добавление */
    .sr-add-wrap { margin-top:20px; }
    .sr-add-toggle { display:flex;align-items:center;gap:8px;background:#141414;border:1px dashed #2e2e2e;border-radius:10px;padding:12px 16px;cursor:pointer;color:#3a3a3a;font-size:12px;font-weight:600;transition:border-color 0.15s,color 0.15s,background 0.15s;user-select:none; }
    .sr-add-toggle:hover { border-color:#8f0000;color:#8f0000;background:#1a0000; }
    .sr-add-toggle .plus { font-size:18px;line-height:1;font-weight:300; }
    .sr-add-form { display:none;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:16px;margin-top:8px;gap:10px;flex-direction:column; }
    .sr-add-form.open { display:flex; }
    .sr-add-form-title { font-size:11px;font-weight:700;color:#8f0000;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:2px; }

    /* футер */
    .sr-footer { margin-top:32px;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:18px 20px;display:flex;gap:28px;flex-wrap:wrap; }
    .sr-fcol { min-width:130px; }
    .sr-footer-lbl { font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#444;margin-bottom:6px; }
    .sr-total { font-size:22px;font-weight:800;color:#e0e0e0;letter-spacing:-0.03em; }
    .sr-total span { font-size:12px;font-weight:400;color:#555;margin-left:4px; }
    .sr-total.zero { color:#333;font-size:13px;font-weight:400; }
    .sr-sub { font-size:11px;color:#555;margin-top:4px; }
    .sr-sub.ok  { color:#2e7d32; }
    .sr-sub.bad { color:#8f0000;font-weight:600; }
    .sr-budget-input { background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:13px;font-weight:700;padding:4px 10px;outline:none;font-family:system-ui,sans-serif;width:120px;transition:border-color 0.14s; }
    .sr-budget-input:focus { border-color:#8f0000; }
    .sr-footer-btn { background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#c9c9c9;font-size:11px;font-weight:600;padding:5px 12px;cursor:pointer;font-family:system-ui,sans-serif;transition:border-color 0.14s,color 0.14s; }
    .sr-footer-btn:hover { border-color:#8f0000;color:#e0e0e0; }
    .sr-footer-btn:disabled { opacity:0.5;cursor:default; }
    .sr-hint { font-size:10px;color:#2a2a2a;margin-top:12px; }
    .sr-footer-badge { align-self:center;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:20px;padding:5px 14px;white-space:nowrap; }
  `;
}

/* ── ROOT ── */
const root = dv.el("div","",{ cls:"sr-root" });

/* ── Заголовок + фильтры ── */
const hdr = root.createEl("div",{ cls:"sr-header" });
hdr.createEl("div",{ cls:"sr-sup", text:"Sim Racing · Full Setup" });
hdr.createEl("h1",{ text:"" }).innerHTML = `Игровая зона <span>на руле</span>`;
hdr.createEl("div",{ cls:"sr-line" });

const toolbar = root.createEl("div",{ cls:"sr-toolbar" });
const FILTERS = [ ["all","Все"], ["todo","Не купленные"], ["bought","Купленные"] ];
const fchips = FILTERS.map(([mode,label]) => {
  const c = toolbar.createEl("div",{ cls:"sr-fchip" + (mode===filterMode?" active":""), text:label });
  c.addEventListener("click", () => {
    filterMode = mode;
    fchips.forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    renderCards();
  });
  return c;
});
const sortSel = toolbar.createEl("select",{ cls:"sr-sort" });
[ ["none","порядок как есть"], ["asc","цена ↑"], ["desc","цена ↓"] ].forEach(([v,t]) => {
  const o = sortSel.createEl("option",{ text:t }); o.value = v; if (v===sortMode) o.selected = true;
});
sortSel.addEventListener("change", () => { sortMode = sortSel.value; renderCards(); });

/* ── Контейнер карточек ── */
const cardsWrap = root.createEl("div");

let totalEl = null, boughtEl = null, boughtSubEl = null, budgetSubEl = null, countBadge = null;

/* ── Итоги ── */
function totals() {
  let all = 0, boughtSum = 0, boughtCount = 0, leftSum = 0, leftCount = 0;
  for (const it of items) {
    const p = num(it.price);
    all += p;
    if (it.status === "bought") { boughtSum += p; boughtCount++; }
    else { leftSum += p; leftCount++; }
  }
  return { all, boughtSum, boughtCount, leftSum, leftCount };
}
function refreshFooter() {
  const t = totals();
  if (totalEl) {
    if (t.all === 0) { totalEl.className = "sr-total zero"; totalEl.textContent = "Введите цены в карточках"; }
    else { totalEl.className = "sr-total"; totalEl.innerHTML = `${fmt(t.all)} <span>₽</span>`; }
  }
  if (boughtEl) boughtEl.innerHTML = t.boughtCount ? `${fmt(t.boughtSum)} <span>₽</span>` : `—`;
  if (boughtSubEl) boughtSubEl.textContent = `Куплено ${t.boughtCount} из ${items.length} · осталось ${fmt(t.leftSum)} ₽`;
  if (budgetSubEl) {
    const b = num(data.budget);
    if (!b) { budgetSubEl.className = "sr-sub"; budgetSubEl.textContent = "не задан"; }
    else if (t.all <= b) { budgetSubEl.className = "sr-sub ok"; budgetSubEl.textContent = `остаток ${fmt(b - t.all)} ₽`; }
    else { budgetSubEl.className = "sr-sub bad"; budgetSubEl.textContent = `превышение на ${fmt(t.all - b)} ₽!`; }
  }
  if (countBadge) countBadge.textContent = `🏆 Комплектация: ${items.length} поз. · куплено ${t.boughtCount}`;
}

/* ── Одна карточка ── */
function makeCard(item, idx) {
  const card = document.createElement("div");
  card.className = "sr-card" + (item.status === "bought" ? " bought" : "");

  const main = document.createElement("div"); main.className = "sr-card-main"; card.appendChild(main);

  const body = document.createElement("div"); body.className = "sr-card-body";
  body.addEventListener("click", () => item.url && window.open(item.url,"_blank"));
  body.appendChild(Object.assign(document.createElement("div"),{ className:"sr-card-brand", textContent:item.brand }));
  body.appendChild(Object.assign(document.createElement("div"),{ className:"sr-card-name",  textContent:item.name }));
  main.appendChild(body);

  /* мета: статус-чип + дата цены + дельта + мин */
  const meta = document.createElement("div"); meta.className = "sr-card-meta"; body.appendChild(meta);

  const st = STATUS[item.status] || STATUS.in;
  const chip = document.createElement("span");
  chip.className = "sr-status-chip";
  chip.style.color = st.chip; chip.style.background = st.bg;
  chip.textContent = `${st.icon} ${st.label}`;
  chip.title = "Клик — сменить статус";
  chip.addEventListener("click", e => {
    e.stopPropagation();
    const cur = STATUS_ORDER.indexOf(item.status);
    item.status = STATUS_ORDER[(cur + 1) % STATUS_ORDER.length];
    saveData().then(() => { renderCards(); refreshFooter(); });
  });
  meta.appendChild(chip);

  if (item.priceDate) {
    const dEl = document.createElement("span"); dEl.textContent = `цена: ${ago(item.priceDate)}`;
    meta.appendChild(dEl);
  }
  /* дельта к предыдущей цене + минимум за всё время */
  const prices = (item.hist || []).map(h => num(h.p)).filter(p => p > 0);
  if (item.price) prices.push(num(item.price));
  if (prices.length >= 2) {
    const cur = num(item.price), prev = prices.length > 1 && item.hist && item.hist.length ? num(item.hist[item.hist.length-1].p) : null;
    if (prev && prev > 0 && cur > 0 && cur !== prev) {
      const d = document.createElement("span");
      d.className = cur > prev ? "sr-delta-up" : "sr-delta-down";
      d.textContent = cur > prev ? `▲ было ${fmt(prev)}` : `▽ было ${fmt(prev)}`;
      meta.appendChild(d);
    }
    const mn = Math.min(...prices);
    const curMin = num(item.price);
    if (mn > 0 && curMin > mn) {
      const m = document.createElement("span"); m.className = "sr-minlbl"; m.textContent = `мин ${fmt(mn)} ₽`;
      meta.appendChild(m);
    }
  }

  if (item.note) {
    const nEl = document.createElement("div"); nEl.className = "sr-card-note"; nEl.textContent = `💬 ${item.note}`;
    body.appendChild(nEl);
  }

  /* правая часть: цена + магазин + кнопки */
  const right = document.createElement("div"); right.className = "sr-card-right"; main.appendChild(right);

  const pblock = document.createElement("div"); pblock.className = "sr-price-block"; right.appendChild(pblock);
  const priceDisplay = document.createElement("div");
  priceDisplay.className = item.price ? "sr-price-display" : "sr-price-display empty";
  priceDisplay.textContent = item.price ? `${fmt(num(item.price))} ₽` : "цена?";
  pblock.appendChild(priceDisplay);
  if (item.altPrice && num(item.altPrice) > 0) {
    const alt = document.createElement("div"); alt.className = "sr-price-date";
    alt.textContent = `${item.altShop || "другой магазин"}: ${fmt(num(item.altPrice))} ₽`;
    pblock.appendChild(alt);
  } else if (item.priceDate) {
    const pd = document.createElement("div"); pd.className = "sr-price-date"; pd.textContent = item.priceDate;
    pblock.appendChild(pd);
  }

  if (item.url) {
    const shopBtn = document.createElement("div"); shopBtn.className = "sr-shop-btn";
    shopBtn.textContent = (item.shop || "→") + " →";
    shopBtn.addEventListener("click", () => window.open(item.url,"_blank"));
    right.appendChild(shopBtn);
  }

  const editBtn = document.createElement("div"); editBtn.className = "sr-icon-btn"; editBtn.textContent = "✏️"; right.appendChild(editBtn);
  const delBtn  = document.createElement("div"); delBtn.className  = "sr-icon-btn del"; delBtn.textContent = "🗑️"; right.appendChild(delBtn);

  /* ── Панель редактирования ── */
  const panel = document.createElement("div"); panel.className = "sr-edit-panel"; card.appendChild(panel);

  function mkRow(label, inputEl) {
    const row = document.createElement("div"); row.className = "sr-edit-row";
    row.appendChild(Object.assign(document.createElement("div"),{ className:"sr-edit-label", textContent:label }));
    row.appendChild(inputEl); panel.appendChild(row);
  }
  function mkInput(cls, type, val, ph) {
    const i = document.createElement("input"); i.className = cls; i.type = type; i.value = val || ""; i.placeholder = ph || ""; return i;
  }

  const catInput   = mkInput("sr-input","text", item.cat,   "Категория (с эмодзи)");
  const brandInput = mkInput("sr-input","text", item.brand, "Бренд");
  const nameInput  = mkInput("sr-input","text", item.name,  "Название");
  const urlInput   = mkInput("sr-input","text", item.url,   "https://...");
  const shopInput  = mkInput("sr-input","text", item.shop,  "DNS / gamestul.ru / ...");
  const priceInput = mkInput("sr-input price-input","number", item.price, "25990");
  const altInput   = mkInput("sr-input price-input","number", item.altPrice, "");
  const altShopInp = mkInput("sr-input","text", item.altShop, "Магазин альт. цены");
  const noteInput  = mkInput("sr-input","text", item.note,   "Ждать скидку / брать б/у / ...");
  const statusSel  = document.createElement("select"); statusSel.className = "sr-select";
  STATUS_ORDER.forEach(sKey => {
    const o = document.createElement("option"); o.value = sKey; o.textContent = `${STATUS[sKey].icon} ${STATUS[sKey].label}`;
    if (sKey === item.status) o.selected = true;
    statusSel.appendChild(o);
  });

  mkRow("Категория",   catInput);
  mkRow("Бренд",       brandInput);
  mkRow("Название",    nameInput);
  mkRow("Ссылка",      urlInput);
  mkRow("Магазин",     shopInput);
  mkRow("Цена ₽",      priceInput);
  mkRow("Статус",      statusSel);
  mkRow("Альт. цена ₽", altInput);
  mkRow("Альт. магазин", altShopInp);
  mkRow("Заметка",     noteInput);
  panel.appendChild(Object.assign(document.createElement("div"),{ className:"sr-hint", textContent:"Новая цена автоматически получает сегодняшнюю дату и попадает в историю" }));

  const btns = document.createElement("div"); btns.className = "sr-panel-btns"; panel.appendChild(btns);
  const cancelBtn = document.createElement("button"); cancelBtn.className = "sr-cancel-btn"; cancelBtn.textContent = "Отмена"; btns.appendChild(cancelBtn);
  const saveBtn   = document.createElement("button"); saveBtn.className   = "sr-save-btn";   saveBtn.textContent = "Сохранить"; btns.appendChild(saveBtn);

  editBtn.addEventListener("click", e => {
    e.stopPropagation();
    const open = panel.classList.toggle("open");
    editBtn.classList.toggle("active", open);
  });
  cancelBtn.addEventListener("click", () => { panel.classList.remove("open"); editBtn.classList.remove("active"); });

  saveBtn.addEventListener("click", () => {
    const it = items[idx];
    it.cat   = catInput.value.trim()   || it.cat;
    it.brand = brandInput.value.trim() || it.brand;
    it.name  = nameInput.value.trim()  || it.name;
    it.url   = urlInput.value.trim();
    it.shop  = shopInput.value.trim();
    it.status = statusSel.value;
    it.altPrice = altInput.value.trim();
    it.altShop  = altShopInp.value.trim();
    it.note  = noteInput.value.trim();
    const newPrice = priceInput.value.trim();
    if (newPrice !== it.price) {
      const prevVal = it.price ? num(it.price) : 0;
      if (newPrice && num(newPrice) > 0 && prevVal !== num(newPrice)) {
        if (!Array.isArray(it.hist)) it.hist = [];
        if (it.price) it.hist.push({ p: String(it.price), d: it.priceDate || "" });
      }
      it.price = newPrice;
      it.priceDate = newPrice ? today() : "";
      if (!newPrice) it.hist = [];
    }
    saveData().then(() => { renderCards(); refreshFooter(); });
  });

  delBtn.addEventListener("click", () => {
    if (!confirm(`Удалить «${item.name}»?`)) return;
    items.splice(idx, 1);
    saveData().then(() => { renderCards(); refreshFooter(); });
  });

  return card;
}

/* ── Рендер всех карточек (с учётом фильтра и сортировки) ── */
function renderCards() {
  cardsWrap.innerHTML = "";
  let list = items.map((it, i) => ({ it, i }));
  if (filterMode === "todo")   list = list.filter(x => x.it.status !== "bought");
  if (filterMode === "bought") list = list.filter(x => x.it.status === "bought");
  if (sortMode === "asc")  list = list.slice().sort((a,b) => num(b.it.price) - num(a.it.price));
  if (sortMode === "desc") list = list.slice().sort((a,b) => num(a.it.price) - num(b.it.price));

  if (!list.length) {
    cardsWrap.appendChild(Object.assign(document.createElement("div"),{ className:"sr-cat-label", textContent:"ничего не найдено" }));
    return;
  }
  const showCats = sortMode === "none";
  let lastCat = null;
  for (const { it, i } of list) {
    if (showCats && it.cat !== lastCat) {
      cardsWrap.appendChild(Object.assign(document.createElement("div"),{ className:"sr-cat-label", textContent:it.cat }));
      lastCat = it.cat;
    }
    cardsWrap.appendChild(makeCard(it, i));
  }
}
renderCards();

/* ── Кнопка + форма добавления ── */
const addWrap   = root.createEl("div",{ cls:"sr-add-wrap" });
const addToggle = addWrap.createEl("div",{ cls:"sr-add-toggle" });
addToggle.innerHTML = `<span class="plus">+</span> Добавить товар`;

const addForm = addWrap.createEl("div",{ cls:"sr-add-form" });
addForm.createEl("div",{ cls:"sr-add-form-title", text:"Новый товар" });

function mkAddRow(label, placeholder, type="text", small=false) {
  const row = addForm.createEl("div",{ cls:"sr-edit-row" });
  row.createEl("div",{ cls:"sr-edit-label", text:label });
  const inp = row.createEl("input",{ cls: small ? "sr-input price-input" : "sr-input" });
  inp.type = type; inp.placeholder = placeholder;
  return inp;
}
const aCat   = mkAddRow("Категория", "🪑 Кокпит");
const aBrand = mkAddRow("Бренд",     "MOZA");
const aName  = mkAddRow("Название",  "Название товара");
const aUrl   = mkAddRow("Ссылка",    "https://...");
const aShop  = mkAddRow("Магазин",   "DNS");
const aPrice = mkAddRow("Цена ₽",    "25990", "number", true);
const aNote  = mkAddRow("Заметка",   "Ждать скидку / ...");

const addBtns   = addForm.createEl("div",{ cls:"sr-panel-btns" });
const addCancel = addBtns.createEl("button",{ cls:"sr-cancel-btn", text:"Отмена" });
const addSave   = addBtns.createEl("button",{ cls:"sr-save-btn",   text:"Добавить" });

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
  const rec = { ...EMPTY(),
    cat:   aCat.value.trim()   || "📦 Другое",
    brand: aBrand.value.trim(),
    name,
    url:   aUrl.value.trim(),
    shop:  aShop.value.trim()  || "→",
    price: aPrice.value.trim(),
    note:  aNote.value.trim(),
  };
  if (rec.price && num(rec.price) > 0) rec.priceDate = today();
  items.push(rec);
  saveData().then(() => { renderCards(); refreshFooter(); });
  [aCat,aBrand,aName,aUrl,aShop,aPrice,aNote].forEach(i => i.value = "");
  addForm.classList.remove("open");
  addToggle.style.cssText = "";
});

/* ── Футер ── */
const footer = root.createEl("div",{ cls:"sr-footer" });

const c1 = footer.createEl("div",{ cls:"sr-fcol" });
c1.createEl("div",{ cls:"sr-footer-lbl", text:"Итого по сборке" });
totalEl = c1.createEl("div");

const c2 = footer.createEl("div",{ cls:"sr-fcol" });
c2.createEl("div",{ cls:"sr-footer-lbl", text:"Куплено" });
boughtEl = c2.createEl("div");
boughtSubEl = c2.createEl("div",{ cls:"sr-sub" });

const c3 = footer.createEl("div",{ cls:"sr-fcol" });
c3.createEl("div",{ cls:"sr-footer-lbl", text:"Бюджет ₽" });
const budgetInput = c3.createEl("input",{ cls:"sr-budget-input" });
budgetInput.type = "number"; budgetInput.placeholder = "200000";
budgetInput.value = data.budget || "";
budgetInput.addEventListener("change", () => { data.budget = budgetInput.value.trim(); saveData().then(refreshFooter); });
budgetSubEl = c3.createEl("div",{ cls:"sr-sub" });

    const c3b = footer.createEl("div",{ cls:"sr-fcol", attr:{"style":"min-width:170px;"} });
    c3b.createEl("div",{ cls:"sr-footer-lbl", text:"Цены с DNS" });
    const dnsBtn = c3b.createEl("button",{ cls:"sr-footer-btn", text:"🔄 Обновить с DNS" });
    const dnsStatus = c3b.createEl("div",{ cls:"sr-sub" });
    async function loadDnsStatus() {
      try {
        const st = await app.vault.adapter.read(".dns-prices-status");
        const j = JSON.parse(st);
        const ts = j.ts ? new Date(j.ts) : null;
        if (!ts) { dnsStatus.textContent = "нет данных"; return; }
        const m = Math.floor((Date.now()-ts)/60000);
        const rel = m < 1 ? "только что" : m < 60 ? m + " мин назад" : Math.floor(m/60) + " ч назад";
        dnsStatus.textContent = "обновлено " + rel + " · " + (j.got||0) + "/" + (j.total||0) + (j.changed ? " (+" + j.changed + ")" : "");
      } catch(_) { dnsStatus.textContent = "нет данных"; }
    }
    dnsBtn.addEventListener("click", async () => {
      try {
        await app.vault.adapter.write(".dns-prices-request", String(Date.now()));
        dnsBtn.textContent = "⏳ Запущено...";
        dnsBtn.disabled = true;
        setTimeout(()=>{ dnsBtn.textContent="🔄 Обновить с DNS"; dnsBtn.disabled=false; }, 60000);
      } catch(e) { dnsBtn.textContent="⚠ Ошибка"; setTimeout(()=>{ dnsBtn.textContent="🔄 Обновить с DNS"; dnsBtn.disabled=false; },2000); }
    });
    await loadDnsStatus();
    setInterval(loadDnsStatus, 30000);

countBadge = footer.createEl("div",{ cls:"sr-footer-badge" });

root.createEl("div",{ cls:"sr-hint", text:"Цены и статусы — через ✏️ на карточке · чип статуса переключается кликом · данные хранятся в Sim Racing · Full Setup/.board-data.json" });

refreshFooter();

})();
```
