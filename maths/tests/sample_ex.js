/* Aperçu : node tests/sample_ex.js <niveau> [fr|ar] — une question par compétence, en texte. */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console, Math, Date }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
['js/lang/fr.js', 'js/lang/ar.js', 'js/lang/ar-catalog.js', 'js/lang/ar-ui.js', 'js/generators.js', 'js/lang/fr2.js', 'js/lang/ar2.js', 'js/lang/ar-catalog2.js', 'js/generators2.js', 'js/catalog2.js', 'js/catalog.js']
  .forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const lang = process.argv[3] || 'fr'; if (lang === 'ar') ctx.STRINGS = Object.assign({}, ctx.STRINGS, ctx.STRINGS_AR);
const strip = (h) => String(h == null ? '' : h).replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '($1/$2)').replace(/<svg.*?<\/svg>/g, '[figure]').replace(/<[^>]+>/g, '').replace(/⁦|⁩/g, '');
const lv = ctx.CATALOG.LEVELS.find((l) => l.id === process.argv[2]);
for (const s of lv.skillList) {
  if (!s.gen) { console.log(`${s.code} ${s.title} — (bientôt)`); continue; }
  const q = ctx.MathsGen.GEN[s.gen](s.params);
  console.log(`${s.code} ${s.title}\n   Q: ${strip(q.q)} ${strip(q.expr)} ${strip(q.vis)}\n   R: ${q.kind === 'choice' ? strip((q.choices.find((c) => String(c.v) === String(q.ans)) || {}).label) + '   [' + q.choices.map((c) => strip(c.label)).join(' | ') + ']' : q.ans}\n   E: ${strip(q.exp)}`);
}
