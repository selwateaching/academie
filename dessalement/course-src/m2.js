/* ================================================ Module 2 : l'eau de mer */
const A1=()=>{let sp='';for(let i=0;i<7;i++){const x=i<4?310+i*72:346+(i-4)*72,y=i<4?168:228;
  sp+=`<g class="a-pop" style="animation-delay:${.4+i*.35}s"><line x1="${x+18}" y1="${y}" x2="${x+52}" y2="${y-10}" stroke="var(--s-mute)" stroke-width="5" stroke-linecap="round"/><ellipse class="cry" cx="${x}" cy="${y}" rx="22" ry="12"/></g>`}
 return `<svg ${V} role="img" aria-label="${X("Un litre d'eau de mer","لتر من ماء البحر")}">
<text class="h" x="32" y="48">${X("Un litre d'eau de mer","لتر من ماء البحر")}</text>
<rect class="wa" x="86" y="150" width="108" height="168"/>
<path class="out" d="M125 70 H155 V100 Q196 116 196 150 V306 Q196 320 182 320 H98 Q84 320 84 306 V150 Q84 116 125 100 Z"/>
<text class="bl num" x="140" y="244" text-anchor="middle">1 L</text>
<text class="bl hl" x="290" y="112">${X("≈ 38 g de sels dissous","الأملاح المنحلّة: ≈ 38 g")}</text>
${sp}
<text class="sm" x="290" y="282">${X("≈ 7 cuillères à café","نحو 7 ملاعق صغيرة")}</text>
<text class="sm" x="290" y="318">${X("Eau du robinet : moins de 1 g","ماء الحنفية: أقل من 1 g")}</text>
</svg>`};

const A2=()=>{let cr='',fr='';
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){const na=(r+c)%2===0,x=70+c*30,y=130+r*30;cr+=na?`<circle class="rgf" cx="${x}" cy="${y}" r="9"/>`:`<circle class="bac" cx="${x}" cy="${y}" r="12"/>`}
 const P=[[370,120],[430,160],[500,118],[560,170],[395,215],[470,240],[540,225],[600,130],[410,290],[490,300],[575,285],[455,195]];
 P.forEach(([x,y],i)=>{const na=i%2===0;fr+=`<g class="a-pop" style="animation-delay:${.5+i*.15}s"><g class="a-bob" style="animation-delay:${i*.2}s">${na?`<circle class="rgf" cx="${x}" cy="${y}" r="9"/>`:`<circle class="bac" cx="${x}" cy="${y}" r="12"/>`}
 <circle cx="${x+17}" cy="${y-10}" r="4" fill="#E07A5F"/><circle cx="${x-16}" cy="${y+11}" r="4" fill="#E07A5F"/></g></g>`});
 return `<svg ${V} role="img" aria-label="${X("Le sel se défait en ions","الملح يتفكّك إلى شوارد")}">
<text class="h" x="32" y="48">${X("Le sel se défait en ions","الملح يتفكّك إلى شوارد")}</text>
<rect class="wa" x="340" y="92" width="280" height="226" rx="8" opacity=".55"/>
${cr}
<text class="sm" x="115" y="268" text-anchor="middle">${X("grain de sel (cristal)","حبّة ملح (بلّورة)")}</text>
<text class="fa" x="250" y="214" text-anchor="middle" style="font-size:40px">→</text>
${fr}
<text class="sm" x="480" y="342" text-anchor="middle">${X("dans l'eau : des ions libres","في الماء: شوارد حرّة")}</text>
<circle class="rgf" cx="44" cy="304" r="8"/><text class="sm num" x="58" y="309">Na⁺</text><text class="sm" x="98" y="309">${X("sodium","الصوديوم")}</text>
<circle class="bac" cx="44" cy="334" r="10"/><text class="sm num" x="58" y="339">Cl⁻</text><text class="sm" x="98" y="339">${X("chlorure","الكلوريد")}</text>
</svg>`};

