import { playerSVG } from "./player.js";
// Studio UI: project list, live preview (stage.html in an iframe), scene editor, voice, caption, render.
const $ = (s) => document.querySelector(s);
// On github.io there is no server: web/local-api.js puts an in-browser implementation on window.LOCAL_API.
const WEB = !!window.LOCAL_API;
const api = window.LOCAL_API || async function (url, opts = {}) {
  const r = await fetch(url, { ...opts, body: opts.body && !(opts.body instanceof Blob) ? JSON.stringify(opts.body) : opts.body });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || r.statusText);
  return j;
};
const toast = (t) => { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove("on"), 2200); };
window.toast = toast; // used by the Mac app after a download
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const busy = async (btn, fn) => { btn.disabled = true; try { await fn(); } catch (e) { toast("Chyba: " + e.message); console.error(e); } finally { btn.disabled = false; } };

let META, CAT = [], P = null, TL = null, playing = false, t0 = 0, tNow = 0, slide = 0;
const frame = $("#frame");
const post = (m) => frame.contentWindow.postMessage(m, "*");
const TYPE = { hook: "Háček", product: "Produkt", fact: "Fakt", quiz: "Kvíz", letters: "Písmena", poll: "Anketa", code: "Slevový kód", cta: "Výzva",
  cover: "Obálka", grid: "Mřížka", promo: "Promo", comment: "Komentáře",
  ghook: "Úvod", gclue: "Nápověda", gcount: "Odpočet", greveal: "Odhalení", gcover: "Obálka" };
let LIST = [], FILTER = "all";

/* tabs */
document.querySelectorAll("nav button").forEach((b) => b.onclick = () => {
  document.querySelectorAll("nav button").forEach((x) => x.classList.toggle("on", x === b));
  for (const t of ["dashboard", "projekty", "katalog", "nastaveni"]) $("#" + t).hidden = b.dataset.tab !== t;
  if (b.dataset.tab === "dashboard") drawDash();
  if (b.dataset.tab === "nastaveni") drawSettings();
  if (b.dataset.tab === "katalog") drawCatalog();
});

/* list */
const fmtDay = (d) => new Date(d + "T12:00").toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" });
const stOf = (p) => p.status === "posted" ? ["posted", "Zveřejněno"] : p.status === "ready" ? ["ready", "Připraveno"] : p.outputs ? ["done", "Vyrenderováno"] : ["", "Koncept"];
async function loadList() {
  LIST = await api("/api/projects");
  const q = ($("#search").value || "").trim().toLowerCase();
  const show = LIST.filter((p) => (!q || p.title.toLowerCase().includes(q)) &&
    (FILTER === "all" || p.kind === FILTER || (FILTER === "plan" && p.plan) || (FILTER === "done" && (p.outputs || p.status))));
  if (FILTER === "plan") show.sort((a, b) => a.plan.localeCompare(b.plan));
  $("#list").innerHTML = show.map((p) => `<li data-id="${p.id}" class="${P?.id === p.id ? "on" : ""}"><span class="k">${p.kind === "reel" ? "REEL" : "CAROUSEL"}${p.outputs ? " · ✓" : ""}</span>${p.plan ? `<span class="when">📅 ${fmtDay(p.plan)}</span>` : ""}
    ${esc(p.title)}<small>${new Date(p.updated).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })} · ${stOf(p)[1]}</small></li>`).join("") || `<li class="muted">${LIST.length ? "Nic neodpovídá." : "Zatím nic."}</li>`;
  $("#list").querySelectorAll("li[data-id]").forEach((li) => li.onclick = () => open(li.dataset.id));
  if (!$("#dashboard").hidden) drawDash();
}
$("#search").oninput = () => loadList();
document.querySelectorAll("#filters button").forEach((b) => b.onclick = () => { FILTER = b.dataset.f; document.querySelectorAll("#filters button").forEach((x) => x.classList.toggle("on", x === b)); loadList(); });
const goTab = (t) => document.querySelector(`nav [data-tab="${t}"]`).click();

