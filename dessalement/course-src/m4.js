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