const IONS=[["Cl⁻",X0("chlorure","الكلوريد"),55.0],["Na⁺",X0("sodium","الصوديوم"),30.6],["SO₄²⁻",X0("sulfate","الكبريتات"),7.7],["Mg²⁺",X0("magnésium","المغنيزيوم"),3.7],["Ca²⁺",X0("calcium","الكالسيوم"),1.2],["K⁺",X0("potassium","البوتاسيوم"),1.1],["HCO₃⁻",X0("hydrogénocarbonate","الهيدروجينوكربونات"),0.4]];
const A3=()=>{let s='';const sc=280/55;
 IONS.forEach(([f,n,v],i)=>{const y=96+i*36;
  s+=`<text class="f num" x="36" y="${y+15}" style="font-size:16px">${f}</text><text class="sm" x="118" y="${y+15}">${L(n)}</text>
  <rect class="${i<2?'accf':'wa'} a-grow" x="300" y="${y}" width="${Math.max(2,v*sc).toFixed(1)}" height="20" style="animation-delay:${.3+i*.18}s"/>
  <text class="sm num" x="${306+v*sc}" y="${y+15}">${String(v).replace('.',',')} %</text>`});
 return `<svg ${V} role="img" aria-label="${X("Les ions de l'eau de mer","شوارد مياه البحر")}">
<text class="h" x="32" y="48">${X("Les ions de l'eau de mer","شوارد مياه البحر")}</text>
<text class="sm" x="32" y="76">${X("part de chaque ion dans les sels dissous","حصّة كل شاردة من الأملاح المنحلّة")}</text>
${s}</svg>`};

const A4=()=>{const B=[[32,82,"Ca²⁺ + CO₃²⁻",X("→ calcaire","← الكلس"),X("comme dans la bouilloire","كما في الغلاية"),0],
 [330,82,"Ba²⁺ · Sr²⁺ + SO₄²⁻",X("→ dépôts très durs","← ترسّبات صلبة جدًا"),X("presque impossibles à enlever","يصعب جدًا إزالتها"),0],
 [32,210,X("SiO₂ (silice)","SiO₂ (السيليس)"),X("→ couche vitreuse","← طبقة زجاجية"),X("comme un vernis sur la membrane","مثل طلاء على الغشاء"),0],
 [330,210,X("B (bore) ≈ 5 mg/L","B (البور) ≈ 5 mg/L"),X("→ traverse la membrane","← يعبر الغشاء"),X("limite OMS : 2,4 mg/L","حدّ منظمة الصحة: 2,4 mg/L"),1]];
 return `<svg ${V} role="img" aria-label="${X("Les petits qui posent problème","العناصر الصغيرة المزعجة")}">
<text class="h" x="32" y="48">${X("Les petits qui posent problème","العناصر الصغيرة المزعجة")}</text>
${B.map(([x,y,f,a,b,hi],i)=>`<g class="a-appear" style="animation-delay:${.3+i*.5}s"><rect class="box${hi?' hi':''}" x="${x}" y="${y}" width="278" height="112" rx="10"/>
<text class="fa num" x="${x+18}" y="${y+34}" style="font-size:17px">${f}</text>
<text class="bl${hi?' hl':''}" x="${x+18}" y="${y+66}">${a}</text>
<text class="sm" x="${x+18}" y="${y+92}">${b}</text></g>`).join('')}
</svg>`};

