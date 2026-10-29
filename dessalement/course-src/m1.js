/* ================================================ Module 1 : le contexte algérien */
const C1=()=>{const x0=200,s=0.4;
 return `<svg ${V} role="img" aria-label="${X("Un pays qui a soif","بلد عطشان")}">
<text class="h" x="32" y="48">${X("Un pays qui a soif","بلد عطشان")}</text>
<circle cx="560" cy="80" r="26" class="accf a-pop"/>${[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return `<line x1="${560+34*Math.cos(a)}" y1="${80+34*Math.sin(a)}" x2="${560+44*Math.cos(a)}" y2="${80+44*Math.sin(a)}" stroke="var(--s-acc)" stroke-width="3" stroke-linecap="round"/>`}).join('')}
<text class="sm" x="32" y="104">${X("Eau disponible par habitant et par an","الماء المتوفّر لكل ساكن في السنة")}</text>
<text class="sm" x="32" y="152">${X("seuil de rareté","عتبة الندرة")}</text>
<rect class="wa a-grow" x="${x0}" y="134" width="${1000*s}" height="28"/><text class="sm num" x="${x0+1000*s-6}" y="${153}" text-anchor="end" style="fill:var(--s-ink)">1 000 m³</text>
<text class="bl hl" x="32" y="208">${X("Algérie","الجزائر")}</text>
<rect class="accf a-grow" x="${x0}" y="190" width="${500*s}" height="28" style="animation-delay:.6s"/><text class="bl hl num" x="${x0+500*s+10}" y="210">&lt; 500 m³</text>
<text class="bl" x="32" y="280">${X("Plus de 80 % du pays est désert.","أكثر من 80 % من البلاد صحراء.")}</text>
<text class="sm" x="32" y="310">${X("Et la pluie est de plus en plus irrégulière.","والأمطار غير منتظمة أكثر فأكثر.")}</text>
</svg>`};

const C2=()=>`<svg ${V} role="img" aria-label="${X("Barrages et nappes","السدود والمياه الجوفية")}">
<text class="h" x="32" y="48">${X("Barrages et nappes","السدود والمياه الجوفية")}</text>
<path d="M40 210 L170 210 L170 120 L200 120 L230 210" fill="var(--s-box)" stroke="var(--s-mute)" stroke-width="2"/>
<rect class="wa" x="230" y="180" width="140" height="30"/>
<line x1="230" y1="130" x2="370" y2="130" stroke="var(--s-mute)" stroke-dasharray="6 5" stroke-width="2"/>
<text class="sm" x="236" y="122">${X("niveau normal","المستوى العادي")}</text>
<text class="sm hl" x="236" y="172">${X("après une sécheresse","بعد الجفاف")}</text>
<rect x="30" y="250" width="380" height="60" fill="#3A3226"/>
<rect class="wa a-grow" x="30" y="282" width="160" height="22" style="animation-delay:.5s"/>
${[90,220,330].map(x=>`<line x1="${x}" y1="210" x2="${x}" y2="296" stroke="var(--s-ink)" stroke-width="3"/>`).join('')}
<text class="sm" x="30" y="338">${X("nappe souterraine : elle se vide plus vite qu'elle ne se remplit","المياه الجوفية: تنفد أسرع مما تتجدّد")}</text>
<text class="bl" x="440" y="140">${X("Barrages :","السدود:")}</text>
<text class="sm" x="440" y="164">${X("dépendent de la pluie","تعتمد على المطر")}</text>
<text class="bl" x="440" y="218">${X("Nappes :","المياه الجوفية:")}</text>
<text class="sm" x="440" y="242">${X("trop sollicitées","مستغلّة أكثر من اللازم")}</text>
</svg>`;

