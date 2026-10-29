let lang='fr';
const L=o=>o[lang];
const X=(fr,ar)=>lang==='ar'?ar:fr;
const X0=(fr,ar)=>({fr,ar});
const UI={
 brand:X0("Formation dessalement","تكوين في تحلية المياه"),
 progH:X0("Le programme","البرنامج"),
 avail:X0("Disponible","متوفّر"),soon:X0("À venir","قريبًا"),done:X0("Réussie","مُنجَز"),
 phH:X0("L'échelle du pH, avec des objets de la maison","سُلّم الـ pH بأشياء من البيت"),
 phP:X0("Le pH dit si un liquide est <b>acide</b> (en dessous de 7), <b>neutre</b> (7) ou <b>basique</b> (au-dessus de 7). L'eau de mer est <b>légèrement basique</b>.",
      "يُبيّن الـ pH إن كان السائل <b>حمضيًا</b> (أقل من 7)، أو <b>معتدلًا</b> (7)، أو <b>قاعديًا</b> (أكثر من 7). مياه البحر <b>قاعدية قليلًا</b>."),
 readH:X0("Comment lire une formule chimique","كيف نقرأ صيغة كيميائية"),
 prepVid:X0("Avant de commencer","قبل البدء"),prepVidLead:X0("Trois rappels pour bien suivre la vidéo.","ثلاثة تذكيرات لمتابعة الفيديو جيدًا."),
 seeBases:X0("Revoir les 8 bases de la chimie (leçon 0)","مراجعة أساسيات الكيمياء الثمانية (الدرس 0)"),
 stepN:X0("Étape {a}","المرحلة {a}"),
 voice:X0("Voix","الصوت"),subs:X0("Sous-titres","الترجمة النصية"),
 play:X0("Lire","تشغيل"),pause:X0("Pause","إيقاف مؤقت"),again:X0("Revoir","إعادة"),
 prev:X0("Scène précédente","المشهد السابق"),next:X0("Scène suivante","المشهد التالي"),
 where:X0("Scène {a} sur {b}","المشهد {a} من {b}"),goto:X0("Aller à la scène {a}","الذهاب إلى المشهد {a}"),
 big:X0("▶ Lire la leçon","▶ شغّلي الدرس"),
 endT:X0("Fin de la leçon","نهاية الدرس"),toQuiz:X0("Passer au quiz","الانتقال إلى الاختبار"),
 words:X0("Mots de la scène :","كلمات المشهد:"),clair:X0("En clair :","بكلمات بسيطة:"),
 vnote:X0("La voix utilise celle de ton appareil. Sans voix française installée, la vidéo avance avec les sous-titres.","يستعمل الصوتُ صوتَ جهازك. إن لم يكن صوت عربي مثبّتًا، يتقدّم الفيديو مع الترجمة النصية."),
 vnone:X0("Aucune voix française n'est installée sur cet appareil : la vidéo avance avec les sous-titres.","لا يوجد صوت عربي مثبّت على هذا الجهاز: يتقدّم الفيديو مع الترجمة النصية."),
 chapH:X0("Revoir une scène","إعادة مشاهدة مشهد"),
 glossH:X0("Les mots de la leçon","كلمات الدرس"),
 quizH:X0("Quiz","الاختبار"),
 quizLead:X0("Les questions portent uniquement sur la leçon. Tu peux refaire celles que tu as ratées.","الأسئلة تخصّ الدرس فقط. يمكنك إعادة الأسئلة التي أخطأتِ فيها."),
 good:X0("Bonne réponse.","إجابة صحيحة."),bad:X0("Ce n'est pas ça.","ليست هذه الإجابة."),
 score:X0("{a} bonne(s) réponse(s) sur {b}.","{a} إجابات صحيحة من {b}."),
 retry:X0("Refaire les questions ratées","إعادة الأسئلة الخاطئة"),
 quizOk:X0("{a} sur {b} : leçon maîtrisée.","{a} من {b}: الدرس متقَن."),
 sceneN:X0("scène {a}","المشهد {a}"),Q:X0("Q","س"),fr:X0("","بالفرنسية:"),
 nextL:X0("Leçon suivante : {a}","الدرس التالي: {a}"),nextGo:X0("Commencer","ابدئي"),
 lastL:X0("C'est la dernière leçon disponible pour l'instant.","هذا آخر درس متوفّر حاليًا."),srcs:X0("Sources des chiffres :","مصادر الأرقام:"),toProg:X0("Voir le programme","عرض البرنامج")
};
const T=(k,v)=>{let s=UI[k][lang];if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s};

