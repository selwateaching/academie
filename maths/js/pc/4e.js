/* Physique-chimie, niveau 4e : générateurs, textes français et arabes, catalogue. */
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
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[R(0, a.length - 1)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const round = (x, k = 6) => Number(x.toFixed(k));
  const fmt = (x) => String(x).replace(/-/g, '−').replace('.', ',');
  const m = (s) => `<span class="m">${String(s).replace(/[؀-ۿ]+/g, '⁦$&⁩')}</span>`;
  const box = '<span class="box">?</span>';
  const mc = (correct, wrongs, labelf = (v) => m(v)) => {
    const seen = new Set([String(correct)]), out = [{ v: correct, label: labelf(correct) }];
    shuf(wrongs).forEach((w) => { if (!seen.has(String(w)) && out.length < 4) { seen.add(String(w)); out.push({ v: w, label: labelf(w) }); } });
    return shuf(out);
  };
  const yesNo = () => [{ v: 'y', label: t('yes') }, { v: 'n', label: t('no') }];
  const svg = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" direction="ltr" style="direction:ltr">${inner}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#334155'}" font-family="system-ui,sans-serif">${s}</text>`;
  const num = (q, ans, exp, vis) => ({ q, vis, kind: 'num', ans, exp });
  const SF = {}, SA = {};   // textes français / arabes

  /* ---------- figures ---------- */
  const lamp = (x, y, l) => `<circle cx="${x}" cy="${y}" r="14" fill="#fff" stroke="#334155" stroke-width="2"/><path d="M${x - 10} ${y - 10}L${x + 10} ${y + 10}M${x + 10} ${y - 10}L${x - 10} ${y + 10}" stroke="#334155" stroke-width="1.5"/>` + txt(x, y - 22, l, { s: 13 });
  const battery = (x) => `<path d="M${x} 25V52M${x} 64V95" stroke="#334155" stroke-width="2" fill="none"/><path d="M${x - 14} 52H${x + 14}" stroke="#334155" stroke-width="3"/><path d="M${x - 8} 64H${x + 8}" stroke="#334155" stroke-width="3"/>` + txt(x + 24, 52, '+', { s: 13 }) + txt(x + 24, 70, '−', { s: 13 });
  const circuitSerie = () => svg(300, 120, `${battery(40)}<path d="M40 25H106M154 25H186M234 25H260V95H40" stroke="#334155" stroke-width="2" fill="none"/>${lamp(130, 25, 'L1')}${lamp(210, 25, 'L2')}`);
  const circuitDeriv = () => svg(300, 120, `${battery(40)}<path d="M40 25H136M164 25H260V95H164M136 95H40" stroke="#334155" stroke-width="2" fill="none"/>${lamp(150, 25, 'L1')}${lamp(150, 95, 'L2').replace(/y="73"/, 'y="125"')}`);
  function mirrorFig(lbI, lbR, ang) {
    const x0 = 130, y0 = 120, L = 95, s = Math.sin(ang * Math.PI / 180), c = Math.cos(ang * Math.PI / 180);
    return svg(260, 150, `<path d="M20 120H240" stroke="#334155" stroke-width="4"/><path d="M${x0} 20V120" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 4"/>`
      + `<path d="M${x0 - L * s} ${y0 - L * c}L${x0} ${y0}" stroke="#dc2626" stroke-width="2.5"/><path d="M${x0} ${y0}L${x0 + L * s} ${y0 - L * c}" stroke="#2563eb" stroke-width="2.5"/>`
      + txt(x0 - 38, 60, lbI, { c: '#dc2626', s: 13 }) + txt(x0 + 38, 60, lbR, { c: '#2563eb', s: 13 }) + txt(x0 + 10, 140, 'N', { s: 12, c: '#64748b', a: 'start' }));
  }

  /* ---------- formules chimiques ---------- */
  const sub = (f) => f.replace(/(\d+)/g, '<sub>$1</sub>');
  function atomsOf(f) { const o = {}; String(f).replace(/([A-Z][a-z]?)(\d*)/g, (_, e, n) => { o[e] = (o[e] || 0) + (n ? +n : 1); }); return o; }
  const MOLS = [
    ['H2O', 'eau', 'الماء'], ['CO2', 'dioxyde de carbone', 'ثنائي أكسيد الكربون'], ['CH4', 'méthane', 'الميثان'], ['O2', 'dioxygène', 'ثنائي الأكسجين'],
    ['N2', 'diazote', 'ثنائي الأزوت'], ['NH3', 'ammoniac', 'النشادر'], ['C3H8', 'propane', 'البروبان'], ['C4H10', 'butane', 'البوتان'],
    ['H2SO4', 'acide sulfurique', 'حمض الكبريت'], ['C6H12O6', 'glucose', 'الغلوكوز'], ['C2H6O', 'éthanol', 'الإيثانول'], ['H2O2', 'eau oxygénée', 'الماء الأكسجيني'],
  ];
  const ELS = [['H', 'hydrogène', 'الهيدروجين'], ['C', 'carbone', 'الكربون'], ['O', 'oxygène', 'الأكسجين'], ['N', 'azote', 'الأزوت'], ['S', 'soufre', 'الكبريت']];
  MOLS.forEach(([f, fr, ar]) => { SF['pc.4e.mol.' + f] = fr; SA['pc.4e.mol.' + f] = ar; });
  ELS.forEach(([f, fr, ar]) => { SF['pc.4e.el.' + f] = fr; SA['pc.4e.el.' + f] = ar; });

  /* ---------- banque de QCM : [question, explication, bonne réponse, [mauvaises]] ---------- */
  function bank(id, fr, ar) {
    fr.forEach((it, i) => {
      [[fr, SF], [ar, SA]].forEach(([src, dst]) => {
        const x = src[i], p = `pc.4e.${id}.${i}.`;
        dst[p + 'q'] = x[0]; dst[p + 'e'] = x[1]; dst[p + 'a'] = x[2];
        x[3].forEach((w, j) => { dst[p + 'w' + j] = w; });
      });
    });
    GEN['pc4e_' + id] = () => {
      const i = R(0, fr.length - 1), p = `pc.4e.${id}.${i}.`;
      return { q: t(p + 'q'), kind: 'choice', ans: 'a', choices: mc('a', fr[i][3].map((_, j) => 'w' + j), (k) => t(p + k)), exp: t(p + 'e') };
    };
  }

  /* ===================================================== Courant et tension */
  GEN.pc4e_intens = (p) => {
    const k = pick(p.kinds);
    if (k === 'toA') {
      const v = pick([20, 50, 80, 120, 150, 250, 300, 450, 600, 750, 900]), r = round(v / 1000, 3);
      return num(t('pc.4e.intens.toA.q', { v: m(v + ' mA') }), r, t('pc.4e.intens.toA.exp', { a: m(v + ' mA'), n: m(v), r: m(fmt(r) + ' A') }));
    }
    const v = pick([0.02, 0.05, 0.12, 0.25, 0.35, 0.4, 0.6, 0.85, 1.5]), r = round(v * 1000, 3);
    return num(t('pc.4e.intens.tomA.q', { v: m(fmt(v) + ' A') }), r, t('pc.4e.intens.tomA.exp', { a: m(fmt(v) + ' A'), n: m(fmt(v)), r: m(r + ' mA') }));
  };
  Object.assign(SF, {
    'pc.4e.intens.toA.q': 'L’intensité du courant dans un circuit est de {v}. Exprime-la en ampères (A).',
    'pc.4e.intens.toA.exp': '1 mA = 0,001 A, donc {a} = {n} × 0,001 A = {r}.',
    'pc.4e.intens.tomA.q': 'Un ampèremètre indique {v}. Exprime cette intensité en milliampères (mA).',
    'pc.4e.intens.tomA.exp': '1 A = 1 000 mA, donc {a} = {n} × 1 000 mA = {r}.',
  });
  Object.assign(SA, {
    'pc.4e.intens.toA.q': 'شدة التيار في دارة كهربائية تساوي {v}. عبّر عنها بالأمبير (A).',
    'pc.4e.intens.toA.exp': '1 mA = 0,001 A ، إذن {a} = {n} × 0,001 A = {r}.',
    'pc.4e.intens.tomA.q': 'يشير الأمبيرمتر إلى {v}. عبّر عن هذه الشدة بالميلي أمبير (mA).',
    'pc.4e.intens.tomA.exp': '1 A = 1 000 mA ، إذن {a} = {n} × 1 000 mA = {r}.',
  });

  GEN.pc4e_serie = (p) => {
    const k = pick(p.kinds), step = () => R(2, 9) / 2;
    if (k === 'u') {
      const w = pick(['gen', 'lamp', 'equal']);
      if (w === 'gen') {
        const a = step(), b = step(), r = round(a + b, 1);
        return num(t('pc.4e.serie.gen.q', { a: m(fmt(a) + ' V'), b: m(fmt(b) + ' V') }), r, t('pc.4e.serie.gen.exp', { a: m(fmt(a)), b: m(fmt(b)), r: m(fmt(r) + ' V') }), circuitSerie());
      }
      if (w === 'lamp') {
        const a = step(), b = step(), U = round(a + b, 1);
        return num(t('pc.4e.serie.lamp.q', { U: m(fmt(U) + ' V'), a: m(fmt(a) + ' V') }), b, t('pc.4e.serie.lamp.exp', { U: m(fmt(U)), a: m(fmt(a)), r: m(fmt(b) + ' V') }), circuitSerie());
      }
      const U = pick([4, 6, 8, 10, 12]);
      return num(t('pc.4e.serie.equal.q', { U: m(U + ' V') }), U / 2, t('pc.4e.serie.equal.exp', { U: m(U), r: m(U / 2 + ' V') }), circuitSerie());
    }
    const v = pick([40, 60, 120, 150, 240, 300, 350, 450]), r = round(v / 1000, 3);
    return num(t('pc.4e.serie.i.q', { v: m(v + ' mA') }), r, t('pc.4e.serie.i.exp', { v: m(v + ' mA'), r: m(fmt(r) + ' A') }), circuitSerie());
  };
  Object.assign(SF, {
    'pc.4e.serie.gen.q': 'Dans un circuit en série, la tension aux bornes de la lampe L1 est {a} et la tension aux bornes de la lampe L2 est {b}. Quelle est la tension (en V) aux bornes de la pile ?',
    'pc.4e.serie.gen.exp': 'En série, la tension de la pile est la somme des tensions : {a} + {b} = {r}.',
    'pc.4e.serie.lamp.q': 'Une pile de {U} alimente en série deux lampes L1 et L2. La tension aux bornes de L1 est {a}. Calcule la tension (en V) aux bornes de L2.',
    'pc.4e.serie.lamp.exp': 'U = U1 + U2, donc U2 = {U} − {a} = {r}.',
    'pc.4e.serie.equal.q': 'Une pile de {U} alimente en série deux lampes identiques. Quelle est la tension (en V) aux bornes de chaque lampe ?',
    'pc.4e.serie.equal.exp': 'Les deux lampes sont identiques : la tension se partage en deux parts égales, {U} ÷ 2 = {r}.',
    'pc.4e.serie.i.q': 'Dans un circuit en série, l’ampèremètre placé près de la lampe L1 indique {v}. Quelle intensité (en A) indiquerait un ampèremètre placé près de la lampe L2 ?',
    'pc.4e.serie.i.exp': 'En série, l’intensité est la même partout : {v} = {r}.',
  });
  Object.assign(SA, {
    'pc.4e.serie.gen.q': 'في دارة على التسلسل، التوتر بين طرفَي المصباح L1 هو {a} والتوتر بين طرفَي المصباح L2 هو {b}. ما هو التوتر (بالفولط) بين طرفَي العمود ؟',
    'pc.4e.serie.gen.exp': 'على التسلسل، توتر العمود يساوي مجموع التوترات : {a} + {b} = {r}.',
    'pc.4e.serie.lamp.q': 'عمود توتره {U} يغذّي على التسلسل مصباحين L1 و L2. التوتر بين طرفَي L1 هو {a}. احسب التوتر (بالفولط) بين طرفَي L2.',
    'pc.4e.serie.lamp.exp': 'U = U1 + U2 ، إذن U2 = {U} − {a} = {r}.',
    'pc.4e.serie.equal.q': 'عمود توتره {U} يغذّي على التسلسل مصباحين متماثلين. ما هو التوتر (بالفولط) بين طرفَي كل مصباح ؟',
    'pc.4e.serie.equal.exp': 'المصباحان متماثلان : ينقسم التوتر إلى حصتين متساويتين، {U} ÷ 2 = {r}.',
    'pc.4e.serie.i.q': 'في دارة على التسلسل، يشير الأمبيرمتر الموضوع قرب المصباح L1 إلى {v}. ما هي الشدة (بالأمبير) التي يشير إليها أمبيرمتر موضوع قرب المصباح L2 ؟',
    'pc.4e.serie.i.exp': 'على التسلسل، تكون الشدة نفسها في كل مكان : {v} = {r}.',
  });

  GEN.pc4e_deriv = (p) => {
    const k = pick(p.kinds), d = () => R(1, 6) / 10;
    if (k === 'sum') {
      const a = d(), b = d(), r = round(a + b, 1);
      return num(t('pc.4e.deriv.sum.q', { a: m(fmt(a) + ' A'), b: m(fmt(b) + ' A') }), r, t('pc.4e.deriv.sum.exp', { a: m(fmt(a)), b: m(fmt(b)), r: m(fmt(r) + ' A') }), circuitDeriv());
    }
    if (k === 'branch') {
      const a = d(), b = d(), I = round(a + b, 1);
      return num(t('pc.4e.deriv.branch.q', { I: m(fmt(I) + ' A'), a: m(fmt(a) + ' A') }), b, t('pc.4e.deriv.branch.exp', { I: m(fmt(I)), a: m(fmt(a)), r: m(fmt(b) + ' A') }), circuitDeriv());
    }
    const U = pick([1.5, 3, 4.5, 6, 9, 12]);
    return num(t('pc.4e.deriv.u.q', { U: m(fmt(U) + ' V') }), U, t('pc.4e.deriv.u.exp', { U: m(fmt(U) + ' V') }), circuitDeriv());
  };
  Object.assign(SF, {
    'pc.4e.deriv.sum.q': 'Dans un circuit en dérivation, la lampe L1 est traversée par un courant de {a} et la lampe L2 par un courant de {b}. Quelle est l’intensité (en A) dans la branche principale, celle de la pile ?',
    'pc.4e.deriv.sum.exp': 'En dérivation, l’intensité principale est la somme des intensités des branches : {a} + {b} = {r}.',
    'pc.4e.deriv.branch.q': 'Dans un circuit en dérivation, l’intensité dans la branche principale est {I} et celle dans la branche de la lampe L1 est {a}. Calcule l’intensité (en A) dans la branche de la lampe L2.',
    'pc.4e.deriv.branch.exp': 'I = I1 + I2, donc I2 = {I} − {a} = {r}.',
    'pc.4e.deriv.u.q': 'Dans un circuit en dérivation, la tension aux bornes de la pile est {U}. Quelle est la tension (en V) aux bornes de la lampe L2 ?',
    'pc.4e.deriv.u.exp': 'En dérivation, la tension est la même aux bornes de chaque branche et de la pile : {U}.',
  });
  Object.assign(SA, {
    'pc.4e.deriv.sum.q': 'في دارة على التفرّع، يمرّ في المصباح L1 تيار شدته {a} وفي المصباح L2 تيار شدته {b}. ما هي الشدة (بالأمبير) في الفرع الرئيسي، فرع العمود ؟',
    'pc.4e.deriv.sum.exp': 'على التفرّع، الشدة الرئيسية تساوي مجموع شدّات الفروع : {a} + {b} = {r}.',
    'pc.4e.deriv.branch.q': 'في دارة على التفرّع، الشدة في الفرع الرئيسي هي {I} والشدة في فرع المصباح L1 هي {a}. احسب الشدة (بالأمبير) في فرع المصباح L2.',
    'pc.4e.deriv.branch.exp': 'I = I1 + I2 ، إذن I2 = {I} − {a} = {r}.',
    'pc.4e.deriv.u.q': 'في دارة على التفرّع، التوتر بين طرفَي العمود هو {U}. ما هو التوتر (بالفولط) بين طرفَي المصباح L2 ؟',
    'pc.4e.deriv.u.exp': 'على التفرّع، التوتر نفسه بين طرفَي كل فرع وبين طرفَي العمود : {U}.',
  });

  bank('appareils', [
    ['L’ampèremètre se branche :', 'L’ampèremètre mesure le courant qui le traverse : il se place en série.', 'en série dans le circuit', ['en dérivation aux bornes du dipôle', 'seulement aux bornes de la pile']],
    ['Le voltmètre se branche :', 'Le voltmètre mesure une tension entre deux points : il se place en dérivation aux bornes du dipôle.', 'en dérivation aux bornes du dipôle', ['en série dans le circuit', 'sur le fil le plus long']],
    ['L’unité de l’intensité du courant est :', 'L’intensité se mesure en ampères (A).', 'l’ampère (A)', ['le volt (V)', 'le newton (N)', 'le kilogramme (kg)']],
    ['L’unité de la tension électrique est :', 'La tension se mesure en volts (V).', 'le volt (V)', ['l’ampère (A)', 'le newton (N)', 'le kilogramme (kg)']],
    ['La tension du secteur (prise de la maison) est de :', 'Le secteur fournit 230 V, une tension dangereuse.', '230 V', ['1,5 V', '12 V', '4,5 V']],
    ['Le courant du secteur est :', 'Le courant du secteur est alternatif et sa fréquence est de 50 Hz.', 'alternatif, de fréquence 50 Hz', ['continu, comme celui d’une pile', 'continu, de fréquence 50 Hz', 'alternatif, de fréquence 5 Hz']],
    ['Quel dispositif coupe le courant en cas de surintensité ?', 'Le fusible (ou le disjoncteur) coupe le circuit quand l’intensité est trop grande.', 'le fusible', ['la lampe', 'l’ampèremètre', 'le voltmètre']],
    ['Pour éviter l’électrocution, il faut :', 'L’eau conduit l’électricité : on ne touche jamais un appareil électrique avec les mains mouillées.', 'ne jamais toucher un appareil électrique avec les mains mouillées', ['brancher beaucoup d’appareils sur la même prise', 'réparer un appareil sans couper le courant']],
    ['Dans un métal, le courant électrique est dû au déplacement :', 'Ce sont les électrons libres qui se déplacent dans un fil métallique.', 'd’électrons libres', ['d’atomes entiers', 'de molécules d’eau']],
    ['Le sens conventionnel du courant, hors de la pile, va :', 'Par convention, le courant sort de la borne + et revient par la borne −.', 'de la borne + vers la borne −', ['de la borne − vers la borne +', 'dans les deux sens à la fois']],
    ['Avant de mesurer une intensité inconnue, on choisit d’abord :', 'On commence par le plus grand calibre pour ne pas abîmer l’appareil, puis on le diminue.', 'le plus grand calibre', ['le plus petit calibre', 'un calibre au hasard']],
    ['Une lampe porte l’indication « 6 V ». Cela signifie :', 'C’est sa tension nominale : elle brille normalement sous 6 V.', 'qu’elle brille normalement sous une tension de 6 V', ['qu’elle est traversée par 6 A', 'qu’elle pèse 6 g']],
  ], [
    ['يُركَّب الأمبيرمتر :', 'يقيس الأمبيرمتر التيار الذي يعبره، لذلك يوضع على التسلسل.', 'على التسلسل في الدارة', ['على التفرّع بين طرفَي ثنائي القطب', 'بين طرفَي العمود فقط']],
    ['يُركَّب الفولطمتر :', 'يقيس الفولطمتر توترًا بين نقطتين، لذلك يوضع على التفرّع بين طرفَي ثنائي القطب.', 'على التفرّع بين طرفَي ثنائي القطب', ['على التسلسل في الدارة', 'على أطول سلك']],
    ['وحدة شدة التيار الكهربائي هي :', 'تُقاس شدة التيار بالأمبير (A).', 'الأمبير (A)', ['الفولط (V)', 'النيوتن (N)', 'الكيلوغرام (kg)']],
    ['وحدة التوتر الكهربائي هي :', 'يُقاس التوتر بالفولط (V).', 'الفولط (V)', ['الأمبير (A)', 'النيوتن (N)', 'الكيلوغرام (kg)']],
    ['توتر القطاع (مأخذ المنزل) يساوي :', 'يوفّر القطاع 230 V ، وهو توتر خطير.', '230 V', ['1,5 V', '12 V', '4,5 V']],
    ['تيار القطاع هو تيار :', 'تيار القطاع متناوب وتواتره 50 Hz.', 'متناوب تواتره 50 Hz', ['مستمر مثل تيار العمود', 'مستمر تواتره 50 Hz', 'متناوب تواتره 5 Hz']],
    ['أي جهاز يقطع التيار عند ارتفاع الشدة أكثر من اللازم ؟', 'تقطع المنصهرة (أو القاطع) الدارة عندما تكون الشدة كبيرة جدًا.', 'المنصهرة', ['المصباح', 'الأمبيرمتر', 'الفولطمتر']],
    ['لتفادي الصعق الكهربائي يجب :', 'الماء ناقل للكهرباء : لا نلمس أي جهاز كهربائي بأيدٍ مبللة.', 'ألّا نلمس أي جهاز كهربائي بأيدٍ مبللة', ['وصل عدة أجهزة بالمأخذ نفسه', 'إصلاح جهاز دون قطع التيار']],
    ['في فلز، التيار الكهربائي ناتج عن حركة :', 'الإلكترونات الحرّة هي التي تتحرك داخل سلك فلزي.', 'إلكترونات حرّة', ['ذرات كاملة', 'جزيئات الماء']],
    ['الاتجاه الاصطلاحي للتيار خارج العمود هو :', 'اصطلاحًا، يخرج التيار من القطب الموجب ويعود عبر القطب السالب.', 'من القطب + نحو القطب −', ['من القطب − نحو القطب +', 'في الاتجاهين معًا']],
    ['قبل قياس شدة تيار مجهولة، نختار أولًا :', 'نبدأ بأكبر معيار حتى لا يتلف الجهاز، ثم نصغّره.', 'أكبر معيار', ['أصغر معيار', 'معيارًا عشوائيًا']],
    ['يحمل مصباح الكتابة « 6 V ». يعني ذلك :', 'هذا هو توتره الاسمي : يتوهّج المصباح بشكل عادي تحت 6 V.', 'أنه يتوهّج بشكل عادي تحت توتر 6 V', ['أنه يعبره تيار شدته 6 A', 'أن كتلته 6 g']],
  ]);

  /* ===================================================== Lumière */
  GEN.pc4e_reflex = (p) => {
    const k = pick(p.kinds);
    if (k === 'r') {
      const i = pick([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
      if (R(0, 1)) return num(t('pc.4e.reflex.r.q', { i: m(i + '°') }), i, t('pc.4e.reflex.r.exp', { i: m(i + '°') }), mirrorFig('i = ' + i + '°', 'r = ?', i));
      return num(t('pc.4e.reflex.i.q', { r: m(i + '°') }), i, t('pc.4e.reflex.i.exp', { r: m(i + '°') }), mirrorFig('i = ?', 'r = ' + i + '°', i));
    }
    if (k === 'mirror') {
      const a = pick([10, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70]), i = 90 - a;
      return num(t('pc.4e.reflex.mirror.q', { a: m(a + '°') }), i, t('pc.4e.reflex.mirror.exp', { a: m(a + '°'), r: m(i + '°') }));
    }
    const i = pick([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
    return num(t('pc.4e.reflex.between.q', { i: m(i + '°') }), 2 * i, t('pc.4e.reflex.between.exp', { i: m(i + '°'), r: m(2 * i + '°') }), mirrorFig('i', 'r', i));
  };
  Object.assign(SF, {
    'pc.4e.reflex.r.q': 'Un rayon lumineux arrive sur un miroir plan avec un angle d’incidence i = {i}. Quel est l’angle de réflexion r (en degrés) ?',
    'pc.4e.reflex.r.exp': 'Loi de la réflexion : r = i = {i}.',
    'pc.4e.reflex.i.q': 'Un rayon lumineux est réfléchi par un miroir plan avec un angle de réflexion r = {r}. Quel est l’angle d’incidence i (en degrés) ?',
    'pc.4e.reflex.i.exp': 'Loi de la réflexion : i = r = {r}.',
    'pc.4e.reflex.mirror.q': 'Un rayon lumineux fait un angle de {a} avec la surface d’un miroir plan. Quel est l’angle d’incidence i (en degrés), mesuré par rapport à la normale ?',
    'pc.4e.reflex.mirror.exp': 'La normale est perpendiculaire au miroir (90°), donc i = 90° − {a} = {r}.',
    'pc.4e.reflex.between.q': 'L’angle d’incidence d’un rayon sur un miroir plan est i = {i}. Quel est l’angle (en degrés) entre le rayon incident et le rayon réfléchi ?',
    'pc.4e.reflex.between.exp': 'On a r = i = {i}. L’angle entre les deux rayons est i + r = {r}.',
  });
  Object.assign(SA, {
    'pc.4e.reflex.r.q': 'يرد شعاع ضوئي على مرآة مستوية بزاوية ورود i = {i}. ما هي زاوية الانعكاس r (بالدرجات) ؟',
    'pc.4e.reflex.r.exp': 'قانون الانعكاس : r = i = {i}.',
    'pc.4e.reflex.i.q': 'ينعكس شعاع ضوئي على مرآة مستوية بزاوية انعكاس r = {r}. ما هي زاوية الورود i (بالدرجات) ؟',
    'pc.4e.reflex.i.exp': 'قانون الانعكاس : i = r = {r}.',
    'pc.4e.reflex.mirror.q': 'يصنع شعاع ضوئي زاوية {a} مع سطح مرآة مستوية. ما هي زاوية الورود i (بالدرجات)، المقاسة بالنسبة إلى الناظم ؟',
    'pc.4e.reflex.mirror.exp': 'الناظم عمودي على المرآة (90°) ، إذن i = 90° − {a} = {r}.',
    'pc.4e.reflex.between.q': 'زاوية ورود شعاع على مرآة مستوية هي i = {i}. ما هي الزاوية (بالدرجات) بين الشعاع الوارد والشعاع المنعكس ؟',
    'pc.4e.reflex.between.exp': 'لدينا r = i = {i}. الزاوية بين الشعاعين هي i + r = {r}.',
  });

  bank('couleurs', [
    ['Un prisme éclairé en lumière blanche donne :', 'Le prisme décompose la lumière blanche en un spectre de couleurs.', 'un spectre de couleurs', ['une seule couleur', 'de l’obscurité']],
    ['Quelles couleurs sont aux deux extrémités du spectre de la lumière blanche ?', 'Le spectre va du rouge au violet.', 'le rouge et le violet', ['le jaune et le vert', 'le bleu et le jaune', 'le noir et le blanc']],
    ['La lumière blanche est une lumière :', 'Elle contient toutes les couleurs du spectre : elle est polychromatique.', 'polychromatique', ['monochromatique', 'toujours produite par un laser']],
    ['La lumière d’un laser rouge est une lumière :', 'Elle ne contient qu’une seule couleur : elle est monochromatique.', 'monochromatique', ['polychromatique', 'blanche']],
    ['Un arc-en-ciel se forme quand la lumière du Soleil traverse :', 'Les gouttes d’eau jouent le rôle de petits prismes.', 'des gouttes d’eau', ['un miroir plan', 'de la fumée épaisse']],
    ['Un objet paraît rouge en lumière blanche, car il :', 'Il renvoie surtout le rouge et absorbe les autres couleurs.', 'renvoie surtout le rouge et absorbe les autres couleurs', ['absorbe le rouge et renvoie les autres couleurs', 'renvoie toutes les couleurs', 'absorbe toute la lumière']],
    ['Un objet noir éclairé en lumière blanche :', 'Un objet noir absorbe presque toute la lumière qu’il reçoit.', 'absorbe presque toute la lumière', ['renvoie toute la lumière', 'décompose la lumière']],
    ['Un objet blanc éclairé en lumière blanche :', 'Un objet blanc renvoie toutes les couleurs.', 'renvoie toutes les couleurs', ['absorbe toutes les couleurs', 'absorbe seulement le rouge']],
    ['Un prisme est éclairé par un laser rouge. On observe :', 'Le laser est monochromatique : le prisme ne le décompose pas.', 'une seule couleur : le rouge', ['tout le spectre', 'de la lumière blanche']],
  ], [
    ['موشور مضاء بالضوء الأبيض يعطي :', 'يحلّل الموشور الضوء الأبيض إلى طيف من الألوان.', 'طيفًا من الألوان', ['لونًا واحدًا فقط', 'الظلام']],
    ['ما اللونان عند طرفَي طيف الضوء الأبيض ؟', 'يمتد الطيف من الأحمر إلى البنفسجي.', 'الأحمر والبنفسجي', ['الأصفر والأخضر', 'الأزرق والأصفر', 'الأسود والأبيض']],
    ['الضوء الأبيض ضوء :', 'يحتوي على كل ألوان الطيف : فهو متعدد الألوان.', 'متعدد الألوان', ['أحادي اللون', 'ينتجه دائمًا ليزر']],
    ['ضوء ليزر أحمر هو ضوء :', 'لا يحتوي إلا على لون واحد : فهو أحادي اللون.', 'أحادي اللون', ['متعدد الألوان', 'أبيض']],
    ['يتشكّل قوس قزح عندما يعبر ضوء الشمس :', 'تلعب قطرات الماء دور موشورات صغيرة.', 'قطرات الماء', ['مرآة مستوية', 'دخانًا كثيفًا']],
    ['يظهر جسم أحمر بالضوء الأبيض لأنه :', 'يعكس اللون الأحمر أساسًا ويمتص الألوان الأخرى.', 'يعكس اللون الأحمر أساسًا ويمتص الألوان الأخرى', ['يمتص الأحمر ويعكس الألوان الأخرى', 'يعكس كل الألوان', 'يمتص كل الضوء']],
    ['جسم أسود مضاء بالضوء الأبيض :', 'يمتص الجسم الأسود كل الضوء الذي يستقبله تقريبًا.', 'يمتص كل الضوء تقريبًا', ['يعكس كل الضوء', 'يحلّل الضوء']],
    ['جسم أبيض مضاء بالضوء الأبيض :', 'يعكس الجسم الأبيض كل الألوان.', 'يعكس كل الألوان', ['يمتص كل الألوان', 'يمتص اللون الأحمر فقط']],
    ['نضيء موشورًا بليزر أحمر. نلاحظ :', 'الليزر أحادي اللون : لا يحلّله الموشور.', 'لونًا واحدًا : الأحمر', ['كل الطيف', 'ضوءًا أبيض']],
  ]);

  /* ===================================================== Poids */
  GEN.pc4e_poids = (p) => {
    const k = pick(p.kinds);
    if (k === 'P') { const mm = pick([2, 3, 4, 5, 6, 8, 12, 15, 20, 45, 60, 75]); return num(t('pc.4e.poids.P.q', { m: m(mm + ' kg') }), mm * 10, t('pc.4e.poids.P.exp', { m: m(mm), r: m(mm * 10 + ' N') })); }
    if (k === 'm') { const mm = pick([2, 3, 4, 5, 6, 8, 12, 15, 20, 45]); return num(t('pc.4e.poids.m.q', { P: m(mm * 10 + ' N') }), mm, t('pc.4e.poids.m.exp', { P: m(mm * 10), r: m(mm + ' kg') })); }
    if (k === 'gram') { const g = pick([200, 250, 400, 500, 600, 750, 800, 1500]), kg = round(g / 1000, 3), P = round(kg * 10, 3); return num(t('pc.4e.poids.gram.q', { m: m(g + ' g') }), P, t('pc.4e.poids.gram.exp', { m: m(g + ' g'), kg: m(fmt(kg) + ' kg'), k: m(fmt(kg)), r: m(fmt(P) + ' N') })); }
    if (k === 'moon') { const mm = pick([5, 10, 15, 20, 25, 30, 40, 50]), P = round(mm * 1.6, 3); return num(t('pc.4e.poids.moon.q', { m: m(mm + ' kg') }), P, t('pc.4e.poids.moon.exp', { m: m(mm), r: m(fmt(P) + ' N') })); }
    const g = pick([1.6, 3.7, 8.9, 24.8]), mm = pick([2, 5, 10]), P = round(g * mm, 3);
    return num(t('pc.4e.poids.g.q', { m: m(mm + ' kg'), P: m(fmt(P) + ' N') }), g, t('pc.4e.poids.g.exp', { P: m(fmt(P)), m: m(mm), r: m(fmt(g) + ' N/kg') }));
  };
  Object.assign(SF, {
    'pc.4e.poids.P.q': 'Calcule le poids (en N) d’un objet de masse {m} sur Terre. On prend g = 10 N/kg.',
    'pc.4e.poids.P.exp': 'P = m × g = {m} × 10 = {r}.',
    'pc.4e.poids.m.q': 'Un objet a un poids de {P} sur Terre. Calcule sa masse (en kg). On prend g = 10 N/kg.',
    'pc.4e.poids.m.exp': 'm = P ÷ g = {P} ÷ 10 = {r}.',
    'pc.4e.poids.gram.q': 'Un objet a une masse de {m}. Calcule son poids (en N) sur Terre. On prend g = 10 N/kg.',
    'pc.4e.poids.gram.exp': '{m} = {kg}, puis P = m × g = {k} × 10 = {r}.',
    'pc.4e.poids.moon.q': 'Sur la Lune, g = 1,6 N/kg. Calcule le poids (en N) d’un objet de masse {m} sur la Lune.',
    'pc.4e.poids.moon.exp': 'P = m × g = {m} × 1,6 = {r}.',
    'pc.4e.poids.g.q': 'Sur un astre, un objet de masse {m} a un poids de {P}. Calcule l’intensité de la pesanteur g (en N/kg) sur cet astre.',
    'pc.4e.poids.g.exp': 'g = P ÷ m = {P} ÷ {m} = {r}.',
  });
  Object.assign(SA, {
    'pc.4e.poids.P.q': 'احسب وزن (بالنيوتن) جسم كتلته {m} على الأرض. نأخذ g = 10 N/kg.',
    'pc.4e.poids.P.exp': 'P = m × g = {m} × 10 = {r}.',
    'pc.4e.poids.m.q': 'وزن جسم على الأرض هو {P}. احسب كتلته (بالكيلوغرام). نأخذ g = 10 N/kg.',
    'pc.4e.poids.m.exp': 'm = P ÷ g = {P} ÷ 10 = {r}.',
    'pc.4e.poids.gram.q': 'كتلة جسم هي {m}. احسب وزنه (بالنيوتن) على الأرض. نأخذ g = 10 N/kg.',
    'pc.4e.poids.gram.exp': '{m} = {kg} ، ثم P = m × g = {k} × 10 = {r}.',
    'pc.4e.poids.moon.q': 'على سطح القمر، g = 1,6 N/kg. احسب وزن (بالنيوتن) جسم كتلته {m} على القمر.',
    'pc.4e.poids.moon.exp': 'P = m × g = {m} × 1,6 = {r}.',
    'pc.4e.poids.g.q': 'على سطح كوكب، وزن جسم كتلته {m} هو {P}. احسب شدة الثقل g (بالنيوتن لكل كيلوغرام) على هذا الكوكب.',
    'pc.4e.poids.g.exp': 'g = P ÷ m = {P} ÷ {m} = {r}.',
  });

  /* ===================================================== Atomes et molécules */
  bank('atomes', [
    ['Un atome est constitué :', 'Un atome a un noyau, autour duquel tournent des électrons.', 'd’un noyau et d’électrons', ['uniquement d’électrons', 'de plusieurs molécules']],
    ['Les électrons ont une charge :', 'Les électrons sont chargés négativement.', 'négative', ['positive', 'nulle']],
    ['Le noyau d’un atome a une charge :', 'Le noyau est chargé positivement.', 'positive', ['négative', 'nulle']],
    ['Un atome est :', 'Il y a autant de charges + que de charges − : l’atome est neutre.', 'électriquement neutre', ['chargé positivement', 'chargé négativement']],
    ['Le symbole chimique du carbone est :', 'Le carbone se note C.', 'C', ['Ca', 'Cu', 'O']],
    ['Le symbole chimique de l’oxygène est :', 'L’oxygène se note O.', 'O', ['N', 'H', 'Ox']],
    ['Le symbole chimique de l’hydrogène est :', 'L’hydrogène se note H.', 'H', ['He', 'Hy', 'O']],
    ['Quel élément a pour symbole Fe ?', 'Fe est le symbole du fer.', 'le fer', ['le fluor', 'le cuivre', 'le phosphore']],
    ['Quel élément a pour symbole N ?', 'N est le symbole de l’azote.', 'l’azote', ['le sodium', 'l’oxygène', 'le néon']],
    ['Le symbole chimique du cuivre est :', 'Le cuivre se note Cu.', 'Cu', ['C', 'Co', 'Fe']],
    ['Un atome est surtout constitué :', 'Le noyau est minuscule : entre le noyau et les électrons, il n’y a que du vide.', 'de vide', ['de matière dense', 'd’eau']],
  ], [
    ['تتكوّن الذرة من :', 'للذرة نواة تدور حولها إلكترونات.', 'نواة وإلكترونات', ['إلكترونات فقط', 'عدة جزيئات']],
    ['شحنة الإلكترونات :', 'الإلكترونات سالبة الشحنة.', 'سالبة', ['موجبة', 'منعدمة']],
    ['شحنة نواة الذرة :', 'النواة موجبة الشحنة.', 'موجبة', ['سالبة', 'منعدمة']],
    ['الذرة :', 'عدد الشحنات + يساوي عدد الشحنات − : الذرة متعادلة.', 'متعادلة كهربائيًا', ['موجبة الشحنة', 'سالبة الشحنة']],
    ['الرمز الكيميائي للكربون هو :', 'يُرمز للكربون بالرمز C.', 'C', ['Ca', 'Cu', 'O']],
    ['الرمز الكيميائي للأكسجين هو :', 'يُرمز للأكسجين بالرمز O.', 'O', ['N', 'H', 'Ox']],
    ['الرمز الكيميائي للهيدروجين هو :', 'يُرمز للهيدروجين بالرمز H.', 'H', ['He', 'Hy', 'O']],
    ['أي عنصر رمزه Fe ؟', 'Fe هو رمز الحديد.', 'الحديد', ['الفلور', 'النحاس', 'الفوسفور']],
    ['أي عنصر رمزه N ؟', 'N هو رمز الأزوت.', 'الأزوت', ['الصوديوم', 'الأكسجين', 'النيون']],
    ['الرمز الكيميائي للنحاس هو :', 'يُرمز للنحاس بالرمز Cu.', 'Cu', ['C', 'Co', 'Fe']],
    ['تتكوّن الذرة في معظمها من :', 'النواة صغيرة جدًا : لا يوجد بين النواة والإلكترونات سوى الفراغ.', 'الفراغ', ['مادة كثيفة', 'الماء']],
  ]);

  GEN.pc4e_formule = (p) => {
    const k = pick(p.kinds), [f, ,] = pick(MOLS), at = atomsOf(f), name = t('pc.4e.mol.' + f), F = m(sub(f));
    if (k === 'total') {
      const r = Object.values(at).reduce((a, b) => a + b, 0), parts = Object.keys(at).map((e) => at[e] + ' ' + e).join(' + ');
      return num(t('pc.4e.formule.total.q', { name, f: F }), r, t('pc.4e.formule.total.exp', { f: F, parts: m(parts), r: m(r) }));
    }
    if (k === 'elem') {
      const e = pick(Object.keys(at)), en = t('pc.4e.el.' + e);
      return num(t('pc.4e.formule.elem.q', { name, f: F, e: m(e), en }), at[e], t('pc.4e.formule.elem.exp', { f: F, e: m(e), r: m(at[e]) }));
    }
    if (k === 'kinds') return num(t('pc.4e.formule.kinds.q', { name, f: F }), Object.keys(at).length, t('pc.4e.formule.kinds.exp', { f: F, l: m(Object.keys(at).join(', ')), r: m(Object.keys(at).length) }));
    // which : quelle formule correspond à la composition ?
    const comp = Object.keys(at).map((e) => at[e] + ' ' + e).join(' + ');
    const wr = MOLS.map((x) => x[0]).filter((x) => x !== f);
    return { q: t('pc.4e.formule.which.q', { comp: m(comp) }), kind: 'choice', ans: f, choices: mc(f, wr, (v) => m(sub(v))), exp: t('pc.4e.formule.which.exp', { comp: m(comp), f: F }) };
  };
  Object.assign(SF, {
    'pc.4e.formule.total.q': 'Combien d’atomes y a-t-il au total dans la molécule suivante : {name}, de formule {f} ?',
    'pc.4e.formule.total.exp': 'On additionne les atomes de la formule {f} : {parts} = {r} atomes.',
    'pc.4e.formule.elem.q': 'Combien d’atomes de l’élément {en} ({e}) y a-t-il dans la molécule suivante : {name}, de formule {f} ?',
    'pc.4e.formule.elem.exp': 'Dans la formule {f}, l’indice du symbole {e} donne le nombre d’atomes : {r}.',
    'pc.4e.formule.kinds.q': 'Combien d’éléments chimiques différents contient la molécule suivante : {name}, de formule {f} ?',
    'pc.4e.formule.kinds.exp': 'La formule {f} contient les symboles {l} : {r} éléments différents.',
    'pc.4e.formule.which.q': 'Quelle est la formule d’une molécule composée de {comp} ?',
    'pc.4e.formule.which.exp': 'La molécule composée de {comp} a pour formule {f}.',
  });
  Object.assign(SA, {
    'pc.4e.formule.total.q': 'كم ذرة توجد في المجموع في الجزيء التالي : {name}، صيغته {f} ؟',
    'pc.4e.formule.total.exp': 'نجمع ذرات الصيغة {f} : {parts} = {r} ذرة.',
    'pc.4e.formule.elem.q': 'كم ذرة من العنصر {en} ({e}) توجد في الجزيء التالي : {name}، صيغته {f} ؟',
    'pc.4e.formule.elem.exp': 'في الصيغة {f}، يدلّ الرقم السفلي بجانب الرمز {e} على عدد الذرات : {r}.',
    'pc.4e.formule.kinds.q': 'كم عنصرًا كيميائيًا مختلفًا يحتوي عليه الجزيء التالي : {name}، صيغته {f} ؟',
    'pc.4e.formule.kinds.exp': 'تحتوي الصيغة {f} على الرموز {l} : {r} عناصر مختلفة.',
    'pc.4e.formule.which.q': 'ما صيغة الجزيء المكوَّن من {comp} ؟',
    'pc.4e.formule.which.exp': 'صيغة الجزيء المكوَّن من {comp} هي {f}.',
  });

  /* ===================================================== Transformations chimiques */
  bank('transfo', [
    ['Quelle transformation est chimique ?', 'Quand le fer rouille, une nouvelle substance, l’oxyde de fer, apparaît.', 'le fer qui rouille', ['la glace qui fond', 'le sucre qui se dissout dans l’eau', 'l’eau qui s’évapore']],
    ['Quelle transformation est physique ?', 'Quand l’eau bout, ses molécules ne changent pas : elle passe seulement à l’état gazeux.', 'l’eau qui bout', ['le bois qui brûle', 'le fer qui rouille', 'un œuf qui cuit']],
    ['Dans une transformation chimique, les substances qui disparaissent s’appellent :', 'Les réactifs disparaissent, les produits apparaissent.', 'les réactifs', ['les produits', 'les mélanges']],
    ['Dans une transformation chimique, les substances qui apparaissent s’appellent :', 'Les produits sont les nouvelles substances formées.', 'les produits', ['les réactifs', 'les solvants']],
    ['Le fer rouille : fer + dioxygène → oxyde de fer. Quel est le produit ?', 'Le produit est la substance qui apparaît : l’oxyde de fer.', 'l’oxyde de fer', ['le fer', 'le dioxygène']],
    ['Un dégagement gazeux, un changement de couleur ou un dépôt solide indique souvent :', 'Ces indices montrent que de nouvelles substances se forment.', 'une transformation chimique', ['une simple dissolution', 'qu’il ne se passe rien']],
    ['Dans une transformation physique, les molécules :', 'Elles ne changent pas : il n’y a pas de nouvelle substance.', 'ne changent pas', ['sont remplacées par de nouvelles molécules', 'disparaissent']],
    ['On dissout du sucre dans l’eau. C’est une transformation :', 'Le sucre est seulement dissous : les molécules ne changent pas.', 'physique', ['chimique']],
    ['La fusion de la glace est une transformation :', 'La glace devient de l’eau liquide, mais ce sont toujours les mêmes molécules.', 'physique', ['chimique']],
    ['Quelle transformation est chimique ?', 'Le papier qui brûle donne de nouvelles substances (cendres, gaz).', 'le papier qui brûle', ['le papier qu’on déchire', 'l’eau liquide qui gèle', 'le sel qui se dissout dans l’eau']],
  ], [
    ['أي تحوّل هو تحوّل كيميائي ؟', 'عندما يصدأ الحديد، تظهر مادة جديدة هي أكسيد الحديد.', 'صدأ الحديد', ['انصهار الجليد', 'ذوبان السكر في الماء', 'تبخر الماء']],
    ['أي تحوّل هو تحوّل فيزيائي ؟', 'عندما يغلي الماء لا تتغير جزيئاته : ينتقل فقط إلى الحالة الغازية.', 'غليان الماء', ['احتراق الخشب', 'صدأ الحديد', 'طهي بيضة']],
    ['في التحوّل الكيميائي، تسمّى المواد التي تختفي :', 'تختفي المتفاعلات وتظهر النواتج.', 'المتفاعلات', ['النواتج', 'الخلائط']],
    ['في التحوّل الكيميائي، تسمّى المواد التي تظهر :', 'النواتج هي المواد الجديدة المتكوّنة.', 'النواتج', ['المتفاعلات', 'المذيبات']],
    ['يصدأ الحديد : حديد + ثنائي الأكسجين ← أكسيد الحديد. ما هو الناتج ؟', 'الناتج هو المادة التي تظهر : أكسيد الحديد.', 'أكسيد الحديد', ['الحديد', 'ثنائي الأكسجين']],
    ['انطلاق غاز أو تغيّر اللون أو ظهور راسب صلب يدلّ غالبًا على :', 'تبيّن هذه المؤشرات أن مواد جديدة تتكوّن.', 'تحوّل كيميائي', ['مجرد انحلال', 'أنه لا يحدث شيء']],
    ['في التحوّل الفيزيائي، الجزيئات :', 'لا تتغيّر : لا توجد مادة جديدة.', 'لا تتغيّر', ['تُستبدل بجزيئات جديدة', 'تختفي']],
    ['نذيب سكرًا في الماء. هذا تحوّل :', 'السكر منحلّ فقط : لا تتغيّر الجزيئات.', 'فيزيائي', ['كيميائي']],
    ['انصهار الجليد تحوّل :', 'يصبح الجليد ماءً سائلًا، لكن الجزيئات هي نفسها.', 'فيزيائي', ['كيميائي']],
    ['أي تحوّل هو تحوّل كيميائي ؟', 'احتراق الورق يعطي مواد جديدة (رماد وغازات).', 'احتراق الورق', ['تمزيق الورق', 'تجمّد الماء السائل', 'ذوبان الملح في الماء']],
  ]);

  bank('combust', [
    ['Quels sont les trois éléments du triangle du feu ?', 'Il faut un combustible, un comburant (le dioxygène) et de la chaleur.', 'combustible, comburant et chaleur', ['combustible, eau et chaleur', 'comburant, eau et froid', 'combustible, azote et eau']],
    ['Dans l’air, le comburant d’une combustion est :', 'C’est le dioxygène de l’air qui permet de brûler.', 'le dioxygène', ['le diazote', 'le dioxyde de carbone', 'l’eau']],
    ['Le bois, le gaz et l’essence sont des :', 'Ce sont des combustibles : ils peuvent brûler.', 'combustibles', ['comburants', 'extincteurs']],
    ['La combustion complète du méthane produit :', 'Méthane + dioxygène → dioxyde de carbone + eau.', 'du dioxyde de carbone et de l’eau', ['du monoxyde de carbone seulement', 'du dioxygène et de l’azote']],
    ['Quel gaz toxique, inodore et invisible se forme lors d’une combustion incomplète ?', 'Quand il manque de dioxygène, il se forme du monoxyde de carbone CO.', 'le monoxyde de carbone', ['le dioxyde de carbone', 'le dioxygène', 'la vapeur d’eau']],
    ['Pour éteindre un feu de casserole d’huile, le bon geste est de :', 'On supprime le dioxygène en recouvrant la casserole ; l’eau est dangereuse sur l’huile.', 'le recouvrir avec un couvercle', ['jeter de l’eau dessus', 'souffler dessus']],
    ['Un couvercle posé sur une bougie l’éteint, car il :', 'Sans dioxygène, il n’y a plus de combustion.', 'prive la flamme de dioxygène', ['ajoute du combustible', 'ajoute de la chaleur']],
    ['Pour éviter l’intoxication par le monoxyde de carbone, il faut :', 'Renouveler l’air évite la combustion incomplète.', 'aérer les pièces où brûle du gaz ou du charbon', ['fermer toutes les fenêtres', 'augmenter le chauffage']],
    ['Une combustion est une transformation :', 'De nouvelles substances apparaissent : c’est une transformation chimique.', 'chimique', ['physique']],
    ['Dans une combustion, le dioxygène est :', 'Le dioxygène disparaît pendant la combustion : c’est un réactif.', 'un réactif', ['un produit']],
  ], [
    ['ما هي العناصر الثلاثة لمثلث النار ؟', 'يلزم وقود ومؤكسد (ثنائي الأكسجين) وحرارة.', 'وقود ومؤكسد وحرارة', ['وقود وماء وحرارة', 'مؤكسد وماء وبرودة', 'وقود وأزوت وماء']],
    ['في الهواء، المؤكسد في الاحتراق هو :', 'ثنائي الأكسجين الموجود في الهواء هو الذي يسمح بالاحتراق.', 'ثنائي الأكسجين', ['ثنائي الأزوت', 'ثنائي أكسيد الكربون', 'الماء']],
    ['الخشب والغاز والبنزين هي :', 'هي وقود : يمكنها أن تحترق.', 'وقود', ['مؤكسدات', 'مطافئ']],
    ['ينتج عن الاحتراق الكامل للميثان :', 'ميثان + ثنائي الأكسجين ← ثنائي أكسيد الكربون + ماء.', 'ثنائي أكسيد الكربون والماء', ['أحادي أكسيد الكربون فقط', 'ثنائي الأكسجين والأزوت']],
    ['أي غاز سام عديم الرائحة واللون يتكوّن عند الاحتراق غير الكامل ؟', 'عندما ينقص ثنائي الأكسجين يتكوّن أحادي أكسيد الكربون CO.', 'أحادي أكسيد الكربون', ['ثنائي أكسيد الكربون', 'ثنائي الأكسجين', 'بخار الماء']],
    ['لإطفاء النار في قدر فيه زيت، التصرف الصحيح هو :', 'نزيل ثنائي الأكسجين بتغطية القدر ؛ والماء خطير على الزيت.', 'تغطيته بغطاء', ['صبّ الماء عليه', 'النفخ عليه']],
    ['غطاء موضوع على شمعة يطفئها لأنه :', 'دون ثنائي الأكسجين لا يحدث احتراق.', 'يحرم اللهب من ثنائي الأكسجين', ['يضيف وقودًا', 'يضيف حرارة']],
    ['لتفادي التسمم بأحادي أكسيد الكربون يجب :', 'تجديد الهواء يمنع الاحتراق غير الكامل.', 'تهوية الغرف التي يحترق فيها الغاز أو الفحم', ['إغلاق كل النوافذ', 'رفع التدفئة']],
    ['الاحتراق تحوّل :', 'تظهر مواد جديدة : إنه تحوّل كيميائي.', 'كيميائي', ['فيزيائي']],
    ['في الاحتراق، ثنائي الأكسجين :', 'يختفي ثنائي الأكسجين أثناء الاحتراق : إنه متفاعل.', 'متفاعل', ['ناتج']],
  ]);

  bank('gaz', [
    ['Quel gaz rallume une allumette qui ne présente plus qu’un point incandescent ?', 'C’est le test du dioxygène.', 'le dioxygène', ['le dioxyde de carbone', 'le dihydrogène', 'le diazote']],
    ['Quel test permet d’identifier le dioxyde de carbone ?', 'Le dioxyde de carbone trouble l’eau de chaux.', 'il trouble l’eau de chaux', ['il rallume une allumette incandescente', 'il fait « pop » à l’approche d’une flamme', 'il bleuit le sulfate de cuivre anhydre']],
    ['L’eau de chaux qui devient laiteuse indique la présence de :', 'L’eau de chaux se trouble en présence de dioxyde de carbone.', 'dioxyde de carbone', ['dihydrogène', 'dioxygène']],
    ['Une petite détonation (« pop ») à l’approche d’une flamme indique la présence de :', 'C’est le test du dihydrogène.', 'dihydrogène', ['dioxygène', 'dioxyde de carbone']],
    ['Le sulfate de cuivre anhydre passe du blanc au bleu en présence de :', 'C’est le test de l’eau.', 'eau', ['dioxygène', 'dioxyde de carbone', 'dihydrogène']],
    ['On souffle avec une paille dans de l’eau de chaux : elle se trouble. L’air expiré contient donc :', 'Le trouble de l’eau de chaux prouve la présence de dioxyde de carbone.', 'du dioxyde de carbone', ['du dihydrogène', 'du sulfate de cuivre']],
    ['Quel gaz est inflammable et explose avec un « pop » ?', 'Le dihydrogène brûle avec une petite détonation.', 'le dihydrogène', ['le diazote', 'le dioxyde de carbone', 'la vapeur d’eau']],
    ['Pour vérifier qu’un liquide contient de l’eau, on utilise :', 'Le sulfate de cuivre anhydre blanc devient bleu en présence d’eau.', 'du sulfate de cuivre anhydre blanc', ['de l’eau de chaux', 'une allumette incandescente', 'un prisme']],
    ['Quel test permet de reconnaître le dioxygène ?', 'Seul le dioxygène rallume l’allumette incandescente.', 'l’allumette incandescente qui se rallume', ['l’eau de chaux qui se trouble', 'le sulfate de cuivre qui devient bleu']],
  ], [
    ['أي غاز يعيد إشعال عود ثقاب لم يبقَ فيه إلا نقطة متوهّجة ؟', 'هذا هو اختبار ثنائي الأكسجين.', 'ثنائي الأكسجين', ['ثنائي أكسيد الكربون', 'ثنائي الهيدروجين', 'ثنائي الأزوت']],
    ['أي اختبار يسمح بالتعرف على ثنائي أكسيد الكربون ؟', 'يعكّر ثنائي أكسيد الكربون ماء الجير.', 'يعكّر ماء الجير', ['يعيد إشعال عود ثقاب متوهّج', 'يُحدث فرقعة عند تقريب لهب', 'يزرّق كبريتات النحاس اللامائية']],
    ['ماء الجير الذي يصير عكرًا يدلّ على وجود :', 'يتعكّر ماء الجير بوجود ثنائي أكسيد الكربون.', 'ثنائي أكسيد الكربون', ['ثنائي الهيدروجين', 'ثنائي الأكسجين']],
    ['فرقعة صغيرة عند تقريب لهب تدلّ على وجود :', 'هذا هو اختبار ثنائي الهيدروجين.', 'ثنائي الهيدروجين', ['ثنائي الأكسجين', 'ثنائي أكسيد الكربون']],
    ['تتحوّل كبريتات النحاس اللامائية من الأبيض إلى الأزرق بوجود :', 'هذا هو اختبار الماء.', 'الماء', ['ثنائي الأكسجين', 'ثنائي أكسيد الكربون', 'ثنائي الهيدروجين']],
    ['ننفخ بقصبة في ماء الجير فيتعكّر. إذن الهواء المزفور يحتوي على :', 'تعكّر ماء الجير يثبت وجود ثنائي أكسيد الكربون.', 'ثنائي أكسيد الكربون', ['ثنائي الهيدروجين', 'كبريتات النحاس']],
    ['أي غاز قابل للالتهاب وينفجر بفرقعة ؟', 'يحترق ثنائي الهيدروجين بفرقعة صغيرة.', 'ثنائي الهيدروجين', ['ثنائي الأزوت', 'ثنائي أكسيد الكربون', 'بخار الماء']],
    ['للتحقق من أن سائلًا يحتوي على الماء، نستعمل :', 'تتحوّل كبريتات النحاس اللامائية البيضاء إلى الأزرق بوجود الماء.', 'كبريتات النحاس اللامائية البيضاء', ['ماء الجير', 'عود ثقاب متوهّج', 'موشورًا']],
    ['أي اختبار يسمح بالتعرف على ثنائي الأكسجين ؟', 'ثنائي الأكسجين وحده يعيد إشعال عود الثقاب المتوهّج.', 'عود الثقاب المتوهّج الذي يشتعل من جديد', ['ماء الجير الذي يتعكّر', 'كبريتات النحاس التي تتزرّق']],
  ]);

  /* ===================================================== Conservation et équations */
  const SUBS = {
    c: ['carbone', 'الكربون'], o2: ['dioxygène', 'ثنائي الأكسجين'], co2: ['dioxyde de carbone', 'ثنائي أكسيد الكربون'], h2: ['dihydrogène', 'ثنائي الهيدروجين'],
    h2o: ['eau', 'الماء'], fe: ['fer', 'الحديد'], s: ['soufre', 'الكبريت'], fes: ['sulfure de fer', 'كبريتيد الحديد'], zn: ['zinc', 'الزنك'],
    zns: ['sulfure de zinc', 'كبريتيد الزنك'], cu: ['cuivre', 'النحاس'], cuo: ['oxyde de cuivre', 'أكسيد النحاس'],
  };
  Object.keys(SUBS).forEach((k) => { SF['pc.4e.sub.' + k] = SUBS[k][0]; SA['pc.4e.sub.' + k] = SUBS[k][1]; });
  const REACS = [['c', 12, 'o2', 32, 'co2', 44], ['h2', 4, 'o2', 32, 'h2o', 36], ['fe', 56, 's', 32, 'fes', 88], ['zn', 65, 's', 32, 'zns', 97], ['cu', 127, 'o2', 32, 'cuo', 159]];
  GEN.pc4e_masse = (p) => {
    const k = pick(p.kinds), [a, ma, b, mb, c, mcc] = pick(REACS), s = pick([1, 2, 3, 5]);
    const A = ma * s, B = mb * s, C = mcc * s, n = (x) => t('pc.4e.sub.' + x);
    if (k === 'prod') return num(t('pc.4e.masse.prod.q', { a: n(a), ma: m(A + ' g'), b: n(b), mb: m(B + ' g'), c: n(c) }), C, t('pc.4e.masse.prod.exp', { ma: m(A), mb: m(B), r: m(C + ' g') }));
    if (k === 'react') return num(t('pc.4e.masse.react.q', { a: n(a), ma: m(A + ' g'), b: n(b), c: n(c), mc: m(C + ' g') }), B, t('pc.4e.masse.react.exp', { mc: m(C), ma: m(A), r: m(B + ' g') }));
    return num(t('pc.4e.masse.first.q', { a: n(a), b: n(b), mb: m(B + ' g'), c: n(c), mc: m(C + ' g') }), A, t('pc.4e.masse.first.exp', { mc: m(C), mb: m(B), r: m(A + ' g') }));
  };
  Object.assign(SF, {
    'pc.4e.masse.prod.q': 'Dans un récipient fermé, on fait réagir deux réactifs. Réactif 1 : {a} (masse : {ma}). Réactif 2 : {b} (masse : {mb}). Il se forme un seul produit : {c}. Quelle est la masse de ce produit (en g) ?',
    'pc.4e.masse.prod.exp': 'La masse se conserve : masse des produits = masse des réactifs = {ma} + {mb} = {r}.',
    'pc.4e.masse.react.q': 'Dans un récipient fermé, deux réactifs réagissent. Réactif 1 : {a} (masse : {ma}). Réactif 2 : {b}. Il se forme un seul produit : {c} (masse : {mc}). Calcule la masse (en g) du réactif 2.',
    'pc.4e.masse.react.exp': 'Masse des réactifs = masse du produit, donc la masse cherchée est {mc} − {ma} = {r}.',
    'pc.4e.masse.first.q': 'Dans un récipient fermé, deux réactifs réagissent. Réactif 1 : {a}. Réactif 2 : {b} (masse : {mb}). Il se forme un seul produit : {c} (masse : {mc}). Calcule la masse (en g) du réactif 1.',
    'pc.4e.masse.first.exp': 'Masse des réactifs = masse du produit, donc la masse cherchée est {mc} − {mb} = {r}.',
  });
  Object.assign(SA, {
    'pc.4e.masse.prod.q': 'في وعاء مغلق، يتفاعل متفاعلان. المتفاعل 1 : {a} (الكتلة : {ma}). المتفاعل 2 : {b} (الكتلة : {mb}). يتكوّن ناتج وحيد : {c}. ما كتلة هذا الناتج (بالغرام) ؟',
    'pc.4e.masse.prod.exp': 'تنحفظ الكتلة : كتلة النواتج = كتلة المتفاعلات = {ma} + {mb} = {r}.',
    'pc.4e.masse.react.q': 'في وعاء مغلق، يتفاعل متفاعلان. المتفاعل 1 : {a} (الكتلة : {ma}). المتفاعل 2 : {b}. يتكوّن ناتج وحيد : {c} (الكتلة : {mc}). احسب كتلة المتفاعل 2 (بالغرام).',
    'pc.4e.masse.react.exp': 'كتلة المتفاعلات = كتلة الناتج، إذن الكتلة المطلوبة هي {mc} − {ma} = {r}.',
    'pc.4e.masse.first.q': 'في وعاء مغلق، يتفاعل متفاعلان. المتفاعل 1 : {a}. المتفاعل 2 : {b} (الكتلة : {mb}). يتكوّن ناتج وحيد : {c} (الكتلة : {mc}). احسب كتلة المتفاعل 1 (بالغرام).',
    'pc.4e.masse.first.exp': 'كتلة المتفاعلات = كتلة الناتج، إذن الكتلة المطلوبة هي {mc} − {mb} = {r}.',
  });

  const EQS = [
    [[[2, 'H2'], [1, 'O2']], [[2, 'H2O']]], [[[1, 'CH4'], [2, 'O2']], [[1, 'CO2'], [2, 'H2O']]], [[[1, 'N2'], [3, 'H2']], [[2, 'NH3']]],
    [[[1, 'C3H8'], [5, 'O2']], [[3, 'CO2'], [4, 'H2O']]], [[[2, 'CO'], [1, 'O2']], [[2, 'CO2']]], [[[2, 'Cu'], [1, 'O2']], [[2, 'CuO']]],
    [[[4, 'Fe'], [3, 'O2']], [[2, 'Fe2O3']]], [[[2, 'Mg'], [1, 'O2']], [[2, 'MgO']]], [[[1, 'C'], [1, 'O2']], [[1, 'CO2']]],
    [[[2, 'C2H6'], [7, 'O2']], [[4, 'CO2'], [6, 'H2O']]], [[[2, 'H2O']], [[2, 'H2'], [1, 'O2']]], [[[2, 'H2O2']], [[2, 'H2O'], [1, 'O2']]], [[[2, 'Zn'], [1, 'O2']], [[2, 'ZnO']]],
  ];
  const side = (terms, blank) => terms.map(([c, f], i) => (blank === i ? box : (c === 1 ? '' : c + ' ')) + sub(f)).join(' + ');
  const eqHtml = (eq, bl) => m(side(eq[0], bl && bl[0] === 0 ? bl[1] : -1) + ' → ' + side(eq[1], bl && bl[0] === 1 ? bl[1] : -1));
  const count = (terms, e) => terms.reduce((s, [c, f]) => s + c * (atomsOf(f)[e] || 0), 0);
  const balanced = (eq) => { const es = new Set(); eq.flat().forEach(([, f]) => Object.keys(atomsOf(f)).forEach((e) => es.add(e))); return [...es].every((e) => count(eq[0], e) === count(eq[1], e)); };
  GEN.pc4e_equil = (p) => {
    const k = pick(p.kinds);
    if (k === 'coef') {
      const eq = pick(EQS.filter((e) => e.flat().some(([c]) => c > 1))), cand = [];
      eq.forEach((sd, si) => sd.forEach(([c], i) => { if (c > 1) cand.push([si, i, c]); }));
      const [si, i, c] = pick(cand);
      return num(t('pc.4e.equil.coef.q', { eq: eqHtml(eq, [si, i]) }), c, t('pc.4e.equil.coef.exp', { eq: eqHtml(eq), r: m(c) }));
    }
    if (k === 'count') {
      const eq = pick(EQS), es = ['H', 'C', 'O', 'N'].filter((e) => count(eq[0], e) > 0), e = pick(es), si = R(0, 1), r = count(eq[si], e);
      return num(t('pc.4e.equil.count.q', { eq: eqHtml(eq), e: m(e), en: t('pc.4e.el.' + e), side: t(si ? 'pc.4e.equil.right' : 'pc.4e.equil.left') }), r, t('pc.4e.equil.count.exp', { eq: eqHtml(eq), e: m(e), r: m(r) }));
    }
    let eq = JSON.parse(JSON.stringify(pick(EQS))), ok = true;
    if (R(0, 1)) {
      do { const sd = eq[R(0, 1)], tm = sd[R(0, sd.length - 1)]; tm[0] = Math.max(1, tm[0] + pick([-1, 1, 2])); } while (balanced(eq));
      ok = false;
    }
    return { q: t('pc.4e.equil.check.q', { eq: eqHtml(eq) }), kind: 'choice', ans: ok ? 'y' : 'n', choices: yesNo(), exp: t(ok ? 'pc.4e.equil.check.yes' : 'pc.4e.equil.check.no', { eq: eqHtml(eq) }) };
  };
  Object.assign(SF, {
    'pc.4e.equil.coef.q': 'Quel nombre faut-il écrire à la place du ? pour équilibrer l’équation {eq} ?',
    'pc.4e.equil.coef.exp': 'Il faut le même nombre d’atomes de chaque sorte des deux côtés. L’équation équilibrée est {eq} : le nombre cherché est {r}.',
    'pc.4e.equil.count.q': 'L’équation {eq} est équilibrée. Combien d’atomes de l’élément {en} ({e}) y a-t-il {side} de la flèche ?',
    'pc.4e.equil.count.exp': 'On multiplie chaque coefficient par l’indice du symbole {e} dans la formule, puis on additionne : {r} atomes.',
    'pc.4e.equil.left': 'à gauche', 'pc.4e.equil.right': 'à droite',
    'pc.4e.equil.check.q': 'L’équation {eq} est-elle équilibrée ?',
    'pc.4e.equil.check.yes': 'Oui : pour chaque sorte d’atomes, il y en a autant à gauche qu’à droite.',
    'pc.4e.equil.check.no': 'Non : pour au moins une sorte d’atomes, le nombre d’atomes à gauche et à droite est différent.',
  });
  Object.assign(SA, {
    'pc.4e.equil.coef.q': 'ما العدد الذي يجب كتابته مكان ? لموازنة المعادلة {eq} ؟',
    'pc.4e.equil.coef.exp': 'يجب أن يتساوى عدد ذرات كل نوع في الطرفين. المعادلة الموزونة هي {eq} : العدد المطلوب هو {r}.',
    'pc.4e.equil.count.q': 'المعادلة {eq} موزونة. كم ذرة من العنصر {en} ({e}) توجد {side} السهم ؟',
    'pc.4e.equil.count.exp': 'نضرب كل معامل في الرقم السفلي للرمز {e} في الصيغة، ثم نجمع : {r} ذرة.',
    'pc.4e.equil.left': 'على يسار', 'pc.4e.equil.right': 'على يمين',
    'pc.4e.equil.check.q': 'هل المعادلة {eq} موزونة ؟',
    'pc.4e.equil.check.yes': 'نعم : لكل نوع من الذرات، العدد على اليسار يساوي العدد على اليمين.',
    'pc.4e.equil.check.no': 'لا : لنوع واحد على الأقل من الذرات، العدد على اليسار يختلف عن العدد على اليمين.',
  });

  Object.assign(root.STRINGS, SF);
  Object.assign(root.STRINGS_AR, SA);

  /* ---------- catalogue ---------- */
  Object.assign(root.AR_CATALOG, {
    'Physique': 'الفيزياء', 'Chimie': 'الكيمياء',
    'Courant et tension': 'التيار والتوتر الكهربائيان', 'Lumière et couleurs': 'الضوء والألوان', 'Poids d’un objet': 'وزن جسم',
    'Atomes et molécules': 'الذرات والجزيئات', 'Transformations chimiques': 'التحولات الكيميائية', 'Conservation et équations': 'الانحفاظ والمعادلات',
    'Milliampères et ampères': 'الميلي أمبير والأمبير', 'Lois du circuit en série': 'قوانين الدارة على التسلسل', 'Lois du circuit en dérivation': 'قوانين الدارة على التفرّع',
    'Appareils de mesure et sécurité': 'أجهزة القياس والسلامة', 'Loi de la réflexion': 'قانون الانعكاس', 'Lumière blanche et couleurs': 'الضوء الأبيض والألوان',
    'Calculer un poids ou une masse': 'حساب وزن أو كتلة', 'Reconnaître les atomes': 'التعرف على الذرات', 'Lire une formule chimique': 'قراءة صيغة كيميائية',
    'Transformation physique ou chimique ?': 'تحوّل فيزيائي أم كيميائي ؟', 'Combustions et feu': 'الاحتراق والنار', 'Identifier un gaz': 'التعرف على غاز',
    'Conservation de la masse': 'انحفاظ الكتلة', 'Équilibrer une équation': 'موازنة معادلة',
  });
  const lv = (root.CATALOG_EXTRA || []).find((l) => l.id === '4e');
  lv.domains.push(
    { name: 'Physique', cats: [
      { name: 'Courant et tension', skills: [['Milliampères et ampères', 'pc4e_intens', { kinds: ['toA', 'tomA'] }], ['Lois du circuit en série', 'pc4e_serie', { kinds: ['u', 'i'] }], ['Lois du circuit en dérivation', 'pc4e_deriv', { kinds: ['sum', 'branch', 'u'] }], ['Appareils de mesure et sécurité', 'pc4e_appareils', { kind: 'choice' }]] },
      { name: 'Lumière et couleurs', skills: [['Loi de la réflexion', 'pc4e_reflex', { kinds: ['r', 'mirror', 'between'] }], ['Lumière blanche et couleurs', 'pc4e_couleurs', { kind: 'choice' }]] },
      { name: 'Poids d’un objet', skills: [['Calculer un poids ou une masse', 'pc4e_poids', { kinds: ['P', 'm', 'gram', 'moon', 'g'] }]] },
    ] },
    { name: 'Chimie', cats: [
      { name: 'Atomes et molécules', skills: [['Reconnaître les atomes', 'pc4e_atomes', { kind: 'choice' }], ['Lire une formule chimique', 'pc4e_formule', { kinds: ['total', 'elem', 'kinds', 'which'] }]] },
      { name: 'Transformations chimiques', skills: [['Transformation physique ou chimique ?', 'pc4e_transfo', { kind: 'choice' }], ['Combustions et feu', 'pc4e_combust', { kind: 'choice' }], ['Identifier un gaz', 'pc4e_gaz', { kind: 'choice' }]] },
      { name: 'Conservation et équations', skills: [['Conservation de la masse', 'pc4e_masse', { kinds: ['prod', 'react', 'first'] }], ['Équilibrer une équation', 'pc4e_equil', { kinds: ['coef', 'count', 'check'] }]] },
    ] }
  );
}(typeof window !== 'undefined' ? window : globalThis));