const C3=()=>{const C=[[70,X("Oran","وهران"),1],[170,X("Tipaza","تيبازة"),0],[240,X("Alger","العاصمة"),1],[310,X("Boumerdès","بومرداس"),0],[400,X("Béjaïa","بجاية"),1],[490,X("Skikda","سكيكدة"),0],[580,X("El Tarf","الطارف"),1]];
 return `<svg ${V} role="img" aria-label="${X("Pourquoi la mer ?","لماذا البحر؟")}">
<text class="h" x="32" y="48">${X("Pourquoi la mer ?","لماذا البحر؟")}</text>
<text class="sm" x="32" y="76">${X("schéma, pas à l'échelle","رسم توضيحي، دون مقياس")}</text>
<path d="M20 190 C90 170 150 205 220 186 S360 170 420 192 S540 176 620 190 V330 H20 Z" class="wa"/>
<path d="M20 232 q15 -8 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="var(--s-ink)" opacity=".35" stroke-width="2"/>
${C.map(([x,n,up],i)=>`<g class="a-pop" style="animation-delay:${.3+i*.25}s"><circle cx="${x}" cy="186" r="7" class="accf"/></g><line x1="${x}" y1="${up?150:120}" x2="${x}" y2="178" stroke="var(--s-mute)" stroke-width="1"/><text class="sm" x="${x}" y="${up?144:114}" text-anchor="middle">${n}</text>`).join('')}
<text class="bl" x="40" y="280">${X("Méditerranée : ≈ 1 200 km de côtes","المتوسط: نحو 1200 km من السواحل")}</text>
<text class="sm" x="40" y="308">${X("La plupart des habitants vivent dans le nord, près de la mer.","يعيش أغلب السكان في الشمال، قرب البحر.")}</text>
</svg>`};

const C4=()=>{const x0=230,s=0.00072;
 return `<svg ${V} role="img" aria-label="${X("Les pionnières","المحطات الأولى")}">
<text class="h" x="32" y="48">${X("Les pionnières","المحطات الأولى")}</text>
<text class="sm" x="32" y="82">${X("capacité, en m³ d'eau douce par jour","القدرة، بالمتر المكعب من الماء العذب يوميًا")}</text>
<text class="bl" x="32" y="140">${X("Hamma (Alger)","الحامة (الجزائر)")}</text><text class="sm num" x="32" y="164">2008</text>
<rect class="wa a-grow" x="${x0}" y="122" width="${200000*s}" height="34"/><text class="bl num" x="${x0+200000*s+10}" y="146">200 000</text>
<text class="bl" x="32" y="230">${X("Magtaa (Oran)","المقطع (وهران)")}</text><text class="sm num" x="32" y="254">2014</text>
<rect class="accf a-grow" x="${x0}" y="212" width="${500000*s}" height="34" style="animation-delay:.6s"/><text class="bl hl num" x="${x0+500000*s-10}" y="236" text-anchor="end" style="fill:var(--s-bg)">500 000</text>
<text class="sm" x="32" y="312">${X("Magtaa a été l'une des plus grandes stations d'osmose inverse au monde.","كانت محطة المقطع من أكبر محطات التناضح العكسي في العالم.")}</text>
</svg>`};

const C5=()=>{const W=[X("El Tarf","الطارف"),X("Béjaïa","بجاية"),X("Boumerdès","بومرداس"),X("Tipaza","تيبازة"),X("Oran","وهران")];
 return `<svg ${V} role="img" aria-label="${X("2025 : cinq grandes stations","2025: خمس محطات كبرى")}">
<text class="h" x="32" y="48">${X("2025 : cinq grandes stations","2025: خمس محطات كبرى")}</text>
${W.map((n,i)=>`<g class="a-pop" style="animation-delay:${.3+i*.3}s"><rect class="box hi" x="${28+i*118}" y="80" width="106" height="104" rx="10"/>
<text class="bl" x="${81+i*118}" y="114" text-anchor="middle">${n}</text><text class="f num" x="${81+i*118}" y="150" text-anchor="middle" style="font-size:16px;fill:var(--s-acc)">300 000</text><text class="sm num" x="${81+i*118}" y="172" text-anchor="middle">m³/j</text></g>`).join('')}
<text class="bl hl num" x="32" y="236">= 1 500 000 m³/j</text>
<text class="bl" x="32" y="266">${X("de quoi alimenter environ 15 millions de personnes","ما يكفي لتزويد نحو 15 مليون شخص")}</text>
<text class="sm" x="32" y="304">${X("Construites en moins de deux ans, avec des ingénieurs et des entreprises algériens.","بُنيت في أقل من سنتين، بمهندسين ومؤسسات جزائرية.")}</text>
</svg>`};

