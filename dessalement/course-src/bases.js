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
