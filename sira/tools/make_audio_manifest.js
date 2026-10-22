/* Écrit js/audio-manifest.js : liste des pages dont tous les fichiers audio existent (audio/<id>/0..n.mp3). */
const fs = require("fs"), path = require("path");
const EN = process.argv[2] === "en"; /* node tools/make_audio_manifest.js [en] */
global.window = {};
["data", "quiz", "companions", "companions2", "themes", "rites", "lexique-data"].forEach(f => require(path.join(__dirname, "..", "js", f + ".js")));
const items = [].concat(window.CHAPTERS, window.COMPANIONS, window.THEMES, window.RITES);
const root = path.join(__dirname, "..", "audio", EN ? "en" : "");
const ids = items.filter(it => {
  for (let n = 0; n <= it.paras.length; n++) {
    const f = path.join(root, String(it.id), n + ".mp3");
    if (!fs.existsSync(f) || fs.statSync(f).size < 2000) return false;
  }
  return true;
}).map(it => it.id);
const terms = window.LEXIQUE.list.map(e => e.k).filter(k => { const f = path.join(root, "lexique", k + ".mp3"); return fs.existsSync(f) && fs.statSync(f).size > 1000; });
fs.writeFileSync(path.join(__dirname, "..", "js", EN ? "en/audio-manifest.js" : "audio-manifest.js"),
  "/* Généré par tools/make_audio_manifest.js : pages disposant d'une voix enregistrée. */\nwindow." + (EN ? "SIRA_AUDIO_EN" : "SIRA_AUDIO") + " = " + JSON.stringify({ version: 1, ids, terms }) + ";\n");
console.log(ids.length + " pages avec audio sur " + items.length + " ; " + terms.length + " mots du lexique");
