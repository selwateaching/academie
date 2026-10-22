/* Exporte les textes à enregistrer (après lexique de prononciation) : node tools/prepare_texts.js > texts.json */
const path = require("path");
global.window = {};
["data", "quiz", "companions", "companions2", "themes", "rites", "speech"].forEach(f => require(path.join(__dirname, "..", "js", f + ".js")));
const items = [].concat(window.CHAPTERS, window.COMPANIONS, window.THEMES, window.RITES), out = {};
for (const it of items) out[it.id] = [it.title + ". " + it.sub + "."].concat(it.paras).map(window.SiraAudio.prepare);
process.stdout.write(JSON.stringify(out));
