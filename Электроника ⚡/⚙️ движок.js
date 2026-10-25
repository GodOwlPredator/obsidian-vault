/* ═══════════════════════════════════════════════════════════════════
   ⚡ Движок раздела «Электроника»
   Один файл на все страницы раздела: карточка записи, главный хаб,
   склад компонентов. Подключается коротким блоком dataviewjs:

     const SRC = await app.vault.adapter.read("Электроника ⚡/⚙️ движок.js");
     const elMain = new Function("dv", "app", SRC + "\nreturn elMain;")();
     await elMain(dv, app, "card");   // "hub" | "stock" | "card"

   Всё создаётся через document.createElement / createEl, без глобальных
   функций Obsidian (createEl не обязателен, но поддерживается).
   ═══════════════════════════════════════════════════════════════════ */

const EL_ROOT = "Электроника ⚡";
const EL_CSS_ID = "el-css";
const EL_CSS_PATH = ".obsidian/snippets/electronics.css";

/* ── Типы записей ───────────────────────────────────────────────── */
const EL_KINDS = {
    "идея": {
        icon: "💡", label: "Идея", plural: "Идеи", dir: "💡 Идеи", tpl: "📝 Шаблон идеи.md",
        accent: "#a80000", status: ["новая", "в работе", "реализована", "отложена"],
        rows: [["приоритет", "Приоритет", "badge"], ["сложность", "Сложность", "badge"], ["связь", "Связанные записи", "chips"]]
    },
    "проект": {
        icon: "📦", label: "Проект", plural: "Проекты", dir: "📦 Проекты", tpl: "📝 Шаблон проекта.md",
        accent: "#c9541f", status: ["идея", "в работе", "переделываю", "готов", "архив"],
        rows: [["сложность", "Сложность", "badge"], ["дата", "Когда", "text"], ["бюджет", "Бюджет", "text"]],
        links: true, checklist: true
    },
    "работа": {
        icon: "✅", label: "Готовая работа", plural: "Готовые работы", dir: "✅ Готовые работы", tpl: "📝 Шаблон работы.md",
        accent: "#3f9d3f", status: ["работает", "требует ремонта", "переделан", "продан", "в архиве"],
        rows: [["дата", "Дата", "text"], ["время", "Время", "text"], ["стоимость", "Стоимость", "text"],
               ["проект", "Проект", "text"], ["ссылка", "Где показан", "link"]],
        rating: "оценка", cover: true
    },
    "компонент": {
        icon: "🧩", label: "Компонент", plural: "Компоненты", dir: "🧩 Компоненты", tpl: "📝 Шаблон компонента.md",
        accent: "#4a90d9",
        rows: [["тип", "Тип", "badge"], ["значение", "Значение", "badge"], ["корпус", "Корпус", "badge"],
               ["место", "Место хранения", "text"], ["ссылка", "Где купить", "link"], ["даташит", "Даташит", "link"]],
        stock: true, cover: true
    },
    "инструмент": {
        icon: "🔧", label: "Инструмент", plural: "Инструменты", dir: "🔧 Инструменты", tpl: "📝 Шаблон инструмента.md",
        accent: "#8a6bd1", status: ["работает", "поломан", "хочу купить"],
        rows: [["тип", "Тип", "badge"], ["характеристики", "Характеристики", "text"], ["ссылка", "Ссылка", "link"]],
        rating: "оценка", cover: true
    },
    "конспект": {
        icon: "📚", label: "Конспект", plural: "Конспекты", dir: "📚 Конспекты", tpl: "📝 Шаблон конспекта.md",
        accent: "#3f9d9d", status: ["не начат", "в работе", "готов"],
        rows: [["тема", "Тема", "badge"], ["уровень", "Уровень", "badge"], ["ссылка", "Источник", "link"]],
        progress: true
    },
    "ресурс": {
        icon: "🔗", label: "Ресурс", plural: "Ресурсы", dir: "🔗 Ресурсы", tpl: "📝 Шаблон ресурса.md",
        accent: "#c9a227",
        rows: [["категория", "Категория", "badge"], ["ссылка", "Ссылка", "link"], ["проект", "Проект", "text"]],
        rating: "оценка"
    }
};
const EL_ORDER = Object.keys(EL_KINDS);

const EL_STATUS_COLOR = {
    "новая": "#a80000", "идея": "#a80000", "не начат": "#5a5a5a", "хочу купить": "#5a5a5a",
    "в работе": "#4a90d9", "в процессе": "#4a90d9", "переделываю": "#c9a227", "требует ремонта": "#c9a227",
    "реализована": "#3f9d3f", "готов": "#3f9d3f", "работает": "#3f9d3f",
    "отложена": "#8a8a8a", "архив": "#8a8a8a", "переделан": "#8a6bd1", "продан": "#8a6bd1", "в архиве": "#8a8a8a",
    "поломан": "#a80000"
};

/* Подсказки-значения для полей */
const EL_PART_TYPES = ["резистор", "конденсатор", "катушка", "диод", "светодиод", "транзистор",
    "стабилизатор", "микроконтроллер", "датчик", "модуль", "разъём", "плата", "питание", "расходник", "прочее"];
const EL_RES_CATS = ["даташит", "магазин", "видео", "калькулятор", "форум", "статья", "инструмент", "прочее"];
const EL_LEVELS = ["база", "средний", "продвинутый"];
const EL_HARD = ["легко", "средне", "сложно"];
const EL_PRIORITY = ["высокий", "средний", "низкий"];

