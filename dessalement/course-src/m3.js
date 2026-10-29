/* ================================================ Module 3 : l'osmose inverse */
function utube(anim,lvL,lvR){
 const salt=[[322,250],[350,262],[336,300],[362,232],[318,296],[358,306],[290,304],[372,288]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.2" fill="#F3E9D2"/>`).join('');
 const left=anim?`<rect class="fresh a-sy" x="122" y="130" width="76" height="150" style="--a:1;--b:.667"/>`:`<rect class="fresh" x="122" y="${lvL}" width="76" height="${280-lvL}"/>`;
 const right=anim?`<rect class="wa a-sy" x="302" y="130" width="76" height="150" style="--a:.667;--b:1"/>`:`<rect class="wa" x="302" y="${lvR}" width="76" height="${280-lvR}"/>`;
 return `${left}${right}<rect class="fresh" x="122" y="280" width="128" height="38"/><rect class="wa" x="250" y="280" width="128" height="38"/>${salt}
 <path class="out" d="M120 80 V320 H380 V80 M200 80 V280 H300 V80"/>
 <line x1="250" y1="280" x2="250" y2="320" stroke="var(--s-rg)" stroke-width="4" stroke-dasharray="5 4"/>
 <text class="sm" x="160" y="346" text-anchor="middle">${X("eau douce","ماء عذب")}</text><text class="sm" x="340" y="346" text-anchor="middle">${X("eau salée","ماء مالح")}</text>`}

const B1=()=>`<svg ${V} role="img" aria-label="${X("L'osmose naturelle","التناضح الطبيعي")}">
<text class="h" x="32" y="48">${X("L'osmose naturelle","التناضح الطبيعي")}</text>
${utube(true)}
${[0,1,2].map(i=>`<circle class="clean a-cross" cx="214" cy="${292+i*9}" r="3.5" style="animation-delay:${i*.5}s"/>`).join('')}
<text class="sm hl" x="250" y="74" text-anchor="middle">${X("membrane","غشاء")}</text>
<text class="bl" x="420" y="140">${X("L'eau traverse seule","يعبر الماء وحده")}</text>
<text class="bl" x="420" y="166">${X("vers le côté salé.","نحو الجهة المالحة.")}</text>
<text class="sm" x="420" y="220">${X("Exemple : un concombre","مثال: الخيار المملّح")}</text>
<text class="sm" x="420" y="244">${X("salé rend son eau.","يُخرج ماءه.")}</text>
</svg>`;

const B2=()=>`<svg ${V} role="img" aria-label="${X("La pression osmotique","الضغط التناضحي")}">
<text class="h" x="32" y="48">${X("La pression osmotique","الضغط التناضحي")}</text>
${utube(false,180,130)}
<line x1="390" y1="130" x2="390" y2="180" stroke="var(--s-acc)" stroke-width="2.5"/><line x1="382" y1="130" x2="398" y2="130" stroke="var(--s-acc)" stroke-width="2.5"/><line x1="382" y1="180" x2="398" y2="180" stroke="var(--s-acc)" stroke-width="2.5"/>
<text class="fa num" x="400" y="162">π</text>
<text class="bl" x="440" y="120">${X("Eau de mer :","ماء البحر:")}</text>
<text class="num a-appear" x="440" y="168" style="font:700 34px var(--f-disp);fill:var(--s-acc);animation-delay:.6s">≈ 28 bar</text>
<text class="sm" x="440" y="206">${X("comme une colonne","كأنه عمود ماء")}</text>
<text class="sm" x="440" y="230">${X("d'eau de ≈ 300 m","ارتفاعه نحو 300 m")}</text>
</svg>`;

const B3=()=>{const salt=[[90,150],[130,210],[170,170],[210,240],[250,150],[110,260],[230,200],[150,130],[270,260]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#F3E9D2"/>`).join('');
 return `<svg ${V} role="img" aria-label="${X("Inverser le sens","عكس الاتجاه")}">
<text class="h" x="32" y="48">${X("Inverser le sens","عكس الاتجاه")}</text>
<rect class="wa" x="42" y="118" width="268" height="164"/>${salt}
<rect class="fresh" x="320" y="118" width="148" height="164" opacity=".8"/>
<rect class="out" x="40" y="116" width="430" height="168"/>
<g class="a-push"><rect class="accf" x="44" y="118" width="20" height="164"/><rect class="accf" x="4" y="190" width="42" height="20"/></g>
<line x1="315" y1="116" x2="315" y2="284" stroke="var(--s-rg)" stroke-width="5" stroke-dasharray="7 5"/>
${[0,1,2,3].map(i=>`<circle class="clean a-cross2" cx="292" cy="${150+i*36}" r="4.5" style="animation-delay:${i*.45}s"/>`).join('')}
<text class="fa num" x="70" y="104">P &gt; π</text>
<text class="sm" x="60" y="312">${X("les sels restent ici","تبقى الأملاح هنا")}</text>
<text class="sm hl" x="330" y="312">${X("eau douce","ماء عذب")}</text>
<text class="bl" x="490" y="160">${X("On pousse","نضغط")}</text>
<text class="bl" x="490" y="186">${X("plus fort que","بقوة أكبر من")}</text>
<text class="bl" x="490" y="212">${X("la pression","الضغط")}</text>
<text class="bl" x="490" y="238">${X("osmotique.","التناضحي.")}</text>
</svg>`};

const B4=()=>{const x0=270,s=4.3,R=[[X("pneu de voiture","عجلة سيارة"),2,"2"],[X("eau de mer (π)","ماء البحر (π)"),28,"28"],[X("saumure en sortie (π)","الماء المركّز عند الخروج (π)"),50,"≈ 50"]];
 let b='';R.forEach(([t,v,lab],i)=>{const y=88+i*50;b+=`<text class="sm" x="32" y="${y+18}">${t}</text><rect class="wa a-grow" x="${x0}" y="${y}" width="${v*s}" height="26" style="animation-delay:${.3+i*.4}s"/><text class="sm num" x="${x0+v*s+8}" y="${y+18}">${lab}</text>`});
 const y=238;b+=`<text class="bl hl" x="32" y="${y+18}">${X("pompes haute pression","مضخّات الضغط العالي")}</text><rect class="accf a-grow" x="${x0}" y="${y}" width="${60*s}" height="26" style="animation-delay:1.5s"/><rect class="accf a-appear" x="${x0+60*s}" y="${y}" width="${10*s}" height="26" opacity=".45" style="animation-delay:2.2s"/><text class="sm num" x="${x0+70*s+8}" y="${y+18}">60–70</text>`;
 let ax=`<line x1="${x0}" y1="290" x2="${x0+70*s}" y2="290" stroke="var(--s-mute)"/>`;for(let v=0;v<=70;v+=10)ax+=`<line x1="${x0+v*s}" y1="290" x2="${x0+v*s}" y2="296" stroke="var(--s-mute)"/><text class="sm num" x="${x0+v*s}" y="314" text-anchor="middle">${v}</text>`;
 return `<svg ${V} role="img" aria-label="${X("Pourquoi 60 à 70 bar ?","لماذا 60 إلى 70 بارًا؟")}">
<text class="h" x="32" y="48">${X("Pourquoi 60 à 70 bar ?","لماذا 60 إلى 70 بارًا؟")}</text>
${b}${ax}<text class="sm num" x="${x0+70*s}" y="340" text-anchor="middle">bar</text>
</svg>`};

const B5=()=>{let pts=[];for(let a=0;a<=10*Math.PI;a+=.15){const r=6+2*a;pts.push((130+r*Math.cos(a)).toFixed(1)+','+(160+r*Math.sin(a)).toFixed(1))}
 let mods='';for(let i=0;i<7;i++)mods+=`<rect class="cry a-appear" x="${66+i*74}" y="284" width="66" height="26" rx="4" opacity=".9" style="animation-delay:${1+i*.25}s"/>`;
 let stripes='';for(let i=0;i<9;i++)stripes+=`<line x1="${290+i*20}" y1="114" x2="${290+i*20}" y2="196" stroke="var(--s-mute)" stroke-width="1.5"/>`;
 return `<svg ${V} role="img" aria-label="${X("La membrane enroulée","الغشاء الملفوف")}">
<text class="h" x="32" y="48">${X("La membrane enroulée","الغشاء الملفوف")}</text>
<polyline class="poly a-appear" points="${pts.join(' ')}"/>
<text class="sm" x="130" y="252" text-anchor="middle">${X("vue en coupe","مقطع عرضي")}</text>
<rect class="box" x="270" y="110" width="200" height="90" rx="10"/>${stripes}
<ellipse class="box" cx="470" cy="155" rx="16" ry="45"/>
<line x1="270" y1="222" x2="486" y2="222" stroke="var(--s-acc)" stroke-width="2"/><text class="sm num" x="378" y="244" text-anchor="middle">≈ 1 m</text>
<text class="bl hl num" x="500" y="140">≈ 40 m²</text>
<text class="sm" x="500" y="166">${X("de membrane","من الغشاء")}</text>
<text class="sm" x="500" y="190">${X("enroulée","ملفوفة")}</text>
<rect class="out" x="58" y="278" width="530" height="38" rx="19"/>${mods}
<text class="sm" x="58" y="344">${X("6 à 8 modules à la suite dans un tube de pression","من 6 إلى 8 وحدات متتالية في أنبوب ضغط")}</text>
</svg>`};

const B6=()=>`<svg ${V} role="img" aria-label="${X("Le taux de conversion","نسبة التحويل")}">
<text class="h" x="32" y="48">${X("Le taux de conversion","نسبة التحويل")}</text>
<path class="a-appear" d="M40 160 H250 C380 160 400 112 600 112" fill="none" stroke="#7FD0DC" stroke-width="54"/>
<path class="a-appear" d="M40 220 H250 C380 220 400 282 600 282" fill="none" stroke="var(--s-acc)" stroke-width="66" style="animation-delay:.6s"/>
<text class="bl" x="48" y="118">${X("100 L d'eau de mer","ماء البحر: 100 L")}</text>
<text class="bl" x="440" y="72">${X("45 L d'eau douce","الماء العذب: 45 L")}</text>
<text class="bl" x="440" y="338">${X("55 L de saumure","الماء المركّز: 55 L")}</text>
<text class="sm" x="48" y="292">${X("≈ 1,8 fois plus salée","أشدّ ملوحة بنحو 1,8 مرة")}</text>
<text class="sm" x="48" y="316">${X("retourne à la mer","يعود إلى البحر")}</text>
</svg>`;

const B7=()=>`<svg ${V} role="img" aria-label="${X("Récupérer l'énergie","استرجاع الطاقة")}">
<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--s-ink)"/></marker></defs>
<text class="h" x="32" y="48">${X("Récupérer l'énergie","استرجاع الطاقة")}</text>
<rect class="box" x="20" y="160" width="110" height="48" rx="8"/><text class="sm" x="75" y="190" text-anchor="middle">${X("eau de mer","ماء البحر")}</text>
<rect class="box" x="190" y="84" width="120" height="48" rx="8"/><text class="sm" x="250" y="114" text-anchor="middle">${X("pompe HP","مضخّة HP")}</text>
<rect class="box hi" x="370" y="78" width="130" height="122" rx="8"/><text class="bl" x="435" y="144" text-anchor="middle">${X("membranes","الأغشية")}</text>
<rect class="box hi" x="190" y="236" width="120" height="56" rx="8"/><text class="sm hl" x="250" y="260" text-anchor="middle">${X("échangeur","مبادل")}</text><text class="sm hl" x="250" y="280" text-anchor="middle">${X("de pression","الضغط")}</text>
<path d="M130 176 H160 V108 H186" class="flowline" marker-end="url(#ah)"/>
<path d="M310 108 H366" class="flowline" marker-end="url(#ah)"/>
<path d="M500 110 H612" class="flowline" marker-end="url(#ah)"/><text class="sm" x="512" y="98">${X("eau douce","ماء عذب")}</text>
<path d="M435 200 V264 H314" class="flowline hot" marker-end="url(#ah)"/>
<path d="M130 196 H160 V250 H186" class="flowline" marker-end="url(#ah)"/>
<path d="M250 236 V214 H340 V170 H366" class="flowline hot" marker-end="url(#ah)"/>
<path d="M190 280 H40 V310" class="flowline" marker-end="url(#ah)"/><text class="sm" x="48" y="340">${X("saumure vers la mer","الماء المركّز نحو البحر")}</text>
<text class="bl hl num" x="400" y="300">≈ 3 kWh/m³</text>
<text class="sm" x="400" y="326">${X("sans échangeur : ≈ 2 fois plus","دون مبادل: الضعف تقريبًا")}</text>
</svg>`;

const M3_SCENES=[
 {svg:B1,w:["semi","osmose"],fx:[],t:X0("L'osmose naturelle","التناضح الطبيعي"),
  say:X0("Quand tu sales des concombres, ils rendent de l'eau : c'est l'osmose. Si on sépare de l'eau douce et de l'eau salée par une membrane qui ne laisse passer que l'eau, l'eau douce traverse toute seule vers le côté salé, pour le diluer. Le niveau baisse d'un côté et monte de l'autre.",
   "عندما تملّحين الخيار، يُخرج ماءه: هذا هو التناضح. إذا فصلنا ماءً عذبًا عن ماء مالح بغشاء لا يترك إلا الماء يمرّ، يعبر الماء العذب وحده نحو الجهة المالحة ليخفّفها. فينخفض المستوى في جهة ويرتفع في الأخرى.")},
 {svg:B2,w:["pression","pi"],t:X0("La pression osmotique","الضغط التناضحي"),
  fx:[["π = i · C · R · T",X0("La pression osmotique (π) grandit avec la quantité de sel (C) et la température (T). i et R sont des nombres connus.","الضغط التناضحي (π) يكبر مع كمية الملح (C) ودرجة الحرارة (T). أما i و R فهما عددان معروفان.")]],
  say:X0("Au bout d'un moment, la différence de niveau s'arrête : le poids de l'eau en trop pousse dans l'autre sens. Cette poussée s'appelle la pression osmotique. Pour l'eau de mer, elle est d'environ 28 bar : c'est comme le poids d'une colonne d'eau de presque 300 mètres de haut. Plus l'eau est salée, plus cette pression est grande.",
   "بعد مدّة، يتوقّف فرق المستوى: فوزن الماء الزائد يدفع في الاتجاه المعاكس. هذا الدفع يُسمّى الضغط التناضحي. بالنسبة لماء البحر، هو نحو ثمانية وعشرين بارًا: كأنه وزن عمود من الماء ارتفاعه قرابة ثلاثمائة متر. وكلما كان الماء أكثر ملوحة، كان هذا الضغط أكبر.")},
 {svg:B3,w:["oi"],fx:[],t:X0("Inverser le sens","عكس الاتجاه"),
  say:X0("Et si on poussait plus fort que la pression osmotique ? On appuie sur l'eau salée avec un piston, à plus de 28 bar. L'eau change alors de direction : elle traverse la membrane du côté salé vers le côté doux, en laissant les sels derrière elle. C'est l'osmose inverse.",
   "وماذا لو ضغطنا بقوة أكبر من الضغط التناضحي؟ نضغط على الماء المالح بمكبس، بأكثر من ثمانية وعشرين بارًا. عندئذ يغيّر الماء اتجاهه: يعبر الغشاء من الجهة المالحة إلى الجهة العذبة، تاركًا الأملاح خلفه. هذا هو التناضح العكسي.")},
 {svg:B4,w:["pression","saumure"],fx:[],t:X0("Pourquoi 60 à 70 bar ?","لماذا 60 إلى 70 بارًا؟"),
  say:X0("Pendant que l'eau douce sort, l'eau qui reste devient de plus en plus salée. Sa pression osmotique monte, jusqu'à environ 50 bar en bout de membrane. Pour que l'eau continue de passer partout, les pompes poussent entre 60 et 70 bar. C'est près de trente fois la pression d'un pneu de voiture.",
   "بينما يخرج الماء العذب، يصبح الماء المتبقّي أكثر فأكثر ملوحة. فيرتفع ضغطه التناضحي حتى نحو خمسين بارًا في نهاية الغشاء. ولكي يستمرّ الماء في العبور في كل مكان، تدفع المضخّات بضغط بين ستين وسبعين بارًا، أي قرابة ثلاثين مرة ضغطَ عجلة السيارة.")},
 {svg:B5,w:["module"],fx:[],t:X0("La membrane enroulée","الغشاء الملفوف"),
  say:X0("En station, la membrane n'est pas plate : elle est enroulée autour d'un tube, comme un tapis roulé. Dans un cylindre d'environ un mètre de long, on cache près de 40 mètres carrés de membrane, la surface d'un petit appartement. On place 6 à 8 de ces modules à la suite dans un tube de pression, et une grande station en compte des milliers.",
   "في المحطة، الغشاء ليس مسطّحًا: إنه ملفوف حول أنبوب، مثل سجّادة ملفوفة. في أسطوانة طولها نحو متر واحد، نُخفي قرابة أربعين مترًا مربعًا من الغشاء، أي مساحة شقة صغيرة. نضع من ستّ إلى ثماني وحدات متتالية داخل أنبوب ضغط، والمحطة الكبيرة تضمّ الآلاف منها.")},
 {svg:B6,w:["conversion","saumure"],t:X0("Le taux de conversion","نسبة التحويل"),
  fx:[["45 L ÷ 100 L = 45 %",X0("On divise l'eau douce produite par l'eau de mer qui est entrée.","نقسم الماء العذب المنتَج على ماء البحر الذي دخل.")]],
  say:X0("Sur 100 litres d'eau de mer qui entrent, environ 45 litres ressortent en eau douce. Les 55 litres restants forment la saumure, presque deux fois plus salée, qui retourne à la mer. Ce rapport s'appelle le taux de conversion : ici, 45 pour cent.",
   "من كل مائة لتر من ماء البحر تدخل، يخرج نحو خمسة وأربعين لترًا ماءً عذبًا. أما الخمسة والخمسون لترًا الباقية فتكوّن الماء المركّز، الأشدّ ملوحة بمرتين تقريبًا، الذي يعود إلى البحر. نسمّي هذه النسبة نسبة التحويل: هنا، خمسة وأربعون بالمائة.")},
 {svg:B7,w:["erd","kwh"],fx:[],t:X0("Récupérer l'énergie","استرجاع الطاقة"),
  say:X0("La saumure sort des membranes encore sous très forte pression. Plutôt que de gaspiller cette énergie, on la fait passer dans un échangeur de pression, qui la transmet à l'eau de mer qui arrive. Grâce à lui, produire un mètre cube d'eau douce consomme environ 3 kilowattheures, à peu près un radiateur électrique allumé pendant une heure et demie. Sans lui, il en faudrait presque le double.",
   "يخرج الماء المركّز من الأغشية وهو ما زال تحت ضغط مرتفع جدًا. بدل إهدار هذه الطاقة، نمرّره عبر مبادل ضغط ينقلها إلى ماء البحر الداخل. وبفضله، يستهلك إنتاج متر مكعب من الماء العذب نحو ثلاثة كيلوواط ساعي، أي تقريبًا مدفأة كهربائية تشتغل ساعة ونصفًا. ومن دونه، نحتاج إلى ضعف ذلك تقريبًا.")}
];
const M3_GLOSS={
 semi:{fr:"membrane semi-perméable",ar:"غشاء نصف نفوذ",n:1,d:X0("Paroi qui laisse passer l'eau mais bloque les ions, comme un tamis extrêmement fin.","جدار يترك الماء يمرّ ويحجز الشوارد، مثل غربال دقيق جدًا.")},
 osmose:{fr:"osmose",ar:"التناضح",n:1,d:X0("Passage naturel de l'eau à travers une membrane, du côté le moins salé vers le plus salé.","مرور طبيعي للماء عبر غشاء، من الجهة الأقل ملوحة إلى الأكثر ملوحة.")},
 pression:{fr:"pression (bar)",ar:"الضغط (بار)",n:2,d:X0("Force qui pousse sur une surface. 1 bar : l'air autour de nous. Pneu de voiture : environ 2 bar.","قوة تدفع على سطح ما. 1 بار: الهواء حولنا. عجلة السيارة: نحو 2 بار.")},
 pi:{fr:"pression osmotique",ar:"الضغط التناضحي",n:2,d:X0("Pression qui arrête l'osmose. Eau de mer : environ 28 bar.","الضغط الذي يوقف التناضح. ماء البحر: نحو 28 بارًا.")},
 oi:{fr:"osmose inverse",ar:"التناضح العكسي",n:3,d:X0("On pousse l'eau salée plus fort que la pression osmotique : l'eau douce passe, les sels restent.","نضغط الماء المالح بقوة أكبر من الضغط التناضحي: يمرّ الماء العذب وتبقى الأملاح.")},
 saumure:{fr:"saumure",ar:"الماء المركّز",n:4,d:X0("Eau très salée qui reste derrière la membrane et retourne à la mer.","ماء مالح جدًا يبقى خلف الغشاء ويعود إلى البحر.")},
 module:{fr:"module spiralé",ar:"وحدة ملفوفة حلزونيًا",n:5,d:X0("Membrane enroulée dans un cylindre d'environ 1 m, avec près de 40 m² de surface.","غشاء ملفوف في أسطوانة طولها نحو 1 m، بمساحة تقارب 40 m².")},
 conversion:{fr:"taux de conversion",ar:"نسبة التحويل",n:6,d:X0("Part de l'eau de mer transformée en eau douce. Souvent autour de 45 %.","حصّة ماء البحر التي تتحوّل إلى ماء عذب. غالبًا في حدود 45 %.")},
 erd:{fr:"échangeur de pression",ar:"مبادل الضغط",n:7,d:X0("Appareil qui récupère la pression de la saumure pour la donner à l'eau de mer qui entre.","جهاز يسترجع ضغط الماء المركّز ليعطيه لماء البحر الداخل.")},
 kwh:{fr:"kWh/m³",ar:"kWh/m³",n:7,d:X0("Énergie électrique pour produire 1 m³ (1 000 litres) d'eau douce.","الطاقة الكهربائية اللازمة لإنتاج 1 m³ (1000 لتر) من الماء العذب.")}
};
const M3_PREP=[
 {t:X0("Pression","الضغط"),fr0:"Pression",like:X0("La <b>force</b> avec laquelle on pousse sur une surface. On la mesure en <b>bar</b>.","<b>القوة</b> التي ندفع بها على سطح ما. نقيسها بوحدة <b>البار</b>."),ex:X0("Air autour de nous : 1 bar · pneu de voiture : ≈ 2 bar","الهواء حولنا: 1 بار · عجلة السيارة: ≈ 2 بار")},
 {t:X0("Membrane semi-perméable","غشاء نصف نفوذ"),fr0:"Membrane semi-perméable",like:X0("Une paroi qui laisse passer <b>l'eau</b> mais bloque <b>les ions</b>.","جدار يترك <b>الماء</b> يمرّ ويحجز <b>الشوارد</b>."),ex:X0("Comme un tamis très, très fin.","مثل غربال دقيق جدًا.")},
 {t:X0("Concentration","التركيز"),fr0:"Concentration",like:X0("Plus il y a de sel dans un litre, plus l'eau est <b>concentrée</b>.","كلما زاد الملح في اللتر، كان الماء أكثر <b>تركيزًا</b>."),ex:X0("Eau de mer : 38 g/L · saumure : ≈ 70 g/L","ماء البحر: 38 g/L · الماء المركّز: ≈ 70 g/L")}
];
const M3_QUIZ=[
 {q:X0("En osmose naturelle, l'eau traverse la membrane vers…","في التناضح الطبيعي، يعبر الماء الغشاء نحو…"),o:X0(["le côté le plus salé","le côté le moins salé","nulle part"],["الجهة الأكثر ملوحة","الجهة الأقل ملوحة","لا مكان"]),c:0,
  e:X0("L'eau va diluer le côté salé.","يذهب الماء ليخفّف الجهة المالحة.")},
 {q:X0("Pour obtenir de l'eau douce, la pression appliquée doit être…","للحصول على ماء عذب، يجب أن يكون الضغط المطبَّق…"),o:X0(["plus faible que la pression osmotique","plus forte que la pression osmotique","égale à zéro"],["أقل من الضغط التناضحي","أكبر من الضغط التناضحي","يساوي صفرًا"]),c:1,
  e:X0("C'est en poussant plus fort que π qu'on inverse le sens de l'eau.","بالضغط بقوة أكبر من π نعكس اتجاه الماء.")},
 {q:X0("Quelle est la pression osmotique de l'eau de mer ?","كم يبلغ الضغط التناضحي لماء البحر؟"),o:X0(["Environ 2 bar","Environ 28 bar","Environ 280 bar"],["نحو 2 بار","نحو 28 بارًا","نحو 280 بارًا"]),c:1,
  e:X0("Environ 28 bar, d'où des pompes à 60–70 bar.","نحو 28 بارًا، ولهذا تعمل المضخّات بين 60 و70 بارًا.")},
 {q:X0("Sur 100 L d'eau de mer, combien d'eau douce obtient-on environ ?","من 100 L من ماء البحر، كم نحصل تقريبًا من الماء العذب؟"),o:X0(["5 L","45 L","100 L"],["5 L","45 L","100 L"]),c:1,
  e:X0("Le taux de conversion tourne autour de 45 %.","نسبة التحويل في حدود 45 %.")},
 {q:X0("À quoi sert l'échangeur de pression ?","ما فائدة مبادل الضغط؟"),o:X0(["À enlever le chlore","À récupérer l'énergie de la saumure sous pression","À ajouter du sel"],["نزع الكلور","استرجاع طاقة الماء المركّز المضغوط","إضافة الملح"]),c:1,
  e:X0("Il redonne la pression de la saumure à l'eau qui entre : la consommation d'énergie est presque divisée par deux.","يعيد ضغط الماء المركّز إلى الماء الداخل: فينخفض استهلاك الطاقة إلى النصف تقريبًا.")}
];
