// usage: node tests/check_course_level.js <level>   (ex. gs, cp, 6e)
// Vérifie les cours d'un niveau : structure, figures, traduction arabe (balises identiques, légendes des schémas).
const fs = require('fs'), path = require('path');
const lv = process.argv[2]; if (!lv) { console.log('niveau ?'); process.exit(1); }
global.window = {};
const J = (p) => require(path.resolve(__dirname, '..', 'js', p));
J('courses.js');
const f = `courses-${lv}.js`; if (fs.existsSync(path.resolve(__dirname, '..', 'js', f))) J(f);
const arf = `lang/ar-courses-${lv}.js`; J('lang/ar-figs.js'); window.AR_COURSES = {};
if (fs.existsSync(path.resolve(__dirname, '..', 'js', arf))) J(arf);
const ar = window.AR_COURSES, figs = window.AR_FIGS, K = window.CourseKit;
const mine = window.COURSES.filter((c) => c.level === lv);
let bad = 0; const err = (m) => { bad++; console.log('ERREUR', m); };
const tags = (s) => (String(s).match(/<[^>]+>|&[a-z]+;/g) || []).join('|');
const AR = /[؀-ۿ]/;
const same = (id, a, b, what) => {
  if (typeof b !== 'string' || !b.trim()) return err(`${id} ${what} manquant`);
  if (tags(a) !== tags(b)) err(`${id} ${what} balises différentes : ${tags(a)} ≠ ${tags(b)}`);
  if (!AR.test(b) && /[A-Za-zéèêàçùô]{4,}/.test(b.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ''))) err(`${id} ${what} pas en arabe : ${b.slice(0, 40)}`);
  if (/\b(le|la|les|des|est|une|pour|dans)\b/.test(b.replace(/<[^>]+>/g, ''))) err(`${id} ${what} mot français : ${b.slice(0, 50)}`);
};
const seen = new Set();
for (const c of mine) {
  if (seen.has(c.id)) err(c.id + ' en double'); seen.add(c.id);
  if (!['maths', 'physique', 'chimie'].includes(c.subj)) err(c.id + ' matière');
  if (!c.title || !c.intro || !c.icon) err(c.id + ' titre/intro/icône');
  if (!c.steps || c.steps.length < 4 || c.steps.length > 7) err(c.id + ' nombre d’étapes (4 à 7) : ' + (c.steps || []).length);
  if (!c.recap || c.recap.length < 3) err(c.id + ' récap (≥3)');
  if (!c.quiz || c.quiz.length < 2) err(c.id + ' quiz (≥2)');
  c.quiz.forEach((q, i) => { if (!(q.choices.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < q.choices.length)) err(`${c.id} quiz${i} réponse`); });
  let nfig = 0;
  c.steps.forEach((s, i) => { if (s.fig) { nfig++; if (!K.FIG[s.fig]) { err(`${c.id} step${i} figure inconnue ${s.fig}`); return; }
    let h; try { h = K.FIG[s.fig](); } catch (e) { return err(`${c.id} figure ${s.fig} plante : ${e.message}`); }
    if (!/^<svg/.test(h)) err(`${c.id} figure ${s.fig} n'est pas un svg`);
    (h.match(/<text[^>]*>([^<]*)<\/text>/g) || []).forEach((x) => { const t = x.replace(/<[^>]+>/g, ''); if (/[A-Za-zéèêàçùô]{3,}/.test(t) && !figs[t]) err(`${c.id} légende sans traduction arabe : « ${t} »`); }); } });
  if (nfig < 3) err(`${c.id} au moins 3 étapes avec figure (${nfig})`);
  const t = ar[c.id]; if (!t) { err(c.id + ' absent en arabe'); continue; }
  same(c.id, c.title, t.title, 'title'); same(c.id, c.intro, t.intro, 'intro');
  if (!t.steps || t.steps.length !== c.steps.length) err(c.id + ' nombre d’étapes arabe'); else c.steps.forEach((s, i) => { same(c.id, s.h, t.steps[i].h, 'step' + i + '.h'); same(c.id, s.p, t.steps[i].p, 'step' + i + '.p'); });
  if (!t.recap || t.recap.length !== c.recap.length) err(c.id + ' recap arabe'); else c.recap.forEach((s, i) => same(c.id, s, t.recap[i], 'recap' + i));
  if (!t.quiz || t.quiz.length !== c.quiz.length) err(c.id + ' quiz arabe'); else c.quiz.forEach((q, i) => { same(c.id, q.q, t.quiz[i].q, 'quiz' + i + '.q'); if (!t.quiz[i].choices || t.quiz[i].choices.length !== q.choices.length) err(c.id + ' choix quiz' + i); else q.choices.forEach((ch, k) => same(c.id, ch, t.quiz[i].choices[k], 'quiz' + i + '.choix' + k)); });
}
for (const id of Object.keys(ar)) if (!mine.some((c) => c.id === id)) err('arabe sans cours : ' + id);
const bySubj = {}; mine.forEach((c) => { bySubj[c.subj] = (bySubj[c.subj] || 0) + 1; });
console.log(bad ? bad + ' erreur(s)' : `OK ${lv} : ${mine.length} cours`, JSON.stringify(bySubj));
process.exit(bad ? 1 : 0);
