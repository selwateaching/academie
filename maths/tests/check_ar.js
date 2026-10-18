/* Contrôle de la version arabe : node tests/check_ar.js
 * - tout titre du catalogue et tout texte d'interface a une traduction ;
 * - ar.js a les mêmes clés que fr.js, avec les mêmes {variables} ;
 * - chaque compétence génère des questions sans texte manquant, dans les deux langues. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { console, Math, Date };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
['js/lang/fr.js', 'js/lang/ar.js', 'js/lang/ar-catalog.js', 'js/lang/ar-ui.js', 'js/generators.js', 'js/catalog.js'].forEach(load);

let bad = 0;
const fail = (m) => { bad++; console.log('✗', m); };
const vars = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
// la traduction peut omettre une variable, mais pas en inventer une que le code ne fournit pas
const extra = (fr, ar, ok = []) => { const have = new Set((String(fr).match(/\{\w+\}/g) || []).concat(ok)); return (String(ar).match(/\{\w+\}/g) || []).filter((v) => !have.has(v)); };

// 1. catalogue
const dict = Object.assign({}, ctx.AR_CATALOG, ctx.AR_UI);
const titles = new Set();
for (const l of ctx.CATALOG.LEVELS) {
  ['short', 'name', 'blurb', 'age'].forEach((k) => titles.add(l[k]));
  for (const d of l.domains) { titles.add(d.name); for (const c of d.cats) { titles.add(c.name); c.skills.forEach((s) => titles.add(s.title)); } }
}
titles.forEach((t) => { if (dict[t] === undefined) fail('catalogue sans traduction : ' + t); });

// 2. interface : T('…') dans app.js et data-t dans index.html
const src = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const used = new Set();
for (const m of src.matchAll(/\bT\(\s*(?:[^'`(),]*\?\s*)?'((?:[^'\\]|\\.)*)'(?:\s*:\s*'((?:[^'\\]|\\.)*)')?/g)) { used.add(m[1]); if (m[2]) used.add(m[2]); }
for (const m of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/data-t(?:-aria|-ph)?="([^"]+)"/g)) used.add(m[1]);
used.forEach((k) => {
  const key = k.replace(/\\'/g, "'");
  if (dict[key] === undefined) fail('interface sans traduction : ' + key);
  else if (extra(key, dict[key]).length) fail('variable inconnue : ' + key);
});
for (const k of Object.keys(ctx.AR_UI)) if (!used.has(k) && !used.has(k.replace(/'/g, "\\'"))) console.log('· clé inutilisée dans app.js (message du serveur ?) :', k.slice(0, 60));

// 3. moteur d'exercices
const FR = ctx.STRINGS, AR = ctx.STRINGS_AR;
for (const k of Object.keys(FR)) {
  if (AR[k] === undefined) { fail('ar.js : clé manquante ' + k); continue; }
  if (Array.isArray(FR[k])) { if (!Array.isArray(AR[k]) || AR[k].length !== FR[k].length) fail('ar.js : tableau de longueur différente ' + k); continue; }
  if (extra(FR[k], AR[k], k.startsWith('wp.') ? ['{P}', '{il}', '{Il}'] : []).length) fail(`ar.js : variable inconnue pour ${k} : ${vars(AR[k])}`);
}
for (const k of Object.keys(AR)) if (FR[k] === undefined) fail('ar.js : clé en trop ' + k);

// 4. génération
const { GEN } = ctx.MathsGen;
for (const lang of ['fr', 'ar']) {
  ctx.STRINGS = lang === 'ar' ? Object.assign({}, FR, AR) : FR;
  for (const l of ctx.CATALOG.LEVELS) for (const s of l.skillList) {
    if (!s.gen) continue;
    for (let i = 0; i < 150; i++) {
      let q;
      try { q = GEN[s.gen](s.params); } catch (e) { fail(`${lang} ${s.id} : ${e.message}`); break; }
      const blob = JSON.stringify([q.q, q.exp, q.choices, q.expr, q.vis]);
      if (blob.includes('[[')) { fail(`${lang} ${s.id} : texte manquant ${blob.match(/\[\[[^\]]*\]\]/)[0]}`); break; }
      if (lang === 'ar' && /[A-Za-zÀ-ÿ]{4,}/.test(String(q.q).replace(/<[^>]*>/g, '').replace(/&\w+;/g, ''))) { fail(`ar ${s.id} : mot latin dans la question : ${q.q.slice(0, 80)}`); break; }
    }
  }
}
console.log(bad ? `\n${bad} problème(s)` : 'OK : traductions complètes');
process.exit(bad ? 1 : 0);
