(function () {
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = matchMedia("(hover: hover)").matches;

    function toast(msg) {
        const t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2600);
    }

    /* 1. Accent color switcher */
    function setAccent(a, b) {
        root.style.setProperty("--accent", a);
        root.style.setProperty("--accent-2", b);
    }
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("accent")); } catch (e) {}
    if (saved) setAccent(saved[0], saved[1]);
    document.querySelectorAll("#swatches button").forEach(btn => {
        btn.addEventListener("click", () => {
            saved = [btn.dataset.a, btn.dataset.b];
            setAccent(saved[0], saved[1]);
            try { localStorage.setItem("accent", JSON.stringify(saved)); } catch (e) {}
        });
    });

    /* 2. Network particles sa hero */
    const cv = document.getElementById("bgCanvas");
    if (cv && !reduce) {
        const c = cv.getContext("2d");
        const hero = cv.parentElement;
        let w, h, pts = [], mouse = null;
        const size = () => {
            w = cv.width = cv.offsetWidth;
            h = cv.height = cv.offsetHeight;
            const n = Math.round(Math.min(70, (w * h) / 20000));
            pts = Array.from({ length: n }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
            }));
        };
        size();
        addEventListener("resize", size);
        hero.addEventListener("mousemove", e => {
            const r = cv.getBoundingClientRect();
            mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
        });
        hero.addEventListener("mouseleave", () => (mouse = null));

        (function frame() {
            if (scrollY < innerHeight) {
                c.clearRect(0, 0, w, h);
                const col = getComputedStyle(root).getPropertyValue("--accent").trim();
                c.fillStyle = col;
                c.strokeStyle = col;
                pts.forEach(p => {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > w) p.vx *= -1;
                    if (p.y < 0 || p.y > h) p.vy *= -1;
                    c.globalAlpha = 0.7;
                    c.beginPath(); c.arc(p.x, p.y, 2, 0, 6.283); c.fill();
                });
                const line = (a, b, max, k) => {
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d > max) return;
                    c.globalAlpha = (1 - d / max) * k;
                    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
                };
                for (let i = 0; i < pts.length; i++) {
                    for (let j = i + 1; j < pts.length; j++) line(pts[i], pts[j], 130, 0.35);
                    if (mouse) line(pts[i], mouse, 170, 0.7);
                }
            }
            requestAnimationFrame(frame);
        })();
    }

    /* 3. Quick find (Ctrl+K) */
    const pal = document.getElementById("palette");
    const inp = document.getElementById("paletteInput");
    const list = document.getElementById("paletteList");
    let items = [], shown = [], active = 0;

    function build() {
        items = [...document.querySelectorAll("nav a[href^='#']")].map(a => ({
            label: a.textContent, group: "Section",
            run: () => { location.hash = a.getAttribute("href"); }
        }));
        document.querySelectorAll(".activity-card").forEach(card => {
            items.push({
                label: card.querySelector("h2").textContent,
                group: card.closest("section").querySelector("h1").textContent,
                run: () => card.querySelector(".design-button").click()
            });
        });
    }
    function render() {
        const q = inp.value.trim().toLowerCase();
        shown = items.filter(i => (i.label + " " + i.group).toLowerCase().includes(q));
        active = Math.min(active, Math.max(shown.length - 1, 0));
        list.innerHTML = shown.length
            ? shown.map((i, n) => `<li class="${n === active ? "on" : ""}" data-n="${n}"><span>${escapeHTML(i.label)}</span><em>${escapeHTML(i.group)}</em></li>`).join("")
            : `<li class="none">No results</li>`;
        const on = list.querySelector(".on");
        if (on) on.scrollIntoView({ block: "nearest" });
    }
    function openPalette() { build(); inp.value = ""; active = 0; render(); pal.style.display = "flex"; inp.focus(); }
    function closePalette() { pal.style.display = "none"; }
    function runItem(n) { const it = shown[n]; if (!it) return; closePalette(); it.run(); }

    inp.addEventListener("input", () => { active = 0; render(); });
    inp.addEventListener("keydown", e => {
        if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); render(); }
        if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
        if (e.key === "Enter") runItem(active);
        if (e.key === "Escape") closePalette();
    });
    list.addEventListener("click", e => {
        const li = e.target.closest("li[data-n]");
        if (li) runItem(Number(li.dataset.n));
    });
    pal.addEventListener("click", e => { if (e.target === pal) closePalette(); });
    document.getElementById("paletteBtn").addEventListener("click", openPalette);
    document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            pal.style.display === "flex" ? closePalette() : openPalette();
        }
    });

    /* 4. Stats na kusang nagbibilang ng cards */
    document.querySelectorAll("[data-count]").forEach(el => {
        const total = document.querySelectorAll(el.dataset.count + " .activity-card").length;
        const io = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            if (reduce) { el.textContent = total; return; }
            const start = performance.now();
            (function tick(now) {
                const k = Math.min((now - start) / 900, 1);
                el.textContent = Math.round(total * k);
                if (k < 1) requestAnimationFrame(tick);
            })(start);
        });
        io.observe(el);
    });

    /* 5. Spotlight at 3D tilt sa cards */
    if (canHover) {
        document.querySelectorAll(".activity-card").forEach(card => {
            card.addEventListener("mouseenter", () => { card.style.transition = "transform .1s, border-color .3s"; });
            card.addEventListener("mousemove", e => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                card.style.setProperty("--mx", x * 100 + "%");
                card.style.setProperty("--my", y * 100 + "%");
                if (!reduce) card.style.transform =
                    `perspective(800px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-6px)`;
            });
            card.addEventListener("mouseleave", () => { card.style.transform = ""; card.style.transition = ""; });
        });
    }

    /* 6. Hidden: Konami code */
    const seq = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    let pos = 0;
    document.addEventListener("keydown", e => {
        if (e.target.tagName === "INPUT") return;
        const k = e.key.toLowerCase();
        pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
        if (pos < seq.length) return;
        pos = 0;
        toast("Rainbow mode unlocked");
        let hue = 0;
        const t = setInterval(() => {
            hue = (hue + 6) % 360;
            setAccent(`hsl(${hue} 85% 58%)`, `hsl(${(hue + 60) % 360} 85% 58%)`);
        }, 50);
        setTimeout(() => {
            clearInterval(t);
            if (saved) setAccent(saved[0], saved[1]);
            else { root.style.removeProperty("--accent"); root.style.removeProperty("--accent-2"); }
        }, 6000);
    });
})();
