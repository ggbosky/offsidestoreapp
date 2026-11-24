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

async function line(text, key) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Řekni česky, přirozeně a s energií, jako mladý moderátor Instagram reelu: ${text}` }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName() } } } },
    }),
  });
  const j = await r.json().catch(() => ({}));
  const b64 = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
  if (/API key|PERMISSION/i.test(j.error?.message || "")) throw new Error("Gemini klíč nefunguje — zkontroluj ho v Nastavení");
  if (!r.ok || !b64) throw new Error("Gemini: " + (j.error?.message || r.status));
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Int16Array(bytes.buffer, 0, bytes.length >> 1);
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

// → { blob, words } with word timings from the exact per-scene durations
export async function geminiVoice(spec) {
  const key = apiKey();
  const chunks = [], words = [];
  let t = 0;
  for (const s of spec.scenes) {
    const text = (s.say || "").trim();
    if (!text) continue;
    const pcm = trim(await line(text, key));
    const speech = pcm.length / SR, ws = text.split(/\s+/).filter(Boolean), total = ws.reduce((a, w) => a + w.length, 0) || 1;
    let u = t;
    for (const w of ws) { const k = speech * w.length / total; words.push([+u.toFixed(2), +(u + k).toFixed(2), w]); u += k; }
    chunks.push(pcm, new Int16Array(Math.round(GAP * SR)));
    t += speech + GAP;
  }
  if (!chunks.length) throw new Error("Scény nemají žádný text pro hlas");
  return { blob: wav(chunks), words };
}
