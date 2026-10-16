---
cssclasses: [task-board]
---

```dataviewjs
/* ═══════════════════════════════════════════════════════
   🖥️ PC BUILD — цены, наличие, история, бюджет
   Данные: PC Build/.board-data.json (внутри vault)
═══════════════════════════════════════════════════════ */
(async () => {

const DATA_FILE = "PC Build/.board-data.json";

const STATUS = {
  in:     { icon:"🟢", label:"В наличии",     chip:"#2e7d32", bg:"#0d1f0e" },
  order:  { icon:"🟡", label:"Под заказ",     chip:"#8a6d00", bg:"#1f1a00" },
  out:    { icon:"🔴", label:"Нет в наличии", chip:"#8f0000", bg:"#1f0000" },
  bought: { icon:"✅", label:"Куплено",       chip:"#5a5a5a", bg:"#161616" },
};
const STATUS_ORDER = ["in","order","out","bought"];

const DEFAULTS = [
  { cat:"🖥️ Видеокарта",        brand:"Palit",    name:"GeForce RTX 5070 Infinity 3", url:"https://www.dns-shop.ru/product/b58aaa7e00a9d582/videokarta-palit-geforce-rtx-5070-infinity-3-ne75070019k9-gb2050s/", shop:"DNS" },
  { cat:"🧠 Процессор",          brand:"AMD",      name:"Ryzen 7 9800X3D OEM",          url:"https://www.dns-shop.ru/product/104767799cdfd582/processor-amd-ryzen-7-9800x3d-oem/",                                shop:"DNS" },
  { cat:"📋 Материнская плата",  brand:"MSI",      name:"MAG B850 TOMAHAWK MAX WIFI",   url:"https://www.dns-shop.ru/product/0e99e58235ead582/materinskaa-plata-msi-mag-b850-tomahawk-max-wifi/",                   shop:"DNS" },
  { cat:"💾 Оперативная память", brand:"ADATA",    name:"XPG Lancer Blade 32 ГБ",       url:"https://www.dns-shop.ru/product/bee7ed0131b5ed20/operativnaa-pamat-adata-xpg-lancer-blade-ax5u6000c3016g-dtlabbk-32-gb/", shop:"DNS" },
  { cat:"💿 Накопитель",         brand:"Kingston", name:"KC3000 1024 ГБ M.2 NVMe",      url:"https://www.dns-shop.ru/product/d843b8c700d5ed20/1024-gb-m2-nvme-nakopitel-kingston-kc3000-skc3000s1024g/",           shop:"DNS" },
  { cat:"⚡ Блок питания",        brand:"MONTECH",  name:"TITAN GOLD 850",               url:"https://www.dns-shop.ru/product/3afea3be698fed20/blok-pitania-montech-titan-gold-850-tis0124-cernyj/",                    shop:"DNS" },
  { cat:"❄️ Охлаждение",         brand:"ARCTIC",   name:"Liquid Freezer III Pro 360",   url:"https://www.dns-shop.ru/product/f643aeb111f7c3ee/sistema-ohlazdenia-arctic-liquid-freezer-iii-pro-360-cernaa/",        shop:"DNS" },
  { cat:"🗃️ Корпус",             brand:"Cougar",   name:"Duoface Pro RGB",              url:"https://www.dns-shop.ru/product/d1a3848c5f26ed20/korpus-cougar-duoface-pro-rgb-cgr-5ad1b-rgb-cernyj/",                    shop:"DNS" },
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
    const s = localStorage.getItem("pc_build_v1");
    if (s) { const a = JSON.parse(s); if (Array.isArray(a) && a.length) items = a.map(d => ({ ...EMPTY(), ...d })); }
  } catch(_) {}
  data = { items, budget:"" };
  await saveData();
}
async function saveData() {
  try { await app.vault.adapter.write(DATA_FILE, JSON.stringify(data, null, 1)); }
  catch(e) { console.error("pcb save:", e); }
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
  let s = document.getElementById("pcb-css");
  if (!s) { s = document.createElement("style"); s.id = "pcb-css"; document.head.appendChild(s); }
  s.textContent = `
    .pcb-root { font-family: system-ui, sans-serif; padding: 4px 0 48px; }

    .pcb-header { margin-bottom: 20px; }
    .pcb-sup { font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8f0000;margin-bottom:8px; }
    .pcb-header h1 { font-size:28px;font-weight:800;color:#e0e0e0;letter-spacing:-0.02em;margin:0;line-height:1.15; }
    .pcb-header h1 span { color:#8f0000; }
    .pcb-line { width:40px;height:2px;background:#8f0000;border-radius:2px;margin-top:14px; }

    /* фильтры */
    .pcb-toolbar { display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;align-items:center; }
    .pcb-fchip { font-size:11px;font-weight:600;color:#444;background:#141414;border:1px solid #2a2a2a;border-radius:20px;padding:5px 14px;cursor:pointer;user-select:none;transition:color 0.14s,border-color 0.14s,background 0.14s; }
    .pcb-fchip:hover { color:#e0e0e0;border-color:#3a3a3a; }
    .pcb-fchip.active { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .pcb-sort { margin-left:auto;background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#888;font-size:11px;padding:5px 8px;outline:none;font-family:system-ui,sans-serif;cursor:pointer; }

    .pcb-cat-label { font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#3a3a3a;margin:22px 0 8px 2px; }

    /* карточка */
    .pcb-card { background:#1a1a1a;border:1px solid #2e2e2e;border-left:3px solid #8f0000;border-radius:10px;margin-bottom:7px;overflow:hidden;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s,opacity 0.2s; }
    .pcb-card:hover { background:#1e1e1e;box-shadow:0 2px 14px rgba(143,0,0,0.14); }
    .pcb-card.bought { opacity:0.55; }
    .pcb-card.bought:hover { opacity:0.85; }
    .pcb-card-main { display:flex;align-items:center;gap:14px;padding:13px 14px 13px 16px; }
    .pcb-card-body { flex:1;min-width:0;cursor:pointer; }
    .pcb-card-brand { font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#555;margin-bottom:3px; }
    .pcb-card-name  { font-size:14px;font-weight:600;color:#e0e0e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .pcb-card-meta  { display:flex;align-items:center;gap:8px;margin-top:5px;font-size:10.5px;color:#555;flex-wrap:wrap; }
    .pcb-card-note  { font-size:10.5px;color:#665;font-style:italic;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .pcb-card-right { display:flex;align-items:center;gap:8px;flex-shrink:0; }

    .pcb-status-chip { display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;border-radius:12px;padding:2px 9px;cursor:pointer;user-select:none;border:1px solid transparent;transition:border-color 0.14s; }
    .pcb-status-chip:hover { border-color:currentColor; }

    .pcb-delta-up   { color:#8f0000;font-weight:700; }
    .pcb-delta-down { color:#2e7d32;font-weight:700; }
    .pcb-minlbl { color:#444; }

    .pcb-price-block { text-align:right; }
    .pcb-price-display { font-size:13px;font-weight:700;color:#e0e0e0;white-space:nowrap; }
    .pcb-price-display.empty { color:#333;font-weight:400;font-size:11px; }
    .pcb-price-date { font-size:9px;color:#444;margin-top:2px;white-space:nowrap; }

    .pcb-shop-btn { font-size:10px;font-weight:600;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:6px;padding:5px 11px;cursor:pointer;white-space:nowrap;transition:background 0.14s,border-color 0.14s,color 0.14s; }
    .pcb-shop-btn:hover { background:#2a0000;border-color:#8f0000;color:#cc2222; }
    .pcb-shop-btn:empty { display:none; }

    .pcb-icon-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;font-size:13px;padding:4px 7px;cursor:pointer;transition:color 0.14s,border-color 0.14s,background 0.14s;line-height:1;color:#3a3a3a; }
    .pcb-icon-btn:hover { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .pcb-icon-btn.active { color:#8f0000;border-color:#8f0000;background:#1a0000; }
    .pcb-icon-btn.del:hover { color:#cc2222;border-color:#cc2222;background:#1a0000; }

    /* панель редактирования */
    .pcb-edit-panel { display:none;background:#141414;border-top:1px solid #2a2a2a;padding:14px 16px;gap:10px;flex-direction:column; }
    .pcb-edit-panel.open { display:flex; }
    .pcb-edit-row { display:flex;gap:8px;align-items:center;flex-wrap:wrap; }
    .pcb-edit-label { font-size:10px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.1em;min-width:80px; }
    .pcb-input { flex:1;background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 10px;outline:none;font-family:system-ui,sans-serif;min-width:0;transition:border-color 0.14s; }
    .pcb-input:focus { border-color:#8f0000;background:#1a0000; }
    .pcb-input.price-input { max-width:110px; }
    .pcb-select { background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 8px;outline:none;font-family:system-ui,sans-serif;cursor:pointer; }
    .pcb-select:focus { border-color:#8f0000; }
    .pcb-panel-btns { display:flex;gap:8px;justify-content:flex-end; }
    .pcb-save-btn { background:#8f0000;border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:700;padding:6px 16px;cursor:pointer;letter-spacing:0.06em;transition:background 0.14s; }
    .pcb-save-btn:hover { background:#b30000; }
    .pcb-cancel-btn { background:transparent;border:1px solid #2a2a2a;border-radius:6px;color:#555;font-size:11px;font-weight:600;padding:6px 14px;cursor:pointer;transition:background 0.14s,color 0.14s; }
    .pcb-cancel-btn:hover { background:#1e1e1e;color:#e0e0e0; }

    /* добавление */
    .pcb-add-wrap { margin-top:20px; }
    .pcb-add-toggle { display:flex;align-items:center;gap:8px;background:#141414;border:1px dashed #2e2e2e;border-radius:10px;padding:12px 16px;cursor:pointer;color:#3a3a3a;font-size:12px;font-weight:600;transition:border-color 0.15s,color 0.15s,background 0.15s;user-select:none; }
    .pcb-add-toggle:hover { border-color:#8f0000;color:#8f0000;background:#1a0000; }
    .pcb-add-toggle .plus { font-size:18px;line-height:1;font-weight:300; }
    .pcb-add-form { display:none;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:16px;margin-top:8px;gap:10px;flex-direction:column; }
    .pcb-add-form.open { display:flex; }
    .pcb-add-form-title { font-size:11px;font-weight:700;color:#8f0000;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:2px; }

    /* футер */
    .pcb-footer { margin-top:32px;background:#141414;border:1px solid #2e2e2e;border-radius:10px;padding:18px 20px;display:flex;gap:28px;flex-wrap:wrap; }
    .pcb-fcol { min-width:130px; }
    .pcb-footer-lbl { font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#444;margin-bottom:6px; }
    .pcb-total { font-size:22px;font-weight:800;color:#e0e0e0;letter-spacing:-0.03em; }
    .pcb-total span { font-size:12px;font-weight:400;color:#555;margin-left:4px; }
    .pcb-total.zero { color:#333;font-size:13px;font-weight:400; }
    .pcb-sub { font-size:11px;color:#555;margin-top:4px; }
    .pcb-sub.ok  { color:#2e7d32; }
    .pcb-sub.bad { color:#8f0000;font-weight:600; }
    .pcb-budget-input { background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#e0e0e0;font-size:13px;font-weight:700;padding:4px 10px;outline:none;font-family:system-ui,sans-serif;width:120px;transition:border-color 0.14s; }
    .pcb-budget-input:focus { border-color:#8f0000; }
    .pcb-footer-btn { background:#1e1e1e;border:1px solid #2e2e2e;border-radius:6px;color:#c9c9c9;font-size:11px;font-weight:600;padding:5px 12px;cursor:pointer;font-family:system-ui,sans-serif;transition:border-color 0.14s,color 0.14s; }
    .pcb-footer-btn:hover { border-color:#8f0000;color:#e0e0e0; }
    .pcb-footer-btn:disabled { opacity:0.5;cursor:default; }
    .pcb-hint { font-size:10px;color:#2a2a2a;margin-top:12px; }
    .pcb-footer-badge { align-self:center;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#8f0000;background:#1a0000;border:1px solid #3d0000;border-radius:20px;padding:5px 14px;white-space:nowrap; }
  `;
}

/* ── ROOT ── */
const root = dv.el("div","",{ cls:"pcb-root" });

/* ── Заголовок + фильтры ── */
const hdr = root.createEl("div",{ cls:"pcb-header" });
hdr.createEl("div",{ cls:"pcb-sup", text:"PC Build · DNS" });
hdr.createEl("h1",{ text:"" }).innerHTML = `Моя <span>будущая</span> сборка`;
hdr.createEl("div",{ cls:"pcb-line" });

const toolbar = root.createEl("div",{ cls:"pcb-toolbar" });
const FILTERS = [ ["all","Все"], ["todo","Не купленные"], ["bought","Купленные"] ];
const fchips = FILTERS.map(([mode,label]) => {
  const c = toolbar.createEl("div",{ cls:"pcb-fchip" + (mode===filterMode?" active":""), text:label });
  c.addEventListener("click", () => {
    filterMode = mode;
    fchips.forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    renderCards();
  });
  return c;
});
const sortSel = toolbar.createEl("select",{ cls:"pcb-sort" });
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
    if (t.all === 0) { totalEl.className = "pcb-total zero"; totalEl.textContent = "Введите цены в карточках"; }
    else { totalEl.className = "pcb-total"; totalEl.innerHTML = `${fmt(t.all)} <span>₽</span>`; }
  }
  if (boughtEl) boughtEl.innerHTML = t.boughtCount ? `${fmt(t.boughtSum)} <span>₽</span>` : `—`;
  if (boughtSubEl) boughtSubEl.textContent = `Куплено ${t.boughtCount} из ${items.length} · осталось ${fmt(t.leftSum)} ₽`;
  if (budgetSubEl) {
    const b = num(data.budget);
    if (!b) { budgetSubEl.className = "pcb-sub"; budgetSubEl.textContent = "не задан"; }
    else if (t.all <= b) { budgetSubEl.className = "pcb-sub ok"; budgetSubEl.textContent = `остаток ${fmt(b - t.all)} ₽`; }
    else { budgetSubEl.className = "pcb-sub bad"; budgetSubEl.textContent = `превышение на ${fmt(t.all - b)} ₽!`; }
  }
  if (countBadge) countBadge.textContent = `🖥️ Сборка: ${items.length} поз. · куплено ${t.boughtCount}`;
}

/* ── Одна карточка ── */
function makeCard(item, idx) {
  const card = document.createElement("div");
  card.className = "pcb-card" + (item.status === "bought" ? " bought" : "");

  const main = document.createElement("div"); main.className = "pcb-card-main"; card.appendChild(main);

  const body = document.createElement("div"); body.className = "pcb-card-body";
  body.addEventListener("click", () => item.url && window.open(item.url,"_blank"));
  body.appendChild(Object.assign(document.createElement("div"),{ className:"pcb-card-brand", textContent:item.brand }));
  body.appendChild(Object.assign(document.createElement("div"),{ className:"pcb-card-name",  textContent:item.name }));
  main.appendChild(body);

  /* мета: статус-чип + дата цены + дельта + мин */
  const meta = document.createElement("div"); meta.className = "pcb-card-meta"; body.appendChild(meta);

  const st = STATUS[item.status] || STATUS.in;
  const chip = document.createElement("span");
  chip.className = "pcb-status-chip";
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
      d.className = cur > prev ? "pcb-delta-up" : "pcb-delta-down";
      d.textContent = cur > prev ? `▲ было ${fmt(prev)}` : `▽ было ${fmt(prev)}`;
      meta.appendChild(d);
    }
    const mn = Math.min(...prices);
    const curMin = num(item.price);
    if (mn > 0 && curMin > mn) {
      const m = document.createElement("span"); m.className = "pcb-minlbl"; m.textContent = `мин ${fmt(mn)} ₽`;
      meta.appendChild(m);
    }
  }

  if (item.note) {
    const nEl = document.createElement("div"); nEl.className = "pcb-card-note"; nEl.textContent = `💬 ${item.note}`;
    body.appendChild(nEl);
  }

  /* правая часть: цена + магазин + кнопки */
  const right = document.createElement("div"); right.className = "pcb-card-right"; main.appendChild(right);

  const pblock = document.createElement("div"); pblock.className = "pcb-price-block"; right.appendChild(pblock);
  const priceDisplay = document.createElement("div");
  priceDisplay.className = item.price ? "pcb-price-display" : "pcb-price-display empty";
  priceDisplay.textContent = item.price ? `${fmt(num(item.price))} ₽` : "цена?";
  pblock.appendChild(priceDisplay);
  if (item.altPrice && num(item.altPrice) > 0) {
    const alt = document.createElement("div"); alt.className = "pcb-price-date";
    alt.textContent = `${item.altShop || "другой магазин"}: ${fmt(num(item.altPrice))} ₽`;
    pblock.appendChild(alt);
  } else if (item.priceDate) {
    const pd = document.createElement("div"); pd.className = "pcb-price-date"; pd.textContent = item.priceDate;
    pblock.appendChild(pd);
  }

  if (item.url) {
    const shopBtn = document.createElement("div"); shopBtn.className = "pcb-shop-btn";
    shopBtn.textContent = (item.shop || "→") + " →";
    shopBtn.addEventListener("click", () => window.open(item.url,"_blank"));
    right.appendChild(shopBtn);
  }

  const editBtn = document.createElement("div"); editBtn.className = "pcb-icon-btn"; editBtn.textContent = "✏️"; right.appendChild(editBtn);
  const delBtn  = document.createElement("div"); delBtn.className  = "pcb-icon-btn del"; delBtn.textContent = "🗑️"; right.appendChild(delBtn);

  /* ── Панель редактирования ── */
  const panel = document.createElement("div"); panel.className = "pcb-edit-panel"; card.appendChild(panel);

  function mkRow(label, inputEl) {
    const row = document.createElement("div"); row.className = "pcb-edit-row";
    row.appendChild(Object.assign(document.createElement("div"),{ className:"pcb-edit-label", textContent:label }));
    row.appendChild(inputEl); panel.appendChild(row);
  }
  function mkInput(cls, type, val, ph) {
    const i = document.createElement("input"); i.className = cls; i.type = type; i.value = val || ""; i.placeholder = ph || ""; return i;
  }

  const catInput   = mkInput("pcb-input","text", item.cat,   "Категория (с эмодзи)");
  const brandInput = mkInput("pcb-input","text", item.brand, "Бренд");
  const nameInput  = mkInput("pcb-input","text", item.name,  "Название");
  const urlInput   = mkInput("pcb-input","text", item.url,   "https://...");
  const shopInput  = mkInput("pcb-input","text", item.shop,  "DNS / Citilink / ...");
  const priceInput = mkInput("pcb-input price-input","number", item.price, "89990");
  const altInput   = mkInput("pcb-input price-input","number", item.altPrice, "");
  const altShopInp = mkInput("pcb-input","text", item.altShop, "Магазин альт. цены");
  const noteInput  = mkInput("pcb-input","text", item.note,   "Ждать скидку / брать б/у / ...");
  const statusSel  = document.createElement("select"); statusSel.className = "pcb-select";
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
  panel.appendChild(Object.assign(document.createElement("div"),{ className:"pcb-hint", textContent:"Новая цена автоматически получает сегодняшнюю дату и попадает в историю" }));

  const btns = document.createElement("div"); btns.className = "pcb-panel-btns"; panel.appendChild(btns);
  const cancelBtn = document.createElement("button"); cancelBtn.className = "pcb-cancel-btn"; cancelBtn.textContent = "Отмена"; btns.appendChild(cancelBtn);
  const saveBtn   = document.createElement("button"); saveBtn.className   = "pcb-save-btn";   saveBtn.textContent = "Сохранить"; btns.appendChild(saveBtn);

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
    cardsWrap.appendChild(Object.assign(document.createElement("div"),{ className:"pcb-cat-label", textContent:"ничего не найдено" }));
    return;
  }
  const showCats = sortMode === "none";
  let lastCat = null;
  for (const { it, i } of list) {
    if (showCats && it.cat !== lastCat) {
      cardsWrap.appendChild(Object.assign(document.createElement("div"),{ className:"pcb-cat-label", textContent:it.cat }));
      lastCat = it.cat;
    }
    cardsWrap.appendChild(makeCard(it, i));
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
const aNote  = mkAddRow("Заметка",   "Ждать скидку / ...");

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
const footer = root.createEl("div",{ cls:"pcb-footer" });

const c1 = footer.createEl("div",{ cls:"pcb-fcol" });
c1.createEl("div",{ cls:"pcb-footer-lbl", text:"Итого по сборке" });
totalEl = c1.createEl("div");

const c2 = footer.createEl("div",{ cls:"pcb-fcol" });
c2.createEl("div",{ cls:"pcb-footer-lbl", text:"Куплено" });
boughtEl = c2.createEl("div");
boughtSubEl = c2.createEl("div",{ cls:"pcb-sub" });

const c3 = footer.createEl("div",{ cls:"pcb-fcol" });
c3.createEl("div",{ cls:"pcb-footer-lbl", text:"Бюджет ₽" });
const budgetInput = c3.createEl("input",{ cls:"pcb-budget-input" });
budgetInput.type = "number"; budgetInput.placeholder = "200000";
budgetInput.value = data.budget || "";
budgetInput.addEventListener("change", () => { data.budget = budgetInput.value.trim(); saveData().then(refreshFooter); });
budgetSubEl = c3.createEl("div",{ cls:"pcb-sub" });

    const c3b = footer.createEl("div",{ cls:"pcb-fcol", attr:{"style":"min-width:170px;"} });
    c3b.createEl("div",{ cls:"pcb-footer-lbl", text:"Цены с DNS" });
    const dnsBtn = c3b.createEl("button",{ cls:"pcb-footer-btn", text:"🔄 Обновить с DNS" });
    const dnsStatus = c3b.createEl("div",{ cls:"pcb-sub" });
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

countBadge = footer.createEl("div",{ cls:"pcb-footer-badge" });

root.createEl("div",{ cls:"pcb-hint", text:"Цены и статусы — через ✏️ на карточке · чип статуса переключается кликом · данные хранятся в PC Build/.board-data.json" });

refreshFooter();

})();
```
