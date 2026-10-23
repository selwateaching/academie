/* Contrôle des exercices : node tests/check_ex.js [niveau]
 * Chaque compétence génère 300 questions ; on vérifie la forme (réponse numérique finie,
 * bonne réponse présente dans les choix, choix distincts, pas de NaN ni de « undefined »). */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console, Math, Date }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
['js/lang/fr.js', 'js/lang/ar.js', 'js/lang/ar-catalog.js', 'js/lang/ar-ui.js', 'js/generators.js', 'js/lang/fr2.js', 'js/lang/ar2.js', 'js/lang/ar-catalog2.js', 'js/generators2.js', 'js/catalog2.js', 'js/catalog.js']
  .forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const only = process.argv[2]; let bad = 0, n = 0;
const { GEN } = ctx.MathsGen;
for (const l of ctx.CATALOG.LEVELS) {
  if (only && l.id !== only) continue;
  for (const s of l.skillList) {
    if (!s.gen) continue;
    for (let i = 0; i < 300; i++) {
      let q; try { q = GEN[s.gen](s.params); } catch (e) { console.log('✗', s.id, s.title, e.message); bad++; break; }
      const blob = JSON.stringify([q.q, q.expr, q.exp, q.choices]);
      let err = '';
      if (/NaN|undefined|Infinity|\[\[/.test(blob)) err = 'NaN/undefined ' + blob.slice(0, 200);
      else if (q.kind === 'num' && !Number.isFinite(Number(q.ans))) err = 'réponse non numérique ' + q.ans;
      else if (q.kind === 'choice') {
        const vs = q.choices.map((c) => String(c.v)), ls = q.choices.map((c) => c.label);
        if (!vs.includes(String(q.ans))) err = 'bonne réponse absente ' + q.ans;
        else if (new Set(vs).size !== vs.length || new Set(ls).size !== ls.length) err = 'choix en double ' + vs.join('|');
        else if (vs.length < 2) err = 'moins de 2 choix';
      } else if (q.kind !== 'num') err = 'kind ' + q.kind;
      if (err) { console.log('✗', s.id, s.title, '—', err); bad++; break; }
      n++;
    }
  }
}
console.log(bad ? `${bad} compétence(s) en erreur` : `OK : ${n} questions contrôlées`); process.exit(bad ? 1 : 0);