async function open(id) { P = await api("/api/projects/" + id); stop(); slide = 0; tNow = 1; if ($("#projekty").hidden) goTab("projekty"); draw(); loadList(); }

/* new project picker */
let pick = null;
const usedPlayers = () => LIST.map((p) => p.player).filter(Boolean);
function openPicker(kind, preset = {}) {
  const T = kind === "reel" ? META.reels : META.carousels;
  pick = { kind, template: preset.template || Object.keys(T)[0], items: [], player: preset.player || "" };
  $("#pickTitle").textContent = kind === "reel" ? "Nový reel" : "Nový carousel";
  $("#pickPlan").value = preset.plan || "";
  const drawPick = () => {
    $("#pickList").innerHTML = Object.entries(T).map(([k, v]) => `<button data-t="${k}" class="${pick.template === k ? "on" : ""}">${esc(v.name)}<small>${esc(v.desc)}</small></button>`).join("");
    $("#pickList").querySelectorAll("button").forEach((x) => x.onclick = () => { pick.template = x.dataset.t; drawPick(); });
    const guess = pick.template === "uhodni-hrace", used = usedPlayers();
    $("#pickClubs").hidden = guess; $("#pickPlayers").hidden = !guess;
    $("#pickHint").textContent = guess ? "Hráč (bez výběru = náhodný, kterého jsi ještě nepoužil):" : "Kluby (nepovinné — jinak se vyberou náhodně):";
    $("#pickPlayers").innerHTML = [["", "🎲 Náhodný", "nepoužitý"], ...Object.entries(META.players).map(([k, v]) => [k, v.name, `#${v.num} · ${v.nation}${used.includes(k) ? " · použit" : ""}`]), ["custom", "✏️ Vlastní hráč", "vyplníš sám"]]
      .map(([k, n, d]) => `<button data-p="${k}" class="${pick.player === k ? "on" : ""} ${used.includes(k) ? "used" : ""}">${esc(n)}<small>${esc(d)}</small></button>`).join("");
    $("#pickPlayers").querySelectorAll("button").forEach((x) => x.onclick = () => { pick.player = x.dataset.p; drawPick(); });
    $("#pickClubs").innerHTML = CAT.filter((c) => c.type === "naramek").map((c) => `<button data-i="${c.id}" class="${pick.items.includes(c.id) ? "on" : ""}">${esc(c.code)} · ${esc(c.short)}</button>`).join("");
    $("#pickClubs").querySelectorAll("button").forEach((x) => x.onclick = () => {
      const i = pick.items.indexOf(x.dataset.i); i >= 0 ? pick.items.splice(i, 1) : pick.items.push(x.dataset.i); drawPick(); });
    $("#pickWordRow").hidden = pick.template !== "vlastni";
  };
  drawPick();
  $("#picker").showModal();
}
async function createProject(body, plan) {
  let x = await api("/api/projects", { method: "POST", body: { ...body, used: usedPlayers() } });
  if (plan) x = await api("/api/projects/" + x.id, { method: "PUT", body: { plan } });
  return x;
}
document.querySelectorAll("[data-new]").forEach((b) => b.onclick = () => openPicker(b.dataset.new));
$("#pickCancel").onclick = () => $("#picker").close();
$("#pickGo").onclick = () => busy($("#pickGo"), async () => {
  P = await createProject({ ...pick, word: $("#pickWord").value }, $("#pickPlan").value);
  $("#picker").close(); slide = 0; tNow = 1; goTab("projekty"); draw(); loadList();
});

