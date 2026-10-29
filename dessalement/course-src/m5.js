/* ================================================ Module 5 : entartrage et encrassement */
const E1=()=>{const K=[[X("Tartre","الكلس"),X("des sels qui cristallisent","أملاح تتبلّر"),'<rect x="-10" y="-10" width="16" height="16" class="cry" transform="rotate(12)"/><rect x="4" y="-2" width="12" height="12" class="cry" transform="rotate(-8)"/>'],
 [X("Colloïdes","الجسيمات الغروية"),X("des poussières très fines","غبار دقيق جدًا"),[[-10,-6],[4,-10],[10,6],[-4,8],[-14,6]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#C9A46B"/>`).join('')],
 [X("Matière organique","المادة العضوية"),X("des restes de plancton","بقايا العوالق"),'<path d="M-18 0 q6 -10 12 0 t12 0 t12 0" fill="none" stroke="var(--s-acc)" stroke-width="3"/>'],
 [X("Biofilm","الغشاء الحيوي"),X("des bactéries qui collent","بكتيريا تلتصق"),'<ellipse rx="20" ry="13" fill="#7CC47F" opacity=".35"/><ellipse cx="-6" cy="-2" rx="6" ry="3.5" class="bac"/><ellipse cx="7" cy="4" rx="6" ry="3.5" class="bac"/>']];
 return `<svg ${V} role="img" aria-label="${X("Les ennemis de la membrane","أعداء الغشاء")}">
<text class="h" x="32" y="48">${X("Les ennemis de la membrane","أعداء الغشاء")}</text>
${K.map(([t,s,ic],i)=>{const x=32+(i%2)*300,y=76+Math.floor(i/2)*124;return `<g class="a-appear" style="animation-delay:${.3+i*.4}s"><rect class="box${i===0?' hi':''}" x="${x}" y="${y}" width="278" height="108" rx="10"/><g transform="translate(${x+44} ${y+54})">${ic}</g>
<text class="bl${i===0?' hl':''}" x="${x+86}" y="${y+48}">${t}</text><text class="sm" x="${x+86}" y="${y+74}">${s}</text></g>`}).join('')}
<text class="sm" x="32" y="342">${X("Tartre = entartrage · les trois autres = encrassement (colmatage)","الكلس = الترسّب الكلسي · الثلاثة الأخرى = الانسداد")}</text>
</svg>`};

const glass=(x,lvl,crys,lab,sub,hi)=>`<rect class="wa" x="${x+4}" y="${lvl}" width="92" height="${296-lvl}"/>
${crys?[0,1,2,3,4].map(i=>`<rect class="cry a-growy" x="${x+12+i*16}" y="${284-(i%2)*6}" width="10" height="10" style="animation-delay:${1+i*.2}s"/>`).join(''):''}
<path class="out" d="M${x} 110 V292 Q${x} 300 ${x+8} 300 H${x+92} Q${x+100} 300 ${x+100} 292 V110"/>
<text class="bl${hi?' hl':''}" x="${x+50}" y="330" text-anchor="middle">${lab}</text><text class="sm" x="${x+50}" y="352" text-anchor="middle">${sub}</text>`;
const E2=()=>`<svg ${V} role="img" aria-label="${X("Trop de sel pour l'eau","ملح أكثر مما يحتمله الماء")}">
<text class="h" x="32" y="48">${X("Trop de sel pour l'eau","ملح أكثر مما يحتمله الماء")}</text>
<text class="sm" x="32" y="80">${X("comme le sucre dans un verre de thé","مثل السكر في كأس الشاي")}</text>
${glass(60,150,0,X("dissous","منحلّ"),X("tout disparaît","كل شيء يختفي"))}
${glass(260,150,0,X("saturé","مشبع"),X("à la limite","عند الحدّ"))}
${glass(460,150,1,X("sursaturé","فوق الإشباع"),X("le surplus se dépose","الزائد يترسّب"),1)}
<text class="fa" x="196" y="220" text-anchor="middle">→</text><text class="fa" x="396" y="220" text-anchor="middle">→</text>
</svg>`;

const E3=()=>{let m='';for(let i=0;i<7;i++){m+=`<rect class="box" x="${50+i*78}" y="150" width="70" height="60" rx="6"/>`;
  const n=Math.max(0,i-2);for(let k=0;k<n;k++)m+=`<rect class="cry a-growy" x="${56+i*78+(k%4)*15}" y="${196-Math.floor(k/4)*12}" width="10" height="10" style="animation-delay:${.6+i*.25}s"/>`}
 return `<svg ${V} role="img" aria-label="${X("Où se forme le tartre ?","أين يتكوّن الكلس؟")}">
<text class="h" x="32" y="48">${X("Où se forme le tartre ?","أين يتكوّن الكلس؟")}</text>
<rect class="out" x="40" y="140" width="560" height="80" rx="40"/>${m}
<line class="flowline" x1="40" y1="120" x2="600" y2="120" marker-end="url(#ah2)"/>
<defs><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--s-ink)"/></marker></defs>
<text class="sm" x="40" y="104">${X("entrée : eau de mer (1×)","المدخل: ماء البحر (1×)")}</text>
<text class="sm hl" x="440" y="104">${X("sortie : saumure (≈ 1,8×)","المخرج: الماء المركّز (≈ 1,8×)")}</text>
<text class="bl" x="40" y="262">${X("Le tartre se forme surtout dans les derniers modules.","يتكوّن الكلس خاصة في الوحدات الأخيرة.")}</text>
<text class="f num" x="40" y="300" style="font-size:15px">CaCO₃ · CaSO₄ · BaSO₄ · SrSO₄ · SiO₂</text>
<text class="sm" x="40" y="326">${X("calcaire · plâtre · sulfates de baryum et strontium · silice","الكلس · الجبس · كبريتات الباريوم والسترونسيوم · السيليس")}</text>
</svg>`};

const E4=()=>{const x0=80,w=480,v=x=>x0+(x+2)/4*w;
 return `<svg ${V} role="img" aria-label="${X("Prévoir le tartre : l'indice LSI","توقّع الكلس: مؤشر LSI")}">
<text class="h" x="32" y="48">${X("Prévoir le tartre : l'indice LSI","توقّع الكلس: مؤشر LSI")}</text>
<rect x="${x0}" y="150" width="${w/2}" height="26" fill="#3C8FC0"/><rect x="${x0+w/2}" y="150" width="${w/2}" height="26" class="accf"/>
${[-2,-1,0,1,2].map(n=>`<line x1="${v(n)}" y1="176" x2="${v(n)}" y2="186" stroke="var(--s-mute)"/><text class="sm num" x="${v(n)}" y="206" text-anchor="middle">${n>0?'+'+n:n}</text>`).join('')}
<g class="a-needle" style="--to:${(0.8+2)/4*w}px;animation-delay:.6s"><path d="M${x0} 144 l-8 -14 h16 z" fill="var(--s-ink)"/></g>
<text class="sm" x="${x0}" y="236">${X("négatif : eau agressive","سالب: ماء عدواني")}</text>
<text class="sm" x="${x0}" y="258">${X("elle attaque les tuyaux","يهاجم الأنابيب")}</text>
<text class="sm hl" x="${x0+w/2+20}" y="236">${X("positif : risque de tartre","موجب: خطر الكلس")}</text>
<text class="sm" x="${x0+w/2+20}" y="258">${X("la saumure est souvent ici","الماء المركّز غالبًا هنا")}</text>
<text class="sm" x="${v(0)}" y="126" text-anchor="middle">${X("équilibre","توازن")}</text>
<text class="f num" x="${x0}" y="312">LSI = pH − pHs</text>
</svg>`};

const E5=()=>{let c='';for(let r=0;r<4;r++)for(let k=0;k<13;k++)c+=`<circle cx="${70+k*20+(r%2)*10}" cy="${246-r*14}" r="6" fill="${(k+r)%3===0?'var(--s-acc)':'#C9A46B'}" class="a-fall" style="animation-delay:${.3+r*.6+k*.03}s"/>`;
 return `<svg ${V} role="img" aria-label="${X("Le gâteau de colmatage","طبقة الانسداد")}">
<text class="h" x="32" y="48">${X("Le gâteau de colmatage","طبقة الانسداد")}</text>
<rect class="wa" x="40" y="80" width="300" height="176" opacity=".6"/>
${c}
<rect class="mem" x="40" y="256" width="300" height="14" rx="3"/>
<text class="sm" x="40" y="294">${X("membrane","الغشاء")}</text>
${[0,1,2].map(i=>`<circle class="clean a-drop" cx="${110+i*80}" cy="276" r="4" style="animation-delay:${i*.4}s;animation-duration:2.2s"/>`).join('')}
<text class="bl" x="370" y="130">${X("Couche après couche,","طبقة بعد طبقة،")}</text>
<text class="bl" x="370" y="156">${X("les poussières forment","يكوّن الغبار")}</text>
<text class="bl" x="370" y="182">${X("un « gâteau ».","«كعكة».")}</text>
<text class="sm hl" x="370" y="232">${X("L'eau passe de moins","يمرّ الماء بصعوبة")}</text>
<text class="sm hl" x="370" y="256">${X("en moins bien.","أكبر فأكبر.")}</text>
</svg>`};

const E6=()=>`<svg ${V} role="img" aria-label="${X("Le biofilm","الغشاء الحيوي")}">
<text class="h" x="32" y="48">${X("Le biofilm","الغشاء الحيوي")}</text>
<rect class="wa" x="40" y="80" width="320" height="180" opacity=".6"/>
<path class="a-growy" d="M50 256 C70 200 110 190 140 214 C170 170 220 176 240 210 C270 186 320 196 350 256 Z" fill="#7CC47F" opacity=".4" style="animation-delay:1.6s;transform-origin:center bottom"/>
${[[90,240,.2],[130,236,.5],[180,244,.8],[230,232,1.1],[280,240,1.3],[320,246,.4],[160,214,1.8],[260,214,2]].map(([x,y,d])=>`<ellipse class="bac a-fall" cx="${x}" cy="${y}" rx="8" ry="4.5" style="animation-delay:${d}s"/>`).join('')}
<rect class="mem" x="40" y="256" width="320" height="14" rx="3"/>
<text class="sm" x="40" y="294">${X("membrane","الغشاء")}</text>
<text class="bl" x="390" y="120">${X("1. Les bactéries se posent.","1. تستقرّ البكتيريا.")}</text>
<text class="bl" x="390" y="160">${X("2. Elles se multiplient.","2. تتكاثر.")}</text>
<text class="bl" x="390" y="200">${X("3. Elles fabriquent","3. تُفرز «غراءً»")}</text>
<text class="bl" x="390" y="224">${X("une « colle » vivante.","حيًّا.")}</text>
<text class="sm hl" x="390" y="276">${X("Comme le film glissant","مثل الطبقة اللزجة")}</text>
<text class="sm hl" x="390" y="298">${X("d'un vase de fleurs.","في مزهرية الورود.")}</text>
</svg>`;

const E7=()=>{const G=[[X("Pression différentielle","فرق الضغط"),"ΔP",'↑',X("monte","يرتفع")],[X("Débit d'eau douce","تدفّق الماء العذب"),"Q",'↓',X("baisse","ينخفض")],[X("Sel dans l'eau douce","الملح في الماء العذب"),"µS/cm",'↑',X("monte","يرتفع")]];
 return `<svg ${V} role="img" aria-label="${X("Les signes d'alerte","علامات الإنذار")}">
<text class="h" x="32" y="48">${X("Les signes d'alerte","علامات الإنذار")}</text>
${G.map(([t,u,a,v],i)=>`<g class="a-pop" style="animation-delay:${.3+i*.4}s"><rect class="box" x="${32+i*200}" y="80" width="180" height="170" rx="12"/>
<text class="num" x="${122+i*200}" y="160" text-anchor="middle" style="font:700 54px var(--f-disp);fill:var(--s-acc)">${a}</text>
<text class="f num" x="${122+i*200}" y="112" text-anchor="middle" style="font-size:15px">${u}</text>
<text class="sm" x="${122+i*200}" y="200" text-anchor="middle">${t}</text><text class="bl hl" x="${122+i*200}" y="228" text-anchor="middle">${v}</text></g>`).join('')}
<text class="bl" x="32" y="296">${X("Une variation de 10 à 15 % : il est temps de nettoyer.","تغيّر بنسبة 10 إلى 15 %: حان وقت التنظيف.")}</text>
<text class="sm" x="32" y="324">${X("Le nettoyage chimique est le sujet du module 7.","التنظيف الكيميائي هو موضوع الوحدة 7.")}</text>
</svg>`};

const M5_SCENES=[
 {svg:E1,w:["entartrage","encrassement"],fx:[],t:X0("Les ennemis de la membrane","أعداء الغشاء"),
  say:X0("Une membrane peut s'abîmer de quatre façons. Le tartre : des sels qui cristallisent sur sa surface. Puis trois formes de saleté, qu'on appelle l'encrassement : les colloïdes, ces poussières très fines, la matière organique, et le biofilm, une couche de bactéries. Dans cette leçon, on apprend à les reconnaître.",
   "يمكن أن يتضرّر الغشاء بأربع طرق. الكلس: أملاح تتبلّر على سطحه. ثم ثلاثة أشكال من الأوساخ نسمّيها الانسداد: الجسيمات الغروية، أي الغبار الدقيق جدًا، والمادة العضوية، والغشاء الحيوي، وهو طبقة من البكتيريا. في هذا الدرس، نتعلّم كيف نتعرّف عليها.")},
 {svg:E2,w:["sursature","solubilite"],t:X0("Trop de sel pour l'eau","ملح أكثر مما يحتمله الماء"),
  fx:[["Q > Ks → ↓",X0("Quand il y a plus d'ions que ce que l'eau peut garder dissous (Ks), le surplus devient solide et se dépose.","عندما تكون الشوارد أكثر مما يستطيع الماء إبقاءه منحلًّا (Ks)، يتحوّل الزائد إلى مادة صلبة ويترسّب.")]],
  say:X0("Mets du sucre dans un verre de thé : au début il disparaît. Mais à partir d'une certaine quantité, l'eau est pleine, on dit saturée. Si on en ajoute encore, le surplus reste au fond. Dans la station, la saumure devient presque deux fois plus concentrée que l'eau de mer : certains sels dépassent leur limite et se déposent sur la membrane.",
   "ضعي السكر في كأس شاي: في البداية يختفي. لكن ابتداءً من كمية معيّنة، يمتلئ الماء، ونقول إنه مشبع. وإذا أضفنا المزيد، يبقى الزائد في القعر. في المحطة، يصبح الماء المركّز أكثر تركيزًا بمرتين تقريبًا من ماء البحر: فتتجاوز بعض الأملاح حدّها وتترسّب على الغشاء.")},
 {svg:E3,w:["entartrage"],t:X0("Où se forme le tartre ?","أين يتكوّن الكلس؟"),
  fx:[["Ca²⁺ + SO₄²⁻ → CaSO₄↓",X0("Le calcium et le sulfate s'assemblent en plâtre, qui se dépose.","الكالسيوم والكبريتات يتّحدان ليكوّنا الجبس الذي يترسّب.")],["Ba²⁺ + SO₄²⁻ → BaSO₄↓",X0("Le baryum fait de même : ce dépôt est presque impossible à enlever.","والباريوم كذلك: هذا الراسب يكاد يستحيل نزعه.")]],
  say:X0("Dans un tube de pression, l'eau devient de plus en plus salée en avançant. Le tartre se forme donc surtout dans les derniers modules, côté saumure. Les principaux coupables sont le calcaire, le plâtre, les sulfates de baryum et de strontium, et la silice.",
   "داخل أنبوب الضغط، يصبح الماء أكثر ملوحة كلما تقدّم. لذلك يتكوّن الكلس خاصة في الوحدات الأخيرة، من جهة الماء المركّز. والمتسبّبون الرئيسيون هم الكلس، والجبس، وكبريتات الباريوم والسترونسيوم، والسيليس.")},
 {svg:E4,w:["lsi"],t:X0("Prévoir le tartre : l'indice LSI","توقّع الكلس: مؤشر LSI"),
  fx:[["LSI = pH − pHs",X0("On compare le pH de l'eau au pH où le calcaire serait juste à l'équilibre (pHs). Positif : risque de tartre.","نقارن pH الماء بالـ pH الذي يكون فيه الكلس في حالة توازن تمامًا (pHs). موجب: خطر الكلس.")]],
  say:X0("Pour savoir si le calcaire va se déposer, les chimistes calculent un indice, le LSI. S'il est négatif, l'eau est agressive : elle a tendance à dissoudre le calcaire et à attaquer les tuyaux. S'il est positif, le calcaire risque de se déposer. La saumure a souvent un indice positif : c'est pour cela qu'on ajoute de l'acide et un antitartre.",
   "لمعرفة ما إذا كان الكلس سيترسّب، يحسب الكيميائيون مؤشرًا يُسمّى LSI. إذا كان سالبًا، فالماء عدواني: يميل إلى إذابة الكلس ومهاجمة الأنابيب. وإذا كان موجبًا، فالكلس مهدّد بالترسّب. وغالبًا ما يكون مؤشر الماء المركّز موجبًا: ولهذا نضيف الحمض ومانع الترسّب.")},
 {svg:E5,w:["encrassement","colloid"],fx:[],t:X0("Le gâteau de colmatage","طبقة الانسداد"),
  say:X0("Les poussières et la matière organique que le prétraitement n'a pas retenues arrivent sur la membrane. Couche après couche, elles forment une sorte de gâteau. L'eau a de plus en plus de mal à passer, et les pompes doivent pousser plus fort. C'est pourquoi on surveille le SDI avant les membranes.",
   "الغبار والمادة العضوية التي لم تحجزها المعالجة الأولية تصل إلى الغشاء. طبقة بعد طبقة، تكوّن نوعًا من الكعكة. فيمرّ الماء بصعوبة متزايدة، وتضطرّ المضخّات إلى الضغط بقوة أكبر. ولهذا نراقب مؤشر SDI قبل الأغشية.")},
 {svg:E6,w:["biofilm"],fx:[],t:X0("Le biofilm","الغشاء الحيوي"),
  say:X0("Le biofilm est l'ennemi le plus sournois. Quelques bactéries se posent sur la membrane, se multiplient, puis fabriquent une sorte de colle qui les protège. C'est comme le film glissant qui apparaît dans un vase de fleurs. Une fois installé, il est difficile à enlever, même avec des produits chimiques.",
   "الغشاء الحيوي هو العدوّ الأكثر مكرًا. تستقرّ بعض البكتيريا على الغشاء، وتتكاثر، ثم تُفرز نوعًا من الغراء يحميها. إنه مثل الطبقة اللزجة التي تظهر في مزهرية الورود. وعندما يستقرّ، يصعب نزعه، حتى بالمواد الكيميائية.")},
 {svg:E7,w:["deltap"],fx:[],t:X0("Les signes d'alerte","علامات الإنذار"),
  say:X0("Comment savoir qu'une membrane s'encrasse ? Trois signes : la différence de pression entre l'entrée et la sortie monte, le débit d'eau douce baisse, et il y a plus de sel dans l'eau douce. Quand l'un de ces chiffres change de 10 à 15 %, il est temps de nettoyer les membranes. Ce sera le sujet du module 7.",
   "كيف نعرف أن الغشاء بدأ ينسدّ؟ هناك ثلاث علامات: يرتفع فرق الضغط بين المدخل والمخرج، وينخفض تدفّق الماء العذب، ويزيد الملح في الماء العذب. وعندما يتغيّر أحد هذه الأرقام بنسبة عشرة إلى خمسة عشر بالمائة، يحين وقت تنظيف الأغشية. وسيكون ذلك موضوع الوحدة السابعة.")}
];
const M5_GLOSS={
 entartrage:{fr:"entartrage",ar:"الترسّب الكلسي",n:1,d:X0("Dépôt de sels cristallisés (tartre) sur la membrane.","ترسّب أملاح متبلّرة (كلس) على الغشاء.")},
 encrassement:{fr:"encrassement (colmatage)",ar:"الانسداد",n:1,d:X0("Accumulation de saleté sur la membrane : poussières, matière organique, bactéries.","تراكم الأوساخ على الغشاء: غبار، مادة عضوية، بكتيريا.")},
 solubilite:{fr:"solubilité",ar:"الذوبانية",n:2,d:X0("Quantité maximale d'une substance que l'eau peut garder dissoute.","أقصى كمية من مادة يستطيع الماء إبقاءها منحلّة.")},
 sursature:{fr:"sursaturé",ar:"فوق الإشباع",n:2,d:X0("L'eau contient plus que ce qu'elle peut dissoudre : le surplus se dépose.","يحتوي الماء على أكثر مما يمكنه حلّه: فيترسّب الزائد.")},
 lsi:{fr:"indice LSI",ar:"مؤشر LSI",n:4,d:X0("Indice de Langelier : négatif = eau agressive, positif = risque de calcaire.","مؤشر لانجلييه: سالب = ماء عدواني، موجب = خطر الكلس.")},
 colloid:{fr:"colloïde",ar:"الجسيمات الغروية",n:5,d:X0("Poussière si petite qu'elle ne tombe jamais au fond de l'eau.","غبار صغير جدًا لا يسقط أبدًا إلى قعر الماء.")},
 biofilm:{fr:"biofilm",ar:"الغشاء الحيوي",n:6,d:X0("Couche de bactéries collées par une substance qu'elles fabriquent elles-mêmes.","طبقة من البكتيريا ملتصقة بمادة تُفرزها بنفسها.")},
 deltap:{fr:"pression différentielle (ΔP)",ar:"فرق الضغط (ΔP)",n:7,d:X0("Différence de pression entre l'entrée et la sortie d'un tube. Elle monte quand ça se bouche.","الفرق في الضغط بين مدخل الأنبوب ومخرجه. يرتفع عندما يحدث الانسداد.")}
};
const M5_PREP=[
 {t:X0("Précipiter","الترسّب"),fr0:"Précipiter",like:X0("Quelque chose de dissous <b>redevient solide</b> et se dépose.","مادة منحلّة <b>تعود صلبة</b> وتستقرّ في القعر."),ex:X0("Le calcaire au fond de la bouilloire.","الكلس في قعر الغلاية.")},
 {t:X0("Saumure","الماء المركّز"),fr0:"Saumure",like:X0("L'eau qui reste derrière la membrane : <b>≈ 1,8 fois plus salée</b> que l'eau de mer.","الماء الذي يبقى خلف الغشاء: <b>أشدّ ملوحة بنحو 1,8 مرة</b> من ماء البحر."),ex:X0("Vu au module 3.","رأيناه في الوحدة 3.")},
 {t:X0("Antitartre","مانع الترسّب"),fr0:"Antitartre",like:X0("Produit qui <b>empêche les cristaux de grandir</b>.","منتج <b>يمنع البلّورات من الكِبَر</b>."),ex:X0("Vu au module 4.","رأيناه في الوحدة 4.")}
];
const M5_QUIZ=[
 {q:X0("Quelle est la différence entre entartrage et encrassement ?","ما الفرق بين الترسّب الكلسي والانسداد؟"),o:X0(["Aucune","Entartrage = sels qui cristallisent ; encrassement = poussières, matière organique, bactéries","Entartrage = bactéries ; encrassement = sel"],["لا فرق","الترسّب = أملاح تتبلّر؛ الانسداد = غبار ومادة عضوية وبكتيريا","الترسّب = بكتيريا؛ الانسداد = ملح"]),c:1,e:X0("Le tartre est minéral ; l'encrassement regroupe toutes les autres saletés.","الكلس معدني؛ والانسداد يجمع كل الأوساخ الأخرى.")},
 {q:X0("Dans un tube de pression, où le tartre se forme-t-il surtout ?","داخل أنبوب الضغط، أين يتكوّن الكلس خاصة؟"),o:X0(["Dans les premiers modules","Dans les derniers modules, côté saumure","Partout pareil"],["في الوحدات الأولى","في الوحدات الأخيرة، من جهة الماء المركّز","في كل مكان بالتساوي"]),c:1,e:X0("C'est là que l'eau est la plus concentrée.","هناك يكون الماء أكثر تركيزًا.")},
 {q:X0("Un LSI positif signifie…","مؤشر LSI موجب يعني…"),o:X0(["que l'eau est agressive","un risque de dépôt de calcaire","que l'eau est potable"],["أن الماء عدواني","خطر ترسّب الكلس","أن الماء صالح للشرب"]),c:1,e:X0("Positif : le calcaire risque de se déposer. Négatif : l'eau attaque les tuyaux.","موجب: الكلس مهدّد بالترسّب. سالب: الماء يهاجم الأنابيب.")},
 {q:X0("Qu'est-ce qu'un biofilm ?","ما هو الغشاء الحيوي؟"),o:X0(["Une couche de bactéries collées","Un filtre en tissu","Une couche de sel"],["طبقة من البكتيريا الملتصقة","مرشّح من القماش","طبقة من الملح"]),c:0,e:X0("Les bactéries fabriquent leur propre « colle », comme dans un vase de fleurs.","البكتيريا تُفرز «غراءها» بنفسها، كما في مزهرية الورود.")},
 {q:X0("Lequel de ces signes montre qu'une membrane s'encrasse ?","أيّ هذه العلامات يدل على أن الغشاء ينسدّ؟"),o:X0(["Le débit d'eau douce augmente","La pression différentielle monte","L'eau douce devient moins salée"],["يزداد تدفّق الماء العذب","يرتفع فرق الضغط","يصبح الماء العذب أقل ملوحة"]),c:1,e:X0("ΔP monte, le débit baisse et le sel passe davantage.","يرتفع ΔP، وينخفض التدفّق، ويمرّ الملح أكثر.")}
];