const C6=()=>{const B=[[X("avant 2025","قبل 2025"),18,'wa'],[X("après 2025","بعد 2025"),42,'accf'],[X("objectif 2030","هدف 2030"),60,'rgf']];const base=300,s=3;
 return `<svg ${V} role="img" aria-label="${X("Les chiffres clés","الأرقام الأساسية")}">
<text class="h" x="32" y="48">${X("Les chiffres clés","الأرقام الأساسية")}</text>
<text class="sm" x="32" y="78">${X("part de l'eau potable qui vient du dessalement","حصّة ماء الشرب الآتية من التحلية")}</text>
<line x1="40" y1="${base}" x2="400" y2="${base}" stroke="var(--s-mute)"/>
${B.map(([n,v,c],i)=>`<rect class="${c} a-growy" x="${70+i*110}" y="${base-v*s}" width="70" height="${v*s}" style="animation-delay:${.3+i*.5}s;transform-origin:center bottom"/>
<text class="bl num" x="${105+i*110}" y="${base-v*s-10}" text-anchor="middle">${v} %</text><text class="sm" x="${105+i*110}" y="${base+24}" text-anchor="middle">${n}</text>`).join('')}
<text class="bl hl num" x="440" y="150">19</text><text class="sm" x="480" y="150">${X("stations","محطة")}</text>
<text class="bl hl num" x="440" y="200">3,7 M m³/j</text><text class="sm" x="440" y="222">${X("produits chaque jour","تُنتج يوميًا")}</text>
<text class="bl num" x="440" y="270">≈ 5,6 M m³/j</text><text class="sm" x="440" y="292">${X("visés en 2030","مستهدفة في 2030")}</text>
</svg>`};

const C7=()=>{const J=[[X("Conduite","القيادة"),X("salle de contrôle","قاعة المراقبة"),'<rect x="-22" y="-16" width="44" height="28" rx="3" fill="none" stroke="var(--s-ink)" stroke-width="2.5"/><line x1="-10" y1="18" x2="10" y2="18" stroke="var(--s-ink)" stroke-width="2.5"/>',0],
 [X("Laboratoire","المخبر"),X("analyses chimiques","التحاليل الكيميائية"),'<path d="M-8 -20 h16 M-5 -20 v14 l-14 24 h38 l-14 -24 v-14" fill="none" stroke="var(--s-acc)" stroke-width="2.5"/>',1],
 [X("Maintenance","الصيانة"),X("pompes, membranes","المضخّات، الأغشية"),'<circle r="12" fill="none" stroke="var(--s-ink)" stroke-width="2.5"/><circle r="4" class="mutef"/>',0],
 [X("Électricité","الكهرباء"),X("automatismes","الأنظمة الآلية"),'<path d="M4 -22 L-10 2 h10 l-4 20 L14 -4 h-10 z" fill="var(--s-rg)"/>',0]];
 return `<svg ${V} role="img" aria-label="${X("Les métiers de la station","مهن المحطة")}">
<text class="h" x="32" y="48">${X("Les métiers de la station","مهن المحطة")}</text>
${J.map(([t,s,ic,hi],i)=>`<g class="a-pop" style="animation-delay:${.3+i*.3}s"><rect class="box${hi?' hi':''}" x="${24+i*152}" y="84" width="144" height="170" rx="12"/>
<g transform="translate(${96+i*152} 140)">${ic}</g><text class="bl${hi?' hl':''}" x="${96+i*152}" y="204" text-anchor="middle">${t}</text><text class="sm" x="${96+i*152}" y="230" text-anchor="middle" style="font-size:13px">${s}</text></g>`).join('')}
<text class="bl hl" x="32" y="304">${X("La chimie est au cœur de toutes ces étapes.","الكيمياء في قلب كل هذه المراحل.")}</text>
</svg>`};