const BASICS=[
 {fr:["Atome","C'est comme <b>une brique de Lego</b> : la plus petite pièce de la matière. Il en existe une centaine de sortes : hydrogène (H), oxygène (O), sodium (Na), chlore (Cl)…","Chaque sorte d'atome a une ou deux lettres."],
  ar:["الذرّة","مثل <b>قطعة ليغو</b>: أصغر قطعة في المادة. يوجد نحو مئة نوع منها: الهيدروجين (H)، الأكسجين (O)، الصوديوم (Na)، الكلور (Cl)…","لكل نوع من الذرات حرف أو حرفان."],fr0:"Atome"},
 {fr:["Molécule","Plusieurs atomes accrochés ensemble, comme <b>un petit assemblage de Lego</b>.","L'eau, H₂O : deux briques H et une brique O."],
  ar:["الجزيء","عدة ذرات مرتبطة معًا، مثل <b>تركيبة صغيرة من قطع الليغو</b>.","الماء H₂O: قطعتان H وقطعة O."],fr0:"Molécule"},
 {fr:["Ion","Un atome qui porte <b>une charge électrique</b>, + ou −. Comme des aimants : les + et les − s'attirent, deux − se repoussent.","Le sel de cuisine dans l'eau : Na⁺ et Cl⁻."],
  ar:["الشاردة","ذرة تحمل <b>شحنة كهربائية</b>، + أو −. مثل المغناطيس: الموجب والسالب يتجاذبان، والسالبان يتنافران.","ملح الطعام في الماء: Na⁺ و Cl⁻."],fr0:"Ion"},
 {fr:["Dissoudre / précipiter","<b>Dissoudre</b>, c'est le sucre qui disparaît dans le thé. <b>Précipiter</b>, c'est l'inverse : quelque chose de dissous redevient solide et se dépose.","Le calcaire au fond d'une bouilloire a précipité."],
  ar:["الانحلال والترسّب","<b>الانحلال</b> هو السكر الذي يختفي في الشاي. <b>الترسّب</b> هو العكس: مادة منحلّة تعود صلبة وتستقرّ في القعر.","الكلس في قعر الغلاية مادة ترسّبت."],fr0:"Dissoudre / précipiter"},
 {fr:["Concentration","<b>Combien</b> d'une substance il y a dans un litre d'eau. Une cuillère de sucre dans un verre ou dans une bassine : ce n'est pas la même concentration.","L'eau de mer contient environ 38 g de sel par litre."],
  ar:["التركيز","<b>كمية</b> مادة ما في لتر من الماء. ملعقة سكر في كأس أو في سطل: ليس التركيز نفسه.","تحتوي مياه البحر على نحو 38 غرامًا من الملح في اللتر."],fr0:"Concentration"},
 {fr:["pH","Une note de 0 à 14 qui dit si un liquide est <b>acide</b>, <b>neutre</b> ou <b>basique</b>. Voir l'échelle juste en dessous.","Citron ≈ 2 · eau pure = 7 · eau de mer ≈ 8."],
  ar:["الـ pH","علامة من 0 إلى 14 تبيّن إن كان السائل <b>حمضيًا</b> أو <b>معتدلًا</b> أو <b>قاعديًا</b>. انظري السلّم أدناه.","الليمون ≈ 2 · الماء النقي = 7 · ماء البحر ≈ 8."],fr0:"pH"},
 {fr:["Réaction chimique","Comme <b>une recette de cuisine</b> : des ingrédients se transforment en un nouveau produit. Les atomes ne disparaissent pas, ils changent de partenaires.","Le fer qui rouille à l'air humide."],
  ar:["التفاعل الكيميائي","مثل <b>وصفة طبخ</b>: مكوّنات تتحوّل إلى منتج جديد. الذرات لا تختفي، بل تغيّر شركاءها.","الحديد الذي يصدأ في الهواء الرطب."],fr0:"Réaction chimique"},
 {fr:["Oxydant","Un produit qui <b>attaque et abîme</b> ce qu'il touche. C'est ce qui le rend utile contre les microbes, et dangereux pour la membrane.","L'eau de Javel est un oxydant."],
  ar:["المؤكسِد","منتج <b>يهاجم ويُتلف</b> ما يلمسه. هذا ما يجعله مفيدًا ضد الميكروبات، وخطيرًا على الغشاء.","ماء جافيل مؤكسِد."],fr0:"Oxydant"}
];
const PH=[[2,{fr:'citron',ar:'الليمون'}],[3,{fr:'vinaigre',ar:'الخلّ'}],[7,{fr:'eau pure',ar:'ماء نقي'}],[8.1,{fr:'eau de mer',ar:'ماء البحر'},1],[10,{fr:'savon',ar:'الصابون'}],[12,{fr:'eau de Javel',ar:'ماء جافيل'}]];
const READ=[
 ["H₂O",{fr:"2 atomes d'hydrogène (H) + 1 atome d'oxygène (O) : c'est l'eau. Le petit chiffre en bas compte les atomes.",ar:"ذرتان من الهيدروجين (H) + ذرة واحدة من الأكسجين (O): إنه الماء. الرقم الصغير في الأسفل يَعُدّ الذرات."}],
 ["Na⁺  Cl⁻",{fr:"Le petit + ou − en haut : l'atome porte une charge électrique. Ici, les deux morceaux du sel de cuisine.",ar:"علامة + أو − الصغيرة في الأعلى: الذرة تحمل شحنة كهربائية. هنا جزءا ملح الطعام."}],
 ["A + B → C",{fr:"La flèche se lit « donne ». À gauche les ingrédients, à droite le résultat, comme une recette.",ar:"السهم يُقرأ «يُعطي». المعادلات تُكتب من اليسار إلى اليمين: على اليسار المكوّنات، وعلى اليمين النتيجة، مثل وصفة طبخ."}],
 ["⇌",{fr:"Double flèche : la réaction va dans les deux sens, comme une porte battante.",ar:"سهم مزدوج: التفاعل يسير في الاتجاهين، مثل باب دوّار."}],
 ["CaCO₃↓",{fr:"Flèche vers le bas : le produit devient solide et tombe en dépôt.",ar:"سهم نحو الأسفل: الناتج يصبح صلبًا ويترسّب."}]
];
const WARM=[
 {q:{fr:"Dans l'eau, Na⁺ et Cl⁻ sont…",ar:"في الماء، Na⁺ و Cl⁻ هي…"},o:{fr:["des atomes qui portent une charge : des ions","des microbes","des molécules d'eau"],ar:["ذرات تحمل شحنة: شوارد","ميكروبات","جزيئات ماء"]},c:0,
  e:{fr:"Le petit + ou − en haut indique une charge électrique : ce sont des ions.",ar:"علامة + أو − الصغيرة في الأعلى تدل على شحنة كهربائية: إنها شوارد."}},
 {q:{fr:"Le pH de l'eau de mer est d'environ 8. Elle est donc…",ar:"درجة pH مياه البحر نحو 8. إذن هي…"},o:{fr:["très acide, comme le citron","légèrement basique","parfaitement neutre"],ar:["حمضية جدًا، مثل الليمون","قاعدية قليلًا","معتدلة تمامًا"]},c:1,
  e:{fr:"Au-dessus de 7, c'est basique. À 8, c'est seulement un peu basique.",ar:"فوق 7 يعني قاعدي. عند 8، هي قاعدية قليلًا فقط."}},
 {q:{fr:"Dans « A + B → C », la flèche se lit…",ar:"في «A + B → C»، السهم يُقرأ…"},o:{fr:["« moins »","« donne »","« est égal à l'envers »"],ar:["«ناقص»","«يُعطي»","«يساوي بالعكس»"]},c:1,
  e:{fr:"A et B sont les ingrédients, la flèche se lit « donne », C est le résultat.",ar:"A و B هما المكوّنات، والسهم يُقرأ «يُعطي»، و C هي النتيجة."}}
];