/* ── Мелкие помощники ───────────────────────────────────────────── */
function elArr(v) {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map(x => String(x));
    if (typeof v === "object" && typeof v.array === "function") return v.array().map(x => String(x));
    return [String(v)];
}
function elNum(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function elOpen(app, path) { app.workspace.openLinkText(path, "", false); }
function elPageName(p) { return String(p.title || p.file.name); }

function elCoverFile(app, str, fromPath) {
    const cp = String(str || "").replace(/^!?\[\[|\]\]$/g, "").trim();
    if (!cp) return null;
    return app.vault.getAbstractFileByPath(cp) || (app.metadataCache && app.metadataCache.getFirstLinkpathDest
        ? app.metadataCache.getFirstLinkpathDest(cp, fromPath) : null);
}

function elLightbox(src) {
    const lb = document.createElement("div");
    lb.className = "el-lightbox";
    const img = document.createElement("img");
    img.src = src;
    const hint = document.createElement("div");
    hint.className = "el-lb-hint";
    hint.textContent = "Клик или Esc — закрыть";
    lb.appendChild(img); lb.appendChild(hint);
    document.body.appendChild(lb);
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    const close = () => { lb.remove(); document.removeEventListener("keydown", onKey, true); };
    document.addEventListener("keydown", onKey, true);
    lb.addEventListener("click", close);
}

/* Запись поля во фронтматтер заметки */
async function elSetFm(app, file, key, val) {
    const tf = app.vault.getAbstractFileByPath(file.path);
    if (!tf) return false;
    await app.fileManager.processFrontMatter(tf, fm => { fm[key] = val; });
    return true;
}

async function elEnsureCss(app) {
    if (document.getElementById(EL_CSS_ID)) return;
    let loaded = "";
    try { loaded = getComputedStyle(document.documentElement).getPropertyValue("--el-loaded").trim(); } catch (e) {}
    if (loaded === "1") return;
    let css = "";
    try { css = await app.vault.adapter.read(EL_CSS_PATH); } catch (e) {}
    const s = document.createElement("style");
    s.id = EL_CSS_ID;
    s.textContent = css;
    document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════════
   КАРТОЧКА ЗАПИСИ
   ═══════════════════════════════════════════════════════════════════ */
async function elCard(dv, app) {
    const p = dv.current(), file = p.file;
    const T = EL_KINDS[String(p.log)] ||
        { icon: "📄", label: String(p.log || "Запись"), accent: "#8a8a8a", rows: [], status: null };

    const root = dv.el("div", "", {});
    root.className = "el-root";

    if (p.шаблон) {
        const h = root.createEl("div", { cls: "el-warn" });
        h.createEl("span", { text: "📝 Это шаблон. " });
        h.createEl("span", { text: "Создавай записи с Главной — тогда метка «шаблон» снимется автоматически." });
    }

    const card = root.createEl("div", { cls: "el-view el-view-accent" });
    card.style.borderLeftColor = T.accent;

    /* Обложка */
    const cover = String(p.обложка || "");
    if (cover) {
        const imf = elCoverFile(app, cover, file.path);
        if (imf) {
            const img = card.createEl("img", { cls: "el-view-banner" });
            img.src = app.vault.getResourcePath(imf);
            img.addEventListener("click", () => elLightbox(img.src));
        }
    }

    const body = card.createEl("div", { cls: "el-view-body" });

    /* Заголовок */
    const head = body.createEl("div", { cls: "el-card-head" });
    head.createEl("h2", { text: T.icon + " " + elPageName(p), cls: "el-view-title" });
    const badge = head.createEl("span", { text: T.label, cls: "el-badge" });
    badge.style.cssText = "background:" + T.accent + "22;color:" + T.accent + ";border-color:" + T.accent + ";";

    /* Статус */
    if (T.status) {
        const row = body.createEl("div", { cls: "el-row" });
        row.createEl("span", { text: "Статус:", cls: "el-row-lbl" });
        for (const s of T.status) {
            const active = String(p.статус) === s;
            const b = row.createEl("button", { text: s, cls: "el-status" + (active ? " is-active" : "") });
            if (active) { b.style.background = EL_STATUS_COLOR[s] || T.accent; b.style.borderColor = EL_STATUS_COLOR[s] || T.accent; }
            b.addEventListener("click", async () => { await elSetFm(app, file, "статус", s); });
        }
    }

    /* Оценка */
    if (T.rating) {
        const row = body.createEl("div", { cls: "el-row" });
        row.createEl("span", { text: "Оценка:", cls: "el-row-lbl" });
        const cur = elNum(p[T.rating]);
        const stars = row.createEl("span", { cls: "el-stars" });
        for (let i = 1; i <= 5; i++) {
            const st = stars.createEl("b", { text: i <= cur ? "★" : "☆" });
            st.style.color = i <= cur ? T.accent : "";
            st.addEventListener("click", async () => { await elSetFm(app, file, T.rating, i); });
        }
    }

    /* Прогресс */
    if (T.progress) {
        const cur = Math.max(0, Math.min(100, elNum(p.прогресс)));
        const wrap = body.createEl("div", {});
        const bar = wrap.createEl("div", { cls: "el-progress" });
        const fill = bar.createEl("i", {});
        fill.style.width = cur + "%";
        wrap.createEl("div", { text: "Прогресс: " + cur + "%  (клик по полосе — изменить)", cls: "el-progress-lbl" });
        bar.addEventListener("click", async (e) => {
            const r = bar.getBoundingClientRect();
            const pct = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100);
            await elSetFm(app, file, "прогресс", pct);
        });
    }

    /* Остаток на складе (компонент) */
    if (T.stock) {
        const row = body.createEl("div", { cls: "el-stock" });
        let qty = elNum(p.количество);
        const min = elNum(p.минимум);
        const val = row.createEl("span", { text: String(qty), cls: "el-stock-num" });
        const unit = row.createEl("span", { text: "шт", cls: "el-stock-unit" });
        const minus = row.createEl("button", { text: "−", cls: "el-step" });
        const plus = row.createEl("button", { text: "+", cls: "el-step" });
        if (qty <= 0) minus.classList.add("is-off");
        const low = row.createEl("span", { cls: "el-low" });
        const paintLow = (n, m) => {
            low.textContent = "";
            if (n === 0 || (m > 0 && n <= m)) {
                low.textContent = n === 0 ? "кончился" : "мало (мин. " + m + ")";
            }
        };
        paintLow(qty, min);
        const step = async (d) => {
            const next = Math.max(0, qty + d);
            if (next === qty) return;
            qty = next;
            val.textContent = String(qty);
            minus.classList.toggle("is-off", qty <= 0);
            paintLow(qty, min);
            unit.textContent = "шт";
            await elSetFm(app, file, "количество", qty);
        };
        minus.addEventListener("click", () => step(-1));
        plus.addEventListener("click", () => step(1));
    }

    /* Ключевые пары */
    for (const [field, label, kind] of (T.rows || [])) {
        const v = p[field];
        if (v == null || String(v).trim() === "" || (Array.isArray(v) && v.length === 0)) continue;
        const row = body.createEl("div", { cls: "el-kv" });
        row.createEl("div", { text: label, cls: "el-kv-k" });
        const val = row.createEl("div", { cls: "el-kv-v" });
        if (kind === "chips") {
            for (const it of elArr(v).filter(Boolean)) {
                const pill = val.createEl("span", { text: it, cls: "el-pill" });
                const target = app.metadataCache && app.metadataCache.getFirstLinkpathDest
                    ? app.metadataCache.getFirstLinkpathDest(it, file.path) : null;
                if (target) { pill.classList.add("is-link"); pill.addEventListener("click", () => elOpen(app, target.path)); }
            }
        } else if (kind === "link") {
            const s = String(v);
            if (s.startsWith("http")) {
                const a = val.createEl("a", { text: "🔗 " + s.replace(/^https?:\/\//, "").slice(0, 60), cls: "el-link" });
                a.href = s; a.target = "_blank"; a.rel = "noopener";
            } else { val.createEl("span", { text: s }); }
        } else if (kind === "badge") {
            const b = val.createEl("span", { text: String(v), cls: "el-badge" });
            b.style.cssText = "background:" + T.accent + "22;color:" + T.accent + ";border-color:" + T.accent + ";";
        } else {
            val.createEl("span", { text: String(v) });
        }
    }

    /* Описание */
    if (p.описание) body.createEl("div", { text: String(p.описание), cls: "el-view-desc" });

    /* Теги */
    const tags = elArr(p.теги).filter(Boolean);
    if (tags.length) {
        const tw = body.createEl("div", { cls: "el-tags" });
        for (const t of tags) tw.createEl("span", { text: "#" + t, cls: "el-tag" });
    }

    /* Связанные записи (проект собирает всё вокруг себя) */
    if (T.links) {
        const name = elPageName(p);
        const list = dv.pages('"' + EL_ROOT + '"').where(x => x.file.path !== file.path && String(x.проект || "") === name).array();
        body.createEl("div", { text: "Связанные записи", cls: "el-section" });
        if (list.length === 0) {
            body.createEl("div", { text: "Пока пусто. В других записях укажи поле «проект: " + name + "» — они соберутся здесь.", cls: "el-progress-lbl" });
        } else {
            const wrap = body.createEl("div", { cls: "el-tags" });
            for (const r of list) {
                const tt = EL_KINDS[String(r.log)] || { icon: "📄", label: String(r.log) };
                const chip = wrap.createEl("span", { text: tt.icon + " " + elPageName(r), cls: "el-pill is-link" });
                chip.addEventListener("click", () => elOpen(app, r.file.path));
            }
            /* Радиальный граф связей */
            const holder = body.createEl("div", {});
            const W = 700, H = 300, cx = W / 2, cy = H / 2, R = 108;
            const NS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(NS, "svg");
            svg.setAttribute("class", "el-graph");
            svg.setAttribute("viewBox", "0 0 " + W + " " + H);
            const nodes = list.slice(0, 14);
            nodes.forEach((r, i) => {
                const ang = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
                const x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
                const ln = document.createElementNS(NS, "line");
                ln.setAttribute("x1", cx); ln.setAttribute("y1", cy);
                ln.setAttribute("x2", x); ln.setAttribute("y2", y);
                svg.appendChild(ln);
                const tt = EL_KINDS[String(r.log)] || { accent: "#8a8a8a" };
                const c = document.createElementNS(NS, "circle");
                c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 9);
                c.setAttribute("fill", tt.accent); c.setAttribute("stroke", "#000");
                c.addEventListener("click", () => elOpen(app, r.file.path));
                const ttl = document.createElementNS(NS, "title");
                ttl.textContent = (tt.icon || "") + " " + elPageName(r);
                c.appendChild(ttl);
                svg.appendChild(c);
                const txt = document.createElementNS(NS, "text");
                txt.setAttribute("x", x); txt.setAttribute("y", y + 22);
                txt.setAttribute("text-anchor", "middle");
                txt.textContent = elPageName(r).slice(0, 18);
                svg.appendChild(txt);
            });
            const cc = document.createElementNS(NS, "circle");
            cc.setAttribute("cx", cx); cc.setAttribute("cy", cy); cc.setAttribute("r", 15);
            cc.setAttribute("fill", T.accent); cc.setAttribute("stroke", "#fff"); cc.setAttribute("stroke-width", "2");
            svg.appendChild(cc);
            const ctxt = document.createElementNS(NS, "text");
            ctxt.setAttribute("x", cx); ctxt.setAttribute("y", cy + 32);
            ctxt.setAttribute("text-anchor", "middle");
            ctxt.textContent = name.slice(0, 20);
            svg.appendChild(ctxt);
            holder.appendChild(svg);
        }
    }

    /* Чеклист (проект) */
    if (T.checklist) {
        const tf = app.vault.getAbstractFileByPath(file.path);
        const text = await app.vault.read(tf);
        const lines = text.split("\n");
        const items = [];
        lines.forEach((l, i) => {
            const m = l.match(/^(\s*[-*]\s+\[)([ xX])(\]\s*)(.*)$/);
            if (m) items.push({ i, done: m[2] !== " ", text: m[4] });
        });
        const doneN = items.filter(x => x.done).length;
        body.createEl("div", { text: "Этапы: " + doneN + " из " + items.length, cls: "el-progress-lbl" });
        const bar = body.createEl("div", { cls: "el-progress" });
        bar.createEl("i", {}).style.width = (items.length ? Math.round((doneN / items.length) * 100) : 0) + "%";
        body.createEl("div", { text: "Этапы", cls: "el-section" });
        if (items.length === 0) {
            body.createEl("div", { text: "Добавь этапы в тело заметки строками вида:  - [ ] нарисовать схему", cls: "el-progress-lbl" });
        }
        for (const it of items) {
            const row = body.createEl("label", { cls: "el-check" + (it.done ? " is-done" : "") });
            const cb = row.createEl("input", {});
            cb.type = "checkbox";
            cb.checked = it.done;
            row.createEl("span", { text: it.text });
            cb.addEventListener("change", async () => {
                const cur = await app.vault.read(tf);
                const ls = cur.split("\n");
                const line = ls[it.i];
                if (line && line.indexOf(it.text) !== -1) {
                    ls[it.i] = line.replace(/^(\s*[-*]\s+\[)([ xX])(\])/, (s, a, b, c) => a + (it.done ? " " : "x") + c);
                    await app.vault.modify(tf, ls.join("\n"));
                }
            });
        }
    }

    /* Навигация */
    const nav = body.createEl("div", { cls: "el-nav" });
    const home = nav.createEl("button", { text: "⚡ Электроника", cls: "el-btn el-btn-sm" });
    home.addEventListener("click", () => elOpen(app, EL_ROOT + "/🏠 Главная.md"));
    if (String(p.log) === "компонент") {
        const st = nav.createEl("button", { text: "🧩 Склад", cls: "el-btn el-btn-sm" });
        st.addEventListener("click", () => elOpen(app, EL_ROOT + "/🧩 Склад.md"));
    } else {
        const kind = EL_KINDS[String(p.log)];
        if (kind) {
            const b = nav.createEl("button", { text: kind.icon + " " + kind.plural, cls: "el-btn el-btn-sm" });
            b.addEventListener("click", () => elOpen(app, EL_ROOT + "/🏠 Главная.md"));
        }
    }
    const instr = nav.createEl("button", { text: "📘 Инструкция", cls: "el-btn el-btn-sm el-btn-ghost" });
    instr.addEventListener("click", () => elOpen(app, EL_ROOT + "/📖 Инструкция.md"));
}

/* ═══════════════════════════════════════════════════════════════════
   ГЛАВНАЯ (хаб)
   ═══════════════════════════════════════════════════════════════════ */
async function elHub(dv, app) {
    const root = dv.el("div", "", {});
    root.className = "el-root";

    /* ── Панель добавления ── */
    const top = root.createEl("div", { cls: "el-top" });
    for (const k of EL_ORDER) {
        const K = EL_KINDS[k];
        const b = top.createEl("button", { text: "＋ " + K.label, cls: "el-btn el-btn-accent" });
        b.title = "Создать: " + K.plural;
        b.addEventListener("click", () => elForm(app, k, dv));
    }
    top.createEl("div", { cls: "el-top-sep" });
    const stock = top.createEl("button", { text: "🧩 Склад", cls: "el-btn" });
    stock.addEventListener("click", () => elOpen(app, EL_ROOT + "/🧩 Склад.md"));
    const tb = top.createEl("button", { text: "🛠 Техника безопасности", cls: "el-btn" });
    tb.addEventListener("click", () => elOpen(app, EL_ROOT + "/🛠 Техника безопасности.md"));
    const cc = top.createEl("button", { text: "⚙️ Центр", cls: "el-btn" });
    cc.addEventListener("click", () => {
        const pg = dv.pages().where(x => String(x.file.path).includes("Центр управления")).first();
        if (pg) elOpen(app, pg.file.path);
    });
    const inb = top.createEl("button", { text: "📘 Инструкция", cls: "el-btn el-btn-ghost" });
    inb.addEventListener("click", () => elOpen(app, EL_ROOT + "/📖 Инструкция.md"));

    /* ── Данные ── */
    const allNotes = dv.pages('"' + EL_ROOT + '"').where(p => p.log && EL_KINDS[String(p.log)] && !p.шаблон);

    /* ── Быстрый переход по разделам ── */
    const jump = root.createEl("div", { cls: "el-filters" });
    for (const k of EL_ORDER) {
        const K = EL_KINDS[k];
        const c = jump.createEl("button", { cls: "el-chip", text: K.icon + " " + K.plural });
        c.addEventListener("click", () => {
            activeTypes.clear();
            activeTypes.add(k);
            syncChips();
            renderTagFilters();
            renderGrid();
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    /* ── Статистика ── */
    const stats = root.createEl("div", { cls: "el-stats" });
    function renderStats() {
        stats.empty();
        let pieces = EL_ORDER.map(k => {
            const n = allNotes.where(p => String(p.log) === k).length;
            return { v: n, l: EL_KINDS[k].icon + " " + EL_KINDS[k].plural };
        });
        const parts = allNotes.where(p => String(p.log) === "компонент").array();
        const total = parts.reduce((s, p) => s + elNum(p.количество), 0);
        pieces.push({ v: total, l: "🧩 Всего штук" });
        pieces.push({ v: parts.filter(p => elNum(p.количество) === 0 || (elNum(p.минимум) > 0 && elNum(p.количество) <= elNum(p.минимум))).length, l: "⚠️ Мало" });
        for (const s of pieces) {
            const d = stats.createEl("div", { cls: "el-stat" });
            d.createEl("div", { text: String(s.v), cls: "el-stat-val" });
            d.createEl("div", { text: s.l, cls: "el-stat-lbl" });
        }
    }

    /* ── Сейчас в работе ── */
    const inWork = allNotes.where(p => {
        const st = String(p.статус || "");
        return st === "в работе" || st === "переделываю";
    }).array();
    if (inWork.length) {
        root.createEl("div", { text: "Сейчас в работе", cls: "el-section" });
        const wrap = root.createEl("div", { cls: "el-tags" });
        for (const p of inWork) {
            const K = EL_KINDS[String(p.log)] || { icon: "📄", accent: "#8a8a8a" };
            const chip = wrap.createEl("span", { cls: "el-pill is-link", text: K.icon + " " + elPageName(p) + " · " + String(p.статус) });
            chip.style.borderColor = K.accent;
            chip.addEventListener("click", () => elOpen(app, p.file.path));
        }
    }

    /* ── Последние готовые ── */
    const works = allNotes.where(p => String(p.log) === "работа")
        .sort((a, b) => (b.file.mtime && b.file.mtime.ts || 0) - (a.file.mtime && a.file.mtime.ts || 0)).array();
    if (works.length) {
        root.createEl("div", { text: "Последние готовые работы", cls: "el-section" });
        const g = root.createEl("div", { cls: "el-feat-grid" });
        for (const p of works.slice(0, 6)) {
            const K = EL_KINDS["работа"];
            const c = g.createEl("div", { cls: "el-feat-card" });
            const imf = p.обложка ? elCoverFile(app, p.обложка, p.file.path) : null;
            if (imf) {
                const img = c.createEl("img", { cls: "el-feat-img" });
                img.src = app.vault.getResourcePath(imf);
                img.addEventListener("click", (e) => { e.stopPropagation(); elLightbox(img.src); });
            } else {
                c.createEl("div", { cls: "el-feat-ph", text: K.icon });
            }
            const info = c.createEl("div", { cls: "el-feat-info" });
            info.createEl("div", { text: elPageName(p), cls: "el-card-title" });
            if (p.статус) {
                const st = info.createEl("div", { cls: "el-tag", text: "● " + String(p.статус) });
                st.style.color = EL_STATUS_COLOR[String(p.статус)] || K.accent;
            }
            c.addEventListener("click", () => elOpen(app, p.file.path));
        }
    }

    /* ── Поиск и сортировка ── */
    const toolRow = root.createEl("div", { cls: "el-toolrow" });
    const searchInput = toolRow.createEl("input", { cls: "el-input" });
    searchInput.type = "text";
    searchInput.placeholder = "🔍 Поиск по названию, описанию, значению…";
    const sortSel = toolRow.createEl("select", { cls: "el-select" });
    for (const [v, t] of [["new", "Сначала новые"], ["old", "Сначала старые"], ["az", "По алфавиту"], ["type", "По типу"]]) {
        const o = sortSel.createEl("option", { text: t }); o.value = v;
    }
    let activeSort = "new";
    sortSel.addEventListener("change", () => { activeSort = sortSel.value; renderGrid(); });

    /* ── Фильтры по типу ── */
    const typeFilters = root.createEl("div", { cls: "el-filters" });
    const activeTypes = new Set();
    const typeChips = new Map();
    for (const k of EL_ORDER) {
        const K = EL_KINDS[k];
        const c = typeFilters.createEl("button", { cls: "el-chip", text: K.icon + " " + K.plural });
        c.addEventListener("click", () => {
            if (activeTypes.has(k)) activeTypes.delete(k); else activeTypes.add(k);
            syncChips();
            renderGrid();
        });
        typeChips.set(k, c);
    }
    function syncChips() {
        for (const [k, c] of typeChips) c.classList.toggle("is-active", activeTypes.has(k));
    }

    /* ── Фильтры по тегу ── */
    const tagFilters = root.createEl("div", { cls: "el-filters" });
    const activeTags = new Set();
    function renderTagFilters() {
        tagFilters.empty();
        const m = new Map();
        for (const p of allNotes.array()) for (const t of elArr(p.теги)) if (t) m.set(t, (m.get(t) || 0) + 1);
        const tags = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
        if (!tags.length) return;
        for (const [t] of tags) {
            const c = tagFilters.createEl("button", { cls: "el-tagchip", text: "#" + t });
            c.classList.toggle("is-active", activeTags.has(t));
            c.addEventListener("click", () => {
                if (activeTags.has(t)) activeTags.delete(t); else activeTags.add(t);
                renderTagFilters();
                renderGrid();
            });
        }
    }

    /* ── Сетка ── */
    const grid = root.createEl("div", { cls: "el-grid" });

    function renderGrid() {
        grid.empty();
        const q = searchInput.value.trim().toLowerCase();
        let items = allNotes.array();
        if (activeTypes.size) items = items.filter(p => activeTypes.has(String(p.log)));
        if (activeTags.size) items = items.filter(p => elArr(p.теги).some(t => activeTags.has(t)));
        if (q) items = items.filter(p => (elPageName(p) + " " + String(p.описание || "") + " " +
            String(p.значение || "") + " " + String(p.тип || "")).toLowerCase().includes(q));

        const bySort = {
            new: (a, b) => ((b.file.mtime && b.file.mtime.ts) || 0) - ((a.file.mtime && a.file.mtime.ts) || 0),
            old: (a, b) => ((a.file.mtime && a.file.mtime.ts) || 0) - ((b.file.mtime && b.file.mtime.ts) || 0),
            az:  (a, b) => elPageName(a).localeCompare(elPageName(b), "ru"),
            type:(a, b) => EL_ORDER.indexOf(String(a.log)) - EL_ORDER.indexOf(String(b.log)) ||
                           elPageName(a).localeCompare(elPageName(b), "ru"),
        };
        items.sort(bySort[activeSort]);

        if (items.length === 0) {
            grid.createEl("div", { text: "Пока пусто. Создай запись кнопкой «＋» вверху.", cls: "el-empty" });
            return;
        }
        for (const p of items) {
            const K = EL_KINDS[String(p.log)];
            const col = K.accent;
            const card = grid.createEl("div", { cls: "el-card" });
            const imf = p.обложка ? elCoverFile(app, p.обложка, p.file.path) : null;
            if (imf) {
                const img = card.createEl("img", { cls: "el-cover" });
                img.src = app.vault.getResourcePath(imf);
                img.addEventListener("click", (e) => { e.stopPropagation(); elLightbox(img.src); });
            } else {
                card.createEl("div", { cls: "el-cover-ph", text: K.icon });
            }
            const body = card.createEl("div", { cls: "el-card-body" });
            const head = body.createEl("div", { cls: "el-card-head" });
            head.createEl("div", { text: elPageName(p), cls: "el-card-title" });
            const bdg = head.createEl("span", { cls: "el-badge", text: K.icon });
            bdg.style.cssText = "background:" + col + "22;color:" + col + ";border-color:" + col + ";";

            /* Короткая подпись: для компонента — значение/корпус/остаток */
            let desc = String(p.описание || "");
            if (String(p.log) === "компонент") {
                const bits = [p.значение, p.корпус].filter(x => x != null && String(x).trim() !== "").map(String);
                const qty = elNum(p.количество);
                bits.push(qty + " шт");
                desc = bits.join(" · ") + (desc ? " — " + desc : "");
            }
            if (desc) body.createEl("div", { text: desc, cls: "el-card-desc" });

            if (p.статус) {
                const st = body.createEl("div", { cls: "el-tags" });
                const sb = st.createEl("span", { cls: "el-tag", text: "● " + String(p.статус) });
                sb.style.color = EL_STATUS_COLOR[String(p.статус)] || col;
            }
            const tags = elArr(p.теги).filter(Boolean);
            if (tags.length) {
                const tw = body.createEl("div", { cls: "el-tags" });
                for (const t of tags.slice(0, 4)) tw.createEl("span", { cls: "el-tag", text: "#" + t });
            }
            card.addEventListener("click", () => elOpen(app, p.file.path));
        }
    }

    renderStats();
    renderTagFilters();
    renderGrid();
    searchInput.addEventListener("input", renderGrid);
}

/* ═══════════════════════════════════════════════════════════════════
   СКЛАД КОМПОНЕНТОВ
   ═══════════════════════════════════════════════════════════════════ */
async function elStock(dv, app) {
    const root = dv.el("div", "", {});
    root.className = "el-root";

    const top = root.createEl("div", { cls: "el-top" });
    const add = top.createEl("button", { text: "＋ Компонент", cls: "el-btn el-btn-accent" });
    add.addEventListener("click", () => elForm(app, "компонент", dv));
    const home = top.createEl("button", { text: "⚡ Главная", cls: "el-btn" });
    home.addEventListener("click", () => elOpen(app, EL_ROOT + "/🏠 Главная.md"));
    const tb = top.createEl("button", { text: "🛠 Техника безопасности", cls: "el-btn el-btn-ghost" });
    tb.addEventListener("click", () => elOpen(app, EL_ROOT + "/🛠 Техника безопасности.md"));

    const parts = dv.pages('"' + EL_ROOT + '"').where(p => String(p.log) === "компонент" && !p.шаблон);

    /* Поиск */
    const toolRow = root.createEl("div", { cls: "el-toolrow" });
    const searchInput = toolRow.createEl("input", { cls: "el-input" });
    searchInput.type = "text";
    searchInput.placeholder = "🔍 Найти: резистор, 10к, ESP32, ящик 2…";
    const onlyLow = toolRow.createEl("button", { text: "⚠️ Только мало", cls: "el-btn" });
    let lowOnly = false;
    onlyLow.addEventListener("click", () => {
        lowOnly = !lowOnly;
        onlyLow.classList.toggle("is-on", lowOnly);
        render();
    });
    const sortSel = toolRow.createEl("select", { cls: "el-select" });
    for (const [v, t] of [["az", "По названию"], ["qty", "По остатку"], ["type", "По типу"]]) {
        const o = sortSel.createEl("option", { text: t }); o.value = v;
    }
    let activeSort = "az";
    sortSel.addEventListener("change", () => { activeSort = sortSel.value; render(); });

    /* Фильтр по типу */
    const typeFilters = root.createEl("div", { cls: "el-filters" });
    const activeTypes = new Set();
    function renderTypeFilters() {
        typeFilters.empty();
        const counts = new Map();
        for (const p of parts.array()) {
            const t = String(p.тип || "прочее");
            counts.set(t, (counts.get(t) || 0) + 1);
        }
        const all = typeFilters.createEl("button", { cls: "el-chip", text: "Все" });
        all.classList.toggle("is-active", activeTypes.size === 0);
        all.addEventListener("click", () => { activeTypes.clear(); render(); });
        for (const [t, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
            const c = typeFilters.createEl("button", { cls: "el-chip", text: t + " · " + n });
            c.classList.toggle("is-active", activeTypes.has(t));
            c.addEventListener("click", () => {
                if (activeTypes.has(t)) activeTypes.delete(t); else activeTypes.add(t);
                render();
            });
        }
    }

    /* Таблица */
    const summary = root.createEl("div", { cls: "el-progress-lbl" });
    const scroll = root.createEl("div", { cls: "el-tscroll" });
    const table = scroll.createEl("div", { cls: "el-table" });

    const COLS = [
        ["тип", "Тип"], ["title", "Название"], ["значение", "Значение"],
        ["корпус", "Корпус"], ["qty", "Количество"], ["место", "Место"]
    ];

    function render() {
        renderTypeFilters();
        const q = searchInput.value.trim().toLowerCase();
        let items = parts.array();
        if (activeTypes.size) items = items.filter(p => activeTypes.has(String(p.тип || "прочее")));
        if (q) items = items.filter(p => (elPageName(p) + " " + String(p.описание || "") + " " +
            String(p.значение || "") + " " + String(p.корпус || "") + " " +
            String(p.тип || "") + " " + String(p.место || "")).toLowerCase().includes(q));
        if (lowOnly) items = items.filter(p => elNum(p.количество) === 0 ||
            (elNum(p.минимум) > 0 && elNum(p.количество) <= elNum(p.минимум)));

        const bySort = {
            az: (a, b) => elPageName(a).localeCompare(elPageName(b), "ru"),
            qty: (a, b) => elNum(a.количество) - elNum(b.количество) || elPageName(a).localeCompare(elPageName(b), "ru"),
            type: (a, b) => String(a.тип || "прочее").localeCompare(String(b.тип || "прочее"), "ru") ||
                           elPageName(a).localeCompare(elPageName(b), "ru"),
        };
        items.sort(bySort[activeSort]);

        const all = parts.array();
        const total = all.reduce((s, p) => s + elNum(p.количество), 0);
        const lowN = all.filter(p => elNum(p.количество) === 0 ||
            (elNum(p.минимум) > 0 && elNum(p.количество) <= elNum(p.минимум))).length;
        summary.textContent = "Позиций: " + all.length + " · Всего штук: " + total +
            " · Мало: " + lowN + (items.length !== all.length ? " · Показано: " + items.length : "");

        table.empty();
        const head = table.createEl("div", { cls: "el-trow el-thead" });
        for (const [, lbl] of COLS) head.createEl("div", { text: lbl, cls: "el-tcell" });
        head.createEl("div", { text: "", cls: "el-tcell" });

        if (items.length === 0) {
            const e = table.createEl("div", { cls: "el-empty" });
            e.textContent = all.length === 0
                ? "Склад пуст. Нажми «＋ Компонент» или добавь детали с Главной."
                : "Ничего не найдено.";
            return;
        }

        for (const p of items) {
            const row = table.createEl("div", { cls: "el-trow" });
            const qty = elNum(p.количество);
            const min = elNum(p.минимум);
            const isLow = qty === 0 || (min > 0 && qty <= min);
            if (isLow) row.classList.add("is-low");

            const c0 = row.createEl("div", { cls: "el-tcell" });
            const tgb = c0.createEl("span", { cls: "el-badge", text: String(p.тип || "—") });
            tgb.style.cssText = "background:#4a90d922;color:#4a90d9;border-color:#4a90d9;";

            const c1 = row.createEl("div", { cls: "el-tcell el-tname" });
            c1.textContent = elPageName(p);
            c1.addEventListener("click", () => elOpen(app, p.file.path));

            row.createEl("div", { cls: "el-tcell", text: String(p.значение || "—") });
            row.createEl("div", { cls: "el-tcell", text: String(p.корпус || "—") });

            const c4 = row.createEl("div", { cls: "el-tcell" });
            const step = c4.createEl("span", { cls: "el-stepwrap" });
            const minus = step.createEl("button", { text: "−", cls: "el-step" });
            if (qty <= 0) minus.classList.add("is-off");
            const num = step.createEl("b", { text: String(qty) });
            const plus = step.createEl("button", { text: "+", cls: "el-step" });
            if (isLow) {
                const low = c4.createEl("span", { cls: "el-low", text: qty === 0 ? "кончился" : "мало" });
                low.style.marginLeft = "6px";
            }
            const doStep = async (d) => {
                const next = Math.max(0, elNum(num.textContent) + d);
                await elSetFm(app, p.file, "количество", next);
                render();
            };
            minus.addEventListener("click", () => doStep(-1));
            plus.addEventListener("click", () => doStep(1));

            row.createEl("div", { cls: "el-tcell", text: String(p.место || "—") });
        }
    }

    render();
    searchInput.addEventListener("input", render);
}

/* ═══════════════════════════════════════════════════════════════════
   МОДАЛКА СОЗДАНИЯ
   ═══════════════════════════════════════════════════════════════════ */
function elForm(app, kind, dv) {
    const K = EL_KINDS[kind];
    const ov = document.createElement("div");
    ov.className = "el-modal";
    const box = ov.createEl("div", { cls: "el-modal-box" });
    box.createEl("div", { text: K.icon + " Новая запись · " + K.label, cls: "el-modal-title" });

    const inputs = {};
    function field(key, label, opts) {
        const o = opts || {};
        const f = box.createEl("div", { cls: "el-field" });
        f.createEl("label", { text: label + (o.req ? " *" : "") });
        if (o.options) {
            const dl = document.createElement("datalist");
            dl.id = "el-dl-" + key;
            for (const v of o.options) {
                const op = document.createElement("option");
                op.value = v;
                dl.appendChild(op);
            }
            f.appendChild(dl);
        }
        const tag = o.area ? "textarea" : "input";
        const inp = f.createEl(tag, {});
        inp.className = "el-input";
        if (o.area) { inp.rows = 2; } else { inp.type = o.type || "text"; }
        if (o.ph) inp.placeholder = o.ph;
        if (o.options) inp.setAttribute("list", "el-dl-" + key);
        inp.addEventListener("keydown", e => { if (e.key === "Enter" && !o.area) ok.click(); });
        inputs[key] = inp;
        return inp;
    }

    const tIn = field("name", "Название", { req: true, ph: kind === "компонент" ? "Резистор 10 кОм" : "Коротко и понятно" });
    tIn.dataset.f = "name";

    if (kind === "компонент") {
        const r2 = box.createEl("div", { cls: "el-row2" });
        const wrap = r2.createEl("div", { cls: "el-field" });
        wrap.createEl("label", { text: "Тип" });
        const dl = document.createElement("datalist");
        dl.id = "el-dl-ptype";
        for (const v of EL_PART_TYPES) { const op = document.createElement("option"); op.value = v; dl.appendChild(op); }
        wrap.appendChild(dl);
        const ti = wrap.createEl("input", {});
        ti.className = "el-input"; ti.type = "text"; ti.placeholder = "резистор";
        ti.setAttribute("list", "el-dl-ptype");
        inputs["тип"] = ti;

        const qf = r2.createEl("div", { cls: "el-field" });
        qf.createEl("label", { text: "Количество (шт)" });
        const qi = qf.createEl("input", {});
        qi.className = "el-input"; qi.type = "number"; qi.min = "0"; qi.placeholder = "10";
        inputs["количество"] = qi;

        const r3 = box.createEl("div", { cls: "el-row2" });
        const vf = r3.createEl("div", { cls: "el-field" });
        vf.createEl("label", { text: "Значение" });
        const vi = vf.createEl("input", {});
        vi.className = "el-input"; vi.type = "text"; vi.placeholder = "10 кОм · 1%";
        inputs["значение"] = vi;

        const cf = r3.createEl("div", { cls: "el-field" });
        cf.createEl("label", { text: "Корпус" });
        const ci = cf.createEl("input", {});
        ci.className = "el-input"; ci.type = "text"; ci.placeholder = "0805 / DIP-8";
        inputs["корпус"] = ci;

        const mf = box.createEl("div", { cls: "el-field" });
        mf.createEl("label", { text: "Место хранения" });
        const mi = mf.createEl("input", {});
        mi.className = "el-input"; mi.type = "text"; mi.placeholder = "ящик 2, коробка R/C";
        inputs["место"] = mi;
    } else if (kind === "проект") {
        const r2 = box.createEl("div", { cls: "el-row2" });
        const hf = r2.createEl("div", { cls: "el-field" });
        hf.createEl("label", { text: "Сложность" });
        const sel = hf.createEl("select", {});
        sel.className = "el-select";
        for (const v of EL_HARD) { const o = document.createElement("option"); o.value = v; o.textContent = v; sel.appendChild(o); }
        inputs["сложность"] = sel;
        const df = r2.createEl("div", { cls: "el-field" });
        df.createEl("label", { text: "Когда" });
        const di = df.createEl("input", {});
        di.className = "el-input"; di.type = "text"; di.placeholder = "октябрь 2026";
        inputs["дата"] = di;
    } else if (kind === "идея") {
        const r2 = box.createEl("div", { cls: "el-row2" });
        const pf = r2.createEl("div", { cls: "el-field" });
        pf.createEl("label", { text: "Приоритет" });
        const sel = pf.createEl("select", {});
        sel.className = "el-select";
        for (const v of EL_PRIORITY) { const o = document.createElement("option"); o.value = v; o.textContent = v; sel.appendChild(o); }
        inputs["приоритет"] = sel;
        const hf = r2.createEl("div", { cls: "el-field" });
        hf.createEl("label", { text: "Сложность" });
        const sel2 = hf.createEl("select", {});
        sel2.className = "el-select";
        for (const v of EL_HARD) { const o = document.createElement("option"); o.value = v; o.textContent = v; sel2.appendChild(o); }
        inputs["сложность"] = sel2;
    } else if (kind === "конспект") {
        const r2 = box.createEl("div", { cls: "el-row2" });
        const tf = r2.createEl("div", { cls: "el-field" });
        tf.createEl("label", { text: "Тема" });
        const ti = tf.createEl("input", {});
        ti.className = "el-input"; ti.type = "text"; ti.placeholder = "транзисторы";
        inputs["тема"] = ti;
        const lf = r2.createEl("div", { cls: "el-field" });
        lf.createEl("label", { text: "Уровень" });
        const sel = lf.createEl("select", {});
        sel.className = "el-select";
        for (const v of EL_LEVELS) { const o = document.createElement("option"); o.value = v; o.textContent = v; sel.appendChild(o); }
        inputs["уровень"] = sel;
    } else if (kind === "ресурс") {
        const r2 = box.createEl("div", { cls: "el-row2" });
        const cf = r2.createEl("div", { cls: "el-field" });
        cf.createEl("label", { text: "Категория" });
        const dl = document.createElement("datalist");
        dl.id = "el-dl-rcat";
        for (const v of EL_RES_CATS) { const op = document.createElement("option"); op.value = v; dl.appendChild(op); }
        cf.appendChild(dl);
        const ci = cf.createEl("input", {});
        ci.className = "el-input"; ci.type = "text"; ci.placeholder = "даташит";
        ci.setAttribute("list", "el-dl-rcat");
        inputs["категория"] = ci;
        const sf = r2.createEl("div", { cls: "el-field" });
        sf.createEl("label", { text: "Ссылка" });
        const si = sf.createEl("input", {});
        si.className = "el-input"; si.type = "url"; si.placeholder = "https://…";
        inputs["ссылка"] = si;
    } else if (kind === "инструмент") {
        const r2 = box.createEl("div", { cls: "el-field" });
        r2.createEl("label", { text: "Тип" });
        const ti = r2.createEl("input", {});
        ti.className = "el-input"; ti.type = "text"; ti.placeholder = "пайка / измерение / питание";
        inputs["тип"] = ti;
    } else if (kind === "работа") {
        const r2 = box.createEl("div", { cls: "el-row2" });
        const df = r2.createEl("div", { cls: "el-field" });
        df.createEl("label", { text: "Дата" });
        const di = df.createEl("input", {});
        di.className = "el-input"; di.type = "text"; di.placeholder = "октябрь 2026";
        inputs["дата"] = di;
        const cf = r2.createEl("div", { cls: "el-field" });
        cf.createEl("label", { text: "Стоимость" });
        const ci = cf.createEl("input", {});
        ci.className = "el-input"; ci.type = "text"; ci.placeholder = "≈ 500 ₽";
        inputs["стоимость"] = ci;
    }

    const fDesc = box.createEl("div", { cls: "el-field" });
    fDesc.createEl("label", { text: "Описание" });
    const dIn = fDesc.createEl("textarea", {});
    dIn.className = "el-input";
    dIn.rows = 2; dIn.placeholder = "Коротко, в одну-две строки";
    inputs["описание"] = dIn;

    const rTags = box.createEl("div", { cls: "el-field" });
    rTags.createEl("label", { text: "Теги (через запятую)" });
    const gIn = rTags.createEl("input", {});
    gIn.className = "el-input"; gIn.type = "text"; gIn.placeholder = "esp32, питание, корпус";

    let pIn = null;
    if (kind !== "проект") {
        const fp = box.createEl("div", { cls: "el-field" });
        fp.createEl("label", { text: "Проект" });
        pIn = fp.createEl("input", {});
        pIn.className = "el-input"; pIn.type = "text"; pIn.placeholder = "необязательно — название проекта";
    }

    box.createEl("div", { text: "Файл создаётся из шаблона и сразу открывается.", cls: "el-progress-lbl" });

    const btns = box.createEl("div", { cls: "el-modal-btns" });
    const cancel = btns.createEl("button", { text: "Отмена", cls: "el-btn" });
    const ok = btns.createEl("button", { text: "Создать", cls: "el-btn el-btn-primary" });

    const close = () => ov.remove();
    cancel.addEventListener("click", close);
    ov.addEventListener("click", e => { if (e.target === ov) close(); });
    const esc = function (e) {
        if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc, true); }
    };
    document.addEventListener("keydown", esc, true);

    ok.addEventListener("click", async () => {
        const name = inputs["name"].value.trim();
        if (!name) { inputs["name"].focus(); return; }
        const dir = EL_ROOT + "/" + K.dir;
        const newPath = dir + "/" + name + ".md";
        if (app.vault.getAbstractFileByPath(newPath)) {
            dIn.value = "Уже существует запись с таким названием.";
            return;
        }
        try {
            const raw = await app.vault.adapter.read(dir + "/" + K.tpl);
            const content = raw.replace(/\{\{TITLE\}\}/g, name);
            const nf = await app.vault.create(newPath, content);
            const tags = gIn.value.split(",").map(s => s.trim()).filter(Boolean);
            const proj = pIn ? pIn.value.trim() : "";
            const extra = {};
            for (const [k, inp] of Object.entries(inputs)) {
                if (k === "name") continue;
                const v = String(inp.value || "").trim();
                if (v !== "") extra[k] = k === "количество" ? (Number(v) || 0) : v;
            }
            await app.fileManager.processFrontMatter(nf, fm => {
                fm.title = name;
                if (tags.length) fm.теги = tags;
                if (proj) fm.проект = proj;
                for (const [k, v] of Object.entries(extra)) fm[k] = v;
                delete fm.шаблон;
            });
            close();
            elOpen(app, newPath);
        } catch (e) {
            dIn.value = "Ошибка: " + (e && e.message || e);
        }
    });

    document.body.appendChild(ov);
    inputs["name"].focus();
}

/* ═══════════════════════════════════════════════════════════════════
   ТОЧКА ВХОДА
   ═══════════════════════════════════════════════════════════════════ */
async function elMain(dv, app, mode) {
    await elEnsureCss(app);
    if (mode === "hub") return await elHub(dv, app);
    if (mode === "stock") return await elStock(dv, app);
    return await elCard(dv, app);
}