const A5=()=>{let s='';
 const pl=[[90,130],[230,200],[150,270],[320,120],[300,280]];pl.forEach(([x,y],i)=>s+=`<g class="a-bob" style="animation-delay:${i*.4}s"><polygon class="rgf" points="${x},${y-12} ${x+4},${y-4} ${x+12},${y} ${x+4},${y+4} ${x},${y+12} ${x-4},${y+4} ${x-12},${y} ${x-4},${y-4}"/></g>`);
 [[120,180],[200,140],[260,240],[80,240],[340,200],[180,300],[300,170]].forEach(([x,y],i)=>s+=`<ellipse class="bac a-bob" cx="${x}" cy="${y}" rx="7" ry="4" style="animation-delay:${i*.3}s"/>`);
 [[110,300],[250,300],[360,305]].forEach(([x,y])=>s+=`<circle class="dirt" cx="${x}" cy="${y}" r="5"/>`);
 [[60,110,150],[200,260,300]].forEach(([x,y])=>s+=`<path d="M${x} ${y} q10 -10 20 0 t20 0 t20 0" fill="none" stroke="var(--s-acc)" stroke-width="2.5" class="a-bob"/>`);
 for(let i=0;i<26;i++)s+=`<circle class="mutef" cx="${45+(i*53)%340}" cy="${95+(i*37)%215}" r="2"/>`;
 const lg=[[`<polygon class="rgf" points="440,108 444,116 452,120 444,124 440,132 436,124 428,120 436,116"/>`,X("plancton, micro-algues","العوالق، طحالب مجهرية")],
  [`<ellipse class="bac" cx="440" cy="160" rx="7" ry="4"/>`,X("bactéries","البكتيريا")],
  [`<path d="M428 200 q6 -8 12 0 t12 0" fill="none" stroke="var(--s-acc)" stroke-width="2.5"/>`,X("matière organique","المادة العضوية")],
  [`<circle class="dirt" cx="440" cy="240" r="5"/>`,X("sable","الرمل")],
  [`<circle class="mutef" cx="440" cy="280" r="2.5"/>`,X("colloïdes","الجسيمات الغروية")]];
 return `<svg ${V} role="img" aria-label="${X("Ce qui vit et flotte","ما يعيش ويطفو")}">
<text class="h" x="32" y="48">${X("Ce qui vit et flotte","ما يعيش ويطفو")}</text>
<rect class="wa" x="30" y="72" width="370" height="256" rx="10" opacity=".7"/>
${s}
${lg.map(([ic,t],i)=>`${ic}<text class="sm" x="462" y="${125+i*40}">${t}</text>`).join('')}
<text class="bl hl" x="430" y="320">${X("→ ça bouche","← هذا يسدّ")}</text><text class="bl hl" x="430" y="344">${X("les membranes","الأغشية")}</text>
</svg>`};

const A6=()=>`<svg ${V} role="img" aria-label="${X("Le pH et son amortisseur","الـ pH ومُخمِّده")}">
<text class="h" x="32" y="48">${X("Le pH et son amortisseur","الـ pH ومُخمِّده")}</text>
<text class="sm" x="520" y="48">${X("air","الهواء")}</text>
${[0,1,2].map(i=>`<g class="a-sink" style="animation-delay:${i*.6}s"><circle cx="${540+i*24}" cy="84" r="6" fill="#9AA5A8"/><circle cx="${530+i*24}" cy="84" r="4" fill="#E07A5F"/><circle cx="${550+i*24}" cy="84" r="4" fill="#E07A5F"/></g>`).join('')}
<rect class="wa" x="20" y="100" width="600" height="228" rx="8" opacity=".5"/>
<rect class="box" x="44" y="128" width="140" height="50" rx="8"/><text class="f" x="114" y="160" text-anchor="middle">CO₂</text>
<text class="fa" x="214" y="160" text-anchor="middle">⇌</text>
<rect class="box hi" x="244" y="128" width="150" height="50" rx="8"/><text class="f" x="319" y="160" text-anchor="middle">HCO₃⁻</text>
<text class="fa" x="424" y="160" text-anchor="middle">⇌</text>
<rect class="box" x="454" y="128" width="150" height="50" rx="8"/><text class="f" x="529" y="160" text-anchor="middle">CO₃²⁻</text>
<text class="bl" x="44" y="216">${X("À pH 8,1 :","عند pH = 8,1:")}</text>
<rect class="mutef a-grow" x="44" y="230" width="6" height="24"/><rect class="accf a-grow" x="51" y="230" width="486" height="24" style="animation-delay:.4s"/><rect class="rgf a-grow" x="538" y="230" width="49" height="24" style="animation-delay:.9s"/>
<text class="sm num" x="44" y="276">CO₂ ≈ 1 %</text><text class="bl hl num" x="250" y="276">HCO₃⁻ ≈ 90 %</text><text class="sm num" x="520" y="276">CO₃²⁻ ≈ 9 %</text>
<text class="bl" x="44" y="314">${X("Un tampon : le pH bouge à peine.","محلول منظِّم: الـ pH لا يكاد يتغيّر.")}</text>
</svg>`;