/* ------------------------------------------------ Textes des dessins */
const D={
 s1h:{fr:"De la mer au robinet",ar:"من البحر إلى الحنفية"},
 cap:{fr:"Captage",ar:"الالتقاط"},pre1:{fr:"Prétraitement",ar:"المعالجة"},pre2:{fr:"chimique",ar:"الأولية"},
 oi1:{fr:"Osmose",ar:"التناضح"},oi2:{fr:"inverse",ar:"العكسي"},po1:{fr:"Post-",ar:"المعالجة"},po2:{fr:"traitement",ar:"النهائية"},
 s1a:{fr:"À retirer avant la membrane :",ar:"ما يجب نزعه قبل الغشاء:"},
 s1b:{fr:[["micro-organismes",1],["colloïdes",1],["matières en suspension",0],["sels entartrants",1]],ar:[["الميكروبات",1],["الجسيمات الغروية",1],["المواد العالقة",0],["أملاح الكلس",1]]},
 s2h:{fr:"1. Le chlore : tuer les microbes",ar:"1. الكلور: قتل الميكروبات"},
 s2a:{fr:"À pH 8,1 (eau de mer) :",ar:"عند pH = 8,1 (ماء البحر):"},
 s2b:{fr:"HOCl ≈ 20 % : très actif",ar:"HOCl ≈ 20 %: فعّال جدًا"},
 s2c:{fr:"OCl⁻ ≈ 80 % : beaucoup moins actif",ar:"OCl⁻ ≈ 80 %: أقل فعالية بكثير"},
 s3h:{fr:"2. Le fer : coller les poussières",ar:"2. الحديد: لصق الغبار"},
 s3a:{fr:"Poussières invisibles chargées « − » : elles se repoussent. Le fer les colle.",ar:"غبار غير مرئي مشحون «−»: يتنافر. الحديد يلصقه ببعضه."},
 s4h:{fr:"Filtrer, puis noter la propreté",ar:"الترشيح، ثم تقييم النظافة"},
 anth:{fr:"anthracite",ar:"الأنثراسيت"},sand:{fr:"sable",ar:"الرمل"},grav:{fr:"gravier",ar:"الحصى"},
 s4a:{fr:"SDI de l'eau filtrée",ar:"مؤشر SDI للماء المرشَّح"},
 s4b:{fr:"Objectif : SDI < 3",ar:"الهدف: SDI أقل من 3"},
 s4c:{fr:"Limite des fabricants de membranes : 5",ar:"الحدّ الأقصى لمصنّعي الأغشية: 5"},
 s5h:{fr:"3. L'acide : contre le calcaire",ar:"3. الحمض: ضد الكلس"},
 s5a:{fr:"Sans acide : du calcaire se dépose",ar:"دون حمض: يترسّب الكلس"},
 mem:{fr:"membrane",ar:"الغشاء"},
 s5b:{fr:"le calcaire (comme dans une bouilloire)",ar:"الكلس (كما في الغلاية)"},
 s5c:{fr:"moins de carbonate, moins de tartre",ar:"كربونات أقل، كلس أقل"},
 sea:{fr:"eau de mer",ar:"ماء البحر"},brine:{fr:"saumure",ar:"الماء المركّز"},
 s6h:{fr:"4. L'antitartre : bloquer les cristaux",ar:"4. مانع الترسّب: إيقاف البلّورات"},
 s6a:{fr:"germe de cristal bloqué",ar:"بذرة بلّورة متوقّفة"},
 s6b:{fr:"Phosphonate",ar:"الفوسفونات"},s6c:{fr:"dose : quelques mg/L",ar:"الجرعة: بضعة mg/L"},
 s6d:{fr:"Il se fixe sur le germe",ar:"يلتصق بالبذرة"},s6e:{fr:"et l'empêche de grossir.",ar:"ويمنعها من الكِبَر."},
 s6f:{fr:"Les sels restent dissous",ar:"تبقى الأملاح منحلّة"},s6g:{fr:"le temps de traverser la membrane.",ar:"إلى أن تعبر الغشاء."},
 s7h:{fr:"5. Le bisulfite : effacer le chlore",ar:"5. البيسلفيت: محو الكلور"},
 poly:{fr:"polyamide",ar:"البولي أميد"},
 s7a:{fr:"le chlore devient un simple sel",ar:"يصبح الكلور ملحًا بسيطًا"},
 s7b:{fr:"élevé : chlore présent",ar:"مرتفع: يوجد كلور"},
 s7c:{fr:"bas : membrane protégée",ar:"منخفض: الغشاء محمي"},
 s8h:{fr:"L'ordre des injections",ar:"ترتيب الحقن"},
 sandf:{fr:"filtres à sable",ar:"مرشّحات الرمل"},cart:{fr:"cartouches",ar:"الخراطيش"},mems:{fr:"membranes",ar:"الأغشية"},
 intake:{fr:"prise d'eau",ar:"مأخذ الماء"},
 floc:{fr:"FeCl₃ + floc.",ar:"FeCl₃ + مُلبِّد"},anti:{fr:"antitartre",ar:"مانع الترسّب"},
 s8a:{fr:"Chaque réactif prépare le travail du suivant.",ar:"كل منتج يحضّر عمل المنتج الذي يليه."}
};

/* ------------------------------------------------ Illustrations */
const V='viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"';
function dirtDots(){let s='';[[40,176,0],[70,200,.6],[52,190,1.3],[90,178,1.9],[64,206,2.5]].forEach(([x,y,d])=>s+=`<circle class="dirt a-drift" cx="${x}" cy="${y}" r="5" style="animation-delay:${d}s"/>`);return s}
function cleanDots(){let s='';[[330,186,0],[330,196,.8],[330,190,1.6],[330,184,2.4]].forEach(([x,y,d])=>s+=`<circle class="clean a-clean" cx="${x}" cy="${y}" r="4" style="animation-delay:${d}s"/>`);return s}
const S1=()=>`<svg ${V} role="img" aria-label="${L(D.s1h)}">
<text class="h" x="32" y="54">${L(D.s1h)}</text>
<line class="pipe" x1="30" y1="190" x2="612" y2="190"/><line class="flowdash" x1="30" y1="190" x2="612" y2="190"/>
<rect class="box" x="22" y="152" width="112" height="76" rx="10"/><text class="bl" x="78" y="196" text-anchor="middle">${L(D.cap)}</text>
<rect class="box hi" x="164" y="138" width="146" height="104" rx="10"/><text class="bl hl" x="237" y="184" text-anchor="middle">${L(D.pre1)}</text><text class="sm" x="237" y="210" text-anchor="middle">${L(D.pre2)}</text>
<rect class="box" x="340" y="152" width="128" height="76" rx="10"/><text class="bl" x="404" y="186" text-anchor="middle">${L(D.oi1)}</text><text class="bl" x="404" y="210" text-anchor="middle">${L(D.oi2)}</text>
<rect class="box" x="496" y="152" width="120" height="76" rx="10"/><text class="bl" x="556" y="186" text-anchor="middle">${L(D.po1)}</text><text class="bl" x="556" y="210" text-anchor="middle">${L(D.po2)}</text>
${dirtDots()}${cleanDots()}
<text class="sm" x="32" y="290">${L(D.s1a)}</text>
<text class="bl" x="32" y="320">${L(D.s1b).map(([w,h])=>h?`<tspan class="hl">${w}</tspan>`:w).join(' · ')}</text>
</svg>`;

function bacteria(){let s='';[[110,200,.4],[160,240,.8],[200,190,1.1],[130,270,1.5],[210,280,1.8],[175,215,2.1],[100,240,2.4]].forEach(([x,y,d])=>s+=`<ellipse class="bac a-kill" cx="${x}" cy="${y}" rx="11" ry="6" style="animation-delay:${d+.6}s"/>`);return s}
const S2=()=>`<svg ${V} role="img" aria-label="${L(D.s2h)}">
<text class="h" x="32" y="48">${L(D.s2h)}</text>
<rect class="wa" x="72" y="150" width="176" height="166"/>
<path class="out" d="M70 110 L70 300 Q70 318 88 318 L232 318 Q250 318 250 300 L250 110"/>
${bacteria()}
<rect x="150" y="62" width="20" height="44" rx="4" class="rgf"/>
<circle class="rgf a-drop" cx="160" cy="116" r="5"/><circle class="rgf a-drop" cx="160" cy="116" r="5" style="animation-delay:.55s"/>
<text class="fa" x="182" y="88">NaOCl</text>
<text class="f" x="290" y="118">Cl₂ + H₂O → HOCl + H⁺ + Cl⁻</text>
<text class="f" x="290" y="162">HOCl ⇌ H⁺ + OCl⁻</text>
<text class="sm num" x="290" y="188">pKa ≈ 7,5</text>
<text class="bl" x="290" y="228">${L(D.s2a)}</text>
<rect class="accf a-grow" x="290" y="242" width="64" height="26" style="animation-delay:1s"/>
<rect class="mutef a-grow" x="356" y="242" width="254" height="26" style="animation-delay:1.6s"/>
<text class="bl hl" x="290" y="298">${L(D.s2b)}</text>
<text class="sm" x="290" y="324">${L(D.s2c)}</text>
</svg>`;

function clusters(){const C=[[150,175],[320,200],[490,165]],off=[[-6,-6],[8,-4],[-8,7],[6,8],[0,0],[12,2]],far=[[-70,-50],[60,-60],[-60,55],[70,45],[-20,80],[85,-10]];let s='';
  C.forEach(([cx,cy],k)=>{s+=`<g transform="translate(${cx} ${cy})">`;
    off.forEach(([x,y],i)=>{const [dx,dy]=far[(i+k*2)%6];s+=`<g class="col a-gather" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${.6+k*.3}s"><circle cx="${x*1.6}" cy="${y*1.6}" r="8"/><text x="${x*1.6}" y="${y*1.6+4}" text-anchor="middle">−</text></g>`});
    s+=`<circle class="floc a-appear" r="36" style="animation-delay:${2.6+k*.3}s"/><text class="fa a-appear" x="-20" y="-44" style="font-size:15px;animation-delay:${1.6+k*.3}s">Fe³⁺</text></g>`});return s}
