/* Physique-chimie, niveau 5e : générateurs, textes français et arabes, catalogue.
 * Chargé après catalog2.js et avant catalog.js ; ajoute les domaines « Physique » et « Chimie » à la 5e.
 */
(function (root) {
  'use strict';

  const GEN = root.MathsGen.GEN;
  const STR = () => root.STRINGS || {};
  function t(k, v) {
    const s = STR()[k];
    if (s === undefined) return '[[' + k + ']]';
    if (typeof s !== 'string') return s;
    return s.replace(/\{(\w+)\}/g, (_, n) => (v && v[n] !== undefined ? v[n] : ''));
  }

  /* ---------- outils ---------- */
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[R(0, a.length - 1)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const round = (x, k = 6) => Number(x.toFixed(k));
  const fmt = (x) => String(x).replace(/-/g, '−').replace('.', ',');
  const big = (n) => fmt(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const m = (s) => `<span class="m">${String(s).replace(/[؀-ۿ]+/g, '⁦$&⁩')}</span>`;
  const V = (x, u) => m(`${fmt(x)} ${u}`);          // valeur + unité
  const VB = (x, u) => m(`${big(x)} ${u}`);         // grand nombre + unité
  function mc(correct, wrongs, labelf = (v) => m(v)) {
    const seen = new Set([String(correct)]), out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  }
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" direction="ltr" style="direction:ltr">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;

  /* textes : D(clé, français, arabe) remplit les deux dictionnaires */
  const FR = {}, AR = {};
  const D = (k, fr, ar) => { FR['pc.5e.' + k] = fr; AR['pc.5e.' + k] = ar; };
  const T = (k, v) => t('pc.5e.' + k, v);
  const oc = (c, ws) => mc(c, ws, (k) => T('o.' + k));          // QCM dont les choix sont des clés « o.… »
  const ST = '#334155';

  /* ---------- options communes ---------- */
  D('o.oui', 'Oui', 'نعم');
  D('o.non', 'Non', 'لا');

  /* ===================================================================
   *  PHYSIQUE
   * =================================================================== */

  /* ---- Circuits : série ou dérivation ---- */
  D('o.serie', 'en série', 'على التسلسل');
  D('o.deriv', 'en dérivation', 'على التفرّع');
  D('o.eteint', 'elle s’éteint', 'ينطفئ');
  D('o.brille', 'elle continue de briller', 'يستمرّ في التوهّج');
  D('circ.type.q', 'Comment les lampes L1 et L2 sont-elles branchées dans ce circuit ?', 'كيف رُكّب المصباحان L1 و L2 في هذه الدارة ؟');
  D('circ.type.exp.serie', 'Il n’y a qu’un seul chemin pour le courant : les lampes sont en série.', 'يوجد مسار واحد فقط للتيار : المصباحان على التسلسل.');
  D('circ.type.exp.deriv', 'Le circuit se sépare en deux branches reliées par des nœuds : les lampes sont en dérivation.', 'تنقسم الدارة إلى فرعين متصلين بعقدتين : المصباحان على التفرّع.');
  D('circ.dev.q', 'Deux lampes L1 et L2 sont branchées {mode}. On dévisse la lampe L1. Que se passe-t-il pour la lampe L2 ?', 'مصباحان L1 و L2 مركّبان {mode}. نفكّ المصباح L1. ماذا يحدث للمصباح L2 ؟');
  D('circ.dev.exp.serie', 'En série, il n’y a qu’un seul chemin : en dévissant L1, le circuit est ouvert et L2 s’éteint.', 'على التسلسل يوجد مسار واحد : بفكّ L1 تصبح الدارة مفتوحة فينطفئ L2.');
  D('circ.dev.exp.deriv', 'En dérivation, L2 est sur une autre branche : le courant continue de la traverser, L2 continue de briller.', 'على التفرّع يوجد L2 في فرع آخر : يستمرّ التيار في عبوره فيستمرّ L2 في التوهّج.');
  D('circ.maison.q', 'Dans une maison, les lampes et les prises sont branchées :', 'في المنزل، تُركَّب المصابيح والمآخذ :');
  D('circ.maison.exp', 'Dans une maison, tout est branché en dérivation : on peut éteindre une lampe sans couper le reste.', 'في المنزل كل شيء مركّب على التفرّع : يمكن إطفاء مصباح دون قطع بقية الأجهزة.');

  const lamp = (x, y, n, dx, dy) => `<circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="${ST}" stroke-width="2"/><path d="M${x - 8.5} ${y - 8.5}L${x + 8.5} ${y + 8.5}M${x + 8.5} ${y - 8.5}L${x - 8.5} ${y + 8.5}" stroke="${ST}" stroke-width="2"/>${txt(x + dx, y + dy, n, { s: 12 })}`;
  const pile = '<path d="M20 70H40" stroke="#334155" stroke-width="2"/><path d="M25 80H35" stroke="#334155" stroke-width="5"/>';
  const circSvg = (type) => (type === 'serie'
    ? svg(240, 150, `<path d="M30 70V25H88M112 25H148M172 25H210V125H30V80" fill="none" stroke="${ST}" stroke-width="2"/>${pile}${lamp(100, 25, 'L1', 0, -18)}${lamp(160, 25, 'L2', 0, -18)}`)
    : svg(240, 150, `<path d="M30 70V25H190M30 80V125H190M120 25V63M120 87V125M190 25V63M190 87V125" fill="none" stroke="${ST}" stroke-width="2"/>${pile}<circle cx="120" cy="25" r="3.5" fill="${ST}"/><circle cx="190" cy="25" r="3.5" fill="${ST}"/><circle cx="120" cy="125" r="3.5" fill="${ST}"/><circle cx="190" cy="125" r="3.5" fill="${ST}"/>${lamp(120, 75, 'L1', -22, 4)}${lamp(190, 75, 'L2', 22, 4)}`));

  GEN.pc5e_circuit = (p) => {
    const k = pick((p && p.kinds) || ['type', 'type', 'dev', 'maison']);
    const ty = pick(['serie', 'deriv']);
    if (k === 'type') return { q: T('circ.type.q'), vis: circSvg(ty), kind: 'choice', ans: ty, choices: oc(ty, [ty === 'serie' ? 'deriv' : 'serie']), exp: T('circ.type.exp.' + ty) };
    if (k === 'dev') {
      const a = ty === 'serie' ? 'eteint' : 'brille';
      return { q: T('circ.dev.q', { mode: T('o.' + ty) }), kind: 'choice', ans: a, choices: oc(a, [a === 'eteint' ? 'brille' : 'eteint']), exp: T('circ.dev.exp.' + ty) };
    }
    return { q: T('circ.maison.q'), kind: 'choice', ans: 'deriv', choices: oc('deriv', ['serie']), exp: T('circ.maison.exp') };
  };

  /* ---- Conducteurs, isolants, circuit fermé ---- */
  D('o.cond', 'conducteur', 'ناقل');
  D('o.iso', 'isolant', 'عازل');
  D('o.lbrille', 'La lampe brille', 'يتوهّج المصباح');
  D('o.leteinte', 'La lampe reste éteinte', 'يبقى المصباح مطفأ');
  D('o.cc', 'un court-circuit', 'دارة قصيرة (قِصْر دارة)');
  D('o.cferme', 'un circuit fermé qui fonctionne', 'دارة مغلقة تشتغل');
  D('o.couvert', 'un circuit ouvert', 'دارة مفتوحة');
  D('i.cuivre', 'le cuivre', 'النحاس');
  D('i.fer', 'le fer', 'الحديد');
  D('i.alu', 'l’aluminium', 'الألمنيوم');
  D('i.graphite', 'le graphite d’une mine de crayon', 'الغرافيت (قلم الرصاص)');
  D('i.eausalee', 'l’eau salée', 'الماء المملّح');
  D('i.plastique', 'le plastique', 'البلاستيك');
  D('i.verre', 'le verre', 'الزجاج');
  D('i.bois', 'le bois sec', 'الخشب الجاف');
  D('i.caoutchouc', 'le caoutchouc', 'المطاط');
  D('i.airsec', 'l’air sec', 'الهواء الجاف');
  D('cond.type.q', 'Ce matériau est-il conducteur ou isolant : {x} ?', 'هل المادة التالية ناقلة أم عازلة للتيار الكهربائي : {x} ؟');
  D('cond.type.exp', 'Les métaux, le graphite et l’eau salée laissent passer le courant ; le plastique, le verre, le bois sec, le caoutchouc et l’air sec l’arrêtent. Ici, c’est un matériau {r}.', 'تسمح المعادن والغرافيت والماء المملّح بمرور التيار، بينما يمنعه البلاستيك والزجاج والخشب الجاف والمطاط والهواء الجاف. هنا نوع المادة : {r}.');
  D('cond.lampe.q', 'On insère dans un circuit simple (pile, lampe, fils) un objet fait de ce matériau : {x}. La lampe brille-t-elle ?', 'نُدخل في دارة بسيطة (عمود، مصباح، أسلاك) جسمًا مصنوعًا من هذه المادة : {x}. هل يتوهّج المصباح ؟');
  D('cond.lampe.exp', 'Si le matériau est conducteur, le courant passe et la lampe brille ; s’il est isolant, le circuit est coupé. Ici, le matériau est {r}.', 'إذا كانت المادة ناقلة يمرّ التيار فيتوهّج المصباح، وإذا كانت عازلة تنقطع الدارة. هنا نوع المادة : {r}.');
  D('cond.inter.q', 'Dans un circuit simple (pile, lampe, interrupteur, fils), l’interrupteur est {e}. Que se passe-t-il ?', 'في دارة بسيطة (عمود، مصباح، قاطعة، أسلاك) تكون القاطعة {e}. ماذا يحدث ؟');
  D('cond.inter.ouvert', 'ouvert', 'مفتوحة');
  D('cond.inter.ferme', 'fermé', 'مغلقة');
  D('cond.inter.exp.ouvert', 'Interrupteur ouvert : le circuit est ouvert, le courant ne circule pas, la lampe reste éteinte.', 'القاطعة مفتوحة : الدارة مفتوحة ولا يمرّ التيار، فيبقى المصباح مطفأ.');
  D('cond.inter.exp.ferme', 'Interrupteur fermé : le circuit est fermé, le courant circule, la lampe brille.', 'القاطعة مغلقة : الدارة مغلقة ويمرّ التيار، فيتوهّج المصباح.');
  D('cond.cc.q', 'Un fil relie directement les deux bornes de la pile, sans passer par un récepteur. Comment appelle-t-on cette situation ?', 'سلك يصل مباشرة بين قطبي العمود دون المرور بجهاز مستقبِل. ماذا نسمّي هذه الحالة ؟');
  D('cond.cc.exp', 'Sans récepteur entre les bornes, le courant est très fort : c’est un court-circuit, dangereux (les fils chauffent et la pile s’use).', 'بدون مستقبِل بين القطبين يصبح التيار قويًّا جدًّا : هذه دارة قصيرة وهي خطيرة (تسخن الأسلاك ويتلف العمود).');

  const CONDS = ['cuivre', 'fer', 'alu', 'graphite', 'eausalee'], ISOS = ['plastique', 'verre', 'bois', 'caoutchouc', 'airsec'];
  GEN.pc5e_conducteur = (p) => {
    const k = pick((p && p.kinds) || ['type', 'lampe', 'inter', 'cc']);
    if (k === 'inter') {
      const e = pick(['ouvert', 'ferme']), a = e === 'ouvert' ? 'leteinte' : 'lbrille';
      return { q: T('cond.inter.q', { e: T('cond.inter.' + e) }), kind: 'choice', ans: a, choices: oc(a, [a === 'lbrille' ? 'leteinte' : 'lbrille']), exp: T('cond.inter.exp.' + e) };
    }
    if (k === 'cc') return { q: T('cond.cc.q'), kind: 'choice', ans: 'cc', choices: oc('cc', ['cferme', 'couvert']), exp: T('cond.cc.exp') };
    const isC = Math.random() < 0.5, item = pick(isC ? CONDS : ISOS), r = isC ? 'cond' : 'iso';
    if (k === 'lampe') {
      const a = isC ? 'oui' : 'non';
      return { q: T('cond.lampe.q', { x: T('i.' + item) }), kind: 'choice', ans: a, choices: oc(a, [isC ? 'non' : 'oui']), exp: T('cond.lampe.exp', { r: T('o.' + r) }) };
    }
    return { q: T('cond.type.q', { x: T('i.' + item) }), kind: 'choice', ans: r, choices: oc(r, [isC ? 'iso' : 'cond']), exp: T('cond.type.exp', { r: T('o.' + r) }) };
  };

  /* ---- Vitesse moyenne ---- */
  D('v.car', 'Une voiture roule', 'تسير سيارة');
  D('v.train', 'Un train roule', 'يسير قطار');
  D('v.cycl', 'Un cycliste roule', 'يسير دراج');
  D('v.run', 'Un coureur avance', 'يركض عدّاء');
  D('vit.v.q', '{o} pendant {t}, à vitesse constante. La distance parcourue est {d}. Quelle est la vitesse moyenne, en {u} ?', '{o} لمدة {t} بسرعة ثابتة، والمسافة المقطوعة {d}. ما السرعة المتوسطة بوحدة {u} ؟');
  D('vit.d.q', '{o} à la vitesse constante de {v}, pendant {t}. Quelle est la distance parcourue, en {du} ?', '{o} بسرعة ثابتة قدرها {v} لمدة {t}. ما المسافة المقطوعة بوحدة {du} ؟');
  D('vit.t.q', '{o} à la vitesse constante de {v} et parcourt {d}. Quelle est la durée du trajet, en {tu} ?', '{o} بسرعة ثابتة قدرها {v} ويقطع مسافة {d}. ما مدة الرحلة بوحدة {tu} ؟');
  D('vit.v.exp', 'v = d ÷ t = {d} ÷ {t} = {r}.', 'v = d ÷ t = {d} ÷ {t} = {r}.');
  D('vit.d.exp', 'd = v × t = {v} × {t} = {r}.', 'd = v × t = {v} × {t} = {r}.');
  D('vit.t.exp', 't = d ÷ v = {d} ÷ {v} = {r}.', 't = d ÷ v = {d} ÷ {v} = {r}.');
  const SUBJ = [
    { k: 'car', v: [40, 50, 60, 70, 80, 90, 100, 110, 120], t: [2, 3, 4, 5], u: ['km', 'h', 'km/h'] },
    { k: 'train', v: [60, 80, 100, 120, 150, 200], t: [2, 3, 4, 5], u: ['km', 'h', 'km/h'] },
    { k: 'cycl', v: [10, 12, 15, 20, 25], t: [2, 3, 4], u: ['km', 'h', 'km/h'] },
    { k: 'run', v: [3, 4, 5, 6, 8], t: [10, 20, 30, 40, 60], u: ['m', 's', 'm/s'] },
  ];
  GEN.pc5e_vitesse = (p) => {
    const k = pick((p && p.kinds) || ['v', 'd', 't']), s = pick(SUBJ), v = pick(s.v), tt = pick(s.t), d = v * tt, [ud, ut, uv] = s.u;
    const o = T('v.' + s.k), dV = V(d, ud), tV = V(tt, ut), vV = V(v, uv);
    if (k === 'v') return { q: T('vit.v.q', { o, t: tV, d: dV, u: m(uv) }), kind: 'num', ans: v, exp: T('vit.v.exp', { d: dV, t: tV, r: vV }) };
    if (k === 'd') return { q: T('vit.d.q', { o, v: vV, t: tV, du: m(ud) }), kind: 'num', ans: d, exp: T('vit.d.exp', { v: vV, t: tV, r: dV }) };
    return { q: T('vit.t.q', { o, v: vV, d: dV, tu: m(ut) }), kind: 'num', ans: tt, exp: T('vit.t.exp', { d: dV, v: vV, r: tV }) };
  };

  /* ---- Conversion km/h <-> m/s ---- */
  D('conv.q', 'Convertis {x} en {u}.', 'حوّل {x} إلى {u}.');
  D('conv.kmh.exp', 'Pour passer de km/h à m/s, on divise par 3,6 : {x} ÷ 3,6 = {r}.', 'للانتقال من km/h إلى m/s نقسم على 3,6 : {x} ÷ 3,6 = {r}.');
  D('conv.ms.exp', 'Pour passer de m/s à km/h, on multiplie par 3,6 : {x} × 3,6 = {r}.', 'للانتقال من m/s إلى km/h نضرب في 3,6 : {x} × 3,6 = {r}.');
  GEN.pc5e_conversion = (p) => {
    const k = pick((p && p.kinds) || ['kmh', 'ms']);
    if (k === 'kmh') {
      const ms = pick([5, 10, 15, 20, 25, 30, 35, 40]), kmh = round(ms * 3.6, 1);
      return { q: T('conv.q', { x: V(kmh, 'km/h'), u: m('m/s') }), kind: 'num', ans: ms, exp: T('conv.kmh.exp', { x: V(kmh, 'km/h'), r: V(ms, 'm/s') }) };
    }
    const ms = pick([2, 4, 5, 8, 10, 12, 15, 20, 25, 30]), kmh = round(ms * 3.6, 1);
    return { q: T('conv.q', { x: V(ms, 'm/s'), u: m('km/h') }), kind: 'num', ans: kmh, exp: T('conv.ms.exp', { x: V(ms, 'm/s'), r: V(kmh, 'km/h') }) };
  };

  /* ---- Poids ---- */
  D('poids.P.q', 'Un objet a une masse de {m}. On prend {g}. Quel est son poids, en newtons (N) ?', 'كتلة جسم {m}. نأخذ {g}. ما وزنه بالنيوتن (N) ؟');
  D('poids.m.q', 'Un objet a un poids de {P}. On prend {g}. Quelle est sa masse, en kilogrammes (kg) ?', 'وزن جسم {P}. نأخذ {g}. ما كتلته بالكيلوغرام (kg) ؟');
  D('poids.conv.q', 'Un objet a une masse de {m}. On prend {g}. Quel est son poids, en newtons (N) ? (Convertis d’abord la masse en kg.)', 'كتلة جسم {m}. نأخذ {g}. ما وزنه بالنيوتن (N) ؟ (حوّل الكتلة أوّلًا إلى kg.)');
  D('poids.lune.q', 'Sur la Lune, {g}. Quel est le poids, en newtons (N), d’un objet de masse {m} ?', 'على سطح القمر {g}. ما وزن جسم كتلته {m} بالنيوتن (N) ؟');
  D('poids.P.exp', 'P = m × g = {m} × {gv} = {r}.', 'P = m × g = {m} × {gv} = {r}.');
  D('poids.m.exp', 'm = P ÷ g = {P} ÷ {gv} = {r}.', 'm = P ÷ g = {P} ÷ {gv} = {r}.');
  D('poids.conv.exp', '{m} = {mk}, puis P = m × g = {mkv} × 10 = {r}.', '{m} = {mk}، ثم P = m × g = {mkv} × 10 = {r}.');
  GEN.pc5e_poids = (p) => {
    const k = pick((p && p.kinds) || ['P', 'm', 'conv', 'lune']), g10 = m('g = 10 N/kg');
    if (k === 'P') {
      const mm = R(2, 40), P = mm * 10;
      return { q: T('poids.P.q', { m: V(mm, 'kg'), g: g10 }), kind: 'num', ans: P, exp: T('poids.P.exp', { m: V(mm, 'kg'), gv: V(10, 'N/kg'), r: V(P, 'N') }) };
    }
    if (k === 'm') {
      const mm = R(2, 40), P = mm * 10;
      return { q: T('poids.m.q', { P: V(P, 'N'), g: g10 }), kind: 'num', ans: mm, exp: T('poids.m.exp', { P: V(P, 'N'), gv: V(10, 'N/kg'), r: V(mm, 'kg') }) };
    }
    if (k === 'conv') {
      const mg = R(1, 9) * 100, P = mg / 100;
      return { q: T('poids.conv.q', { m: V(mg, 'g'), g: g10 }), kind: 'num', ans: P, exp: T('poids.conv.exp', { m: V(mg, 'g'), mk: V(mg / 1000, 'kg'), mkv: V(mg / 1000, 'kg'), r: V(P, 'N') }) };
    }
    const mm = R(1, 12) * 5, P = round(mm * 1.6, 1);
    return { q: T('poids.lune.q', { g: m('g = 1,6 N/kg'), m: V(mm, 'kg') }), kind: 'num', ans: P, exp: T('poids.P.exp', { m: V(mm, 'kg'), gv: V(1.6, 'N/kg'), r: V(P, 'N') }) };
  };

  /* ---- Le son ---- */
  D('o.freq', 'la fréquence', 'التواتر');
  D('o.amp', 'l’amplitude', 'السعة');
  D('o.duree', 'la durée', 'المدّة');
  D('m.vide', 'le vide', 'الفراغ');
  D('m.air', 'l’air', 'الهواء');
  D('m.eau', 'l’eau', 'الماء');
  D('m.acier', 'l’acier (un solide)', 'الفولاذ (جسم صلب)');
  D('son.d.q', 'Dans l’air, le son se propage à {c}. Pendant un orage, on entend le tonnerre {t} après avoir vu l’éclair (on néglige la durée de propagation de la lumière). À quelle distance, en mètres, l’éclair a-t-il eu lieu ?', 'ينتشر الصوت في الهواء بسرعة {c}. أثناء عاصفة رعدية، نسمع الرعد بعد {t} من رؤية البرق (نهمل مدّة انتشار الضوء). على أيّ مسافة بالمتر حدث البرق ؟');
  D('son.t.q', 'Dans l’air, le son se propage à {c}. Un éclair frappe le sol à {d} de nous. Combien de secondes après l’éclair entend-on le tonnerre ?', 'ينتشر الصوت في الهواء بسرعة {c}. يضرب البرق الأرض على بعد {d} منّا. بعد كم ثانية من رؤية البرق نسمع الرعد ؟');
  D('son.d.exp', 'd = v × t = 340 × {tn} = {r}.', 'd = v × t = 340 × {tn} = {r}.');
  D('son.t.exp', 't = d ÷ v = {dn} ÷ 340 = {r}.', 't = d ÷ v = {dn} ÷ 340 = {r}.');
  D('son.milieu.q', 'Le son peut-il se propager dans {x} ?', 'هل يمكن للصوت أن ينتشر في {x} ؟');
  D('son.milieu.exp.oui', 'Le son se propage dans un milieu matériel (gaz, liquide ou solide) : oui.', 'ينتشر الصوت في وسط مادي (غاز أو سائل أو صلب) : نعم.');
  D('son.milieu.exp.non', 'Dans le vide, il n’y a pas de matière pour transmettre la vibration : le son ne se propage pas.', 'في الفراغ لا توجد مادة تنقل الاهتزاز : لا ينتشر الصوت.');
  D('son.aigu.q', 'Un son est d’autant plus aigu que sa … est grande. Quel mot complète la phrase ?', 'يكون الصوت أحدّ كلما كان … الاهتزاز أكبر. ما الكلمة التي تكمل الجملة ؟');
  D('son.fort.q', 'Un son est d’autant plus fort que son … est grand. Quel mot complète la phrase ?', 'يكون الصوت أقوى كلما كانت … الاهتزاز أكبر. ما الكلمة التي تكمل الجملة ؟');
  D('son.aigu.exp', 'Plus la fréquence (en hertz) est grande, plus le son est aigu.', 'كلما كبر التواتر (بالهرتز) كان الصوت أحدّ.');
  D('son.fort.exp', 'Plus l’amplitude de la vibration est grande, plus le son est fort.', 'كلما كبرت سعة الاهتزاز كان الصوت أقوى.');
  GEN.pc5e_son = (p) => {
    const k = pick((p && p.kinds) || ['d', 't', 'milieu', 'carac']), c = m('340 m/s');
    if (k === 'd') {
      const tt = R(1, 10), d = 340 * tt;
      return { q: T('son.d.q', { c, t: V(tt, 's') }), kind: 'num', ans: d, exp: T('son.d.exp', { tn: m(fmt(tt)), r: V(d, 'm') }) };
    }
    if (k === 't') {
      const tt = R(2, 10), d = 340 * tt;
      return { q: T('son.t.q', { c, d: V(d, 'm') }), kind: 'num', ans: tt, exp: T('son.t.exp', { dn: m(fmt(d)), r: V(tt, 's') }) };
    }
    if (k === 'milieu') {
      const x = pick(['vide', 'air', 'eau', 'acier']), a = x === 'vide' ? 'non' : 'oui';
      return { q: T('son.milieu.q', { x: T('m.' + x) }), kind: 'choice', ans: a, choices: oc(a, [a === 'oui' ? 'non' : 'oui']), exp: T('son.milieu.exp.' + a) };
    }
    if (Math.random() < 0.5) return { q: T('son.aigu.q'), kind: 'choice', ans: 'freq', choices: oc('freq', ['amp', 'duree']), exp: T('son.aigu.exp') };
    return { q: T('son.fort.q'), kind: 'choice', ans: 'amp', choices: oc('amp', ['freq', 'duree']), exp: T('son.fort.exp') };
  };

  /* ---- La lumière ---- */
  D('s.soleil', 'le Soleil', 'الشمس');
  D('s.lampe', 'une lampe allumée', 'مصباح متوهّج');
  D('s.etoile', 'une étoile', 'نجم');
  D('s.bougie', 'une bougie allumée', 'شمعة مشتعلة');
  D('s.lune', 'la Lune', 'القمر');
  D('s.livre', 'un livre', 'كتاب');
  D('s.mur', 'un mur blanc', 'جدار أبيض');
  D('s.terre', 'la Terre', 'الأرض');
  D('lum.d.q', 'La lumière se propage à {c}. Quelle distance parcourt-elle en {t} ? Donne la réponse en kilomètres.', 'ينتشر الضوء بسرعة {c}. ما المسافة التي يقطعها في {t} ؟ أعط الجواب بالكيلومتر.');
  D('lum.t.q', 'La lumière se propage à {c}. Un faisceau de lumière parcourt {d}. Combien de secondes dure le trajet ?', 'ينتشر الضوء بسرعة {c}. تقطع حزمة ضوئية مسافة {d}. كم ثانية تدوم الرحلة ؟');
  D('lum.lune.q', 'La lumière se propage à {c}. La distance Terre–Lune est d’environ {d}. Combien de secondes la lumière met-elle pour aller de la Terre à la Lune ?', 'ينتشر الضوء بسرعة {c}. المسافة بين الأرض والقمر نحو {d}. كم ثانية يستغرق الضوء ليصل من الأرض إلى القمر ؟');
  D('lum.soleil.q', 'La lumière se propage à {c}. La distance Terre–Soleil est d’environ {d}. Combien de secondes la lumière du Soleil met-elle pour nous parvenir ?', 'ينتشر الضوء بسرعة {c}. المسافة بين الأرض والشمس نحو {d}. كم ثانية يستغرق ضوء الشمس ليصلنا ؟');
  D('lum.d.exp', 'd = v × t = {c} × {t} = {r}.', 'd = v × t = {c} × {t} = {r}.');
  D('lum.t.exp', 't = d ÷ v = {d} ÷ {c} = {r}.', 't = d ÷ v = {d} ÷ {c} = {r}.');
  D('lum.soleil.exp', 't = d ÷ v = {d} ÷ {c} = {r}, soit environ 8 minutes.', 't = d ÷ v = {d} ÷ {c} = {r}، أي نحو 8 دقائق.');
  D('lum.src.q', 'Lequel de ces objets est une source primaire de lumière (il produit lui-même sa lumière) ?', 'أيّ هذه الأجسام منبع ضوئي أوّلي (ينتج الضوء بنفسه) ؟');
  D('lum.dif.q', 'Lequel de ces objets n’est pas une source primaire : il se contente de renvoyer la lumière qu’il reçoit ?', 'أيّ هذه الأجسام ليس منبعًا ضوئيًّا أوّليًّا : فهو يكتفي بإرسال الضوء الذي يستقبله ؟');
  D('lum.src.exp', 'Le Soleil, les étoiles, une lampe ou une bougie allumées produisent leur lumière : ce sont des sources. La Lune, la Terre, un livre ou un mur ne font que diffuser la lumière reçue.', 'الشمس والنجوم والمصباح أو الشمعة المتوهّجان تنتج الضوء بنفسها فهي منابع. أمّا القمر والأرض والكتاب والجدار فتكتفي بإرسال الضوء الذي تستقبله.');
  GEN.pc5e_lumiere = (p) => {
    const k = pick((p && p.kinds) || ['d', 't', 'astre', 'qcm']), c = m('300 000 km/s');
    if (k === 'd') {
      const tt = R(2, 9), d = 300000 * tt;
      return { q: T('lum.d.q', { c, t: V(tt, 's') }), kind: 'num', ans: d, exp: T('lum.d.exp', { c, t: V(tt, 's'), r: VB(d, 'km') }) };
    }
    if (k === 't') {
      const tt = R(2, 9), d = 300000 * tt;
      return { q: T('lum.t.q', { c, d: VB(d, 'km') }), kind: 'num', ans: tt, exp: T('lum.t.exp', { d: VB(d, 'km'), c, r: V(tt, 's') }) };
    }
    if (k === 'astre') {
      if (Math.random() < 0.5) return { q: T('lum.lune.q', { c, d: VB(384000, 'km') }), kind: 'num', ans: 1.28, exp: T('lum.t.exp', { d: VB(384000, 'km'), c, r: V(1.28, 's') }) };
      return { q: T('lum.soleil.q', { c, d: VB(150000000, 'km') }), kind: 'num', ans: 500, exp: T('lum.soleil.exp', { d: VB(150000000, 'km'), c, r: V(500, 's') }) };
    }
    const S = ['soleil', 'lampe', 'etoile', 'bougie'], N = ['lune', 'livre', 'mur', 'terre'];
    const lab = (x) => T('s.' + x);
    if (Math.random() < 0.5) { const a = pick(S); return { q: T('lum.src.q'), kind: 'choice', ans: a, choices: mc(a, shuf(N).slice(0, 3), lab), exp: T('lum.src.exp') }; }
    const a = pick(N); return { q: T('lum.dif.q'), kind: 'choice', ans: a, choices: mc(a, shuf(S).slice(0, 3), lab), exp: T('lum.src.exp') };
  };

  /* ---- Énergie ---- */
  D('x.solaire', 'un panneau solaire', 'لوح شمسي');
  D('x.pile', 'une pile qui alimente une lampe de poche', 'عمود يغذّي مصباحًا يدويًّا');
  D('x.moteur', 'un moteur électrique', 'محرّك كهربائي');
  D('x.radiateur', 'un radiateur électrique', 'مدفأة كهربائية');
  D('x.eolienne', 'une éolienne', 'توربين رياح');
  D('o.cv.solaire', 'de l’énergie lumineuse en énergie électrique', 'تحويل الطاقة الضوئية إلى طاقة كهربائية');
  D('o.cv.pile', 'de l’énergie chimique en énergie électrique', 'تحويل الطاقة الكيميائية إلى طاقة كهربائية');
  D('o.cv.moteur', 'de l’énergie électrique en énergie mécanique', 'تحويل الطاقة الكهربائية إلى طاقة حركية (ميكانيكية)');
  D('o.cv.radiateur', 'de l’énergie électrique en énergie thermique', 'تحويل الطاقة الكهربائية إلى طاقة حرارية');
  D('o.cv.eolienne', 'de l’énergie mécanique (le vent) en énergie électrique', 'تحويل الطاقة الميكانيكية (الرياح) إلى طاقة كهربائية');
  D('en.cv.q', 'Quelle conversion d’énergie réalise {x} ?', 'أيّ تحويل للطاقة يحدث في {x} ؟');
  D('en.cv.exp', 'Un appareil convertit une forme d’énergie en une autre : ici, c’est la conversion {r}.', 'يحوّل الجهاز شكلًا من الطاقة إلى شكل آخر : هنا التحويل هو {r}.');
  D('o.e.soleil', 'le Soleil', 'الشمس');
  D('o.e.vent', 'le vent', 'الرياح');
  D('o.e.eau', 'la chute d’eau', 'سقوط الماء');
  D('o.e.petrole', 'le pétrole', 'البترول');
  D('o.e.gaz', 'le gaz naturel', 'الغاز الطبيعي');
  D('o.e.charbon', 'le charbon', 'الفحم');
  D('en.ren.q', 'Laquelle de ces sources d’énergie est renouvelable ?', 'أيّ مصادر الطاقة التالية متجدّدة ؟');
  D('en.fos.q', 'Laquelle de ces sources d’énergie est une énergie fossile (non renouvelable) ?', 'أيّ مصادر الطاقة التالية طاقة أحفورية (غير متجدّدة) ؟');
  D('en.ren.exp', 'Le Soleil, le vent et l’eau se renouvellent sans cesse ; le pétrole, le gaz et le charbon (énergies fossiles) s’épuisent.', 'الشمس والرياح والماء تتجدّد باستمرار، بينما البترول والغاز والفحم (طاقات أحفورية) تنفد.');
  const CV = ['solaire', 'pile', 'moteur', 'radiateur', 'eolienne'];
  GEN.pc5e_energie = (p) => {
    const k = pick((p && p.kinds) || ['cv', 'cv', 'ren']);
    if (k === 'cv') {
      const a = pick(CV), cho = mc('cv.' + a, shuf(CV.filter((x) => x !== a)).slice(0, 3).map((x) => 'cv.' + x), (v) => T('o.' + v));
      return { q: T('en.cv.q', { x: T('x.' + a) }), kind: 'choice', ans: 'cv.' + a, choices: cho, exp: T('en.cv.exp', { r: T('o.cv.' + a) }) };
    }
    const R3 = ['soleil', 'vent', 'eau'], F3 = ['petrole', 'gaz', 'charbon'];
    const lab = (x) => T('o.e.' + x);
    if (k === 'ren') {
      if (Math.random() < 0.5) { const a = pick(R3); return { q: T('en.ren.q'), kind: 'choice', ans: a, choices: mc(a, F3, lab), exp: T('en.ren.exp') }; }
      const a = pick(F3); return { q: T('en.fos.q'), kind: 'choice', ans: a, choices: mc(a, R3, lab), exp: T('en.ren.exp') };
    }
    return GEN.pc5e_energie({ kinds: ['cv'] });
  };

  /* ===================================================================
   *  CHIMIE
   * =================================================================== */

  /* ---- États de la matière ---- */
  D('o.solide', 'solide', 'صلب');
  D('o.liquide', 'liquide', 'سائل');
  D('o.gaz', 'gazeux', 'غازي');
  D('d.solide1', 'il a une forme propre et un volume propre', 'له شكل خاص وحجم خاص');
  D('d.solide2', 'ses particules sont rangées et très serrées', 'دقائقه مرتّبة ومتراصّة جدًّا');
  D('d.liquide1', 'il prend la forme de son récipient et sa surface libre est plane et horizontale', 'يأخذ شكل الإناء الذي يوجد فيه وسطحه الحرّ مستوٍ وأفقي');
  D('d.liquide2', 'ses particules sont serrées mais mobiles', 'دقائقه متقاربة لكنها متحرّكة');
  D('d.gaz1', 'il occupe tout l’espace disponible et se comprime facilement', 'يشغل كل الحيّز المتاح ويمكن ضغطه بسهولة');
  D('d.gaz2', 'ses particules sont très éloignées et se déplacent dans tous les sens', 'دقائقه متباعدة جدًّا وتتحرّك في كل الاتجاهات');
  D('et.desc.q', 'Un corps a la propriété suivante : {d}. De quel état de la matière s’agit-il ?', 'لجسم الخاصية التالية : {d}. ما هي الحالة الفيزيائية للمادة ؟');
  D('et.desc.exp', 'Cette description correspond à l’état {r}.', 'الحالة الفيزيائية الموافقة لهذا الوصف : {r}.');
  D('et.obj.q', 'Dans quel état de la matière se trouve {x} à température ambiante ?', 'ما الحالة الفيزيائية عند درجة حرارة المحيط بالنسبة إلى {x} ؟');
  D('et.obj.exp', 'À température ambiante, {x} est à l’état {r}.', 'عند درجة حرارة المحيط، حالة {x} الفيزيائية : {r}.');
  D('b.glacon', 'la glace d’un glaçon', 'قطعة الجليد');
  D('b.pierre', 'une pierre', 'حجر');
  D('b.fer', 'un clou en fer', 'مسمار حديدي');
  D('b.huile', 'l’huile de table', 'زيت المائدة');
  D('b.lait', 'le lait', 'الحليب');
  D('b.eau', 'l’eau d’un verre', 'ماء الكأس');
  D('b.vapeur', 'la vapeur d’eau', 'بخار الماء');
  D('b.air', 'l’air', 'الهواء');
  D('b.o2', 'le dioxygène', 'ثنائي الأكسجين');
  const DESC = { solide: ['solide1', 'solide2'], liquide: ['liquide1', 'liquide2'], gaz: ['gaz1', 'gaz2'] };
  const OBJ = { solide: ['glacon', 'pierre', 'fer'], liquide: ['huile', 'lait', 'eau'], gaz: ['vapeur', 'air', 'o2'] };
  GEN.pc5e_etat = (p) => {
    const k = pick((p && p.kinds) || ['desc', 'obj']), s = pick(['solide', 'liquide', 'gaz']), others = ['solide', 'liquide', 'gaz'].filter((x) => x !== s);
    if (k === 'desc') return { q: T('et.desc.q', { d: T('d.' + pick(DESC[s])) }), kind: 'choice', ans: s, choices: oc(s, others), exp: T('et.desc.exp', { r: T('o.' + s) }) };
    const x = pick(OBJ[s]);
    return { q: T('et.obj.q', { x: T('b.' + x) }), kind: 'choice', ans: s, choices: oc(s, others), exp: T('et.obj.exp', { x: T('b.' + x), r: T('o.' + s) }) };
  };

  /* ---- Changements d'état ---- */
  D('o.fusion', 'la fusion', 'الانصهار');
  D('o.solidification', 'la solidification', 'التجمّد');
  D('o.vaporisation', 'la vaporisation', 'التبخّر');
  D('o.liquefaction', 'la liquéfaction', 'التكاثف (التميّع)');
  D('o.sublimation', 'la sublimation', 'التصعيد');
  D('o.condensation', 'la condensation solide', 'التكاثف الصلب');
  D('ch.name.q', 'Un corps passe de l’état {a} à l’état {b}. Comment s’appelle ce changement d’état ?', 'ينتقل جسم من الحالة {a} إلى الحالة {b}. ماذا نسمّي هذا التغيّر في الحالة الفيزيائية ؟');
  D('ch.name.exp', 'De l’état {a} à l’état {b} : c’est {r}.', 'من الحالة {a} إلى الحالة {b} : إنه {r}.');
  D('ch.ex.q', 'Quel changement d’état se produit dans cette situation : {e} ?', 'أيّ تغيّر في الحالة الفيزيائية يحدث في هذه الوضعية : {e} ؟');
  D('ch.ex.exp', 'Dans cette situation, il s’agit de {r}.', 'في هذه الوضعية : {r}.');
  D('e.glacon', 'un glaçon fond dans un verre', 'قطعة جليد تذوب في كأس');
  D('e.gel', 'de l’eau liquide devient de la glace au congélateur', 'ماء سائل يتحوّل إلى جليد في المجمّد');
  D('e.linge', 'le linge mouillé sèche au soleil', 'الثياب المبلّلة تجفّ تحت الشمس');
  D('e.buee', 'de la buée se forme sur une vitre froide', 'يتشكّل بخار متكاثف (ضباب) على زجاج بارد');
  D('e.naph', 'la naphtaline disparaît sans passer par l’état liquide', 'تختفي النفتالين دون المرور بالحالة السائلة');
  D('e.givre', 'du givre se forme sur une vitre en hiver', 'يتشكّل الصقيع على الزجاج في الشتاء');
  D('e.bout', 'l’eau d’une casserole bout', 'ماء الطنجرة يغلي');
  const CHG = [['solide', 'liquide', 'fusion'], ['liquide', 'solide', 'solidification'], ['liquide', 'gaz', 'vaporisation'], ['gaz', 'liquide', 'liquefaction'], ['solide', 'gaz', 'sublimation'], ['gaz', 'solide', 'condensation']];
  const EXA = { glacon: 'fusion', gel: 'solidification', linge: 'vaporisation', buee: 'liquefaction', naph: 'sublimation', givre: 'condensation', bout: 'vaporisation' };
  const CHN = CHG.map((c) => c[2]);
  GEN.pc5e_changement = (p) => {
    const k = pick((p && p.kinds) || ['name', 'ex']);
    if (k === 'name') {
      const [a, b, n] = pick(CHG), sa = T('o.' + a), sb = T('o.' + b);
      return { q: T('ch.name.q', { a: sa, b: sb }), kind: 'choice', ans: n, choices: oc(n, shuf(CHN.filter((x) => x !== n)).slice(0, 3)), exp: T('ch.name.exp', { a: sa, b: sb, r: T('o.' + n) }) };
    }
    const e = pick(Object.keys(EXA)), n = EXA[e];
    return { q: T('ch.ex.q', { e: T('e.' + e) }), kind: 'choice', ans: n, choices: oc(n, shuf(CHN.filter((x) => x !== n)).slice(0, 3)), exp: T('ch.ex.exp', { r: T('o.' + n) }) };
  };

  /* ---- Température et paliers de l'eau ---- */
  D('o.sol', 'glace seule : elle se réchauffe', 'جليد فقط : يسخن');
  D('o.fus', 'la glace fond : il y a de la glace et de l’eau liquide', 'الجليد ينصهر : يوجد جليد وماء سائل');
  D('o.liq', 'eau liquide seule : elle se réchauffe', 'ماء سائل فقط : يسخن');
  D('o.ebu', 'l’eau bout : il y a de l’eau liquide et de la vapeur', 'الماء يغلي : يوجد ماء سائل وبخار');
  D('o.vap', 'vapeur d’eau seule : elle se réchauffe', 'بخار الماء فقط : يسخن');
  D('tp.etat.q', 'À la pression atmosphérique normale, dans quel état se trouve l’eau pure à {T} ?', 'عند الضغط الجوي العادي، في أيّ حالة يوجد الماء الخالص عند الدرجة {T} ؟');
  D('tp.etat.exp', 'L’eau pure fond à 0 °C et bout à 100 °C : à {T}, elle est à l’état {r}.', 'يذوب الماء الخالص عند 0 °C ويغلي عند 100 °C : عند {T} تكون الحالة : {r}.');
  D('tp.ecart.q', 'On chauffe de l’eau liquide pure, initialement à {a}, jusqu’à son ébullition (à la pression normale). De combien de degrés Celsius sa température augmente-t-elle ?', 'نسخّن ماءً سائلًا خالصًا درجة حرارته الابتدائية {a} إلى أن يغلي (عند الضغط العادي). بكم درجة سلسيوس ترتفع درجة حرارته ؟');
  D('tp.ecart.exp', 'L’eau bout à 100 °C : 100 − {an} = {r}.', 'يغلي الماء عند 100 °C : 100 − {an} = {r}.');
  D('tp.graph.q', 'Voici la courbe de chauffage d’un morceau de glace d’eau pure. Que se passe-t-il au point {P} ?', 'هذا منحنى تسخين قطعة جليد من ماء خالص. ماذا يحدث عند النقطة {P} ؟');
  D('tp.graph.exp', 'Les paliers à 0 °C (fusion) et à 100 °C (ébullition) sont horizontaux : la température reste constante pendant le changement d’état. Au point {P} : {r}.', 'المرحلتان الأفقيتان عند 0 °C (انصهار) وعند 100 °C (غليان) : تبقى درجة الحرارة ثابتة أثناء تغيّر الحالة. عند النقطة {P} : {r}.');
  D('tp.lire.q', 'Sur la courbe de chauffage de l’eau pure, quelle est la température du palier correspondant à {x}, en °C ?', 'على منحنى تسخين الماء الخالص، ما درجة حرارة المرحلة الأفقية الموافقة لـ {x} بوحدة °C ؟');
  D('tp.lire.fusion', 'la fusion de la glace', 'انصهار الجليد');
  D('tp.lire.ebu', 'l’ébullition de l’eau', 'غليان الماء');
  D('tp.lire.exp', 'Le palier de {x} se lit à {r}.', 'تُقرأ المرحلة الأفقية لـ {x} عند {r}.');
  const heatSvg = (pt) => {
    const P = { A: [60, 118], B: [100, 110], C: [160, 70], D: [220, 30], E: [255, 22] };
    let s = '<path d="M40 10V150H275" fill="none" stroke="#334155" stroke-width="2"/>';
    s += '<path d="M40 110H100M40 30H220" stroke="#94a3b8" stroke-dasharray="4 4"/>';
    s += '<path d="M40 126L80 110H120L200 30H240L270 14" fill="none" stroke="#2563eb" stroke-width="3"/>';
    s += txt(34, 114, '0', { a: 'end', s: 12 }) + txt(34, 34, '100', { a: 'end', s: 12 }) + txt(48, 12, 'θ (°C)', { a: 'start', s: 12 }) + txt(270, 166, 't', { s: 12 });
    Object.keys(P).forEach((q) => { const [x, y] = P[q]; s += `<circle cx="${x}" cy="${y}" r="4" fill="${q === pt ? '#dc2626' : '#334155'}"/>` + txt(x, y + (q === 'B' || q === 'D' || q === 'E' ? -9 : 17), q, { s: 13, c: q === pt ? '#dc2626' : ST }); });
    return svg(290, 172, s);
  };
  GEN.pc5e_temperature = (p) => {
    const k = pick((p && p.kinds) || ['etat', 'ecart', 'graph', 'lire']);
    if (k === 'etat') {
      const z = pick(['solide', 'liquide', 'gaz']), T0 = z === 'solide' ? -R(1, 30) : z === 'liquide' ? R(1, 99) : R(101, 150), Ts = V(T0, '°C');
      return { q: T('tp.etat.q', { T: Ts }), kind: 'choice', ans: z, choices: oc(z, ['solide', 'liquide', 'gaz'].filter((x) => x !== z)), exp: T('tp.etat.exp', { T: Ts, r: T('o.' + z) }) };
    }
    if (k === 'ecart') {
      const a = R(1, 19) * 5;
      return { q: T('tp.ecart.q', { a: V(a, '°C') }), kind: 'num', ans: 100 - a, exp: T('tp.ecart.exp', { an: m(fmt(a)), r: V(100 - a, '°C') }) };
    }
    if (k === 'lire') {
      const x = pick(['fusion', 'ebu']), r = x === 'fusion' ? 0 : 100;
      return { q: T('tp.lire.q', { x: T('tp.lire.' + x) }), vis: heatSvg(''), kind: 'num', ans: r, exp: T('tp.lire.exp', { x: T('tp.lire.' + x), r: V(r, '°C') }) };
    }
    const pt = pick(['A', 'B', 'C', 'D', 'E']), a = { A: 'sol', B: 'fus', C: 'liq', D: 'ebu', E: 'vap' }[pt];
    return { q: T('tp.graph.q', { P: `<b>${pt}</b>` }), vis: heatSvg(pt), kind: 'choice', ans: a, choices: oc(a, ['sol', 'fus', 'liq', 'ebu', 'vap'].filter((x) => x !== a)), exp: T('tp.graph.exp', { P: `<b>${pt}</b>`, r: T('o.' + a) }) };
  };

  /* ---- Masse et volume ---- */
  D('o.augmente', 'il augmente', 'يزداد');
  D('o.diminue', 'il diminue', 'ينقص');
  D('o.inchange', 'il ne change pas', 'لا يتغيّر');
  D('mv.fonte.q', 'Un glaçon de masse {m} fond complètement. Quelle est la masse de l’eau liquide obtenue, en grammes ?', 'تنصهر قطعة جليد كتلتها {m} كليًّا. ما كتلة الماء السائل الناتج بالغرام ؟');
  D('mv.fonte.exp', 'La masse se conserve lors d’un changement d’état : on obtient {r}.', 'تُحفَظ الكتلة أثناء تغيّر الحالة الفيزيائية : نحصل على {r}.');
  D('mv.dis.q', 'On dissout {s} de sucre dans {e} d’eau. Quelle est la masse de la solution obtenue, en grammes ?', 'نُذيب {s} من السكر في {e} من الماء. ما كتلة المحلول الناتج بالغرام ؟');
  D('mv.dis.exp', 'La masse totale se conserve : {e} + {s} = {r}.', 'تُحفَظ الكتلة الإجمالية : {e} + {s} = {r}.');
  D('mv.rev.q', 'Une solution d’eau salée a une masse de {tot}. Elle contient {e} d’eau. Quelle est la masse de sel dissous, en grammes ?', 'كتلة محلول ماء مملّح {tot}. يحتوي على {e} من الماء. ما كتلة الملح المذاب بالغرام ؟');
  D('mv.rev.exp', 'Masse du sel = masse de la solution − masse de l’eau = {tot} − {e} = {r}.', 'كتلة الملح = كتلة المحلول − كتلة الماء = {tot} − {e} = {r}.');
  D('mv.l.q', 'Un récipient contient {v} d’eau liquide. Sachant que 1 L d’eau a une masse de 1 kg, quelle est la masse de l’eau, en kilogrammes ?', 'يحتوي إناء على {v} من الماء السائل. علمًا أن كتلة 1 L من الماء تساوي 1 kg، ما كتلة الماء بالكيلوغرام ؟');
  D('mv.l.exp', '1 L d’eau a une masse de 1 kg : {v} d’eau pèsent {r}.', 'كتلة 1 L من الماء تساوي 1 kg : كتلة {v} من الماء هي {r}.');
  D('mv.ml.q', 'Convertis {x} en {u}.', 'حوّل {x} إلى {u}.');
  D('mv.ml.exp', '1 L = 1 000 mL, donc {x} = {r}.', '1 L = 1 000 mL إذن {x} = {r}.');
  D('mv.lm.exp', '1 L = 1 000 mL, donc {x} = {x} ÷ 1 000 = {r}.', '1 L = 1 000 mL إذن {x} = {x} ÷ 1 000 = {r}.');
  D('mv.gel.q', 'Une bouteille d’eau est mise au congélateur : l’eau gèle. Que devient le volume de l’eau ?', 'توضع قارورة ماء في المجمّد فيتجمّد الماء. ماذا يحدث لحجم الماء ؟');
  D('mv.gel.exp', 'En gelant, l’eau augmente de volume d’environ 9 % (une bouteille pleine peut éclater), mais sa masse ne change pas.', 'عند التجمّد يزداد حجم الماء بنحو 9 % (قد تنفجر قارورة ممتلئة)، لكن كتلته لا تتغيّر.');
  D('mv.gelm.q', 'Une bouteille d’eau est mise au congélateur : l’eau gèle. Que devient la masse de l’eau ?', 'توضع قارورة ماء في المجمّد فيتجمّد الماء. ماذا يحدث لكتلة الماء ؟');
  GEN.pc5e_masse = (p) => {
    const k = pick((p && p.kinds) || ['fonte', 'dis', 'rev', 'l', 'ml', 'lm', 'gel']);
    if (k === 'fonte') { const mm = R(2, 50) * 10; return { q: T('mv.fonte.q', { m: V(mm, 'g') }), kind: 'num', ans: mm, exp: T('mv.fonte.exp', { r: V(mm, 'g') }) }; }
    if (k === 'dis') { const e = R(2, 10) * 50, s = R(1, 10) * 5; return { q: T('mv.dis.q', { s: V(s, 'g'), e: V(e, 'g') }), kind: 'num', ans: e + s, exp: T('mv.dis.exp', { e: V(e, 'g'), s: V(s, 'g'), r: V(e + s, 'g') }) }; }
    if (k === 'rev') { const e = R(2, 10) * 50, s = R(1, 10) * 5; return { q: T('mv.rev.q', { tot: V(e + s, 'g'), e: V(e, 'g') }), kind: 'num', ans: s, exp: T('mv.rev.exp', { tot: V(e + s, 'g'), e: V(e, 'g'), r: V(s, 'g') }) }; }
    if (k === 'l') { const v = pick([1, 2, 3, 5, 8, 10, 12, 15, 20, 25]); return { q: T('mv.l.q', { v: V(v, 'L') }), kind: 'num', ans: v, exp: T('mv.l.exp', { v: V(v, 'L'), r: V(v, 'kg') }) }; }
    if (k === 'ml') { const v = pick([0.5, 1.5, 2, 2.5, 3, 4, 4.5, 6]), r = round(v * 1000, 0); return { q: T('mv.ml.q', { x: V(v, 'L'), u: m('mL') }), kind: 'num', ans: r, exp: T('mv.ml.exp', { x: V(v, 'L'), r: V(r, 'mL') }) }; }
    if (k === 'lm') { const x = pick([250, 500, 750, 1500, 2500, 3000, 4500]), r = round(x / 1000, 3); return { q: T('mv.ml.q', { x: V(x, 'mL'), u: m('L') }), kind: 'num', ans: r, exp: T('mv.lm.exp', { x: V(x, 'mL'), r: V(r, 'L') }) }; }
    if (Math.random() < 0.5) return { q: T('mv.gel.q'), kind: 'choice', ans: 'augmente', choices: oc('augmente', ['diminue', 'inchange']), exp: T('mv.gel.exp') };
    return { q: T('mv.gelm.q'), kind: 'choice', ans: 'inchange', choices: oc('inchange', ['augmente', 'diminue']), exp: T('mv.gel.exp') };
  };

  /* ---- L'air ---- */
  D('o.g.n2', 'le diazote (N<sub>2</sub>)', 'ثنائي الآزوت (N<sub>2</sub>)');
  D('o.g.o2', 'le dioxygène (O<sub>2</sub>)', 'ثنائي الأكسجين (O<sub>2</sub>)');
  D('o.g.co2', 'le dioxyde de carbone (CO<sub>2</sub>)', 'ثنائي أكسيد الكربون (CO<sub>2</sub>)');
  D('o.g.h2o', 'la vapeur d’eau (H<sub>2</sub>O)', 'بخار الماء (H<sub>2</sub>O)');
  D('o.t.cuso4', 'le sulfate de cuivre anhydre', 'كبريتات النحاس اللامائية');
  D('o.t.chaux', 'l’eau de chaux', 'ماء الجير');
  D('o.t.filtre', 'le papier filtre', 'ورق الترشيح');
  D('air.o2.q', 'L’air contient environ 21 % de dioxygène (O<sub>2</sub>). Quel volume de dioxygène, en litres, y a-t-il dans {V} d’air ?', 'يحتوي الهواء على نحو 21 % من ثنائي الأكسجين (O<sub>2</sub>). ما حجم ثنائي الأكسجين باللتر في {V} من الهواء ؟');
  D('air.n2.q', 'L’air contient environ 78 % de diazote (N<sub>2</sub>). Quel volume de diazote, en litres, y a-t-il dans {V} d’air ?', 'يحتوي الهواء على نحو 78 % من ثنائي الآزوت (N<sub>2</sub>). ما حجم ثنائي الآزوت باللتر في {V} من الهواء ؟');
  D('air.exp', '{p} % de {V} : {V} × {pc} ÷ 100 = {r}.', '{p} % من {V} : {V} × {pc} ÷ 100 = {r}.');
  D('air.trouble.q', 'Quel gaz trouble l’eau de chaux ?', 'أيّ غاز يعكّر ماء الجير ؟');
  D('air.trouble.exp', 'Le dioxyde de carbone (CO<sub>2</sub>) rend l’eau de chaux laiteuse.', 'ثنائي أكسيد الكربون (CO<sub>2</sub>) يجعل ماء الجير عكرًا.');
  D('air.comb.q', 'Quel gaz de l’air est nécessaire à la combustion et à la respiration ?', 'أيّ غاز في الهواء ضروري للاحتراق وللتنفّس ؟');
  D('air.comb.exp', 'Le dioxygène (O<sub>2</sub>) entretient la combustion : une bougie couverte d’un verre s’éteint quand il est consommé.', 'ثنائي الأكسجين (O<sub>2</sub>) ضروري للاحتراق : تنطفئ شمعة غُطّيت بكأس عندما يُستهلك.');
  D('air.abond.q', 'Quel est le gaz le plus abondant dans l’air ?', 'ما هو الغاز الأكثر وفرة في الهواء ؟');
  D('air.abond.exp', 'L’air contient environ 78 % de diazote (N<sub>2</sub>) et 21 % de dioxygène (O<sub>2</sub>) : le diazote est le plus abondant.', 'يحتوي الهواء على نحو 78 % من ثنائي الآزوت (N<sub>2</sub>) و 21 % من ثنائي الأكسجين (O<sub>2</sub>) : ثنائي الآزوت هو الأكثر وفرة.');
  D('air.eau.q', 'Avec quel produit reconnaît-on la présence d’eau (il devient bleu au contact de l’eau) ?', 'بأيّ مادة نكشف عن وجود الماء (تتحوّل إلى الأزرق عند ملامسته) ؟');
  D('air.eau.exp', 'Le sulfate de cuivre anhydre, blanc, devient bleu en présence d’eau.', 'كبريتات النحاس اللامائية البيضاء تصبح زرقاء بوجود الماء.');
  GEN.pc5e_air = (p) => {
    const k = pick((p && p.kinds) || ['pct', 'pct', 'qcm']);
    if (k === 'pct') {
      const gz = pick(['o2', 'n2']), pc = gz === 'o2' ? 21 : 78, Vv = pick([50, 100, 200, 250, 500, 1000]), r = round(Vv * pc / 100, 2);
      return { q: T('air.' + gz + '.q', { V: V(Vv, 'L') }), kind: 'num', ans: r, exp: T('air.exp', { p: m(pc), V: V(Vv, 'L'), pc: m(pc), r: V(r, 'L') }) };
    }
    const q = pick(['trouble', 'comb', 'abond', 'eau']);
    if (q === 'trouble') return { q: T('air.trouble.q'), kind: 'choice', ans: 'g.co2', choices: oc('g.co2', ['g.o2', 'g.n2', 'g.h2o']), exp: T('air.trouble.exp') };
    if (q === 'comb') return { q: T('air.comb.q'), kind: 'choice', ans: 'g.o2', choices: oc('g.o2', ['g.n2', 'g.co2', 'g.h2o']), exp: T('air.comb.exp') };
    if (q === 'abond') return { q: T('air.abond.q'), kind: 'choice', ans: 'g.n2', choices: oc('g.n2', ['g.o2', 'g.co2', 'g.h2o']), exp: T('air.abond.exp') };
    return { q: T('air.eau.q'), kind: 'choice', ans: 't.cuso4', choices: oc('t.cuso4', ['t.chaux', 't.filtre']), exp: T('air.eau.exp') };
  };

  /* ---- Mélanges et séparations ---- */
  D('o.cp', 'un corps pur', 'جسم خالص');
  D('o.mel', 'un mélange', 'مزيج');
  D('o.homo', 'homogène', 'متجانس');
  D('o.hetero', 'hétérogène', 'غير متجانس');
  D('o.filtration', 'la filtration', 'الترشيح');
  D('o.evaporation', 'l’évaporation', 'التبخير');
  D('o.distillation', 'la distillation', 'التقطير');
  D('o.decantation', 'la décantation', 'التصفيق (الرَّوْق)');
  D('o.w.eau', 'l’eau', 'الماء');
  D('o.w.sucre', 'le sucre', 'السكر');
  D('o.w.sel', 'le sel', 'الملح');
  D('o.w.huile', 'l’huile', 'الزيت');
  D('y.distillee', 'l’eau distillée', 'الماء المقطّر');
  D('y.fer', 'le fer pur', 'الحديد الخالص');
  D('y.o2', 'le dioxygène', 'ثنائي الأكسجين');
  D('y.air', 'l’air', 'الهواء');
  D('y.robinet', 'l’eau du robinet', 'ماء الحنفية');
  D('y.lait', 'le lait', 'الحليب');
  D('y.jus', 'le jus d’orange', 'عصير البرتقال');
  D('y.minerale', 'l’eau minérale', 'الماء المعدني');
  D('h.sucre', 'de l’eau sucrée', 'ماء مُسكَّر');
  D('h.sale', 'de l’eau salée', 'ماء مملّح');
  D('h.sirop', 'du sirop dilué dans de l’eau', 'شراب مخفَّف في الماء');
  D('h.huile', 'de l’eau et de l’huile', 'ماء وزيت');
  D('h.sable', 'de l’eau et du sable', 'ماء ورمل');
  D('h.salade', 'une salade de fruits', 'سلطة فواكه');
  D('z.sable', 'retenir le sable d’un mélange d’eau et de sable', 'حجز الرمل من مزيج ماء ورمل');
  D('z.sel', 'récupérer le sel dissous dans de l’eau salée', 'استرجاع الملح المذاب في ماء مملّح');
  D('z.pure', 'obtenir de l’eau pure à partir d’eau salée', 'الحصول على ماء خالص انطلاقًا من ماء مملّح');
  D('z.huile', 'séparer l’huile de l’eau, après avoir laissé reposer le mélange', 'فصل الزيت عن الماء بعد ترك المزيج يستقر');
  D('mel.cp.q', 'Cette substance est-elle un corps pur ou un mélange : {x} ?', 'هل المادة التالية جسم خالص أم مزيج : {x} ؟');
  D('mel.cp.exp', 'Un corps pur ne contient qu’une seule espèce chimique ; un mélange en contient plusieurs. Ici, c’est {r}.', 'الجسم الخالص يحتوي على نوع كيميائي واحد فقط، والمزيج يحتوي على عدّة أنواع. هنا الأمر يتعلّق بـ {r}.');
  D('mel.hh.q', 'Ce mélange est-il homogène ou hétérogène : {x} ?', 'هل المزيج التالي متجانس أم غير متجانس : {x} ؟');
  D('mel.hh.exp', 'Dans un mélange homogène, on ne distingue qu’une seule phase ; dans un mélange hétérogène, on en distingue plusieurs à l’œil nu. Ici, il est {r}.', 'في المزيج المتجانس لا نميّز إلا طورًا واحدًا، وفي المزيج غير المتجانس نميّز عدّة أطوار بالعين المجرّدة. هنا المزيج {r}.');
  D('mel.sep.q', 'Quelle technique de séparation utilise-t-on pour {z} ?', 'أيّ تقنية فصل نستعمل من أجل {z} ؟');
  D('mel.sep.exp', 'La filtration retient un solide, l’évaporation récupère le soluté, la distillation récupère le solvant pur et la décantation sépare des phases après repos. Ici : {r}.', 'الترشيح يحجز الجسم الصلب، والتبخير يسترجع المذاب، والتقطير يسترجع المذيب الخالص، والتصفيق يفصل الأطوار بعد الاستقرار. هنا : {r}.');
  D('mel.sol.q', 'Dans {x}, quel est le soluté ?', 'في {x}، ما هو المذاب ؟');
  D('mel.solv.q', 'Dans {x}, quel est le solvant ?', 'في {x}، ما هو المذيب ؟');
  D('mel.sol.exp', 'Le solvant est le liquide qui dissout (l’eau) ; le soluté est ce qui est dissous : {r}.', 'المذيب هو السائل الذي يُذيب (الماء) والمذاب هو ما يذوب : {r}.');
  const CPS = ['distillee', 'fer', 'o2'], MELS = ['air', 'robinet', 'lait', 'jus', 'minerale'], HOM = ['sucre', 'sale', 'sirop'], HET = ['huile', 'sable', 'salade'];
  const SEP = { sable: 'filtration', sel: 'evaporation', pure: 'distillation', huile: 'decantation' };
  GEN.pc5e_melange = (p) => {
    const k = pick((p && p.kinds) || ['cp', 'hh', 'sep', 'sol']);
    if (k === 'cp') {
      const cp = Math.random() < 0.5, x = pick(cp ? CPS : MELS), a = cp ? 'cp' : 'mel';
      return { q: T('mel.cp.q', { x: T('y.' + x) }), kind: 'choice', ans: a, choices: oc(a, [cp ? 'mel' : 'cp']), exp: T('mel.cp.exp', { r: T('o.' + a) }) };
    }
    if (k === 'hh') {
      const ho = Math.random() < 0.5, x = pick(ho ? HOM : HET), a = ho ? 'homo' : 'hetero';
      return { q: T('mel.hh.q', { x: T('h.' + x) }), kind: 'choice', ans: a, choices: oc(a, [ho ? 'hetero' : 'homo']), exp: T('mel.hh.exp', { r: T('o.' + a) }) };
    }
    if (k === 'sep') {
      const z = pick(Object.keys(SEP)), a = SEP[z];
      return { q: T('mel.sep.q', { z: T('z.' + z) }), kind: 'choice', ans: a, choices: oc(a, ['filtration', 'evaporation', 'distillation', 'decantation'].filter((x) => x !== a)), exp: T('mel.sep.exp', { r: T('o.' + a) }) };
    }
    const so = pick(['sucre', 'sel']), x = so === 'sucre' ? T('h.sucre') : T('h.sale'), asked = pick(['sol', 'solv']), a = asked === 'sol' ? 'w.' + so : 'w.eau';
    return { q: T('mel.' + asked + '.q', { x }), kind: 'choice', ans: a, choices: oc(a, ['w.eau', 'w.sucre', 'w.sel', 'w.huile'].filter((y) => y !== a)), exp: T('mel.sol.exp', { r: T('o.' + a) }) };
  };

  /* ----- textes ----- */
  Object.assign(root.STRINGS, FR);
  Object.assign(root.STRINGS_AR, AR);

  /* ----- titres arabes du catalogue ----- */
  Object.assign(root.AR_CATALOG, {
    'Circuits électriques': 'الدارات الكهربائية',
    'Mouvement et forces': 'الحركة والقوى',
    'Son, lumière et énergie': 'الصوت والضوء والطاقة',
    'États de la matière': 'الحالات الفيزيائية للمادة',
    'Masse, air et mélanges': 'الكتلة والهواء والمزائج',
    'Lampes en série ou en dérivation': 'مصباحان على التسلسل أو على التفرّع',
    'Conducteurs, isolants et circuit': 'النواقل والعوازل والدارة',
    'Vitesse, distance et durée': 'السرعة والمسافة والمدّة',
    'Convertir km/h et m/s': 'التحويل بين km/h و m/s',
    'Poids et masse': 'الوزن والكتلة',
    'Le son : distance et propagation': 'الصوت : المسافة والانتشار',
    'La lumière : vitesse et sources': 'الضوء : السرعة والمنابع',
    'Conversions et sources d’énergie': 'تحويلات الطاقة ومصادرها',
    'Reconnaître un état de la matière': 'التعرّف على الحالة الفيزيائية للمادة',
    'Nommer un changement d’état': 'تسمية تغيّر الحالة الفيزيائية',
    'Température et paliers de l’eau': 'درجة الحرارة ومراحل ثبات حرارة الماء',
    'Masse et volume de l’eau': 'كتلة الماء وحجمه',
    'L’air et ses gaz': 'الهواء وغازاته',
    'Mélanges et séparations': 'المزائج وطرق الفصل',
  });

  /* ----- catalogue ----- */
  const lv = (root.CATALOG_EXTRA || []).find((l) => l.id === '5e');
  lv.domains.push(
    { name: 'Physique', cats: [
      { name: 'Circuits électriques', skills: [
        ['Lampes en série ou en dérivation', 'pc5e_circuit', { kinds: ['type', 'type', 'dev', 'maison'] }],
        ['Conducteurs, isolants et circuit', 'pc5e_conducteur', {}],
      ] },
      { name: 'Mouvement et forces', skills: [
        ['Vitesse, distance et durée', 'pc5e_vitesse', {}],
        ['Convertir km/h et m/s', 'pc5e_conversion', {}],
        ['Poids et masse', 'pc5e_poids', {}],
      ] },
      { name: 'Son, lumière et énergie', skills: [
        ['Le son : distance et propagation', 'pc5e_son', {}],
        ['La lumière : vitesse et sources', 'pc5e_lumiere', {}],
        ['Conversions et sources d’énergie', 'pc5e_energie', {}],
      ] },
    ] },
    { name: 'Chimie', cats: [
      { name: 'États de la matière', skills: [
        ['Reconnaître un état de la matière', 'pc5e_etat', {}],
        ['Nommer un changement d’état', 'pc5e_changement', {}],
        ['Température et paliers de l’eau', 'pc5e_temperature', {}],
      ] },
      { name: 'Masse, air et mélanges', skills: [
        ['Masse et volume de l’eau', 'pc5e_masse', {}],
        ['L’air et ses gaz', 'pc5e_air', {}],
        ['Mélanges et séparations', 'pc5e_melange', {}],
      ] },
    ] }
  );
}(typeof window !== 'undefined' ? window : globalThis));
