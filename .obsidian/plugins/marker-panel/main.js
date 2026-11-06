const { Plugin, Notice } = require("obsidian");

const TOOLBAR_CMD = "editing-toolbar:hide-show-menu";
const PANEL_ID = "marker-panel-root";
const BAR_SELECTOR = "#editingToolbarModalBar, #editingToolbarPopoverBar";

const COLORS = [
    ["hl-yellow", "Жёлтый", "#FFDB28"],
    ["hl-green", "Зелёный", "#84E574"],
    ["hl-pink", "Розовый", "#FF8FBB"],
    ["hl-blue", "Голубой", "#7AC2FF"],
    ["hl-orange", "Оранжевый", "#FFA040"],
    ["hl-purple", "Фиолетовый", "#C49EFF"],
    ["hl-cyan", "Бирюзовый", "#7EE7FF"],
    ["hl-red", "Красный", "#FF6E6E"],
    ["hl-lime", "Лаймовый", "#C9F04B"],
    ["hl-brown", "Терракотовый", "#D98C5F"],
    ["hl-gray", "Серый", "#C4C4C4"],
    ["hl-teal", "Изумрудный", "#5FD6A8"],
];

const SHAPES = [
    ["plain", "Ровная"],
    ["round", "Скруглённая"],
    ["rag", "Рваная"],
];

const DEFAULTS = {
    colors: COLORS.reduce((acc, [id, , hex]) => Object.assign(acc, { [id]: hex }), {}),
    shape: "plain",
    density: 35,
    padY: 13,
    padX: 28,
    custom: "#FFDB28",
    hk: [{ modifiers: ["Alt", "Shift"], key: "T" }],
    hkPanel: [],
    btnBg: ["#FFB78B", "#CDF469", "#A0CCF6", "#F0A7D8", "#ADEFEF"],
    btnFg: ["#D83931", "#DE7802", "#245BDB", "#6425D0", "#646A73"],
    pos: { top: 110, right: 40 },
    collapsed: false,
    order: { main: [], popover: [] },
};

const STYLE = `
#${PANEL_ID} {
    position: fixed; z-index: 9999; width: 286px;
    background: var(--background-secondary, #232323);
    border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 10px; box-shadow: 0 10px 28px rgba(0,0,0,.45);
    font-size: 12px; color: var(--text-normal, #ddd); user-select: none;
}
#${PANEL_ID} .mp-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 8px; cursor: grab; border-bottom: 1px solid var(--background-modifier-border, #3a3a3a);
}
#${PANEL_ID} .mp-title { font-weight: 600; font-size: 12px; letter-spacing: .2px; }
#${PANEL_ID} .mp-head button, #${PANEL_ID} .mp-btn {
    background: var(--background-modifier-hover, #333); color: var(--text-normal, #ddd);
    border: 1px solid var(--background-modifier-border, #3a3a3a); border-radius: 6px;
    height: 20px; min-width: 20px; padding: 0 6px; cursor: pointer; font-size: 12px; line-height: 1;
}
#${PANEL_ID} .mp-head button:hover, #${PANEL_ID} .mp-btn:hover { background: var(--background-modifier-border, #444); }
#${PANEL_ID} .mp-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; max-height: 74vh; overflow-y: auto; }
#${PANEL_ID} .mp-body.mp-hidden { display: none; }
#${PANEL_ID} .mp-label { font-size: 11px; text-transform: uppercase; letter-spacing: .4px; opacity: .65; }
#${PANEL_ID} .mp-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
#${PANEL_ID} .mp-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
#${PANEL_ID} .mp-sw {
    height: 22px; border-radius: 5px; cursor: pointer;
    border: 1px solid rgba(0,0,0,.35); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
}
#${PANEL_ID} .mp-sw:hover { outline: 2px solid var(--interactive-accent, #a80000); outline-offset: 1px; }
#${PANEL_ID} .mp-shapes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
#${PANEL_ID} .mp-shape { height: 24px; border-radius: 6px; cursor: pointer; font-size: 11px; }
#${PANEL_ID} .mp-shape.is-on { background: var(--interactive-accent, #a80000); color: #fff; border-color: transparent; }
#${PANEL_ID} .mp-slider { display: grid; grid-template-columns: 74px 1fr 26px; align-items: center; gap: 6px; }
#${PANEL_ID} .mp-slider input[type=range] { width: 100%; height: 14px; }
#${PANEL_ID} .mp-val { text-align: right; opacity: .7; font-variant-numeric: tabular-nums; }
#${PANEL_ID} .mp-sep { height: 1px; background: var(--background-modifier-border, #3a3a3a); margin: 2px 0; }
#${PANEL_ID} .mp-hk { font-family: var(--font-monospace, monospace); font-size: 11px; opacity: .85; }
#${PANEL_ID} .mp-hk.is-wait { color: var(--text-accent, #ff9f43); opacity: 1; }
#${PANEL_ID} .mp-hkblock { display: flex; flex-direction: column; gap: 3px; margin-bottom: 4px; }
#${PANEL_ID} .mp-hkname { font-size: 11px; opacity: .7; }
#${PANEL_ID} input[type=color] {
    width: 26px; height: 20px; padding: 0; border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 5px; background: none; cursor: pointer;
}
#${PANEL_ID} .mp-editor { display: flex; flex-direction: column; gap: 3px; }
#${PANEL_ID} .mp-editor-row { display: grid; grid-template-columns: 1fr 26px; align-items: center; gap: 6px; }
#${PANEL_ID} .mp-hint { font-size: 10px; opacity: .5; }
/* перетаскивание значков в панели форматирования */
#editingToolbarModalBar > .mp-drag-target,
#editingToolbarPopoverBar > .mp-drag-target { position: relative; }
#editingToolbarModalBar > .mp-drop-left::after,
#editingToolbarModalBar > .mp-drop-right::after,
#editingToolbarPopoverBar > .mp-drop-left::after,
#editingToolbarPopoverBar > .mp-drop-right::after {
    content: ""; position: absolute; top: 2px; bottom: 2px; width: 2px;
    background: var(--interactive-accent, #a80000); border-radius: 1px;
}
#editingToolbarModalBar > .mp-drop-left::after,
#editingToolbarPopoverBar > .mp-drop-left::after { left: -1px; }
#editingToolbarModalBar > .mp-drop-right::after,
#editingToolbarPopoverBar > .mp-drop-right::after { right: -1px; }
#editingToolbarModalBar > .mp-dragging,
#editingToolbarPopoverBar > .mp-dragging { opacity: .35; }
`;