const S3=()=>`<svg ${V} role="img" aria-label="${L(D.s3h)}">
<text class="h" x="32" y="48">${L(D.s3h)}</text>
<text class="sm" x="32" y="80">${L(D.s3a)}</text>
${clusters()}
<text class="f" x="320" y="318" text-anchor="middle">FeCl₃ + 3 H₂O → Fe(OH)₃↓ + 3 H⁺ + 3 Cl⁻</text>
</svg>`;

function flocsFall(){let s='';[[95,.2],[130,.6],[165,1],[200,.4],[115,1.4],[185,1.7]].forEach(([x,d])=>s+=`<circle class="dirt a-fall" cx="${x}" cy="${128+((x*7)%10)}" r="6" style="animation-delay:${d}s"/>`);return s}
function gravel(){let s='';for(let i=0;i<9;i++)s+=`<circle class="grav" cx="${82+i*17}" cy="${276+(i%2)*14}" r="7"/>`;return s}
const S4=()=>`<svg ${V} role="img" aria-label="${L(D.s4h)}">
<text class="h" x="32" y="48">${L(D.s4h)}</text>
<rect class="wa" x="72" y="80" width="156" height="42"/>
<rect class="anth" x="72" y="122" width="156" height="56"/>
<rect class="sand" x="72" y="178" width="156" height="78"/>
<rect class="box" x="72" y="256" width="156" height="50" style="stroke:none"/>${gravel()}
<rect class="out" x="70" y="78" width="160" height="230" rx="4"/>
${flocsFall()}
<circle class="clean a-drop" cx="150" cy="312" r="5"/><circle class="clean a-drop" cx="150" cy="312" r="5" style="animation-delay:.5s"/>
<text class="sm" x="240" y="155">${L(D.anth)}</text><text class="sm" x="240" y="222">${L(D.sand)}</text><text class="sm" x="240" y="288">${L(D.grav)}</text>
<text class="bl" x="340" y="140">${L(D.s4a)}</text>
<rect class="ok" x="340" y="168" width="138" height="22"/><rect class="warn" x="478" y="168" width="92" height="22"/><rect class="badz" x="570" y="168" width="46" height="22"/>
${[0,1,2,3,4,5,6].map(n=>`<text class="sm num" x="${340+n*46}" y="214" text-anchor="middle">${n}</text>`).join('')}
<g class="a-needle" style="--to:${2.4*46}px;animation-delay:.8s"><path d="M340 162 l-8 -14 h16 z" class="accf"/></g>
<text class="bl hl" x="340" y="262">${L(D.s4b).replace('<','&lt;')}</text>
<text class="sm" x="340" y="292">${L(D.s4c)}</text>
</svg>`;

function crystals(){let s='';[[80,.4,14],[120,1,10],[165,.7,16],[210,1.4,12],[255,1.1,15]].forEach(([x,d,w])=>s+=`<rect class="cry a-growy" x="${x}" y="${240-w}" width="${w}" height="${w}" transform="rotate(8 ${x} 240)" style="animation-delay:${d+.8}s"/>`);return s}
const S5=()=>`<svg ${V} role="img" aria-label="${L(D.s5h)}">
<text class="h" x="32" y="48">${L(D.s5h)}</text>
<text class="sm" x="40" y="84">${L(D.s5a)}</text>
<text class="bl num a-sink" x="70" y="160" style="animation-delay:.2s">Ca²⁺</text><text class="bl hl num a-sink" x="150" y="140" style="animation-delay:.6s">CO₃²⁻</text><text class="bl num a-sink" x="230" y="170" style="animation-delay:1s">Ca²⁺</text>
<rect class="mem" x="40" y="240" width="270" height="14" rx="3"/>
${crystals()}
<text class="sm" x="40" y="282">${L(D.mem)}</text>
<text class="f" x="340" y="112">Ca²⁺ + CO₃²⁻ → CaCO₃↓</text>
<text class="sm" x="340" y="138">${L(D.s5b)}</text>
<text class="fa" x="340" y="182">+ H₂SO₄</text>
<text class="f" x="340" y="212">HCO₃⁻ + H⁺ → CO₂ + H₂O</text>
<text class="sm" x="340" y="238">${L(D.s5c)}</text>
<text class="sm" x="340" y="278">${L(D.sea)}</text><rect class="wa a-grow" x="440" y="264" width="90" height="16"/><text class="sm num" x="538" y="277">1×</text>
<text class="sm" x="340" y="310">${L(D.brine)}</text><rect class="accf a-grow" x="440" y="296" width="162" height="16" style="animation-delay:.7s"/><text class="sm num" x="598" y="309" text-anchor="end" style="fill:var(--s-bg)">≈1,8×</text>
</svg>`;

function antiscal(){const pts=[[0,-70],[61,-35],[61,35],[0,70],[-61,35],[-61,-35]];let s='';
  pts.forEach(([x,y],i)=>{s+=`<g class="chain a-attach" style="--dx:${x*1.2}px;--dy:${y*1.2}px;animation-delay:${1.2+i*.2}s" transform="translate(${x*.62} ${y*.62})"><line x1="0" y1="0" x2="${x*.3}" y2="${y*.3}"/><circle class="rgf" r="6"/><circle class="rgf" cx="${x*.3}" cy="${y*.3}" r="4"/></g>`});return s}
const S6=()=>`<svg ${V} role="img" aria-label="${L(D.s6h)}">
<text class="h" x="32" y="48">${L(D.s6h)}</text>
<g transform="translate(200 200)">
<polygon class="cry a-growy" points="0,-36 31,-18 31,18 0,36 -31,18 -31,-18" style="animation-duration:1s"/>
${antiscal()}
</g>
<text class="sm" x="200" y="322" text-anchor="middle">${L(D.s6a)}</text>
<text class="bl hl" x="360" y="130">${L(D.s6b)}</text>
<text class="sm" x="360" y="158">${L(D.s6c)}</text>
<text class="bl" x="360" y="208">${L(D.s6d)}</text>
<text class="bl" x="360" y="234">${L(D.s6e)}</text>
<text class="sm" x="360" y="278">${L(D.s6f)}</text>
<text class="sm" x="360" y="302">${L(D.s6g)}</text>
</svg>`;

function hocl(){let s='';[[60,150,0],[40,200,.5],[70,250,1],[50,290,1.4]].forEach(([x,y,d])=>s+=`<circle class="a-neutral" cx="${x}" cy="${y}" r="11" style="animation-delay:${d+.4}s"/>`);return s}
const S7=()=>`<svg ${V} role="img" aria-label="${L(D.s7h)}">
<text class="h" x="32" y="48">${L(D.s7h)}</text>
<text class="sm num" x="32" y="96">HOCl</text>
${hocl()}
<text class="fa" x="120" y="96">NaHSO₃</text>
<circle class="rgf a-drop" cx="150" cy="110" r="5"/><circle class="rgf a-drop" cx="150" cy="110" r="5" style="animation-delay:.55s"/>
<polyline class="poly" points="270,90 290,112 270,134 290,156 270,178 290,200 270,222 290,244 270,266 290,288 270,310"/>
<text class="sm" x="280" y="338" text-anchor="middle">${L(D.poly)}</text>
<text class="f" x="340" y="112">NaHSO₃ + HOCl</text>
<text class="f" x="340" y="142">→ NaHSO₄ + HCl</text>
<text class="sm" x="340" y="170">${L(D.s7a)}</text>
<text class="bl num" x="340" y="212">ORP</text>
<rect class="out" x="340" y="222" width="34" height="110" rx="4"/>
<rect class="accf a-orp" x="344" y="226" width="26" height="102" rx="2"/>
<text class="sm" x="386" y="238">${L(D.s7b)}</text>
<text class="sm" x="386" y="328"><tspan class="hl">${L(D.s7c)}</tspan></text>
</svg>`;

