/* Lexique : mots arabes, lieux, personnes et événements de la Sirah, expliqués simplement.
   Champs : k clé, t terme, a écriture arabe, c catégorie, d définition, l lien « en savoir plus »,
   f formes repérées dans les textes (soulignées), s texte à prononcer (si différent de t).
   Les arabes sont donnés à titre d'aide à l'identification des mots. */
(function () {
  "use strict";
  var CAT = { rel: "Termes religieux", per: "Personnes et tribus", lieu: "Lieux", evt: "Événements et calendrier", vie: "Vie quotidienne", co: "Compagnons" };
  var L = [];
  function E(k, t, a, c, d, l, f, s) { L.push({ k: k, t: t, a: a || "", c: c, d: d, l: l || "", f: f || [t], s: s || "" }); }

  /* ---------- Termes religieux ---------- */
  E("sira", "Sirah", "السيرة", "rel", "La biographie du Prophète ﷺ : le récit de sa vie, de sa naissance à sa mort.", "#/chapitres", ["Sirah"]);
  E("salat", "ﷺ (salutation)", "صلى الله عليه وسلم", "rel", "Formule qui signifie « que la paix et les bénédictions de Dieu soient sur lui ». Les musulmans la prononcent chaque fois qu'ils citent le nom du Prophète ﷺ. En arabe : « ṣallā Llāhu ʿalayhi wa sallam ».", "", ["ﷺ"], "que la paix et les bénédictions de Dieu soient sur lui");
  E("islam", "Islam", "الإسلام", "rel", "Religion fondée sur la foi en un Dieu unique. Le mot signifie « soumission à Dieu ». Celui qui la pratique est un musulman.", "", ["islam"]);
  E("dieu", "Dieu (Allah)", "الله", "rel", "« Allah » veut simplement dire « Dieu » en arabe. C'est le Dieu unique, créateur de tout, celui d'Ibrahim, de Musa et d'Isa selon les musulmans.", "", []);
  E("wahy", "Révélation (wahy)", "الوحي", "rel", "Message que Dieu transmet à ses prophètes. Pour Mouhammed ﷺ, c'est l'ange Jibril qui l'apporte, petit à petit, pendant vingt-trois ans.", "#/theme/211", ["révélation", "révélations"], "révélation");
  E("coran", "Coran", "القرآن", "rel", "Le livre sacré de l'islam, la parole de Dieu révélée à Mouhammed ﷺ. Il compte 114 chapitres, les sourates.", "#/theme/211", ["Coran"]);
  E("sourate", "Sourate", "سورة", "rel", "Chapitre du Coran. Il y en a 114, de longueurs très différentes.", "", ["sourate", "sourates"]);
  E("verset", "Verset", "آية", "rel", "Phrase du Coran. Chaque sourate est formée de plusieurs versets.", "", ["verset", "versets"]);
  E("hadith", "Hadith", "حديث", "rel", "Parole, geste ou approbation du Prophète ﷺ, rapportés et transmis par ses compagnons. Le pluriel est « hadiths ».", "", ["hadith", "hadiths"]);
  E("sunna", "Sunna", "السنة", "rel", "La manière de vivre du Prophète ﷺ : ses paroles, ses actes et ses choix, que les musulmans prennent pour exemple.", "", ["Sunna"]);
  E("jibril", "Jibril", "جبريل", "rel", "L'ange Gabriel, qui apporte la révélation aux prophètes.", "", ["Jibril"]);
  E("isra", "Isra' et Mi'raj", "الإسراء والمعراج", "rel", "Le voyage de nuit du Prophète ﷺ de La Mecque à Jérusalem (l'Isra'), puis son ascension à travers les cieux (le Mi'raj). C'est là que les cinq prières lui sont prescrites.", "#/chapitre/12", ["Isra'", "Mi'raj", "voyage nocturne"]);
  E("piliers", "Les cinq piliers", "أركان الإسلام", "rel", "Les cinq bases de la pratique musulmane : l'attestation de foi, la prière, la zakat, le jeûne du Ramadan et le pèlerinage.", "", ["piliers", "pilier"]);
  E("shahada", "Attestation de foi (shahada)", "الشهادة", "rel", "Phrase par laquelle on devient musulman : « Il n'y a de dieu que Dieu et Mouhammed est le Messager de Dieu ».", "", ["attestation de foi"]);
  E("priere", "Prière (salat)", "الصلاة", "rel", "Les cinq prières quotidiennes : l'aube, le milieu du jour, l'après-midi, le coucher du soleil et la nuit. Elles ont été prescrites lors du voyage nocturne.", "#/rite/308", ["prière", "prières"], "prière");
  E("qibla", "Qibla", "القبلة", "rel", "La direction vers laquelle on se tourne pour prier : la Kaaba, à La Mecque. Au début de l'islam à Médine, c'était Jérusalem.", "#/rite/302", ["qibla", "qiblas"]);
  E("adhan", "Adhan", "الأذان", "rel", "L'appel à la prière, lancé du haut de la mosquée avant chaque prière.", "#/rite/301", ["adhan"]);
  E("muezzin", "Muezzin", "المؤذن", "rel", "Celui qui lance l'appel à la prière. Bilal fut le premier muezzin de l'islam.", "#/compagnon/105", ["muezzin", "muezzins"]);
  E("iqama", "Iqama", "الإقامة", "rel", "Second appel, plus court, qui annonce le début de la prière en commun.", "", ["iqama"]);
  E("mosquee", "Mosquée (masjid)", "المسجد", "rel", "Lieu de prière des musulmans. À Médine, celle du Prophète ﷺ était faite de briques crues et de troncs de palmier.", "#/chapitre/15", ["mosquée", "mosquées"], "mosquée");
  E("jumua", "Vendredi (Jumu'a)", "الجمعة", "rel", "Jour de la prière en commun de la semaine, avec un discours avant la prière.", "#/rite/303", ["vendredi"]);
  E("khutba", "Khutba", "الخطبة", "rel", "Discours prononcé avant la prière du vendredi ou des fêtes.", "", ["khutba"]);
  E("zakat", "Zakat", "الزكاة", "rel", "Aumône obligatoire : on donne chaque année une part de ses biens aux pauvres et aux autres personnes qui y ont droit. Pour l'argent, c'est deux et demi pour cent.", "#/rite/305", ["zakat"]);
  E("sadaqa", "Sadaqa", "الصدقة", "rel", "Aumône volontaire, que l'on peut donner à tout moment. Même un sourire est une sadaqa, dit le Prophète ﷺ.", "", ["sadaqa"]);
  E("jeune", "Jeûne (sawm)", "الصيام", "rel", "Se priver de manger, de boire et de relations conjugales de l'aube au coucher du soleil, pendant le mois de Ramadan.", "#/rite/304", ["jeûne", "jeûner"], "jeûne");
  E("ramadan", "Ramadan", "رمضان", "rel", "Le neuvième mois du calendrier musulman : mois du jeûne et de la révélation du Coran.", "#/rite/304", ["Ramadan"]);
  E("suhur", "Suhur", "السحور", "rel", "Le repas pris avant l'aube, avant de commencer le jeûne.", "#/rite/304", ["suhur"]);
  E("iftar", "Iftar", "الإفطار", "rel", "Le repas qui rompt le jeûne au coucher du soleil, traditionnellement avec des dattes.", "#/rite/304", ["iftar"]);
  E("qadr", "Nuit du Destin (Laylat al-Qadr)", "ليلة القدر", "rel", "Une nuit des derniers jours du Ramadan, « meilleure que mille mois », où le Coran a commencé à être révélé.", "#/rite/304", ["Nuit du Destin"]);
  E("itikaf", "I'tikaf", "الاعتكاف", "rel", "Retraite à la mosquée pour prier et se recueillir, surtout pendant les dix derniers jours du Ramadan.", "", ["i'tikaf"]);
  E("hajj", "Pèlerinage (Hajj)", "الحج", "rel", "Le grand pèlerinage à La Mecque, à accomplir une fois dans la vie quand on le peut. C'est le cinquième pilier de l'islam.", "#/rite/306", ["pèlerinage", "pèlerinages", "Hajj"], "pèlerinage");
  E("umra", "'Umra", "العمرة", "rel", "Le petit pèlerinage : on peut l'accomplir à n'importe quel moment de l'année, avec moins de rites que le grand pèlerinage.", "#/rite/306", ["'umra"]);
  E("ihram", "Ihram", "الإحرام", "rel", "État de sacralisation du pèlerin : il porte deux pièces de tissu blanc non cousues et respecte des interdits.", "#/rite/306", ["ihram"]);
  E("arafat", "Arafat", "عرفة", "rel", "Plaine proche de La Mecque où tous les pèlerins se rassemblent le 9e jour de Dhou al-Hijja. « Le pèlerinage, c'est Arafat », dit le Prophète ﷺ.", "#/chapitre/24", ["Arafat"]);
  E("muzdalifa", "Muzdalifa", "مزدلفة", "rel", "Lieu entre Arafat et Mina où les pèlerins passent la nuit après Arafat.", "#/rite/306", ["Muzdalifa"]);
  E("mina", "Mina", "منى", "rel", "Vallée près de La Mecque où les pèlerins accomplissent plusieurs rites : lancer de pierres, sacrifice, rasage de la tête.", "#/rite/306", ["Mina"]);
  E("aid", "Aïd", "عيد", "rel", "Fête musulmane. Il y en a deux : l'Aïd al-Fitr, qui termine le Ramadan, et l'Aïd al-Adha, la fête du sacrifice.", "#/rite/307", ["Aïd al-Fitr", "Aïd al-Adha", "Aïd"]);
  E("kaaba", "Kaaba", "الكعبة", "rel", "Le sanctuaire en forme de cube au centre de la Mosquée sacrée de La Mecque, bâti selon la tradition par Ibrahim et Ismaïl. Les musulmans prient dans sa direction.", "#/lieux/mecque", ["Kaaba"]);
  E("pierrenoire", "Pierre noire", "الحجر الأسود", "rel", "Pierre sacrée enchâssée dans un angle de la Kaaba.", "#/chapitre/3", ["Pierre noire"]);
  E("zamzam", "Zamzam", "زمزم", "rel", "Source d'eau près de la Kaaba qui, selon la tradition, a jailli pour Hajar et son fils Ismaïl.", "", ["Zamzam"]);
  E("safa", "Safa et Marwa", "الصفا والمروة", "rel", "Deux petites collines près de la Kaaba. Les pèlerins les parcourent sept fois, en souvenir de Hajar cherchant de l'eau pour son fils.", "#/rite/306", ["Safa", "Marwa"]);
  E("hanif", "Hanif", "حنيف", "rel", "Homme de l'Arabie d'avant l'islam qui refuse les idoles et cherche la religion pure d'Ibrahim. Pluriel : les hanifs.", "#/chapitre/1", ["hanifs", "hanif"]);
  E("idoles", "Idoles", "الأصنام", "rel", "Statues que l'on adorait à la place de Dieu. Autour de la Kaaba, il y en avait des centaines avant l'islam.", "", ["idoles", "idolâtrie", "idolâtres"]);
  E("hypocrites", "Hypocrites (munafiqun)", "المنافقون", "rel", "À Médine, ceux qui disent croire mais n'ont pas la foi dans le cœur et travaillent contre la communauté.", "", ["hypocrites"], "hypocrites");
  E("martyr", "Martyr (shahid)", "الشهيد", "rel", "Musulman mort en défendant sa foi ou sa communauté.", "", ["martyr", "martyre", "martyrs"]);
  E("calife", "Calife", "الخليفة", "rel", "Successeur du Prophète ﷺ à la tête de la communauté. Les quatre premiers sont Abu Bakr, Omar, Uthman et Ali.", "", ["calife", "califes", "califat"]);
  E("sahaba", "Compagnons (sahaba)", "الصحابة", "rel", "Les hommes et les femmes qui ont connu le Prophète ﷺ, ont cru en lui et sont morts musulmans.", "#/compagnons", ["compagnons", "compagnes"], "compagnons");
  E("muhajirun", "Muhajirun", "المهاجرون", "rel", "Les « émigrés » : les musulmans de La Mecque partis s'installer à Médine.", "#/chapitre/15", ["Muhajirun"]);
  E("ansar", "Ansar", "الأنصار", "rel", "Les « auxiliaires » : les habitants de Médine qui ont accueilli et aidé les émigrés.", "#/chapitre/15", ["Ansar"]);
  E("meres", "Mères des croyants", "أمهات المؤمنين", "rel", "Titre donné par le Coran aux épouses du Prophète ﷺ.", "#/theme/201", ["mères des croyants"]);
  E("suffa", "Ahl as-Suffa", "أهل الصفة", "rel", "Les « gens de la suffa » : des compagnons pauvres qui vivaient dans un espace couvert au fond de la mosquée de Médine pour apprendre.", "#/theme/210", ["Ahl as-Suffa", "suffa"]);
  E("mubahala", "Mubahala", "المباهلة", "rel", "Défi religieux où chacun demande à Dieu de punir celui qui ment. Il fut proposé aux chrétiens de Najran.", "#/theme/216", ["mubahala"]);
  E("ridwan", "Serment de Ridwan", "بيعة الرضوان", "rel", "Serment prêté par les compagnons sous un arbre, à Hudaybiyya. Le mot « ridwan » signifie « satisfaction » : Dieu s'est dit satisfait d'eux.", "#/chapitre/19", ["serment de Ridwan", "Ridwan"]);
  E("charte", "Charte de Médine", "صحيفة المدينة", "evt", "Accord conclu par le Prophète ﷺ entre les musulmans, les juifs et les tribus de Médine : sécurité, défense commune et liberté de culte.", "#/theme/212", ["Charte de Médine", "Charte"]);
  E("tribut", "Tribut (jizya)", "الجزية", "rel", "Somme versée chaque année par un groupe non musulman placé sous la protection de la communauté, en échange de sa sécurité.", "#/theme/216", ["tribut"]);

  /* ---------- Personnes et tribus ---------- */
  E("quraysh", "Quraysh", "قريش", "per", "La grande tribu de La Mecque, gardienne de la Kaaba, dont fait partie le Prophète ﷺ. Beaucoup de ses chefs l'ont combattu jusqu'à la conquête de La Mecque.", "#/chapitre/1", ["Quraysh"]);
  E("banu", "Banu", "بنو", "per", "« Fils de » ou « clan de » en arabe : les Banu Hashim sont le clan de Hashim.", "", ["Banu"]);
  E("hashim", "Banu Hashim", "بنو هاشم", "per", "Le clan de Quraysh auquel appartient le Prophète ﷺ.", "#/chapitre/10", ["Banu Hashim"]);
  E("awskhazraj", "Aws et Khazraj", "الأوس والخزرج", "per", "Les deux grandes tribus arabes de Médine, longtemps rivales avant l'arrivée du Prophète ﷺ.", "#/chapitre/13", ["Aws", "Khazraj"]);
  E("tribusjuives", "Tribus juives de Médine", "بنو قينقاع وبنو النضير وبنو قريظة", "per", "Les Banu Qaynuqa, les Banu an-Nadir et les Banu Qurayza : trois tribus juives de Médine, liées à la Charte.", "#/theme/212", ["Banu Qaynuqa", "Banu an-Nadir", "Banu Qurayza"]);
  E("negus", "Négus", "النجاشي", "per", "Titre du roi chrétien d'Abyssinie, qui a protégé les musulmans réfugiés chez lui.", "#/chapitre/8", ["Négus"]);
  E("heraclius", "Héraclius", "هرقل", "per", "Empereur de Byzance au temps du Prophète ﷺ. Il a reçu une lettre l'invitant à l'islam.", "#/chapitre/20", ["Héraclius"]);
  E("khosro", "Khosro", "كسرى", "per", "Roi de Perse, qui déchira la lettre du Prophète ﷺ.", "#/chapitre/20", ["Khosro"]);
  E("muqawqis", "Muqawqis", "المقوقس", "per", "Gouverneur d'Égypte, qui répondit poliment à la lettre du Prophète ﷺ.", "#/chapitre/20", ["Muqawqis"]);
  E("byzance", "Byzance (les Byzantins)", "الروم", "per", "Empire chrétien d'Orient, dont la capitale était Constantinople (aujourd'hui Istanbul). Grand rival de la Perse.", "", ["Byzantins", "Byzance", "byzantine", "byzantin"], "Byzance");
  E("perse", "Perse", "فارس", "per", "Empire correspondant en grande partie à l'Iran actuel, grand rival de Byzance.", "", ["Perse", "Perses"]);
  E("bedouin", "Bédouin", "الأعرابي", "per", "Arabe du désert, qui vit en tribu de l'élevage et des déplacements.", "", ["bédouin", "bédouins", "bédouine"]);
  E("abutalib", "Abu Talib", "أبو طالب", "per", "Oncle du Prophète ﷺ qui l'a élevé et protégé jusqu'à sa mort, sans embrasser l'islam.", "#/chapitre/2", ["Abu Talib"]);
  E("abdmuttalib", "Abd al-Muttalib", "عبد المطلب", "per", "Grand-père du Prophète ﷺ et chef de Quraysh.", "#/chapitre/2", ["Abd al-Muttalib"]);
  E("abulahab", "Abu Lahab", "أبو لهب", "per", "Oncle du Prophète ﷺ et l'un de ses plus violents adversaires.", "#/chapitre/6", ["Abu Lahab"]);
  E("abujahl", "Abu Jahl", "أبو جهل", "per", "Chef de Quraysh et l'un des pires ennemis du Prophète ﷺ, tué à Badr.", "#/chapitre/16", ["Abu Jahl"]);
  E("abusufyan", "Abu Sufyan", "أبو سفيان", "per", "Chef de Quraysh, longtemps opposé au Prophète ﷺ, converti à l'approche de la conquête de La Mecque.", "#/chapitre/21", ["Abu Sufyan"]);
  E("halima", "Halima", "حليمة السعدية", "per", "La nourrice bédouine qui a élevé le Prophète ﷺ pendant sa petite enfance.", "#/chapitre/2", ["Halima"]);
  E("amina", "Amina", "آمنة", "per", "Mère du Prophète ﷺ, morte quand il avait six ans.", "#/chapitre/2", ["Amina"]);
  E("waraqa", "Waraqa ibn Nawfal", "ورقة بن نوفل", "per", "Cousin de Khadija et savant chrétien, qui reconnaît le message du Prophète ﷺ.", "#/chapitre/4", ["Waraqa ibn Nawfal", "Waraqa"]);
  E("bahira", "Bahira", "بحيرى", "per", "Moine de Bosra qui, selon la tradition, remarque chez le jeune Mouhammed ﷺ des signes de prophétie.", "#/chapitre/3", ["Bahira"]);
  E("ibnubayy", "Abdallah ibn Ubayy", "عبد الله بن أبي", "per", "Chef des hypocrites de Médine.", "#/chapitre/17", ["Abdallah ibn Ubayy"]);
  E("suhayl", "Suhayl ibn Amr", "سهيل بن عمرو", "per", "Négociateur de Quraysh lors du traité de Hudaybiyya.", "#/chapitre/19", ["Suhayl ibn Amr"]);
  E("wahshi", "Wahshi", "وحشي", "per", "L'homme qui a tué Hamza à Uhud, puis s'est converti.", "#/compagnon/107", ["Wahshi"]);
  E("ibrahim", "Ibrahim", "إبراهيم", "per", "Abraham, prophète qui a bâti la Kaaba avec son fils Ismaïl.", "#/theme/307", ["Ibrahim"]);
  E("ismail", "Ismaïl", "إسماعيل", "per", "Ismaël, fils d'Ibrahim et de Hajar, prophète lui aussi.", "#/theme/307", ["Ismaïl"]);
  E("hajar", "Hajar", "هاجر", "per", "Agar, mère d'Ismaïl, qui chercha de l'eau pour lui entre Safa et Marwa.", "#/rite/306", ["Hajar"]);
  E("musa", "Musa", "موسى", "per", "Moïse, prophète de Dieu.", "", ["Musa"]);
  E("isa", "Isa", "عيسى", "per", "Jésus, prophète de Dieu pour les musulmans, né de la vierge Maryam.", "", ["Isa"]);
  E("maryam", "Maryam", "مريم", "per", "Marie, mère de Jésus. Une sourate du Coran porte son nom.", "", ["Maryam"]);

  /* ---------- Lieux ---------- */
  E("mecque", "La Mecque", "مكة المكرمة", "lieu", "Ville sainte de l'islam, dans le Hedjaz. On y trouve la Kaaba. C'est la ville natale du Prophète ﷺ.", "#/lieux/mecque", ["La Mecque", "Mecquois", "Mecquoise"]);
  E("medine", "Médine", "المدينة المنورة", "lieu", "La ville où le Prophète ﷺ a émigré en 622 et où il est enterré. Son ancien nom est Yathrib.", "#/lieux/medine", ["Médine", "Yathrib"]);
  E("hira", "Hira", "غار حراء", "lieu", "Grotte d'une montagne près de La Mecque, où le Prophète ﷺ reçoit la première révélation.", "#/chapitre/4", ["Hira"]);
  E("thawr", "Thawr", "غار ثور", "lieu", "Grotte au sud de La Mecque où le Prophète ﷺ et Abu Bakr se cachent pendant l'Hégire.", "#/chapitre/14", ["Thawr"]);
  E("taif", "Taïf", "الطائف", "lieu", "Ville fraîche et fertile à l'est de La Mecque.", "#/lieux/taif", ["Taïf"]);
  E("badr", "Badr", "بدر", "lieu", "Point d'eau au sud-ouest de Médine, où a lieu la première grande bataille de l'islam, en l'an 2.", "#/lieux/badr", ["Badr"]);
  E("uhud", "Uhud", "أحد", "lieu", "Montagne près de Médine, où a lieu la bataille de l'an 3.", "#/chapitre/17", ["Uhud"]);
  E("khaybar", "Khaybar", "خيبر", "lieu", "Oasis fortifiée au nord de Médine, conquise en l'an 7.", "#/lieux/khaybar", ["Khaybar"]);
  E("tabuk", "Tabuk", "تبوك", "lieu", "Étape au nord de l'Arabie où va l'armée de l'an 9 face à Byzance.", "#/lieux/tabuk", ["Tabuk"]);
  E("muta", "Mu'ta", "مؤتة", "lieu", "Village de l'actuelle Jordanie où a lieu la bataille de l'an 8.", "#/theme/213", ["Mu'ta"]);
  E("hudaybiyya", "Hudaybiyya", "الحديبية", "lieu", "Lieu à l'entrée du territoire sacré de La Mecque, où est conclu un traité en l'an 6.", "#/chapitre/19", ["Hudaybiyya"]);
  E("hunayn", "Hunayn", "حنين", "lieu", "Vallée près de La Mecque où a lieu la bataille de l'an 8.", "#/chapitre/22", ["Hunayn"]);
  E("quba", "Quba", "قباء", "lieu", "Village près de Médine où est bâtie la première mosquée de l'islam.", "#/chapitre/14", ["Quba"]);
  E("najran", "Najran", "نجران", "lieu", "Oasis du sud de l'Arabie, peuplée surtout de chrétiens.", "#/theme/216", ["Najran"]);
  E("hedjaz", "Hedjaz", "الحجاز", "lieu", "Région de l'ouest de l'Arabie où se trouvent La Mecque, Médine et Taïf.", "#/lieux/mecque", ["Hedjaz"]);
  E("abyssinie", "Abyssinie", "الحبشة", "lieu", "Ancien royaume chrétien situé dans la région de l'Éthiopie actuelle, de l'autre côté de la mer Rouge.", "#/lieux/abyssinie", ["Abyssinie"]);
  E("jerusalem", "Jérusalem", "القدس", "lieu", "Ville sainte où se trouve la mosquée al-Aqsa. Elle fut la première qibla des musulmans.", "#/lieux/jerusalem", ["Jérusalem", "al-Aqsa", "Aqsa"]);
  E("bosra", "Bosra", "بصرى", "lieu", "Ville de Syrie, étape des caravanes de La Mecque.", "#/lieux/bosra", ["Bosra"]);
  E("syrie", "Syrie (Châm)", "الشام", "lieu", "Région au nord de l'Arabie (Syrie, Liban, Jordanie et Palestine actuels) où allaient les caravanes.", "", ["Syrie"]);
  E("yemen", "Yémen", "اليمن", "lieu", "Région du sud de l'Arabie, d'où venaient aussi des caravanes.", "", ["Yémen"]);
  E("constantinople", "Constantinople", "القسطنطينية", "lieu", "Capitale de l'empire byzantin, aujourd'hui Istanbul.", "#/compagnon/127", ["Constantinople"]);

  /* ---------- Événements et calendrier ---------- */
  E("hegire", "Hégire (Hijra)", "الهجرة", "evt", "L'émigration du Prophète ﷺ de La Mecque à Médine, en 622. Cette année est le point de départ du calendrier musulman.", "#/chapitre/14", ["Hégire"], "Hégire");
  E("elephant", "Année de l'Éléphant", "عام الفيل", "evt", "L'année de la naissance du Prophète ﷺ, vers 570 : Abraha, gouverneur du Yémen, marche sur la Kaaba avec des éléphants, sans parvenir à la détruire.", "#/chapitre/2", ["Éléphant"]);
  E("tristesse", "Année de la tristesse", "عام الحزن", "evt", "L'année 619, où meurent Abu Talib et Khadija.", "#/chapitre/11", ["année de la tristesse"]);
  E("tranchee", "Bataille de la Tranchée", "غزوة الخندق", "evt", "Siège de Médine en l'an 5 : les musulmans creusent un fossé pour arrêter les armées coalisées.", "#/chapitre/18", ["Tranchée"]);
  E("ifk", "Al-Ifk", "حادثة الإفك", "evt", "La calomnie contre Aïcha, démentie par un verset du Coran. « Ifk » signifie « mensonge ».", "#/theme/214", ["al-Ifk"]);
  E("adieu", "Pèlerinage d'adieu", "حجة الوداع", "evt", "L'unique grand pèlerinage du Prophète ﷺ, en l'an 10, où il prononce son grand sermon à Arafat.", "#/chapitre/24", ["pèlerinage d'adieu"]);
  E("dhulhijja", "Dhou al-Hijja", "ذو الحجة", "evt", "Le douzième mois du calendrier musulman, mois du pèlerinage.", "#/rite/306", ["Dhou al-Hijja"]);
  E("rabi", "Rabi' al-awwal", "ربيع الأول", "evt", "Le troisième mois du calendrier musulman. C'est le mois de l'Hégire et de la mort du Prophète ﷺ.", "", ["Rabi' al-awwal"]);
  E("calendrier", "Calendrier de l'Hégire", "التقويم الهجري", "evt", "Calendrier lunaire musulman. Il commence en 622, année de l'émigration à Médine. Chaque année compte 12 mois lunaires.", "#/chapitre/14", ["calendrier de l'Hégire"]);

  /* ---------- Vie quotidienne ---------- */
  E("datte", "Datte", "التمر", "vie", "Fruit du palmier-dattier, aliment de base en Arabie. On rompt traditionnellement le jeûne avec des dattes.", "#/rite/304", ["datte", "dattes"]);
  E("caravane", "Caravane", "القافلة", "vie", "Groupe de marchands et de chameaux qui voyagent ensemble. La Mecque vivait du commerce des caravanes.", "#/chapitre/1", ["caravane", "caravanes"]);
  E("oasis", "Oasis", "واحة", "vie", "Lieu du désert où il y a de l'eau et des palmiers.", "", ["oasis"]);
  E("etendard", "Étendard", "الراية", "vie", "Grand drapeau porté à la guerre. Celui du Prophète ﷺ était noir, l'autre était blanc.", "#/chapitre/20", ["étendard", "étendards"]);

  /* ---------- Compagnons (liés aux portraits) ---------- */
  var CF = {
    101: ["Abu Bakr as-Siddiq", "Abu Bakr"], 102: ["Omar ibn al-Khattab", "Omar"], 103: ["Uthman ibn Affan", "Uthman"], 104: ["Ali ibn Abi Talib", "Ali"], 105: ["Bilal"], 106: ["Salman al-Farisi", "Salman"],
    107: ["Hamza"], 108: ["Mus'ab ibn Umayr", "Mus'ab"], 109: ["Khalid ibn al-Walid", "Khalid"], 110: ["Abu Ubayda ibn al-Jarrah", "Abu Ubayda"], 111: ["Sa'd ibn Abi Waqqas"], 112: ["Az-Zubayr"],
    113: ["Aïcha"], 114: ["Asma bint Abi Bakr", "Asma"], 115: ["Umm Salama"], 116: ["Khadija bint Khuwaylid", "Khadija"], 117: ["Fatima"], 118: ["Zayd ibn Haritha"], 119: ["Ja'far ibn Abi Talib", "Ja'far"],
    120: ["Talha"], 121: ["Abd ar-Rahman ibn Awf"], 122: ["Abu Dharr al-Ghifari", "Abu Dharr"], 123: ["Mu'adh ibn Jabal"], 124: ["Abu Hurayra"], 125: ["Abdallah ibn Mas'ud", "Ibn Mas'ud"],
    126: ["Ammar ibn Yasir", "Ammar"], 127: ["Abu Ayyub al-Ansari", "Abu Ayyub"], 128: ["Sa'd ibn Mu'adh"], 129: ["Ubayy ibn Ka'b", "Ubayy"], 130: ["Anas ibn Malik"]
  };
  var base = L.length;
  (window.COMPANIONS || []).forEach(function (c) {
    L.push({ k: "c" + c.id, t: c.title, a: "", c: "co", d: c.sub + " (" + c.date + ").", l: "#/compagnon/" + c.id, f: CF[c.id] || [c.title], s: "", portrait: c.id });
  });
  E("hasan", "Hasan et Husayn", "الحسن والحسين", "co", "Les deux petits-fils du Prophète ﷺ, fils d'Ali et de Fatima.", "#/theme/203", ["Hasan", "Husayn"]);
  E("usama", "Usama ibn Zayd", "أسامة بن زيد", "co", "Jeune compagnon très aimé du Prophète ﷺ, fils de Zayd, qui commande une armée à dix-huit ans.", "#/theme/215", ["Usama"]);

  window.LEXIQUE = { cat: CAT, list: L };
})();