/* editor */
const fields = (s, i) => {
  const isReel = P.kind === "reel";
  const opt = (sel) => `<option value="">—</option>` + CAT.map((c) => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${esc(c.code ? c.code + " · " : "")}${esc(c.short || c.name)}</option>`).join("");
  return `<div class="item" data-i="${i}">
    <div class="top">${i + 1}. ${TYPE[s.type] || s.type}${s.num ? " " + s.num : ""}<span>${isReel && P.spec.scenes.length > 2 ? `<button data-act="up" title="Nahoru">↑</button><button data-act="rm" title="Odebrat">✕</button>` : ""}</span></div>
    ${s.text !== undefined ? `<label>Text na obrazovce (*slovo* = červeně)<input data-k="text" value="${esc(s.text)}"></label>` : ""}
    ${s.sub !== undefined ? `<label>Podtitulek<input data-k="sub" value="${esc(s.sub)}"></label>` : ""}
    ${s.bubble !== undefined ? `<label>Bublina maskota<input data-k="bubble" value="${esc(s.bubble)}"></label>` : ""}
    ${isReel ? `<div class="two"><label>Hlas říká<input data-k="say" value="${esc(s.say || "")}"></label><label>Délka (s)<input data-k="dur" type="number" step="0.1" value="${s.dur || 2}"></label></div>` : ""}
    ${s.item !== undefined ? `<label>Produkt<select data-k="item">${opt(s.item)}</select></label>` : ""}
    ${s.type === "greveal" && P.spec.player ? `<div class="three"><label>Číslo dresu<input data-pk="num" value="${esc(P.spec.player.num)}"></label>
      <label>Barva dresu<input data-pk="c0" type="color" value="${esc(P.spec.player.colors?.[0] || "#E30613")}"></label>
      <label>Barva lemu<input data-pk="c1" type="color" value="${esc(P.spec.player.colors?.[1] || "#FFFFFF")}"></label></div>` : ""}
  </div>`;
};

function draw() {
  $("#empty").hidden = !!P; $("#editor").hidden = !P; $("#frameWrap").hidden = !P;
  if (!P) return;
  const reel = P.kind === "reel";
  $("#title").value = P.title;
  $("#plan").value = P.plan || ""; $("#status").value = P.status || "";
  $("#rebuild").textContent = P.template === "uhodni-hrace" ? "↻ Jiný hráč" : "↻ Jiné kluby";
  const list = reel ? P.spec.scenes : P.spec.slides;
  $("#items").innerHTML = list.map(fields).join("");
  $("#items").querySelectorAll(".item").forEach((el) => {
    const i = +el.dataset.i;
    el.querySelectorAll("[data-k]").forEach((inp) => inp.oninput = () => {
      const k = inp.dataset.k; list[i][k] = k === "dur" ? Number(inp.value) : inp.value;
      if (k === "item") { // a new product brings its own code / club / spoken name
        const c = CAT.find((x) => x.id === inp.value);
        if (c && ["product", "quiz"].includes(list[i].type)) {
          Object.assign(list[i], { text: c.code || c.name, sub: c.club || c.name });
          if (P.kind === "reel") list[i].say = list[i].type === "quiz" ? list[i].say : (c.short || c.name) + ".";
          save(true); draw(); return;
        }
      }
      save(); refresh();
    });
    el.querySelectorAll("[data-pk]").forEach((inp) => inp.oninput = () => {
      const pl = P.spec.player, k = inp.dataset.pk;
      if (k === "num") pl.num = inp.value.replace(/\D/g, "").slice(0, 2);
      else { pl.colors = [...(pl.colors || ["#E30613", "#FFFFFF"])]; pl.colors[k === "c0" ? 0 : 1] = inp.value; }
      save(); refresh();
    });
    el.querySelectorAll("[data-act]").forEach((b) => b.onclick = () => {
      if (b.dataset.act === "rm") list.splice(i, 1);
      if (b.dataset.act === "up" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      save(true); draw();
    });
  });
  document.querySelectorAll(".reelOnly").forEach((e) => (e.hidden = !reel));
  $("#mOn").checked = P.spec.mascot?.on !== false; $("#mBubble").checked = !!P.spec.mascot?.bubble; $("#sound").checked = P.spec.sound !== "none";
  $("#frameWrap").classList.toggle("slide", !reel);
  $("#controls").hidden = !reel; $("#slideNav").hidden = reel;
  if (reel) {
    const v = P.voice;
    $("#voiceState").innerHTML = v ? `Hlas: <b>${({ say: "náhledový (Zuzana)", gemini: "AI — Puck (Gemini)", piper: "AI — Jirka (Piper)" })[v.kind] || "nahraný"}</b>, ${v.duration.toFixed(1)} s.` +
      (P.voiceStale ? ` <span class="warn">Text se od namluvení změnil — vytvoř hlas znovu.</span>` : "") : "Bez hlasu — délky scén podle čísel, maskot mluví v bublině.";
    $("#script").textContent = P.spec.scenes.map((s) => s.say).filter(Boolean).join("\n");
    $("#audio").src = v ? v.url || `/projects/${P.id}/${v.file}?${v.duration}` : "";
  } else {
    $("#slideNav").innerHTML = list.map((_, i) => `<button class="${i === slide ? "on" : ""}">${i + 1}</button>`).join("");
    $("#slideNav").querySelectorAll("button").forEach((b, i) => b.onclick = () => { slide = i; post({ cmd: "slide", i }); draw(); });
  }
  $("#capText").value = P.caption.text; $("#capTags").value = P.caption.hashtags.join(" ");
  drawOutputs(P.outputs);
  refresh();
}

let saveT;
function save(now) {
  clearTimeout(saveT);
  const go = async () => { const x = await api("/api/projects/" + P.id, { method: "PUT", body: { spec: P.spec, caption: P.caption, title: P.title } }); P.voiceStale = x.voiceStale; if (P.kind === "reel") $("#voiceState").querySelector(".warn") || (x.voiceStale && draw()); };
  now ? go() : (saveT = setTimeout(go, 500));
}
let refT;
function refresh() {
  clearTimeout(refT);
  refT = setTimeout(() => {
    if (P.kind === "reel") post({ cmd: "reel", spec: P.spec, catalog: CAT, voice: P.voiceStale ? null : P.voice, t: tNow });
    else post({ cmd: "slides", spec: P.spec, catalog: CAT, i: slide });
  }, 120);
}
window.addEventListener("message", (e) => { if (e.data?.cmd === "tl") { TL = e.data.tl; tNow = Math.min(tNow, TL.total); showTime(); } });

$("#title").oninput = () => { P.title = $("#title").value; save(); };
$("#plan").onchange = async () => { P.plan = $("#plan").value || null; await api("/api/projects/" + P.id, { method: "PUT", body: { plan: P.plan } }); loadList(); toast(P.plan ? "Naplánováno na " + fmtDay(P.plan) : "Bez termínu"); };
$("#status").onchange = async () => { P.status = $("#status").value || null; await api("/api/projects/" + P.id, { method: "PUT", body: { status: P.status } }); loadList(); };
$("#dup").onclick = () => busy($("#dup"), async () => { P = await api(`/api/projects/${P.id}/duplicate`, { method: "POST" }); draw(); loadList(); toast("Zkopírováno"); });
$("#mOn").onchange = () => { P.spec.mascot = { ...P.spec.mascot, on: $("#mOn").checked }; save(); refresh(); };
$("#mBubble").onchange = () => { P.spec.mascot = { ...P.spec.mascot, bubble: $("#mBubble").checked }; save(); refresh(); };
$("#sound").onchange = () => { P.spec.sound = $("#sound").checked ? "hits" : "none"; save(); };
$("#rebuild").onclick = () => busy($("#rebuild"), async () => { P = await api(`/api/projects/${P.id}/rebuild`, { method: "POST", body: { used: usedPlayers() } }); draw(); loadList(); });
$("#del").onclick = async () => { if (!confirm("Smazat projekt „" + P.title + "“ i s vyrenderovanými soubory?")) return; await api("/api/projects/" + P.id, { method: "DELETE" }); P = null; draw(); loadList(); };

/* playback */
const showTime = () => { $("#time").textContent = tNow.toFixed(1) + " s"; if (TL) $("#scrub").value = Math.round((tNow / TL.total) * 1000); };
function stop() { playing = false; $("#play").textContent = "▶ Přehrát"; $("#audio").pause(); }
$("#play").onclick = () => {
  if (playing) return stop();
  if (!TL) return;
  if (tNow >= TL.total - 0.05) tNow = 0;
  playing = true; $("#play").textContent = "❚❚ Pauza"; t0 = performance.now() - tNow * 1000;
  const a = $("#audio"), v = P.voiceStale ? null : P.voice;
  const tick = () => {
    if (!playing) return;
    tNow = (performance.now() - t0) / 1000;
    if (v && a.src) { const at = tNow - (v.at ?? 0.25); if (at >= 0 && a.paused) { a.currentTime = at; a.play(); } }
    if (tNow >= TL.total) { tNow = TL.total; stop(); }
    post({ cmd: "at", t: tNow }); showTime();
    requestAnimationFrame(tick);
  };
  tick();
};
$("#scrub").oninput = () => { stop(); if (!TL) return; tNow = ($("#scrub").value / 1000) * TL.total; post({ cmd: "at", t: tNow }); showTime(); };

/* voice */
$("#tts").onclick = () => busy($("#tts"), async () => { P = await api(`/api/projects/${P.id}/voice/tts`, { method: "POST" }); stop(); tNow = 0; draw(); toast("Realistický hlas hotový"); });
$("#say").onclick = () => busy($("#say"), async () => { P = await api(`/api/projects/${P.id}/voice/say`, { method: "POST" }); stop(); tNow = 0; draw(); toast("Náhledový hlas hotový"); });
$("#voiceFile").onchange = () => busy($("#say"), async () => {
  const f = $("#voiceFile").files[0]; if (!f) return;
  toast(WEB ? "Zarovnávám hlas k textu…" : "Zarovnávám hlas k textu (whisper)…");
  P = await api(`/api/projects/${P.id}/voice/upload?ext=${f.name.split(".").pop()}`, { method: "POST", body: f });
  $("#voiceFile").value = ""; stop(); tNow = 0; draw(); toast("Hlas nahraný a zarovnaný");
});
$("#voiceDel").onclick = () => busy($("#voiceDel"), async () => { P = await api(`/api/projects/${P.id}/voice`, { method: "DELETE" }); draw(); });
$("#copyScript").onclick = () => { navigator.clipboard.writeText($("#script").textContent); toast("Text zkopírován"); };

/* caption */
$("#capText").oninput = () => { P.caption.text = $("#capText").value; save(); };
$("#capTags").oninput = () => { P.caption.hashtags = $("#capTags").value.split(/\s+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : "#" + t)); save(); };
$("#capNext").onclick = () => busy($("#capNext"), async () => { P = await api(`/api/projects/${P.id}/caption`, { method: "POST", body: {} }); $("#capText").value = P.caption.text; $("#capTags").value = P.caption.hashtags.join(" "); });
$("#capAi").onclick = () => busy($("#capAi"), async () => { toast("Gemma4 píše… (chvilku to trvá)"); P = await api(`/api/projects/${P.id}/caption`, { method: "POST", body: { ai: true } }); $("#capText").value = P.caption.text; });
$("#capCopy").onclick = () => { navigator.clipboard.writeText(`${$("#capText").value}\n\n${$("#capTags").value}`); toast("Popisek zkopírován"); };

/* render */
function drawOutputs(o) {
  const el = $("#outputs");
  if (!o) { el.innerHTML = ""; return; }
  const q = WEB ? "" : "?" + o.at; // blob: URLs take no query string
  el.innerHTML = o.video
    ? `<video src="${o.video}${q}" controls playsinline></video><div class="row"><a class="pill small" href="${o.video}${q}" download="${P.id}.mp4">Stáhnout MP4</a><a class="pill small" href="${o.cover}${q}" download>Obálka JPG</a><a class="pill small" href="${o.caption}${q}" target="_blank">popisek.txt</a></div>`
    : `<div class="slides">${o.slides.map((s) => `<a href="${s}${q}" target="_blank"><img src="${s}${q}"></a>`).join("")}</div><div class="row"><a class="pill small" href="${o.zip}${q}" download="${P.id}.zip">Stáhnout ZIP (${o.slides.length} slidů)</a><a class="pill small" href="${o.caption}${q}" target="_blank">popisek.txt</a></div>`;
}
$("#render").onclick = () => busy($("#render"), async () => {
  clearTimeout(saveT);
  await api("/api/projects/" + P.id, { method: "PUT", body: { spec: P.spec, caption: P.caption, title: P.title } });
  const id = P.id;
  let job = await api(`/api/projects/${id}/render`, { method: "POST" });
  $("#progress").hidden = false;
  while (!["hotovo", "chyba"].includes(job.state)) {
    await new Promise((r) => setTimeout(r, 700));
    job = await api("/api/jobs/" + job.id);
    $("#progress div").style.width = Math.round(job.progress * 100) + "%";
  }
  $("#progress").hidden = true;
  if (job.state === "chyba") throw new Error(job.error);
  if (P?.id === id) { P.outputs = job.outputs; drawOutputs(job.outputs); }
  toast("Hotovo ✓"); loadList();
});

/* catalog */
function drawCatalog() {
  $("#catInfo").textContent = `${CAT.length} produktů` + (window.CATU ? ` · načteno ${new Date(window.CATU).toLocaleString("cs-CZ")}` : "");
  $("#catGrid").innerHTML = CAT.map((c) => `<div class="card"><div class="ph" style="background-image:url('${c.image}')"></div>
    <div class="b"><span class="sw" style="background:${c.color}"></span><b>${esc(c.code || "")}</b><div>${esc(c.club || c.name)}</div><small class="muted">${c.price ? c.price + " Kč" : ""} · ${c.source === "upload" ? "vlastní" : "e-shop"}</small></div></div>`).join("");
}
async function loadCat() { const c = await api("/api/catalog"); CAT = c.items; window.CATU = c.updated; }
$("#catRefresh").onclick = () => busy($("#catRefresh"), async () => { const c = await api("/api/catalog/refresh", { method: "POST" }); CAT = c.items; window.CATU = c.updated; drawCatalog(); toast("Katalog aktualizován"); });
$("#catFile").onchange = () => busy($("#catRefresh"), async () => {
  const f = $("#catFile").files[0]; if (!f) return;
  const name = prompt("Název produktu (např. Tričko Toxickej):", f.name.replace(/\.[^.]+$/, "")); if (!name) return;
  const price = prompt("Cena v Kč (nepovinné):", "");
  const c = await api(`/api/catalog/upload?ext=${f.name.split(".").pop()}&name=${encodeURIComponent(name)}&price=${encodeURIComponent(price || "")}&type=tricko`, { method: "POST", body: f });
  CAT = c.items; drawCatalog(); $("#catFile").value = ""; toast("Přidáno do katalogu");
});

if (WEB) { // no macOS voice, Ollama or live e-shop feed in the browser
  for (const id of ["#say", "#capAi", "#catRefresh"]) $(id).hidden = true;
  document.body.classList.add("web");
}
let started = false;
const start = async () => {
  if (started) return; started = true;
  META = await api("/api/meta");
  await loadCat();
  await loadList();
  drawDash();
};
// the stage iframe may finish loading before this module runs (always on the static build)
if (frame.contentWindow?.ready) start(); else frame.addEventListener("load", start);

/* settings (web only): Gemini key + voice live in this browser's localStorage */
const LS = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
  set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} } };
const KEYS = { key: "offside-gemini-key", voice: "offside-gemini-voice" };
const mask = (k) => k.length > 10 ? k.slice(0, 4) + "…" + k.slice(-4) : "••••";
function drawSettings() {
  const k = LS.get(KEYS.key);
  $("#keyState").innerHTML = k ? `Klíč je uložený: <b>${esc(mask(k))}</b>` : `Klíč zatím není nastavený — bez něj tlačítko „Realistický hlas (AI)“ nefunguje.`;
  $("#keyInput").value = k; $("#keyInput").type = "password"; $("#keyShow").textContent = "Zobrazit";
  $("#voiceName").value = LS.get(KEYS.voice) || "Puck";
}
if (WEB) {
  $("#tabSettings").hidden = false;
  $("#voiceHint").innerHTML = `Realistický hlas namluví Gemini (výchozí Puck, jako v Project Two). Klíč a hlas nastavíš v <button class="voiceSet" id="goSettings">⚙ Nastavení</button>. Nebo nahraj vlastní nahrávku přes „Nahrát hlas…“.`;
  $("#goSettings").onclick = () => $("#tabSettings").click();
  $("#setBack").onclick = () => document.querySelector('nav [data-tab="projekty"]').click();
  $("#asideSettings").hidden = false; $("#asideSettings").onclick = () => $("#tabSettings").click();
  $("#keyShow").onclick = () => { const i = $("#keyInput"), show = i.type === "password"; i.type = show ? "text" : "password"; $("#keyShow").textContent = show ? "Skrýt" : "Zobrazit"; };
  $("#keySave").onclick = () => {
    const k = $("#keyInput").value.trim();
    LS.set(KEYS.key, k); LS.set(KEYS.voice, $("#voiceName").value);
    drawSettings(); toast(k ? "Uloženo" : "Klíč odebrán");
  };
  $("#voiceName").onchange = () => { LS.set(KEYS.voice, $("#voiceName").value); toast("Hlas: " + $("#voiceName").value); };
  $("#keyDel").onclick = () => { LS.set(KEYS.key, ""); drawSettings(); toast("Klíč odebrán"); };
  $("#keyTest").onclick = () => busy($("#keyTest"), async () => {
    const k = $("#keyInput").value.trim();
    if (!k) throw new Error("Nejdřív vlož klíč");
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", { headers: { "x-goog-api-key": k } });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error("Klíč nefunguje: " + (j.error?.message || r.status)); }
    toast("Klíč funguje ✓");
  });
}

/* ───────── dashboard ───────── */
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const days7 = () => [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return iso(d); });
const TPL = () => [...Object.entries(META.reels).map(([k, v]) => ["reel", k, v]), ...Object.entries(META.carousels).map(([k, v]) => ["carousel", k, v])];
function drawDash() {
  if (!META) return;
  const today = iso(new Date()), week = days7();
  $("#dToday").textContent = new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const n = (f) => LIST.filter(f).length;
  const planned = n((p) => p.plan && p.plan >= today && p.plan <= week[6]);
  const used = new Set(usedPlayers()), total = Object.keys(META.players).length;
  const kpi = (v, l, bar) => `<div class="kpi"><b>${v}</b><span>${l}</span>${bar != null ? `<div class="bar"><i style="width:${Math.round(bar * 100)}%"></i></div>` : ""}</div>`;
  $("#dKpis").innerHTML = kpi(LIST.length, "projektů celkem") + kpi(n((p) => p.kind === "reel"), "reelů") + kpi(n((p) => p.kind === "carousel"), "carouselů") +
    kpi(n((p) => p.outputs), "vyrenderováno", LIST.length ? n((p) => p.outputs) / LIST.length : 0) + kpi(`${planned}/5`, "naplánováno na 7 dní", Math.min(1, planned / 5)) +
    kpi(n((p) => p.status === "posted"), "zveřejněno") + kpi(`${used.size}/${total}`, "hráčů v sérii", used.size / total);
  // week
  $("#dPlan").innerHTML = week.map((d) => {
    const items = LIST.filter((p) => p.plan === d);
    return `<div class="day ${d === today ? "today" : ""}"><h4>${new Date(d + "T12:00").toLocaleDateString("cs-CZ", { weekday: "short" })}<small>${new Date(d + "T12:00").toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}</small></h4>
      ${items.map((p) => `<div class="pj" data-id="${p.id}"><span class="k">${p.kind === "reel" ? "REEL" : "CAROUSEL"}</span>${esc(p.title)}<br><span class="st ${stOf(p)[0]}">${stOf(p)[1]}</span></div>`).join("")}
      <button class="add" data-d="${d}">+ přidat</button></div>`;
  }).join("");
  $("#dPlan").querySelectorAll(".add").forEach((b) => b.onclick = () => openPicker("reel", { plan: b.dataset.d }));
  // players
  $("#dSeries").textContent = `${used.size} z ${total} použito · klikni a vytvoř reel`;
  $("#dPlayers").innerHTML = Object.entries(META.players).map(([k, v]) => `<div class="pl ${used.has(k) ? "used" : ""}" data-p="${k}" title="${used.has(k) ? "Už jsi použil — klikni pro další video" : "Vytvořit reel"}">
    <div class="av">${playerSVG({ jersey: v.colors[0], trim: v.colors[1], num: v.num, mystery: !used.has(k) })}</div>${used.has(k) ? esc(v.name) : "???"}<small>${used.has(k) ? "✓ použit" : `#${v.num} · ${v.nation}`}</small></div>`).join("");
  $("#dPlayers").querySelectorAll(".pl").forEach((el) => el.onclick = () => busy(el, async () => {
    P = await createProject({ kind: "reel", template: "uhodni-hrace", player: el.dataset.p }); goTab("projekty"); slide = 0; tNow = 1; draw(); loadList(); toast("Reel vytvořen");
  }));
  // recent
  $("#dRecent").innerHTML = LIST.slice(0, 7).map((p) => `<div class="pj" data-id="${p.id}"><span><span class="k">${p.kind === "reel" ? "REEL" : "CAROUSEL"}${p.plan ? " · 📅 " + fmtDay(p.plan) : ""}</span>${esc(p.title)}</span><span class="st ${stOf(p)[0]}">${stOf(p)[1]}</span></div>`).join("") || `<p class="muted">Zatím žádné projekty. Začni třeba „Uhodni hráče“ nebo naplánuj celý týden.</p>`;
  document.querySelectorAll("#dashboard .pj[data-id]").forEach((el) => el.onclick = () => open(el.dataset.id));
  // templates
  $("#dTpls").innerHTML = TPL().map(([kind, k, v]) => `<button class="tpl" data-kind="${kind}" data-t="${k}"><span class="k">${kind === "reel" ? "REEL" : "CAROUSEL"}</span>${esc(v.name)}<small>${esc(v.desc)}</small></button>`).join("");
  $("#dTpls").querySelectorAll(".tpl").forEach((b) => b.onclick = () => openPicker(b.dataset.kind, { template: b.dataset.t }));
}
$("#dGuess").onclick = () => openPicker("reel", { template: "uhodni-hrace" });
// one click: a balanced week of content on the free days (3 reels + 2 carousels, two of them "Uhodni hráče")
const WEEK_MIX = [["reel", "uhodni-hrace"], ["carousel", "nejsou-pro-kazdeho"], ["reel", "poznas-klub"], ["carousel", "uhodni-hrace"], ["reel", "nos-klub"]];
$("#dWeek").onclick = () => busy($("#dWeek"), async () => {
  const week = days7(), busyDays = new Set(LIST.map((p) => p.plan));
  const free = [1, 2, 3, 4, 5, 6, 0].map((i) => week[i]).filter((d) => d && !busyDays.has(d)).slice(0, 5);
  if (!free.length) return toast("Celý týden už je naplánovaný");
  if (!confirm(`Vytvořit ${free.length} projektů na volné dny (${free.map(fmtDay).join(", ")})?`)) return;
  for (let i = 0; i < free.length; i++) {
    const [kind, template] = WEEK_MIX[i % WEEK_MIX.length];
    await createProject({ kind, template }, free[i]);
    await loadList();
  }
  toast(`Naplánováno ${free.length} příspěvků`);
});