function inj(x,n,label,ly,d){return `<g class="a-appear" style="animation-delay:${d}s"><line x1="${x}" y1="${ly+8}" x2="${x}" y2="186" stroke="var(--s-rg)" stroke-width="2" stroke-dasharray="3 4"/><text class="fa" x="${x}" y="${ly}" text-anchor="middle" style="font-size:16px">${label}</text><circle class="rgf" cx="${x}" cy="200" r="13"/><text class="num" x="${x}" y="205" text-anchor="middle" style="font:700 14px var(--f-mono);fill:#1B1206">${n}</text></g>`}
const S8=()=>`<svg ${V} role="img" aria-label="${L(D.s8h)}">
<text class="h" x="32" y="48">${L(D.s8h)}</text>
<line class="pipe" x1="20" y1="200" x2="628" y2="200"/><line class="flowdash" x1="20" y1="200" x2="628" y2="200"/>
<rect class="box" x="168" y="178" width="96" height="44" rx="6"/><text class="sm" x="216" y="252" text-anchor="middle">${L(D.sandf)}</text>
<rect class="box" x="478" y="178" width="66" height="44" rx="6"/><text class="sm num" x="511" y="205" text-anchor="middle">5 µm</text><text class="sm" x="511" y="252" text-anchor="middle">${L(D.cart)}</text>
<rect class="box hi" x="566" y="172" width="64" height="56" rx="6"/><text class="bl num" x="598" y="206" text-anchor="middle">OI</text><text class="sm" x="598" y="252" text-anchor="middle">${L(D.mems)}</text>
${inj(54,1,'NaOCl',112,.3)}${inj(130,2,L(D.floc),142,.9)}${inj(310,3,'H₂SO₄',112,1.5)}${inj(380,4,L(D.anti),142,2.1)}${inj(448,5,'NaHSO₃',112,2.7)}
<text class="sm" x="54" y="252" text-anchor="middle">${L(D.intake)}</text>
<text class="bl" x="32" y="310">${L(D.s8a)}</text>
</svg>`;