module.exports = class MarkerPanel extends Plugin {
    async onload() {
        const saved = (await this.loadData()) || {};
        this.settings = Object.assign({}, DEFAULTS, saved);
        this.settings.colors = Object.assign({}, DEFAULTS.colors, saved.colors || {});
        this.settings.pos = Object.assign({}, DEFAULTS.pos, saved.pos || {});
        // в палитре плагина бывают 8-значные hex (#RRGGBBAA) — поле выбора цвета их не понимает
        const hex6 = (c) => (typeof c === "string" && /^#[0-9a-fA-F]{8}$/.test(c) ? c.slice(0, 7) : c);
        this.settings.btnBg = (this.settings.btnBg || DEFAULTS.btnBg).map(hex6);
        this.settings.btnFg = (this.settings.btnFg || DEFAULTS.btnFg).map(hex6);
        this.settings.order = Object.assign({ main: [], popover: [] }, saved.order || {});
        this.awaitingHotkey = false;

        this.addCommand({ id: "open", name: "Панель выделителей (открыть/скрыть)", callback: () => this.toggle() });
        this.addCommand({
            id: "toggle-toolbar",
            name: "Скрыть/показать панель форматирования",
            callback: () => this.exec(TOOLBAR_CMD),
        });

        this.applyAll();
        this.registerEvent(this.app.workspace.on("layout-change", () => this.applyAll()));
        this.setupToolbarDrag();
        this.restoreHotkeys();
    }

    onunload() {
        this.closePanel();
        const body = document.body;
        for (const [id] of COLORS) body.style.removeProperty(`--${id}`);
        body.style.removeProperty("--hl-a");
        body.style.removeProperty("--hl-pad-y");
        body.style.removeProperty("--hl-pad-x");
        body.classList.remove("hl-plain", "hl-round", "hl-razn");
        this.clearDragMarks(true);
    }

    // ── перетаскивание значков в панели форматирования ───────────────
    setupToolbarDrag() {
        this.barObservers = new Map();
        this.drag = null;

        const markOnMouseDown = (ev) => {
            const bar = ev.target instanceof Element ? ev.target.closest(BAR_SELECTOR) : null;
            if (bar) this.markBarDraggable(bar);
        };
        document.addEventListener("mousedown", markOnMouseDown, true);
        this.register(() => document.removeEventListener("mousedown", markOnMouseDown, true));

        const onStart = (ev) => this.onDragStart(ev);
        const onOver = (ev) => this.onDragOver(ev);
        const onDrop = (ev) => this.onDrop(ev);
        const onEnd = () => {
            this.drag = null;
            this.clearDragMarks(true);
        };
        for (const [type, fn] of [["dragstart", onStart], ["dragover", onOver], ["drop", onDrop], ["dragend", onEnd]]) {
            document.addEventListener(type, fn, true);
            this.register(() => document.removeEventListener(type, fn, true));
        }

        const refresh = () => this.refreshBarObservers();
        refresh();
        this.registerEvent(this.app.workspace.on("layout-change", refresh));
        this.registerEvent(this.app.workspace.on("active-leaf-change", refresh));
        const timer = window.setInterval(refresh, 1500);
        this.register(() => window.clearInterval(timer));
    }

    barName(bar) {
        return bar && bar.id === "editingToolbarPopoverBar" ? "popover" : "main";
    }

    markBarDraggable(bar) {
        for (const child of bar.children) {
            if (child.classList.contains("more-menu")) continue;
            child.classList.add("mp-drag-target");
            if (child.getAttribute("draggable") !== "true") child.setAttribute("draggable", "true");
        }
    }

    // устойчивый ключ значка: подпись, иначе иконка, иначе номер повтора
    nodeKey(el, seen) {
        const label = (el.getAttribute("aria-label") || el.getAttribute("title") || "").trim();
        const svg = el.querySelector("svg");
        const icon = svg ? [...svg.classList].filter((c) => c !== "svg-icon").join(" ") : "";
        const base = label ? `L:${label}` : icon ? `I:${icon}` : `X:${(el.textContent || "").trim().slice(0, 24)}`;
        const n = (seen.get(base) || 0) + 1;
        seen.set(base, n);
        return n === 1 ? base : `${base}~${n}`;
    }

    barKeys(bar) {
        const seen = new Map();
        return [...bar.children]
            .filter((c) => !c.classList.contains("more-menu"))
            .map((el) => this.nodeKey(el, seen));
    }

    // переставить значки так, как запомнили
    enforceOrder(bar) {
        const stored = (this.settings.order && this.settings.order[this.barName(bar)]) || [];
        if (!stored.length) return;
        const kids = [...bar.children].filter((c) => !c.classList.contains("more-menu"));
        const seen = new Map();
        const keys = kids.map((el) => this.nodeKey(el, seen));
        const rank = new Map(stored.map((k, i) => [k, i]));
        const sorted = kids
            .map((el, i) => ({ el, i, r: rank.has(keys[i]) ? rank.get(keys[i]) : 1e6 + i }))
            .sort((a, b) => a.r - b.r || a.i - b.i);
        if (sorted.every((x, i) => x.el === kids[i])) return;
        const more = [...bar.children].find((c) => c.classList.contains("more-menu")) || null;
        for (const { el } of sorted) bar.insertBefore(el, more);
    }

    refreshBarObservers() {
        if (!this.barObservers) return;
        for (const [el, obs] of [...this.barObservers]) {
            if (!el.isConnected) {
                obs.disconnect();
                this.barObservers.delete(el);
            }
        }
        for (const el of document.querySelectorAll(BAR_SELECTOR)) {
            if (!this.barObservers.has(el)) {
                const obs = new MutationObserver(() => {
                    if (el.isConnected) this.enforceOrder(el);
                });
                obs.observe(el, { childList: true });
                this.barObservers.set(el, obs);
                this.register(() => obs.disconnect());
            }
            this.enforceOrder(el);
        }
    }

    onDragStart(ev) {
        const node = ev.target instanceof Element ? ev.target : null;
        if (!node) return;
        const bar = node.closest(BAR_SELECTOR);
        if (!bar) return;
        let item = node;
        while (item && item.parentElement !== bar) item = item.parentElement;
        if (!item || item === bar || item.classList.contains("more-menu")) return;

        this.markBarDraggable(bar);
        this.drag = { bar, item, name: this.barName(bar) };
        item.classList.add("mp-dragging");
        if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = "move";
            try {
                ev.dataTransfer.setData("application/x-marker-panel", "move");
            } catch (e) {
                /* Electron иногда запрещает setData в dragstart — не критично */
            }
        }
    }

    // куда вставить: элемент, перед которым встать (null — в конец)
    dropTargetIndex(bar, x) {
        const items = [...bar.children].filter(
            (c) => c !== this.drag.item && !c.classList.contains("more-menu") && !c.classList.contains("mp-dragging"),
        );
        for (const el of items) {
            const r = el.getBoundingClientRect();
            if (x < r.left + r.width / 2) return el;
        }
        return null;
    }

    clearDragMarks(all) {
        document.querySelectorAll(".mp-drop-left, .mp-drop-right").forEach((el) =>
            el.classList.remove("mp-drop-left", "mp-drop-right"),
        );
        document.querySelectorAll(".mp-dragging").forEach((el) => el.classList.remove("mp-dragging"));
        if (all) {
            document.querySelectorAll(".mp-drag-target").forEach((el) => {
                el.classList.remove("mp-drag-target");
                if (el.getAttribute("draggable") === "true") el.removeAttribute("draggable");
            });
        }
    }

    onDragOver(ev) {
        const d = this.drag;
        if (!d) return;
        const bar = ev.target instanceof Element ? ev.target.closest(BAR_SELECTOR) : null;
        if (!bar || bar !== d.bar) return; // между строками не переносим
        ev.preventDefault();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";

        const target = this.dropTargetIndex(bar, ev.clientX);
        document.querySelectorAll(".mp-drop-left, .mp-drop-right").forEach((el) =>
            el.classList.remove("mp-drop-left", "mp-drop-right"),
        );
        if (target) {
            target.classList.add("mp-drop-left");
        } else {
            const items = [...bar.children].filter(
                (c) => c !== d.item && !c.classList.contains("more-menu") && !c.classList.contains("mp-dragging"),
            );
            const last = items[items.length - 1];
            if (last) last.classList.add("mp-drop-right");
        }
    }

    async onDrop(ev) {
        const d = this.drag;
        if (!d) return;
        const bar = ev.target instanceof Element ? ev.target.closest(BAR_SELECTOR) : null;
        if (!bar || bar !== d.bar) return;
        ev.preventDefault();
        ev.stopPropagation();

        const target = this.dropTargetIndex(bar, ev.clientX);
        const more = [...bar.children].find((c) => c.classList.contains("more-menu")) || null;
        if (target !== d.item) {
            bar.insertBefore(d.item, target || more);
            this.settings.order[d.name] = this.barKeys(bar);
            await this.save();
        }
        this.drag = null;
        this.clearDragMarks(true);
    }

    // ── настройки → CSS ───────────────────────────────────────────────
    rgb(hex) {
        const h = String(hex || "").replace("#", "");
        const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
        const n = parseInt(full.slice(0, 6), 16);
        if (Number.isNaN(n)) return "255, 219, 40";
        return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    }

    applyAll() {
        const s = this.settings;
        const body = document.body;
        for (const [id] of COLORS) body.style.setProperty(`--${id}`, this.rgb(s.colors[id]));
        body.style.setProperty("--hl-a", String(s.density / 100));
        body.style.setProperty("--hl-pad-y", String(s.padY / 100));
        body.style.setProperty("--hl-pad-x", String(s.padX / 100));
        body.classList.remove("hl-plain", "hl-round", "hl-razn");
        body.classList.add(s.shape === "rag" ? "hl-razn" : s.shape === "round" ? "hl-round" : "hl-plain");
    }

    async save() {
        await this.saveData(this.settings);
    }

    // ── действия ─────────────────────────────────────────────────────
    exec(id) {
        if (!this.app.commands.commands[id]) {
            new Notice("Команда недоступна — проверь плагин Editing Toolbar");
            return false;
        }
        this.app.commands.executeCommandById(id);
        return true;
    }

    wrap(cls, inline) {
        const view = this.app.workspace.activeLeaf && this.app.workspace.activeLeaf.view;
        const editor = view && view.editor;
        if (!editor) {
            new Notice("Открой заметку — выделять нечего");
            return;
        }
        const from = editor.getCursor("from");
        const to = editor.getCursor("to");
        if (from.line === to.line && from.ch === to.ch) {
            new Notice("Сначала выдели текст");
            return;
        }
        const text = editor.getRange(from, to);
        const open = inline ? `<span class="${cls}" style="${inline}">` : `<span class="${cls}">`;
        editor.replaceRange(open + text + "</span>", from, to);
        editor.setCursor({ line: to.line, ch: to.ch + open.length + 7 });
    }

    applyPreset(id) {
        if (!this.exec(`editing-toolbar:${id}`)) this.wrap(id, "");
    }

    applyCustom() {
        this.wrap("hl-custom", `--hl-c: ${this.rgb(this.settings.custom)}`);
    }

    hkOf(cmd, key) {
        const hm = this.app.hotkeyManager;
        let list = null;
        if (hm && typeof hm.getHotkeys === "function") list = hm.getHotkeys(cmd);
        if (!Array.isArray(list) || !list.length) list = this.settings[key] || [];
        return (list && list[0]) || null;
    }

    hotkeyLabel(cmd, key) {
        const hk = this.hkOf(cmd, key);
        if (!hk || !hk.key) return "не задан";
        return [].concat(hk.modifiers || [], hk.key).join(" + ");
    }

    // восстановить бинд из наших настроек, если в Obsidian он потерялся
    restoreHotkeys() {
        const hm = this.app.hotkeyManager;
        if (!hm || typeof hm.setHotkeys !== "function") return;
        for (const [cmd, key] of [[this.panelCmd(), "hkPanel"], [TOOLBAR_CMD, "hk"]]) {
            const own = this.settings[key];
            if (!own || !own.length) continue;
            const cur = typeof hm.getHotkeys === "function" ? hm.getHotkeys(cmd) : null;
            if (Array.isArray(cur) && cur.length) continue;
            hm.setHotkeys(cmd, own);
            if (typeof hm.save === "function") hm.save();
        }
    }

    panelCmd() {
        return `${this.manifest.id}:open`;
    }

    async assignHotkey(cmd, key, hint) {
        if (this.awaitingHotkey) return;
        this.awaitingHotkey = true;
        if (hint) {
            hint.textContent = "нажми сочетание…";
            hint.classList.add("is-wait");
        }
        const handler = async (ev) => {
            if (ev.key === "Escape") {
                done();
                return;
            }
            const mods = [];
            if (ev.altKey) mods.push("Alt");
            if (ev.ctrlKey) mods.push("Ctrl");
            if (ev.metaKey) mods.push("Meta");
            if (ev.shiftKey) mods.push("Shift");
            const name = (ev.key || "").toUpperCase();
            if (!name || ["ALT", "SHIFT", "CONTROL", "META", "OS", "ESCAPE"].includes(name)) return;
            ev.preventDefault();
            ev.stopPropagation();
            const hk = [{ modifiers: mods, key: name }];
            const hm = this.app.hotkeyManager;
            if (!hm || !hm.setHotkeys) {
                new Notice("Не удалось назначить: API Obsidian недоступен");
                done();
                return;
            }
            hm.setHotkeys(cmd, hk);
            if (typeof hm.save === "function") hm.save();
            this.settings[key] = hk;
            await this.save();
            done();
            new Notice(`Бинд: ${this.hotkeyLabel(cmd, key)}`);
        };
        const done = () => {
            this.awaitingHotkey = false;
            window.removeEventListener("keydown", handler, true);
            this.render();
        };
        window.addEventListener("keydown", handler, true);
    }

    async resetHotkey(cmd, key) {
        const hm = this.app.hotkeyManager;
        if (hm && hm.removeHotkeys) hm.removeHotkeys(cmd);
        if (hm && typeof hm.save === "function") hm.save();
        this.settings[key] = [];
        await this.save();
        this.render();
        new Notice("Бинд снят");
    }

    syncToolbarColors() {
        const plugin = this.app.plugins.plugins["editing-toolbar"];
        if (!plugin || !plugin.settings) return;
        this.settings.btnBg.forEach((c, i) => (plugin.settings[`custom_bg${i + 1}`] = c));
        this.settings.btnFg.forEach((c, i) => (plugin.settings[`custom_fc${i + 1}`] = c));
        if (typeof plugin.saveSettings === "function") plugin.saveSettings();
    }

    // ── панель ───────────────────────────────────────────────────────
    toggle() {
        if (this.el) this.closePanel();
        else this.openPanel();
    }

    openPanel() {
        if (this.el) return;
        let style = document.getElementById("marker-panel-style");
        if (!style) {
            style = document.createElement("style");
            style.id = "marker-panel-style";
            document.head.appendChild(style);
        }
        // обновляем всегда: правки CSS должны применяться без перезапуска
        if (style.textContent !== STYLE) style.textContent = STYLE;
        this.el = document.body.createDiv({ attr: { id: PANEL_ID } });
        this.el.style.top = `${this.settings.pos.top}px`;
        this.el.style.right = `${this.settings.pos.right}px`;
        this.render();
        this.makeDraggable();
    }

    closePanel() {
        if (this.el) {
            this.el.remove();
            this.el = null;
        }
    }

    makeDraggable() {
        const head = this.el.querySelector(".mp-head");
        let start = null;
        head.addEventListener("mousedown", (ev) => {
            if (ev.target.closest("button")) return;
            const rect = this.el.getBoundingClientRect();
            start = { x: ev.clientX, y: ev.clientY, top: rect.top, left: rect.left };
            ev.preventDefault();
        });
        const move = (ev) => {
            if (!start) return;
            const top = Math.max(0, start.top + ev.clientY - start.y);
            const left = Math.max(0, start.left + ev.clientX - start.x);
            this.el.style.top = `${top}px`;
            this.el.style.left = `${left}px`;
            this.el.style.right = "auto";
        };
        const up = () => {
            if (!start) return;
            const rect = this.el.getBoundingClientRect();
            this.settings.pos = { top: Math.round(rect.top), right: Math.round(window.innerWidth - rect.right) };
            this.save();
            start = null;
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        this.register(() => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        });
    }

    render() {
        if (!this.el) return;
        const s = this.settings;
        this.el.empty();

        const head = this.el.createDiv({ cls: "mp-head" });
        head.createSpan({ cls: "mp-title", text: "🎨 Маркер" });
        const headBtns = head.createDiv({ cls: "mp-row" });
        const collapse = headBtns.createEl("button", { text: s.collapsed ? "▸" : "—" });
        collapse.onclick = () => {
            s.collapsed = !s.collapsed;
            this.save();
            this.render();
        };
        const close = headBtns.createEl("button", { text: "✕" });
        close.onclick = () => this.closePanel();

        const body = this.el.createDiv({ cls: "mp-body" + (s.collapsed ? " mp-hidden" : "") });

        // цвета
        body.createDiv({ cls: "mp-label", text: "Цвет выделения" });
        const grid = body.createDiv({ cls: "mp-grid" });
        for (const [id, name, hex] of COLORS) {
            const sw = grid.createDiv({ cls: "mp-sw" });
            const color = s.colors[id] || hex;
            sw.style.background = color;
            sw.title = `${name} — нажми, чтобы выделить`;
            sw.onclick = () => this.applyPreset(id);
        }

        const rowCustom = body.createDiv({ cls: "mp-row" });
        const customInput = rowCustom.createEl("input", { type: "color" });
        customInput.value = s.custom;
        customInput.onchange = () => {
            s.custom = customInput.value;
            this.save();
        };
        const applyCustom = rowCustom.createEl("button", { cls: "mp-btn", text: "Свой цвет" });
        applyCustom.onclick = () => this.applyCustom();

        // редактор цветов пресетов
        const editToggle = body.createDiv({ cls: "mp-row" });
        const editBtn = editToggle.createEl("button", { cls: "mp-btn", text: "Цвета пресетов" });
        editBtn.onclick = () => {
            const box = this.el.querySelector(".mp-presets");
            if (box) box.remove();
            else this.renderColorEditor(body);
        };
        const btnColorsBtn = editToggle.createEl("button", { cls: "mp-btn", text: "Цвета кнопок панели" });
        btnColorsBtn.onclick = () => {
            const box = this.el.querySelector(".mp-btncolors");
            if (box) box.remove();
            else this.renderButtonColors(body);
        };

        // форма
        body.createDiv({ cls: "mp-sep" });
        body.createDiv({ cls: "mp-label", text: "Форма мазка" });
        const shapes = body.createDiv({ cls: "mp-shapes" });
        for (const [value, title] of SHAPES) {
            const btn = shapes.createEl("button", { cls: "mp-shape mp-btn", text: title });
            if (s.shape === value) btn.classList.add("is-on");
            btn.onclick = () => {
                s.shape = value;
                this.applyAll();
                this.save();
                this.render();
            };
        }

        // ползунки
        const slider = (label, value, min, max, onChange) => {
            const row = body.createDiv({ cls: "mp-slider" });
            row.createSpan({ text: label });
            const input = row.createEl("input", { type: "range" });
            input.min = String(min);
            input.max = String(max);
            input.value = String(value);
            const out = row.createSpan({ cls: "mp-val", text: `${value}%` });
            input.oninput = () => {
                out.textContent = `${input.value}%`;
                onChange(Number(input.value));
                this.applyAll();
            };
            input.onchange = () => this.save();
        };
        slider("Плотность", s.density, 5, 100, (v) => (s.density = v));
        slider("Высота", s.padY, 0, 40, (v) => (s.padY = v));
        slider("Ширина", s.padX, 0, 80, (v) => (s.padX = v));

        // горячие клавиши
        body.createDiv({ cls: "mp-sep" });
        body.createDiv({ cls: "mp-label", text: "Горячие клавиши" });

        const hotkeyBlock = (title, cmd, key) => {
            const box = body.createDiv({ cls: "mp-hkblock" });
            box.createDiv({ cls: "mp-hkname", text: title });
            const row = box.createDiv({ cls: "mp-row" });
            const hint = row.createSpan({ cls: "mp-hk", text: this.hotkeyLabel(cmd, key) });
            const bind = row.createEl("button", { cls: "mp-btn", text: "Назначить" });
            bind.onclick = () => this.assignHotkey(cmd, key, hint);
            const drop = row.createEl("button", { cls: "mp-btn", text: "Сброс" });
            drop.onclick = () => this.resetHotkey(cmd, key);
            return box;
        };
        hotkeyBlock("Панель «Маркер» (показать/скрыть)", this.panelCmd(), "hkPanel");
        hotkeyBlock("Панель форматирования (показать/скрыть)", TOOLBAR_CMD, "hk");

        // панель форматирования
        body.createDiv({ cls: "mp-sep" });
        body.createDiv({ cls: "mp-label", text: "Панель форматирования" });
        const toolbarRow = body.createDiv({ cls: "mp-row" });
        const toolbarBtn = toolbarRow.createEl("button", { cls: "mp-btn", text: "Скрыть/показать панель" });
        toolbarBtn.onclick = () => this.exec(TOOLBAR_CMD);

        const orderRow = body.createDiv({ cls: "mp-row" });
        const orderHint = orderRow.createEl("button", { cls: "mp-btn", text: "Сбросить порядок значков" });
        orderHint.onclick = () => this.resetToolbarOrder();
        orderRow.createSpan({
            cls: "mp-hint",
            text: "значки панели можно перетаскивать мышью",
        });
    }

    async resetToolbarOrder() {
        this.settings.order = { main: [], popover: [] };
        await this.save();
        const et = this.app.plugins.plugins["editing-toolbar"];
        if (et && typeof et.clearToolbarCache === "function") et.clearToolbarCache();
        dispatchEvent(new Event("editingToolbar-NewCommand"));
        new Notice("Порядок значков панели сброшен");
    }

    renderButtonColors(body) {
        const s = this.settings;
        const btnColors = body.createDiv({ cls: "mp-editor mp-btncolors" });
        const hint = btnColors.createDiv({ cls: "mp-hint", text: "цвета кнопок «Цвет шрифта» в панели" });
        for (let i = 0; i < 5; i++) {
            const row = btnColors.createDiv({ cls: "mp-editor-row" });
            row.createSpan({ text: `Цвет ${i + 1}` });
            const wrap = row.createDiv({ cls: "mp-row" });
            const fg = wrap.createEl("input", { type: "color" });
            fg.value = s.btnFg[i];
            fg.onchange = () => {
                s.btnFg[i] = fg.value;
                this.syncToolbarColors();
                this.save();
            };
        }
    }

    renderColorEditor(body) {
        const s = this.settings;
        const box = body.createDiv({ cls: "mp-editor mp-presets" });
        for (const [id, name, hex] of COLORS) {
            const row = box.createDiv({ cls: "mp-editor-row" });
            row.createSpan({ text: name });
            const input = row.createEl("input", { type: "color" });
            input.value = s.colors[id] || hex;
            input.oninput = () => {
                s.colors[id] = input.value;
                this.applyAll();
            };
            input.onchange = () => this.save();
        }
    }
};