const A7=()=>{const I=[[40,X("Conductivité","الناقلية"),"≈ 55 mS/cm"],[240,"pH","8,1"],[440,"TDS","≈ 38 000 mg/L"]];
 return `<svg ${V} role="img" aria-label="${X("Mesurer l'eau de mer","قياس مياه البحر")}">
<text class="h" x="32" y="48">${X("Mesurer l'eau de mer","قياس مياه البحر")}</text>
${I.map(([x,t,v],i)=>`<g class="a-appear" style="animation-delay:${.3+i*.6}s"><rect class="box" x="${x}" y="80" width="160" height="170" rx="14"/>
<rect x="${x+16}" y="98" width="128" height="58" rx="6" fill="#0A1F17"/><text class="f num" x="${x+80}" y="135" text-anchor="middle" style="fill:#7CE3A0;font-size:${v.length>9?14:20}px">${v}</text>
<circle cx="${x+80}" cy="196" r="16" fill="none" stroke="var(--s-mute)" stroke-width="2"/><line x1="${x+80}" y1="250" x2="${x+80}" y2="300" stroke="var(--s-mute)" stroke-width="4"/>
<text class="bl" x="${x+80}" y="234" text-anchor="middle">${t}</text></g>`).join('')}
<text class="bl hl" x="32" y="336">${X("Plus d'ions = plus de courant électrique.","شوارد أكثر = تيار كهربائي أكبر.")}</text>
</svg>`};