/* ------------------------------------------------ Scènes */
const M4_SCENES=[
 {svg:S1,w:["membrane","colloid"],fx:[],
  t:{fr:"Pourquoi nettoyer l'eau d'abord ?",ar:"لماذا ننظّف الماء أولًا؟"},
  say:{fr:"Imagine un filtre à café extrêmement fin : c'est la membrane. Elle laisse passer l'eau mais retient le sel. Le problème, c'est qu'elle se bouche très vite et qu'elle coûte très cher. Avant de lui envoyer l'eau de mer, il faut donc la nettoyer : enlever les microbes, les poussières invisibles et ce qui pourrait former du calcaire. C'est ce qu'on appelle le prétraitement.",
       ar:"تخيّلي مصفاة قهوة دقيقة جدًا: هذا هو الغشاء. يترك الماء يمرّ ويحجز الملح. المشكلة أنه ينسدّ بسرعة كبيرة وثمنه غالٍ جدًا. لذلك، قبل إرسال مياه البحر إليه، يجب تنظيفها: نزع الميكروبات، والغبار غير المرئي، وكل ما قد يكوّن الكلس. هذا ما نسمّيه المعالجة الأولية."}},
 {svg:S2,w:["oxydant","ph"],
  t:{fr:"Le chlore : tuer les microbes",ar:"الكلور: قتل الميكروبات"},
  fx:[["Cl₂ + H₂O → HOCl + H⁺ + Cl⁻",{fr:"Le chlore réagit avec l'eau et donne l'acide hypochloreux (HOCl) : c'est lui le « tueur de microbes ».",ar:"الكلور يتفاعل مع الماء ويعطي حمض الهيبوكلوروز (HOCl): إنه «قاتل الميكروبات»."}],
      ["HOCl ⇌ H⁺ + OCl⁻",{fr:"Ce tueur peut se transformer en OCl⁻, une forme moins efficace. La double flèche : ça va dans les deux sens.",ar:"هذا القاتل يمكن أن يتحوّل إلى OCl⁻، وهو شكل أقل فعالية. السهم المزدوج: التفاعل يسير في الاتجاهين."}]],
  say:{fr:"Premier produit : le chlore, le même principe que l'eau de Javel de la maison. On l'ajoute dès que l'eau de mer entre dans la station, pour tuer les microbes et les algues. Petite subtilité : l'eau de mer est légèrement basique, son pH est de 8,1. Dans ces conditions, seulement un cinquième du chlore reste sous sa forme la plus efficace. On en tient compte pour bien doser.",
       ar:"المنتج الأول: الكلور، على مبدأ ماء جافيل الذي نستعمله في البيت. نضيفه بمجرد دخول مياه البحر إلى المحطة، لقتل الميكروبات والطحالب. لكن هناك تفصيل مهم: مياه البحر قاعدية قليلًا، ودرجة الـ pH فيها ثمانية فاصل واحد. في هذه الظروف، لا يبقى إلا خُمس الكلور تقريبًا في شكله الأكثر فعالية. نأخذ ذلك بعين الاعتبار عند تحديد الجرعة."}},
 {svg:S3,w:["colloid","ion","floc"],
  t:{fr:"Le fer : coller les poussières",ar:"الحديد: لصق الغبار"},
  fx:[["FeCl₃ + 3 H₂O → Fe(OH)₃↓ + 3 H⁺ + 3 Cl⁻",{fr:"Le sel de fer réagit avec l'eau et forme une sorte de rouille gélatineuse, Fe(OH)₃, qui tombe (↓) en emprisonnant les poussières.",ar:"ملح الحديد يتفاعل مع الماء ويكوّن نوعًا من الصدأ الهلامي، Fe(OH)₃، يترسّب (↓) حابسًا الغبار معه."}]],
  say:{fr:"Deuxième produit : le chlorure ferrique, un sel de fer. L'eau de mer contient des poussières si fines qu'elles ne tombent jamais : on les appelle des colloïdes. Elles portent toutes une petite charge négative, alors elles se repoussent, comme deux aimants qu'on met face à face. Le fer, chargé positivement, annule ces charges : les poussières se collent ensemble et forment des flocons, les flocs. Assez gros, ils pourront être filtrés.",
       ar:"المنتج الثاني: كلوريد الحديد الثلاثي، وهو ملح من الحديد. تحتوي مياه البحر على غبار دقيق جدًا لا يسقط أبدًا: نسمّيه الجسيمات الغروية. كلها تحمل شحنة سالبة صغيرة، لذلك تتنافر، مثل مغناطيسين متقابلين. الحديد، المشحون بشحنة موجبة، يُلغي هذه الشحنات: فيلتصق الغبار بعضه ببعض ويكوّن نُدَفًا. وعندما تكبر بما يكفي، يمكن ترشيحها."}},
 {svg:S4,w:["sdi"],fx:[],
  t:{fr:"Filtrer, puis noter la propreté",ar:"الترشيح، ثم تقييم النظافة"},
  say:{fr:"Les flocs sont arrêtés par de grands filtres remplis de sable et de charbon, un peu comme l'eau de pluie qui traverse le sol avant d'arriver à une source. Ensuite, on vérifie si l'eau est assez propre grâce à une note de colmatage, le SDI. Plus la note est basse, mieux c'est : on vise moins de 3.",
       ar:"تُحجز النُّدَف في مرشّحات كبيرة مملوءة بالرمل والفحم، تمامًا كمياه المطر التي تعبر التربة قبل أن تصل إلى العين. بعد ذلك، نتحقق من نظافة الماء بعلامة انسداد تُسمّى SDI. كلما كانت العلامة أقل، كان ذلك أفضل: نهدف إلى أقل من ثلاثة."}},
 {svg:S5,w:["brine","scale"],
  t:{fr:"L'acide : contre le calcaire",ar:"الحمض: ضد الكلس"},
  fx:[["Ca²⁺ + CO₃²⁻ → CaCO₃↓",{fr:"Le calcium et le carbonate s'assemblent en calcaire, qui se dépose.",ar:"الكالسيوم والكربونات يتّحدان ليكوّنا الكلس الذي يترسّب."}],
      ["HCO₃⁻ + H⁺ → CO₂ + H₂O",{fr:"L'acide (H⁺) transforme un ingrédient du calcaire en gaz carbonique et en eau, qui ne se déposent pas.",ar:"الحمض (H⁺) يحوّل أحد مكوّنات الكلس إلى غاز ثاني أكسيد الكربون وماء، وهما لا يترسّبان."}]],
  say:{fr:"Troisième produit : un acide. Pense au calcaire qui se dépose au fond d'une bouilloire. Dans la station, l'eau qui reste derrière la membrane, la saumure, est presque deux fois plus salée que l'eau de mer. Le calcaire risque alors de se déposer sur la membrane. Un peu d'acide sulfurique transforme une partie des ingrédients du calcaire en gaz carbonique, qui lui ne se dépose pas. C'est la même idée que le vinaigre qui détartre une bouilloire.",
       ar:"المنتج الثالث: حمض. تذكّري الكلس الذي يترسّب في قعر الغلاية. في المحطة، الماء الذي يبقى خلف الغشاء أشدّ ملوحة بمرتين تقريبًا من مياه البحر. فيصبح الكلس مهدّدًا بالترسّب على الغشاء. قليل من حمض الكبريت يحوّل جزءًا من مكوّنات الكلس إلى غاز ثاني أكسيد الكربون، وهو لا يترسّب. إنها الفكرة نفسها مع الخلّ الذي يزيل الكلس من الغلاية."}},
 {svg:S6,w:["anti","conc"],fx:[],
  t:{fr:"L'antitartre : bloquer les cristaux",ar:"مانع الترسّب: إيقاف البلّورات"},
  say:{fr:"Quatrième produit : l'antitartre. Même avec l'acide, de minuscules cristaux commencent à se former. L'antitartre vient se coller sur eux, comme une housse, et les empêche de grandir. Il en faut très peu : quelques milligrammes par litre, à peine une pincée dans une baignoire.",
       ar:"المنتج الرابع: مانع الترسّب الكلسي. حتى مع الحمض، تبدأ بلّورات صغيرة جدًا في التكوّن. يلتصق بها مانع الترسّب مثل غطاء، ويمنعها من الكِبَر. نحتاج كمية قليلة جدًا: بضعة مليغرامات في اللتر، أي ما يقارب رشّة صغيرة في حوض استحمام."}},
 {svg:S7,w:["polyamide","orp"],
  t:{fr:"Le bisulfite : effacer le chlore",ar:"البيسلفيت: محو الكلور"},
  fx:[["NaHSO₃ + HOCl → NaHSO₄ + HCl",{fr:"Le bisulfite « mange » le chlore actif. Il ne reste que des produits sans danger pour la membrane.",ar:"البيسلفيت «يأكل» الكلور النشيط. لا تبقى إلا مواد غير ضارة بالغشاء."}]],
  say:{fr:"Cinquième produit, le plus important : le bisulfite de sodium. Souviens-toi, on a mis du chlore au début pour tuer les microbes. Mais la membrane est faite d'un plastique spécial, le polyamide, et le chlore l'abîme pour toujours. Juste avant les membranes, le bisulfite agit comme une éponge à chlore : il le fait disparaître. Un capteur, appelé ORP, surveille en permanence qu'il ne reste plus de chlore.",
       ar:"المنتج الخامس، وهو الأهم: بيسلفيت الصوديوم. تذكّري أننا أضفنا الكلور في البداية لقتل الميكروبات. لكن الغشاء مصنوع من بلاستيك خاص هو البولي أميد، والكلور يُتلفه نهائيًا. قبل الأغشية مباشرة، يعمل البيسلفيت مثل إسفنجة تمتصّ الكلور: يجعله يختفي. وحسّاس يُسمّى ORP يراقب باستمرار أنه لم يبق أي كلور."}},
 {svg:S8,w:[],fx:[],
  t:{fr:"Récapitulatif",ar:"الخلاصة"},
  say:{fr:"Récapitulons, dans l'ordre : le chlore pour tuer les microbes, le fer pour coller les poussières, l'acide et l'antitartre contre le calcaire, et enfin le bisulfite pour effacer le chlore juste avant les membranes. Chaque produit prépare le travail du suivant.",
       ar:"لنلخّص بالترتيب: الكلور لقتل الميكروبات، والحديد للصق الغبار، والحمض ومانع الترسّب ضد الكلس، وأخيرًا البيسلفيت لمحو الكلور قبل الأغشية مباشرة. كل منتج يحضّر عمل المنتج الذي يليه."}}
];

