// Realistic voice in the browser: Gemini TTS ("Puck", same as AI Studio / Project Two reels) called
// straight from the page. Key and voice are set in the Nastavení tab (this browser's localStorage only).
// Each scene line is synthesized separately, silence trimmed, joined with short gaps → one WAV.
const KEY = "offside-gemini-key";
const SR = 24000, GAP = 0.3;

function apiKey() {
  let k = "";
  try { k = localStorage.getItem(KEY) || ""; } catch {}
  if (!k) throw new Error("Nejdřív vlož Gemini API klíč v záložce Nastavení");
  return k;
}
const voiceName = () => { try { return localStorage.getItem("offside-gemini-voice") || "Puck"; } catch { return "Puck"; } };

const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"];
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function call(model, text, key) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName() } } } },
    }),
  });
  const j = await r.json().catch(() => ({}));
  const msg = j.error?.message || "";
  if (/API key|PERMISSION|API_KEY/i.test(msg)) throw Object.assign(new Error("Gemini klíč nefunguje — zkontroluj ho v Nastavení"), { fatal: true });
  const c = j.candidates?.[0], b64 = c?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
  if (b64) {
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    return new Int16Array(bytes.buffer, 0, bytes.length >> 1);
  }
  const why = msg || (c?.finishReason ? "bez zvuku (" + c.finishReason + ")" : j.promptFeedback?.blockReason ? "zablokováno (" + j.promptFeedback.blockReason + ")" : "bez zvuku");
  throw Object.assign(new Error(`${model}: ${r.status} ${why}`), { status: r.status });
}

// Gemini TTS now and then answers 200 with no audio, or 429 on the free tier → retry with
// a plainer prompt, wait out rate limits, then fall back to the other TTS model.
async function speak(script, key, onStatus) {
  const styled = `Přečti česky, přirozeně a s energií, jako mladý moderátor Instagram reelu. Mezi řádky dělej krátkou pauzu.\n\n${script}`;
  const tries = [[MODELS[0], styled], [MODELS[0], script], [MODELS[0], styled], [MODELS[1], styled], [MODELS[1], script]];
  let last;
  for (const [i, [model, text]] of tries.entries()) {
    try { return await call(model, text, key); }
    catch (e) {
      if (e.fatal) throw e;
      last = e; console.warn("Gemini TTS", i + 1, e.message);
      if (e.status === 429) { onStatus?.("Gemini limit — čekám 30 s…"); await sleep(30000); }
      else await sleep(1500);
    }
  }
  throw new Error("Gemini hlas se nepovedl: " + last.message + (last.status === 429 ? " — bezplatný limit klíče je vyčerpaný, zkus to později" : ""));
}

function trim(pcm) {
  const thr = 32768 * 0.006; // ≈ −45 dB
  let a = 0, b = pcm.length - 1;
  while (a < b && Math.abs(pcm[a]) < thr) a++;
  while (b > a && Math.abs(pcm[b]) < thr) b--;
  return pcm.subarray(Math.max(0, a - 240), Math.min(pcm.length, b + 240));
}

function wav(chunks) {
  const n = chunks.reduce((s, c) => s + c.length, 0), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, n * 2, true);
  let o = 44; for (const c of chunks) for (const s of c) { v.setInt16(o, s, true); o += 2; }
  return new Blob([buf], { type: "audio/wav" });
}

// whole script in one request (natural flow, fewer failures); timings come from align.js
export async function geminiVoice(spec, onStatus) {
  const key = apiKey();
  const script = spec.scenes.map((s) => (s.say || "").trim()).filter(Boolean).join("\n");
  if (!script) throw new Error("Scény nemají žádný text pro hlas");
  const pcm = trim(await speak(script, key, onStatus));
  return { blob: wav([pcm]) };
}