const M2_SCENES=[
 {svg:A1,w:["salinite"],fx:[],t:X0("Un litre d'eau de mer","لتر من ماء البحر"),
  say:X0("Prends un litre d'eau de la Méditerranée et fais-le bouillir jusqu'à ce qu'il ne reste plus d'eau. Au fond de la casserole, tu trouveras environ 38 grammes de sels, à peu près sept cuillères à café. L'eau du robinet, elle, en contient moins d'un gramme. Tout l'objectif du dessalement est de passer de l'une à l'autre.",
   "خذي لترًا من ماء البحر الأبيض المتوسط واتركيه يغلي حتى يتبخّر كل الماء. ستجدين في قعر القدر نحو ثمانية وثلاثين غرامًا من الأملاح، أي ما يقارب سبع ملاعق صغيرة. أما ماء الحنفية فيحتوي على أقل من غرام واحد. هدف التحلية كله هو الانتقال من الأول إلى الثاني.")},
 {svg:A2,w:["ion","cristal"],t:X0("Le sel se défait en ions","الملح يتفكّك إلى شوارد"),
  fx:[["NaCl → Na⁺ + Cl⁻",X0("Le sel solide (NaCl) se sépare dans l'eau en un ion sodium et un ion chlorure.","الملح الصلب (NaCl) يتفكّك في الماء إلى شاردة صوديوم وشاردة كلوريد.")]],
  say:X0("Dans un grain de sel, les ions sodium, positifs, et les ions chlorure, négatifs, sont rangés serrés comme sur un damier. Quand on le met dans l'eau, les molécules d'eau viennent les entourer et les séparent un à un. Le sel n'a pas disparu : il est devenu des ions, trop petits pour être vus, qui nagent librement.",
   "في حبّة الملح، تكون شوارد الصوديوم الموجبة وشوارد الكلوريد السالبة مرتّبة ومتلاصقة مثل رقعة الشطرنج. عندما نضعها في الماء، تأتي جزيئات الماء لتحيط بها وتفصلها واحدة تلو الأخرى. الملح لم يختفِ: لقد أصبح شوارد صغيرة جدًا لا تُرى، تسبح بحرية.")},
 {svg:A3,w:["salinite"],fx:[],t:X0("Les ions de l'eau de mer","شوارد مياه البحر"),
  say:X0("Dans ces 38 grammes, il n'y a pas que du sel de cuisine. Le chlorure représente plus de la moitié, le sodium presque un tiers. Viennent ensuite le sulfate, le magnésium, le calcium et le potassium. Ces proportions restent presque les mêmes dans toutes les mers du monde : seule la quantité totale change.",
   "في هذه الغرامات الثمانية والثلاثين، لا يوجد ملح الطعام فقط. يمثّل الكلوريد أكثر من النصف، والصوديوم ما يقارب الثلث. ثم تأتي الكبريتات والمغنيزيوم والكالسيوم والبوتاسيوم. تبقى هذه النسب شبه ثابتة في كل بحار العالم: الكمية الإجمالية فقط هي التي تتغيّر.")},
 {svg:A4,w:["bore","entartrage"],fx:[],t:X0("Les petits qui posent problème","العناصر الصغيرة المزعجة"),
  say:X0("Certains ions sont présents en toute petite quantité, mais causent de gros soucis. Le calcium et le carbonate forment du calcaire. Le baryum et le strontium, avec le sulfate, donnent des dépôts très durs. La silice laisse une couche comme du verre. Et le bore, environ 5 milligrammes par litre, traverse en partie la membrane, alors que l'Organisation mondiale de la santé recommande de ne pas dépasser 2,4 milligrammes par litre dans l'eau potable.",
   "بعض الشوارد موجودة بكميات صغيرة جدًا، لكنها تسبّب مشاكل كبيرة. الكالسيوم والكربونات يكوّنان الكلس. الباريوم والسترونسيوم، مع الكبريتات، يعطيان ترسّبات صلبة جدًا. والسيليس يترك طبقة تشبه الزجاج. أما البور، بنحو خمسة مليغرامات في اللتر، فيعبر الغشاء جزئيًا، بينما توصي منظمة الصحة العالمية بألا يتجاوز اثنين فاصل أربعة مليغرام في اللتر في ماء الشرب.")},
 {svg:A5,w:["plancton","colloid"],fx:[],t:X0("Ce qui vit et flotte","ما يعيش ويطفو"),
  say:X0("L'eau de mer est aussi pleine de vie : du plancton, des algues microscopiques, et des centaines de milliers de bactéries dans chaque millilitre. On y trouve aussi de la matière organique, des grains de sable et ces poussières invisibles, les colloïdes. Tout cela peut boucher les membranes : c'est pour cela qu'il faut un prétraitement, que l'on verra au module 4.",
   "مياه البحر مليئة أيضًا بالحياة: العوالق، والطحالب المجهرية، ومئات الآلاف من البكتيريا في كل ميليلتر. ونجد فيها أيضًا المادة العضوية، وحبّات الرمل، وذلك الغبار غير المرئي: الجسيمات الغروية. كل هذا قد يسدّ الأغشية، ولهذا نحتاج إلى معالجة أولية سنراها في الوحدة الرابعة.")},
 {svg:A6,w:["ph","tampon"],t:X0("Le pH et son amortisseur","الـ pH ومُخمِّده"),
  fx:[["CO₂ + H₂O ⇌ HCO₃⁻ + H⁺",X0("Le gaz carbonique se dissout dans l'eau et devient ion hydrogénocarbonate.","غاز ثاني أكسيد الكربون ينحلّ في الماء ويصبح شاردة هيدروجينوكربونات.")],
      ["HCO₃⁻ ⇌ CO₃²⁻ + H⁺",X0("L'hydrogénocarbonate peut devenir carbonate, et inversement : c'est l'amortisseur.","الهيدروجينوكربونات قد تصبح كربونات، والعكس صحيح: هذا هو المُخمِّد.")]],
  say:X0("Le pH de l'eau de mer est d'environ 8,1, donc légèrement basique. Il reste très stable grâce au gaz carbonique dissous, qui se transforme en ions hydrogénocarbonate et carbonate. Ce trio agit comme un amortisseur : si on ajoute un peu d'acide ou de base, il absorbe le choc et le pH bouge à peine. On appelle cela un tampon.",
   "درجة الـ pH في مياه البحر نحو ثمانية فاصل واحد، أي قاعدية قليلًا. وتبقى ثابتة جدًا بفضل غاز ثاني أكسيد الكربون المنحلّ، الذي يتحوّل إلى شوارد الهيدروجينوكربونات والكربونات. يعمل هذا الثلاثي مثل مُخمِّد الصدمات: إذا أضفنا قليلًا من الحمض أو الأساس، يمتصّ الصدمة ولا يكاد الـ pH يتغيّر. نسمّي ذلك محلولًا منظِّمًا.")},
 {svg:A7,w:["conductivite","tds"],fx:[],t:X0("Mesurer l'eau de mer","قياس مياه البحر"),
  say:X0("Au laboratoire de la station, trois mesures reviennent chaque jour. La conductivité : plus il y a d'ions, mieux l'eau conduit le courant électrique, environ 55 millisiemens par centimètre pour l'eau de mer. Le pH, avec un pH-mètre. Et le TDS, la quantité totale de sels dissous, environ 38 000 milligrammes par litre. Ces chiffres permettent de régler toute la station.",
   "في مخبر المحطة، هناك ثلاثة قياسات تتكرّر كل يوم. الناقلية: كلما زادت الشوارد، نقل الماء التيار الكهربائي بشكل أفضل، نحو خمسة وخمسين ميلي سيمنس في السنتيمتر لماء البحر. ثم الـ pH، بجهاز قياس الـ pH. وأخيرًا TDS، أي الكمية الإجمالية للأملاح المنحلّة، وهي نحو ثمانية وثلاثين ألف مليغرام في اللتر. تسمح هذه الأرقام بضبط المحطة كلها.")}
];
const M2_GLOSS={
 salinite:{fr:"salinité",ar:"الملوحة",n:1,d:X0("Quantité totale de sels dissous dans l'eau. Méditerranée : environ 38 g par litre.","الكمية الإجمالية للأملاح المنحلّة في الماء. البحر المتوسط: نحو 38 غرامًا في اللتر.")},
 ion:{fr:"ion",ar:"الشاردة",n:2,d:X0("Atome qui porte une charge électrique, + ou −. Le sel se sépare en ions dans l'eau.","ذرة تحمل شحنة كهربائية، + أو −. الملح يتفكّك إلى شوارد في الماء.")},
 cristal:{fr:"cristal",ar:"البلّورة",n:2,d:X0("Solide dont les atomes ou les ions sont rangés en ordre, comme les cases d'un damier.","مادة صلبة ذراتها أو شواردها مرتّبة بانتظام، مثل خانات رقعة الشطرنج.")},
 bore:{fr:"bore",ar:"البور",n:4,d:X0("Élément présent à environ 5 mg/L dans l'eau de mer. Il passe en partie à travers les membranes.","عنصر موجود بنحو 5 mg/L في ماء البحر. يعبر الأغشية جزئيًا.")},
 entartrage:{fr:"entartrage",ar:"الترسّب الكلسي",n:4,d:X0("Dépôt de calcaire ou d'autres sels sur une surface.","ترسّب الكلس أو أملاح أخرى على سطح ما.")},
 plancton:{fr:"plancton",ar:"العوالق",n:5,d:X0("Petits êtres vivants, végétaux ou animaux, qui flottent dans la mer.","كائنات حيّة صغيرة، نباتية أو حيوانية، تطفو في البحر.")},
 colloid:{fr:"colloïde",ar:"الجسيمات الغروية",n:5,d:X0("Poussière si petite qu'elle ne tombe jamais au fond de l'eau.","غبار صغير جدًا لا يسقط أبدًا إلى قعر الماء.")},
 ph:{fr:"pH",ar:"الـ pH",n:6,d:X0("Note de 0 à 14 : acide sous 7, neutre à 7, basique au-dessus. Eau de mer : 8,1.","علامة من 0 إلى 14: حمضي تحت 7، معتدل عند 7، قاعدي فوقها. ماء البحر: 8,1.")},
 tampon:{fr:"tampon",ar:"المحلول المنظِّم",n:6,d:X0("Mélange qui empêche le pH de changer brusquement, comme un amortisseur de voiture.","مزيج يمنع الـ pH من التغيّر المفاجئ، مثل مُخمِّد الصدمات في السيارة.")},
 conductivite:{fr:"conductivité",ar:"الناقلية",n:7,d:X0("Capacité de l'eau à laisser passer le courant électrique. Plus il y a d'ions, plus elle est grande.","قدرة الماء على تمرير التيار الكهربائي. كلما زادت الشوارد، زادت الناقلية.")},
 tds:{fr:"TDS",ar:"TDS",n:7,d:X0("Total des sels dissous, en mg/L. Eau de mer : environ 38 000 mg/L.","مجموع الأملاح المنحلّة، بوحدة mg/L. ماء البحر: نحو 38000 mg/L.")}
};
const M2_PREP=[
 {t:X0("Ion","الشاردة"),fr0:"Ion",like:X0("Un atome qui porte une <b>charge</b>, + ou −. Le sel dans l'eau se sépare en ions.","ذرة تحمل <b>شحنة</b>، + أو −. الملح في الماء يتفكّك إلى شوارد."),ex:X0("Na⁺ et Cl⁻","Na⁺ و Cl⁻")},
 {t:X0("Dissoudre","الانحلال"),fr0:"Dissoudre",like:X0("Le sucre qui disparaît dans le thé : il est <b>toujours là</b>, mais en morceaux invisibles.","السكر الذي يختفي في الشاي: ما زال <b>موجودًا</b>، لكن في قطع غير مرئية."),ex:X0("On ne voit pas le sel de la mer, mais on le goûte.","لا نرى ملح البحر، لكننا نتذوّقه.")},
 {t:X0("g/L et mg/L","g/L و mg/L"),fr0:"g/L, mg/L",like:X0("<b>g/L</b> : grammes par litre. <b>mg/L</b> : milligrammes par litre, mille fois plus petit.","<b>g/L</b>: غرام في اللتر. <b>mg/L</b>: مليغرام في اللتر، أصغر بألف مرة."),ex:"38 g/L = 38 000 mg/L"}
];
const M2_QUIZ=[
 {q:X0("Combien de sels contient un litre d'eau de la Méditerranée ?","كم من الأملاح يحتوي لتر من ماء البحر المتوسط؟"),o:X0(["Environ 3 g","Environ 38 g","Environ 380 g"],["نحو 3 g","نحو 38 g","نحو 380 g"]),c:1,
  e:X0("Environ 38 g, soit à peu près sept cuillères à café.","نحو 38 g، أي ما يقارب سبع ملاعق صغيرة.")},
 {q:X0("Quand le sel se dissout dans l'eau, il…","عندما ينحلّ الملح في الماء، فإنه…"),o:X0(["disparaît complètement","se sépare en ions Na⁺ et Cl⁻","se transforme en gaz"],["يختفي تمامًا","يتفكّك إلى شوارد Na⁺ و Cl⁻","يتحوّل إلى غاز"]),c:1,
  e:X0("Le sel est toujours là, sous forme d'ions trop petits pour être vus.","الملح ما زال موجودًا، في شكل شوارد صغيرة جدًا لا تُرى.")},
 {q:X0("Quel ion est le plus abondant dans l'eau de mer ?","ما الشاردة الأكثر وفرة في ماء البحر؟"),o:X0(["Le calcium","Le chlorure","Le bore"],["الكالسيوم","الكلوريد","البور"]),c:1,
  e:X0("Le chlorure représente environ 55 % des sels dissous.","يمثّل الكلوريد نحو 55 % من الأملاح المنحلّة.")},
 {q:X0("Pourquoi surveille-t-on le bore ?","لماذا نراقب البور؟"),o:X0(["Il colore l'eau","Il traverse en partie la membrane et doit rester sous 2,4 mg/L","Il bouche les filtres à sable"],["لأنه يلوّن الماء","لأنه يعبر الغشاء جزئيًا ويجب أن يبقى تحت 2,4 mg/L","لأنه يسدّ مرشّحات الرمل"]),c:1,
  e:X0("L'eau de mer en contient environ 5 mg/L ; l'OMS recommande au plus 2,4 mg/L dans l'eau potable.","يحتوي ماء البحر على نحو 5 mg/L، وتوصي منظمة الصحة العالمية بـ 2,4 mg/L كحدّ أقصى في ماء الشرب.")},
 {q:X0("Que mesure un conductimètre ?","ماذا يقيس جهاز الناقلية؟"),o:X0(["La température","La quantité d'ions, grâce au courant électrique","La couleur de l'eau"],["درجة الحرارة","كمية الشوارد، بفضل التيار الكهربائي","لون الماء"]),c:1,
  e:X0("Plus il y a d'ions, mieux l'eau conduit le courant.","كلما زادت الشوارد، نقل الماء التيار بشكل أفضل.")}
];