const M4_GLOSS={
 membrane:{fr:"membrane",ar:"الغشاء",n:1,d:{fr:"Film très fin, un peu comme un filtre à café extrêmement serré, qui laisse passer l'eau et retient le sel.",ar:"طبقة رقيقة جدًا، تشبه مصفاة قهوة ضيّقة جدًا، تترك الماء يمرّ وتحجز الملح."}},
 colloid:{fr:"colloïde",ar:"الجسيمات الغروية",n:1,d:{fr:"Poussière si petite qu'elle ne tombe jamais au fond de l'eau, comme la poussière qui flotte dans un rayon de soleil.",ar:"غبار صغير جدًا لا يسقط أبدًا إلى قعر الماء، مثل الغبار الذي يطفو في شعاع الشمس."}},
 oxydant:{fr:"oxydant",ar:"المؤكسِد",n:2,d:{fr:"Produit qui attaque ce qu'il touche. Le chlore est un oxydant : il tue les microbes.",ar:"منتج يهاجم ما يلمسه. الكلور مؤكسِد: يقتل الميكروبات."}},
 ph:{fr:"pH",ar:"الـ pH",n:2,d:{fr:"Note de 0 à 14 : acide en dessous de 7, neutre à 7, basique au-dessus. L'eau de mer est à environ 8.",ar:"علامة من 0 إلى 14: حمضي تحت 7، معتدل عند 7، قاعدي فوقها. ماء البحر في حدود 8."}},
 ion:{fr:"ion",ar:"الشاردة",n:3,d:{fr:"Atome qui porte une charge électrique, + ou −. Les + et les − s'attirent comme des aimants.",ar:"ذرة تحمل شحنة كهربائية، + أو −. الموجب والسالب يتجاذبان مثل المغناطيس."}},
 floc:{fr:"floc",ar:"النُّدَف",n:3,d:{fr:"Petit flocon formé de poussières collées ensemble par le fer. Assez gros pour être filtré.",ar:"ندفة صغيرة من غبار التصق بعضه ببعض بفضل الحديد. كبيرة بما يكفي لتُرشَّح."}},
 sdi:{fr:"SDI",ar:"مؤشر SDI",n:4,d:{fr:"Note de colmatage : elle dit à quelle vitesse l'eau bouche un filtre test. Plus elle est basse, plus l'eau est propre.",ar:"علامة الانسداد: تبيّن بأي سرعة يسدّ الماءُ مرشّحَ اختبار. كلما كانت أقل، كان الماء أنظف."}},
 brine:{fr:"saumure",ar:"الماء المركّز (المحلول الملحي)",n:5,d:{fr:"L'eau très salée qui reste derrière la membrane et qui est rejetée en mer.",ar:"الماء المالح جدًا الذي يبقى خلف الغشاء ويُعاد إلى البحر."}},
 scale:{fr:"entartrage",ar:"الترسّب الكلسي",n:5,d:{fr:"Dépôt de calcaire (tartre) sur une surface, comme dans une bouilloire.",ar:"ترسّب الكلس على سطح ما، كما في الغلاية."}},
 anti:{fr:"antitartre",ar:"مانع الترسّب الكلسي",n:6,d:{fr:"Produit qui se colle sur les petits cristaux de calcaire pour les empêcher de grandir.",ar:"منتج يلتصق ببلّورات الكلس الصغيرة ليمنعها من الكِبَر."}},
 conc:{fr:"concentration",ar:"التركيز",n:6,d:{fr:"Quantité d'une substance dans un litre d'eau, par exemple en milligrammes par litre (mg/L).",ar:"كمية مادة في لتر من الماء، مثلًا بالمليغرام في اللتر (mg/L)."}},
 polyamide:{fr:"polyamide",ar:"البولي أميد",n:7,d:{fr:"Plastique spécial qui forme la membrane. Le chlore l'abîme définitivement.",ar:"بلاستيك خاص يُصنع منه الغشاء. الكلور يُتلفه نهائيًا."}},
 orp:{fr:"ORP",ar:"مقياس ORP",n:7,d:{fr:"Capteur qui détecte s'il reste du chlore dans l'eau. Valeur haute : il reste du chlore. Valeur basse : la membrane est protégée.",ar:"حسّاس يكشف إن بقي كلور في الماء. قيمة مرتفعة: ما زال هناك كلور. قيمة منخفضة: الغشاء محمي."}}
};
const M4_QUIZ=[
 {q:{fr:"Pourquoi faut-il enlever le chlore juste avant les membranes ?",ar:"لماذا يجب نزع الكلور قبل الأغشية مباشرة؟"},
  o:{fr:["Le chlore donne un mauvais goût à l'eau","Le chlore abîme définitivement la membrane en polyamide","Le chlore fabrique du calcaire","Le chlore rend l'eau plus salée"],ar:["الكلور يعطي الماء طعمًا سيئًا","الكلور يُتلف غشاء البولي أميد نهائيًا","الكلور يصنع الكلس","الكلور يجعل الماء أكثر ملوحة"]},c:1,
  e:{fr:"Le chlore est un oxydant : il attaque le plastique de la membrane. Le bisulfite le fait disparaître juste avant.",ar:"الكلور مؤكسِد: يهاجم بلاستيك الغشاء. البيسلفيت يزيله قبله مباشرة."}},
 {q:{fr:"Quel produit colle les poussières invisibles entre elles ?",ar:"أي منتج يلصق الغبار غير المرئي بعضه ببعض؟"},
  o:{fr:["Le bisulfite de sodium","L'acide sulfurique","Le chlorure ferrique (sel de fer)","L'antitartre"],ar:["بيسلفيت الصوديوم","حمض الكبريت","كلوريد الحديد الثلاثي (ملح الحديد)","مانع الترسّب الكلسي"]},c:2,
  e:{fr:"Les poussières sont chargées « − ». Le fer, chargé « + », annule leurs charges et elles se collent en flocs.",ar:"الغبار مشحون «−». الحديد المشحون «+» يُلغي شحناته فيلتصق ويكوّن نُدَفًا."}},
 {q:{fr:"À quoi sert le chlore, au tout début ?",ar:"ما فائدة الكلور في البداية؟"},
  o:{fr:["À tuer les microbes et les algues","À retirer le sel","À empêcher le calcaire","À colorer l'eau"],ar:["قتل الميكروبات والطحالب","نزع الملح","منع الكلس","تلوين الماء"]},c:0,
  e:{fr:"Comme l'eau de Javel à la maison, il détruit les microbes avant qu'ils ne salissent les membranes.",ar:"مثل ماء جافيل في البيت، يقضي على الميكروبات قبل أن تُوسّخ الأغشية."}},
 {q:{fr:"Pour le SDI, la note de colmatage, quelle valeur vise-t-on ?",ar:"بالنسبة لـ SDI، علامة الانسداد، ما القيمة المستهدفة؟"},
  o:{fr:["Moins de 3","Entre 5 et 10","Le plus haut possible","Exactement 14"],ar:["أقل من 3","بين 5 و 10","أعلى ما يمكن","14 بالضبط"]},c:0,
  e:{fr:"Plus la note est basse, plus l'eau est propre. On vise moins de 3.",ar:"كلما كانت العلامة أقل، كان الماء أنظف. نهدف إلى أقل من 3."}},
 {q:{fr:"Pourquoi ajoute-t-on un peu d'acide ?",ar:"لماذا نضيف قليلًا من الحمض؟"},
  o:{fr:["Pour tuer les microbes","Pour éviter que du calcaire se dépose sur la membrane","Pour rendre l'eau plus salée","Pour remplacer le chlore"],ar:["لقتل الميكروبات","لتجنّب ترسّب الكلس على الغشاء","لجعل الماء أكثر ملوحة","لتعويض الكلور"]},c:1,
  e:{fr:"L'acide transforme un ingrédient du calcaire en gaz carbonique, qui ne se dépose pas. Même idée que le vinaigre dans la bouilloire.",ar:"الحمض يحوّل أحد مكوّنات الكلس إلى غاز ثاني أكسيد الكربون الذي لا يترسّب. الفكرة نفسها مع الخلّ في الغلاية."}}
];


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