const M1_SCENES=[
 {svg:C1,w:["stress"],fx:[],t:X0("Un pays qui a soif","بلد عطشان"),
  say:X0("On dit qu'un pays manque d'eau quand chaque habitant dispose de moins de 1 000 mètres cubes par an. En Algérie, c'est moins de 500. Plus de 80 % du territoire est désert, et la pluie devient de plus en plus irrégulière. C'est ce qu'on appelle le stress hydrique.",
   "نقول إن البلد يعاني نقصًا في الماء عندما يتوفّر لكل ساكن أقل من ألف متر مكعب في السنة. في الجزائر، الرقم أقل من خمسمائة. أكثر من ثمانين بالمائة من البلاد صحراء، والأمطار غير منتظمة أكثر فأكثر. هذا ما نسمّيه الإجهاد المائي.")},
 {svg:C2,w:["barrage","nappe"],fx:[],t:X0("Barrages et nappes","السدود والمياه الجوفية"),
  say:X0("Pendant longtemps, l'eau potable venait surtout des barrages et des nappes souterraines. Mais les barrages dépendent de la pluie : après plusieurs années sèches, ils se vident. Et les nappes sont pompées plus vite qu'elles ne se remplissent. Il fallait une autre source.",
   "لمدة طويلة، كان ماء الشرب يأتي أساسًا من السدود والمياه الجوفية. لكن السدود تعتمد على المطر: بعد عدّة سنوات جافة، تفرغ. والمياه الجوفية تُضخّ أسرع مما تتجدّد. كان لا بد من مصدر آخر.")},
 {svg:C3,w:["dessalement"],fx:[],t:X0("Pourquoi la mer ?","لماذا البحر؟"),
  say:X0("L'Algérie a environ 1 200 kilomètres de côtes sur la Méditerranée, et la plupart de ses habitants vivent dans le nord, près de la mer. La mer, elle, ne connaît pas la sécheresse. Le dessalement permet donc de produire de l'eau potable tout près des grandes villes, quelle que soit la pluie.",
   "للجزائر نحو ألف ومائتي كيلومتر من السواحل على البحر الأبيض المتوسط، ويعيش أغلب سكانها في الشمال قرب البحر. والبحر لا يعرف الجفاف. لذلك تسمح التحلية بإنتاج ماء الشرب قرب المدن الكبرى، مهما كانت كمية الأمطار.")},
 {svg:C4,w:["capacite"],fx:[],t:X0("Les pionnières","المحطات الأولى"),
  say:X0("Les premières grandes stations sont arrivées dans les années 2000. Celle du Hamma, à Alger, produit 200 000 mètres cubes par jour depuis 2008. Celle de Magtaa, près d'Oran, en produit 500 000 : à son ouverture, c'était l'une des plus grandes stations d'osmose inverse au monde.",
   "وصلت أولى المحطات الكبرى في سنوات الألفين. محطة الحامة في الجزائر العاصمة تنتج مائتي ألف متر مكعب يوميًا منذ 2008. ومحطة المقطع قرب وهران تنتج خمسمائة ألف: وعند افتتاحها، كانت من أكبر محطات التناضح العكسي في العالم.")},
 {svg:C5,w:["capacite"],fx:[],t:X0("2025 : cinq grandes stations","2025: خمس محطات كبرى"),
  say:X0("En 2025, cinq nouvelles stations sont entrées en service : à El Tarf, Béjaïa, Boumerdès, Tipaza et Oran. Chacune produit 300 000 mètres cubes par jour. Ensemble, elles peuvent alimenter environ 15 millions de personnes. Elles ont été construites en moins de deux ans, avec des ingénieurs et des entreprises algériens.",
   "في 2025، دخلت خمس محطات جديدة حيّز الخدمة: في الطارف وبجاية وبومرداس وتيبازة ووهران. تنتج كل واحدة منها ثلاثمائة ألف متر مكعب يوميًا. ومعًا، يمكنها تزويد نحو خمسة عشر مليون شخص. وقد بُنيت في أقل من سنتين، بمهندسين ومؤسسات جزائرية.")},
 {svg:C6,w:["part"],fx:[],t:X0("Les chiffres clés","الأرقام الأساسية"),
  say:X0("Avec ces stations, l'Algérie en compte 19, qui produisent ensemble 3,7 millions de mètres cubes par jour. La part de l'eau potable qui vient de la mer est passée d'environ 18 % à 42 %. D'autres stations sont lancées, à Tlemcen, Chlef, Mostaganem ou Skikda, avec un objectif d'environ 60 % en 2030.",
   "بهذه المحطات، أصبح للجزائر تسع عشرة محطة، تنتج معًا ثلاثة ملايين وسبعمائة ألف متر مكعب يوميًا. وانتقلت حصّة ماء الشرب الآتية من البحر من نحو ثمانية عشر بالمائة إلى اثنين وأربعين بالمائة. وقد أُطلقت محطات أخرى، في تلمسان والشلف ومستغانم وسكيكدة، بهدف بلوغ نحو ستين بالمائة في 2030.")},
 {svg:C7,w:["laboratoire"],fx:[],t:X0("Les métiers de la station","مهن المحطة"),
  say:X0("Une station, ce sont des dizaines de métiers. À la conduite, on surveille l'installation depuis une salle de contrôle. Au laboratoire, on analyse l'eau plusieurs fois par jour. La maintenance s'occupe des pompes et des membranes, et les électriciens des automatismes. Dans tous ces métiers, la chimie de l'eau est au centre : c'est ce que tu vas apprendre.",
   "المحطة تضمّ عشرات المهن. في القيادة، نراقب المنشأة من قاعة المراقبة. وفي المخبر، نحلّل الماء عدّة مرات في اليوم. وتهتمّ الصيانة بالمضخّات والأغشية، والكهربائيون بالأنظمة الآلية. وفي كل هذه المهن، كيمياء الماء في القلب: وهذا ما ستتعلّمينه.")}
];
const M1_GLOSS={
 stress:{fr:"stress hydrique",ar:"الإجهاد المائي",n:1,d:X0("Situation d'un pays où l'eau disponible ne suffit pas aux besoins.","وضع بلد لا يكفي فيه الماء المتوفّر لتلبية الحاجات.")},
 barrage:{fr:"barrage",ar:"السدّ",n:2,d:X0("Mur qui retient l'eau d'une rivière pour former un lac de réserve.","جدار يحجز ماء الوادي لتكوين بحيرة احتياطية.")},
 nappe:{fr:"nappe souterraine",ar:"المياه الجوفية",n:2,d:X0("Eau stockée dans le sol, entre les roches. On la pompe avec des forages.","ماء مخزّن في باطن الأرض بين الصخور. نضخّه بواسطة الآبار.")},
 dessalement:{fr:"dessalement",ar:"التحلية",n:3,d:X0("Retirer le sel de l'eau de mer pour la rendre buvable.","نزع الملح من ماء البحر لجعله صالحًا للشرب.")},
 capacite:{fr:"capacité (m³/j)",ar:"القدرة (m³/يوم)",n:4,d:X0("Quantité d'eau douce qu'une station peut produire par jour. 1 m³ = 1 000 litres.","كمية الماء العذب التي تنتجها المحطة يوميًا. 1 m³ = 1000 لتر.")},
 part:{fr:"part du dessalement",ar:"حصّة التحلية",n:6,d:X0("Pourcentage de l'eau potable du pays qui vient de la mer.","النسبة المئوية لماء الشرب في البلاد الآتي من البحر.")},
 laboratoire:{fr:"laboratoire",ar:"المخبر",n:7,d:X0("Lieu de la station où l'on analyse l'eau : pH, sels, chlore, bactéries…","مكان في المحطة نحلّل فيه الماء: الـ pH، الأملاح، الكلور، البكتيريا…")}
};
const M1_PREP=[
 {t:X0("Mètre cube (m³)","المتر المكعب (m³)"),fr0:"Mètre cube",like:X0("Un cube d'un mètre de côté, rempli d'eau : <b>1 000 litres</b>.","مكعّب طول ضلعه متر واحد، مملوء بالماء: <b>1000 لتر</b>."),ex:X0("À peu près 6 baignoires pleines.","تقريبًا 6 أحواض استحمام ممتلئة.")},
 {t:X0("Pourcentage (%)","النسبة المئوية (%)"),fr0:"Pourcentage",like:X0("Une part sur 100. <b>42 %</b>, c'est 42 litres sur 100.","حصّة من 100. <b>42 %</b> تعني 42 لترًا من كل 100."),ex:X0("La moitié = 50 %.","النصف = 50 %.")},
 {t:X0("Wilaya côtière","ولاية ساحلية"),fr0:"Wilaya côtière",like:X0("Une wilaya qui touche la <b>mer</b>. C'est là qu'on construit les stations.","ولاية تطلّ على <b>البحر</b>. هناك تُبنى المحطات."),ex:X0("Oran, Alger, Béjaïa, El Tarf…","وهران، الجزائر، بجاية، الطارف…")}
];
const M1_QUIZ=[
 {q:X0("Combien d'eau un Algérien a-t-il environ par an ?","كم من الماء يتوفّر تقريبًا لكل جزائري في السنة؟"),o:X0(["Plus de 5 000 m³","Moins de 500 m³","Exactement 1 000 m³"],["أكثر من 5000 m³","أقل من 500 m³","1000 m³ بالضبط"]),c:1,e:X0("Moins de 500 m³, soit la moitié du seuil de rareté.","أقل من 500 m³، أي نصف عتبة الندرة.")},
 {q:X0("Pourquoi les barrages ne suffisent-ils plus ?","لماذا لم تعد السدود كافية؟"),o:X0(["Ils dépendent de la pluie, devenue irrégulière","Ils sont trop salés","Ils sont interdits"],["لأنها تعتمد على المطر الذي أصبح غير منتظم","لأنها مالحة جدًا","لأنها ممنوعة"]),c:0,e:X0("Après plusieurs années sèches, les barrages se vident.","بعد عدّة سنوات جافة، تفرغ السدود.")},
 {q:X0("Combien produit chacune des cinq stations mises en service en 2025 ?","كم تنتج كل محطة من المحطات الخمس التي دخلت الخدمة في 2025؟"),o:X0(["3 000 m³ par jour","300 000 m³ par jour","3 millions de m³ par jour"],["3000 m³ يوميًا","300000 m³ يوميًا","3 ملايين m³ يوميًا"]),c:1,e:X0("300 000 m³ par jour chacune, 1,5 million au total.","300000 m³ يوميًا لكل واحدة، و1,5 مليون في المجموع.")},
 {q:X0("Quelle part de l'eau potable vient aujourd'hui du dessalement ?","ما حصّة ماء الشرب الآتية اليوم من التحلية؟"),o:X0(["Environ 5 %","Environ 42 %","100 %"],["نحو 5 %","نحو 42 %","100 %"]),c:1,e:X0("Environ 42 %, avec un objectif d'environ 60 % en 2030.","نحو 42 %، بهدف بلوغ نحو 60 % في 2030.")},
 {q:X0("Quelle est la plus grande des deux stations pionnières ?","ما أكبر المحطتين الأوليين؟"),o:X0(["Hamma (Alger)","Magtaa (Oran)"],["الحامة (الجزائر)","المقطع (وهران)"]),c:1,e:X0("Magtaa produit 500 000 m³/j, contre 200 000 pour le Hamma.","تنتج المقطع 500000 m³/يوم، مقابل 200000 للحامة.")}
];
const M1_SOURCES=[["TSA, fin 2025","https://www.tsa-algerie.com/lalgerie-lance-la-realisation-de-stations-de-dessalement-pour-un-milliard/"],["TSA, juillet 2026","https://www.tsa-algerie.com/lalgerie-met-en-chantier-une-nouvelle-station-de-dessalement/"],["Radio Algérie, mars 2025","https://news.radioalgerie.dz/fr/node/61897"],["Algérie Eco, sept. 2024","https://www.algerie-eco.com/2024/09/05/dessalement-plus-de-75-de-taux-davancement-des-stations-en-cours-de-realisation/"]];
