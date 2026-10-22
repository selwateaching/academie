/* Exporte les textes à enregistrer (après lexique de prononciation) : node tools/prepare_texts.js [en] > texts.json */
const path = require("path");
const EN = process.argv[2] === "en";
global.window = { LANG: EN ? "en" : "fr", EN: {} };
const J = f => path.join(__dirname, "..", "js", f + ".js");
["data", "quiz", "companions", "companions2", "themes", "rites", "lexique-data"].forEach(f => require(J(f)));
if (EN) ["content-1", "content-2", "content-3", "lex"].forEach(f => require(path.join(__dirname, "..", "js", "en", f + ".js")));
require(J("speech"));
const items = [].concat(window.CHAPTERS, window.COMPANIONS, window.THEMES, window.RITES), out = {};
for (const it of items) {
  const tr = EN && window.EN.items[it.id];
  const title = tr ? tr.t : it.title, sub = tr ? tr.s : it.sub, paras = tr ? tr.p : it.paras;
  out[it.id] = [title + ". " + sub + "."].concat(paras).map(window.SiraAudio.prepare);
}
out.lexique = {};
for (const e of window.LEXIQUE.list) {
  const tr = EN && window.EN.lex[e.k];
  const s = tr ? tr.s : e.s, t = tr ? tr.t : e.t;
  out.lexique[e.k] = window.SiraAudio.prepare(s || t.replace(/\s*\([^)]*\)/g, ""));
}
process.stdout.write(JSON.stringify(out));