/* ================================================ Leçons et programme */
const conv=b=>({t:{fr:b.fr[0],ar:b.ar[0]},like:{fr:b.fr[1],ar:b.ar[1]},ex:{fr:b.fr[2],ar:b.ar[2]},fr0:b.fr0});
const BASES_QUIZ=WARM.concat([
 {q:X0("Combien d'atomes y a-t-il dans une molécule d'eau, H₂O ?","كم ذرة في جزيء الماء H₂O؟"),o:X0(["2","3","4"],["2","3","4"]),c:1,e:X0("Deux atomes d'hydrogène (H₂) et un atome d'oxygène (O) : 3 atomes.","ذرتا هيدروجين (H₂) وذرة أكسجين (O): 3 ذرات.")},
 {q:X0("« Précipiter », en chimie, c'est…","«الترسّب» في الكيمياء هو…"),o:X0(["se dissoudre dans l'eau","redevenir solide et se déposer","s'évaporer"],["الانحلال في الماء","العودة إلى الحالة الصلبة والاستقرار في القعر","التبخّر"]),c:1,e:X0("Comme le calcaire qui se dépose au fond de la bouilloire.","مثل الكلس الذي يترسّب في قعر الغلاية.")}
]);
const LESSONS=[
 {id:'bases',kind:'reading',eyebrow:X0("Module 0 · Avant de commencer","الوحدة 0 · قبل البدء"),title:X0("Les bases de la chimie, sans formules","أساسيات الكيمياء، دون معادلات"),
  lead:X0("Huit idées simples, avec des exemples de la maison, pour suivre toute la formation. À lire en premier.","ثماني أفكار بسيطة، مع أمثلة من البيت، لمتابعة التكوين كله. تُقرأ أولًا."),
  meta:X0(["8 fiches","l'échelle du pH","lire une formule","quiz de 5 questions"],["8 بطاقات","سُلّم الـ pH","قراءة صيغة","اختبار من 5 أسئلة"]),
  prepH:X0("Les 8 idées de base","الأفكار الأساسية الثماني"),prepLead:X0("Prends le temps de les lire : elles reviennent dans toutes les leçons.","خذي وقتك لقراءتها: فهي تتكرّر في كل الدروس."),
  prep:BASICS.map(conv),quiz:BASES_QUIZ},
 {id:'contexte',kind:'video',eyebrow:X0("Module 1 · Le contexte algérien · Leçon 1","الوحدة 1 · السياق الجزائري · الدرس 1"),title:X0("Pourquoi l'Algérie dessale l'eau de mer","لماذا تُحلّي الجزائر مياه البحر"),
  lead:X0("Le manque d'eau, les sécheresses, et la réponse du pays : des stations de dessalement de plus en plus grandes le long de la côte. Une leçon sans chimie, pour comprendre à quoi va servir ta formation.","نقص الماء، والجفاف، وردّ البلاد: محطات تحلية أكبر فأكبر على طول الساحل. درس دون كيمياء، لفهم فائدة تكوينك."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M1_PREP,scenes:M1_SCENES,gloss:M1_GLOSS,quiz:M1_QUIZ,sources:M1_SOURCES},
 {id:'eau-de-mer',kind:'video',eyebrow:X0("Module 2 · Chimie de l'eau de mer · Leçon 1","الوحدة 2 · كيمياء مياه البحر · الدرس 1"),title:X0("Qu'y a-t-il dans l'eau de mer ?","ماذا يوجد في مياه البحر؟"),
  lead:X0("Avant d'apprendre à la traiter, il faut savoir ce que contient l'eau de mer : du sel bien sûr, mais aussi des ions plus discrets, des êtres vivants et des poussières. Chacun pose un problème différent à la station.","قبل أن نتعلّم كيف نعالجها، يجب أن نعرف ما تحتويه مياه البحر: الملح طبعًا، لكن أيضًا شوارد أقلّ ظهورًا، وكائنات حيّة، وغبارًا. كلّ منها يطرح مشكلة مختلفة في المحطة."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M2_PREP,scenes:M2_SCENES,gloss:M2_GLOSS,quiz:M2_QUIZ},
 {id:'osmose',kind:'video',eyebrow:X0("Module 3 · L'osmose · Leçon 1","الوحدة 3 · التناضح · الدرس 1"),title:X0("L'osmose inverse, comment ça marche ?","التناضح العكسي، كيف يعمل؟"),
  lead:X0("Les grandes stations algériennes utilisent l'osmose inverse. Pour la comprendre, on part d'un phénomène que tu connais déjà en cuisine, puis on apprend à l'inverser.","تعتمد محطات التحلية الكبرى في الجزائر على التناضح العكسي. لفهمه، ننطلق من ظاهرة تعرفينها في المطبخ، ثم نتعلّم كيف نعكسها."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M3_PREP,scenes:M3_SCENES,gloss:M3_GLOSS,quiz:M3_QUIZ},
 {id:'pretraitement',kind:'video',eyebrow:X0("Module 4 · Chimie du prétraitement · Leçon 1","الوحدة 4 · كيمياء المعالجة الأولية · الدرس 1"),title:X0("Le prétraitement chimique de l'eau de mer","المعالجة الكيميائية الأولية لمياه البحر"),
  lead:X0("Avant d'arriver aux membranes qui retirent le sel, l'eau de mer reçoit cinq produits, dans un ordre précis. Chaque produit est expliqué par son rôle, avec des exemples de la vie de tous les jours.","قبل أن تصل مياه البحر إلى الأغشية التي تنزع منها الملح، تُضاف إليها خمسة منتجات بترتيب دقيق. نشرح كل منتج بدوره، مع أمثلة من الحياة اليومية."),
  meta:X0(["3 rappels","vidéo de 8 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 8 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:[conv(BASICS[7]),conv(BASICS[5]),conv(BASICS[3])],scenes:M4_SCENES,gloss:M4_GLOSS,quiz:M4_QUIZ},
 {id:'entartrage',kind:'video',eyebrow:X0("Module 5 · Entartrage et encrassement · Leçon 1","الوحدة 5 · الترسّب الكلسي والانسداد · الدرس 1"),title:X0("Tartre et saleté : les ennemis de la membrane","الكلس والأوساخ: أعداء الغشاء"),
  lead:X0("Même avec un bon prétraitement, les membranes finissent par s'abîmer. Cette leçon explique pourquoi les sels se déposent, comment les bactéries s'installent, et quels chiffres surveiller.","حتى مع معالجة أولية جيدة، تتضرّر الأغشية في النهاية. يشرح هذا الدرس لماذا تترسّب الأملاح، وكيف تستقرّ البكتيريا، وأيّ الأرقام يجب مراقبتها."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M5_PREP,scenes:M5_SCENES,gloss:M5_GLOSS,quiz:M5_QUIZ}

];
const PROGRAM=[[0,X0("Les bases de la chimie","أساسيات الكيمياء"),'bases'],[1,X0("Le contexte algérien","السياق الجزائري"),'contexte'],[2,X0("Chimie de l'eau de mer","كيمياء مياه البحر"),'eau-de-mer'],
 [3,X0("L'osmose inverse","التناضح العكسي"),'osmose'],[4,X0("Chimie du prétraitement","كيمياء المعالجة الأولية"),'pretraitement'],[5,X0("Entartrage et encrassement","الترسّب الكلسي والانسداد"),'entartrage'],
 [6,X0("Chimie des membranes","كيمياء الأغشية")],[7,X0("Nettoyage chimique des membranes","التنظيف الكيميائي للأغشية")],[8,X0("Post-traitement et reminéralisation","المعالجة النهائية وإعادة التمعدن")],
 [9,X0("Procédés thermiques et électrodialyse","الطرق الحرارية والفرز الكهربائي")],[10,X0("Rejets et environnement","الطرح والبيئة")],[11,X0("Projet final","المشروع النهائي")]];


Object.assign(UI,{
 logout:X0("Se déconnecter","تسجيل الخروج"),dash:X0("Tableau de bord","لوحة المتابعة"),
 overall:X0("{a} leçon(s) terminée(s) sur {b}","{a} من {b} دروس منتهية"),
 inprog:X0("En cours","قيد الإنجاز"),video:X0("vidéo {a} %","الفيديو {a} %"),
 saveErr:X0("Ta progression n'a pas pu être enregistrée. Vérifie ta connexion.","تعذّر حفظ تقدّمك. تحقّقي من الاتصال.")
});
