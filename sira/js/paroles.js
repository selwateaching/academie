/* Paroles du Prophète ﷺ (hadiths) classées par thème. Chaque parole : fr, en, source (recueil et numéro).
   Seuls des hadiths des recueils de Bukhari et de Muslim (ou jugés authentiques) sont retenus. Traductions libres, à visée pédagogique. */
(function () {
  "use strict";
  var EN = window.LANG === "en", AR = window.LANG === "ar", SAY = (AR && window.AR && window.AR.say) || null;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var THEMES = [
    { id: "foi", icon: "🌟", fr: "Foi et intentions", en: "Faith and intentions" },
    { id: "car", icon: "🤝", fr: "Bon caractère", en: "Good character" },
    { id: "par", icon: "🗣️", fr: "Parole et silence", en: "Speech and silence" },
    { id: "fam", icon: "🏠", fr: "Famille et parents", en: "Family and parents" },
    { id: "sav", icon: "📖", fr: "Science et Coran", en: "Knowledge and the Quran" },
    { id: "cha", icon: "💛", fr: "Charité et générosité", en: "Charity and generosity" },
    { id: "fra", icon: "🫂", fr: "Fraternité et voisins", en: "Brotherhood and neighbours" },
    { id: "vie", icon: "⏳", fr: "Patience et vie quotidienne", en: "Patience and daily life" }
  ];

  var S = [
    /* Foi et intentions */
    ["foi", "Les actes ne valent que par les intentions, et chacun n'obtient que ce qu'il a eu l'intention de faire.", "Actions are judged only by intentions, and each person gets only what they intended.", "Bukhari 1, Muslim 1907"],
    ["foi", "L'islam est bâti sur cinq piliers : l'attestation qu'il n'y a de dieu que Dieu et que Mouhammed ﷺ est son Messager, la prière, la zakat, le pèlerinage et le jeûne du Ramadan.", "Islam is built on five pillars: the testimony that there is no god but God and that Muhammad ﷺ is His Messenger, the prayer, the zakat, the pilgrimage and the fast of Ramadan.", "Bukhari 8, Muslim 16"],
    ["foi", "Aucun de vous ne croit vraiment tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même.", "None of you truly believes until he loves for his brother what he loves for himself.", "Bukhari 13, Muslim 45"],
    ["foi", "La foi comporte plus de soixante branches, et la pudeur est l'une d'elles.", "Faith has more than sixty branches, and modesty is one of them.", "Bukhari 9, Muslim 35"],
    ["foi", "Les actes que Dieu préfère sont les plus réguliers, même s'ils sont petits.", "The deeds most loved by God are the most regular, even if they are small.", "Bukhari 6464, Muslim 783"],
    ["foi", "Sois dans ce monde comme un étranger ou comme un voyageur.", "Be in this world as a stranger or a traveller.", "Bukhari 6416"],
    ["foi", "Dieu ne regarde ni vos apparences ni vos biens, mais il regarde vos cœurs et vos actes.", "God does not look at your appearances or your wealth, but He looks at your hearts and your deeds.", "Muslim 2564"],
    /* Bon caractère */
    ["car", "Les meilleurs d'entre vous sont ceux qui ont le meilleur caractère.", "The best of you are those with the best character.", "Bukhari 3559, Muslim 2321"],
    ["car", "Le fort n'est pas celui qui terrasse les autres, mais celui qui se maîtrise lorsqu'il est en colère.", "The strong one is not the one who overpowers others, but the one who controls himself when angry.", "Bukhari 6114, Muslim 2609"],
    ["car", "Dieu est doux et il aime la douceur en toute chose.", "God is gentle and loves gentleness in everything.", "Bukhari 6024, Muslim 2593"],
    ["car", "Celui qui n'est pas miséricordieux envers les gens, Dieu ne lui fera pas miséricorde.", "Whoever is not merciful to people, God will not be merciful to him.", "Bukhari 7376, Muslim 2319"],
    ["car", "Un homme demanda un conseil au Prophète ﷺ, qui répondit : « Ne te mets pas en colère. » L'homme répéta plusieurs fois, et il répondit chaque fois : « Ne te mets pas en colère. »", "A man asked the Prophet ﷺ for advice, and he said: “Do not become angry.” The man repeated his request several times, and each time he answered: “Do not become angry.”", "Bukhari 6116"],
    ["car", "La sincérité mène à la piété, et la piété mène au Paradis. L'homme reste sincère jusqu'à être inscrit auprès de Dieu comme véridique.", "Truthfulness leads to righteousness, and righteousness leads to Paradise. A man keeps telling the truth until he is recorded with God as truthful.", "Bukhari 6094, Muslim 2607"],
    ["car", "Crains Dieu où que tu sois, fais suivre une mauvaise action d'une bonne qui l'effacera, et traite les gens avec un bon caractère.", "Fear God wherever you are, follow a bad deed with a good one that will wipe it out, and treat people with good character.", "Tirmidhi 1987"],
    /* Parole et silence */
    ["par", "Que celui qui croit en Dieu et au Jour dernier dise du bien ou se taise.", "Whoever believes in God and the Last Day, let him speak good or keep silent.", "Bukhari 6018, Muslim 47"],
    ["par", "Le musulman est celui dont les gens sont à l'abri de la langue et de la main.", "A Muslim is the one from whose tongue and hand people are safe.", "Bukhari 10, Muslim 40"],
    ["par", "Le signe de l'hypocrite est triple : quand il parle, il ment ; quand il promet, il manque à sa promesse ; quand on lui confie quelque chose, il trahit.", "The sign of the hypocrite is threefold: when he speaks, he lies; when he promises, he breaks his promise; when he is trusted, he betrays.", "Bukhari 33, Muslim 59"],
    ["par", "Celui qui me garantit ce qu'il y a entre ses mâchoires et ce qu'il y a entre ses jambes, je lui garantis le Paradis.", "Whoever guarantees me what is between his jaws and what is between his legs, I guarantee him Paradise.", "Bukhari 6474"],
    ["par", "Une bonne parole est une aumône.", "A good word is charity.", "Bukhari 2989, Muslim 1009"],
    ["par", "Il suffit à un homme, comme mensonge, de répéter tout ce qu'il entend.", "It is enough lying for a man to repeat everything he hears.", "Muslim 5"],
    /* Famille et parents */
    ["fam", "Un homme demanda : « Qui mérite le plus ma bonne compagnie ? » Il répondit : « Ta mère. » — « Puis qui ? » — « Ta mère. » — « Puis qui ? » — « Ta mère. » — « Puis qui ? » — « Ton père. »", "A man asked: “Who most deserves my good company?” He said: “Your mother.” — “Then who?” — “Your mother.” — “Then who?” — “Your mother.” — “Then who?” — “Your father.”", "Bukhari 5971, Muslim 2548"],
    ["fam", "Le meilleur d'entre vous est le meilleur envers sa famille, et moi, je suis le meilleur d'entre vous envers ma famille.", "The best of you is the best to his family, and I am the best of you to my family.", "Tirmidhi 3895"],
    ["fam", "N'est pas des nôtres celui qui n'a pas de compassion pour nos petits et ne reconnaît pas les droits de nos aînés.", "He is not one of us who has no compassion for our young and does not recognise the rights of our elders.", "Tirmidhi 1919"],
    ["fam", "Craignez Dieu et soyez justes envers vos enfants.", "Fear God and be fair to your children.", "Bukhari 2587, Muslim 1623"],
    ["fam", "Qu'un croyant ne déteste pas une croyante : s'il n'aime pas un de ses traits, il en aimera un autre.", "Let a believing man not hate a believing woman: if he dislikes one trait in her, he will like another.", "Muslim 1469"],
    /* Science et Coran */
    ["sav", "Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne.", "The best of you is the one who learns the Quran and teaches it.", "Bukhari 5027"],
    ["sav", "Celui qui emprunte un chemin à la recherche du savoir, Dieu lui facilite un chemin vers le Paradis.", "Whoever takes a path in search of knowledge, God makes easy for him a path to Paradise.", "Muslim 2699"],
    ["sav", "Quand Dieu veut du bien à quelqu'un, il lui donne la compréhension de la religion.", "When God wants good for someone, He gives him understanding of the religion.", "Bukhari 71, Muslim 1037"],
    ["sav", "Transmettez de ma part, ne serait-ce qu'un verset.", "Convey from me, even if it is a single verse.", "Bukhari 3461"],
    ["sav", "Quand un homme meurt, ses actes s'arrêtent, sauf trois : une aumône continue, un savoir utile, ou un enfant pieux qui prie pour lui.", "When a person dies, his deeds come to an end except three: ongoing charity, useful knowledge, or a righteous child who prays for him.", "Muslim 1631"],
    /* Charité et générosité */
    ["cha", "Sourire à ton frère est une aumône.", "Smiling at your brother is charity.", "Tirmidhi 1956"],
    ["cha", "Protégez-vous du Feu, ne serait-ce qu'avec une demi-datte.", "Protect yourselves from the Fire, even with half a date.", "Bukhari 1417, Muslim 1016"],
    ["cha", "La main qui donne vaut mieux que la main qui reçoit.", "The upper hand is better than the lower hand.", "Bukhari 1429, Muslim 1033"],
    ["cha", "L'aumône n'a jamais diminué une richesse.", "Charity never decreases wealth.", "Muslim 2588"],
    ["cha", "Toute bonne action est une aumône.", "Every good deed is charity.", "Bukhari 6021, Muslim 1005"],
    ["cha", "Il y a une récompense pour toute bonté envers un être vivant.", "There is a reward for kindness to every living creature.", "Bukhari 2363, Muslim 2244"],
    /* Fraternité et voisins */
    ["fra", "Le croyant est pour le croyant comme un édifice dont les parties se soutiennent les unes les autres.", "The believer is to the believer like a building whose parts support one another.", "Bukhari 481, Muslim 2585"],
    ["fra", "Jibril n'a cessé de me recommander le voisin, au point que j'ai cru qu'il allait lui donner une part d'héritage.", "Jibril kept advising me about the neighbour until I thought he would make him an heir.", "Bukhari 6014, Muslim 2625"],
    ["fra", "Que celui qui croit en Dieu et au Jour dernier honore son hôte.", "Whoever believes in God and the Last Day, let him honour his guest.", "Bukhari 6019, Muslim 48"],
    ["fra", "Ne vous enviez pas, ne vous haïssez pas, ne vous tournez pas le dos, et soyez, serviteurs de Dieu, des frères.", "Do not envy one another, do not hate one another, do not turn away from one another, and be, servants of God, brothers.", "Bukhari 6064, Muslim 2559"],
    ["fra", "Le musulman est le frère du musulman : il ne lui fait pas de tort et ne le livre pas à ses ennemis.", "A Muslim is the brother of a Muslim: he does not wrong him and does not abandon him.", "Bukhari 2442, Muslim 2580"],
    ["fra", "Vous n'entrerez pas au Paradis tant que vous ne croirez pas, et vous ne croirez pas tant que vous ne vous aimerez pas. Voulez-vous que je vous indique ce qui vous fera vous aimer ? Répandez le salut entre vous.", "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I tell you something that will make you love one another? Spread the greeting of peace among you.", "Muslim 54"],
    /* Patience et vie quotidienne */
    ["vie", "La propreté est la moitié de la foi.", "Cleanliness is half of faith.", "Muslim 223"],
    ["vie", "L'affaire du croyant est étonnante : tout est bien pour lui. S'il reçoit un bienfait, il remercie, et c'est un bien ; s'il subit une épreuve, il patiente, et c'est un bien.", "The affair of the believer is remarkable: all of it is good for him. If he is given a blessing he gives thanks, and that is good; if he is struck by hardship he is patient, and that is good.", "Muslim 2999"],
    ["vie", "Deux bienfaits dont beaucoup de gens sont privés faute d'en profiter : la santé et le temps libre.", "There are two blessings that many people lose out on: health and free time.", "Bukhari 6412"],
    ["vie", "La patience, c'est au premier choc.", "Patience is at the first strike of calamity.", "Bukhari 1283, Muslim 926"],
    ["vie", "Applique-toi à ce qui t'est utile, demande l'aide de Dieu et ne te décourage pas.", "Strive for what benefits you, seek God's help and do not lose heart.", "Muslim 2664"],
    ["vie", "Le meilleur jour sur lequel le soleil se soit levé est le vendredi.", "The best day on which the sun has risen is Friday.", "Muslim 854"]
  ];
  S = S.map(function (x, i) {
    var a = SAY && SAY.items && SAY.items["s" + (i + 1)];
    return { n: i + 1, th: x[0], t: a ? a.ar : EN ? x[2] : x[1], src: a ? a.src_ar : x[3], approx: !!(a && a.exact === false) };
  });
  function tname(t) { return AR && SAY && SAY.themes ? SAY.themes[t.id] : EN ? t.en : t.fr; }

  function view(sel) {
    var app = document.getElementById("app");
    var th = THEMES.filter(function (t) { return t.id === sel; })[0];
    var chips = '<div class="chips"><a class="chip' + (th ? "" : " on") + '" href="#/paroles">' + L3("Toutes", "All", "الكل") + " (" + S.length + ")</a>" +
      THEMES.map(function (t) { return '<a class="chip' + (th && th.id === t.id ? " on" : "") + '" href="#/paroles/' + t.id + '">' + t.icon + " " + esc(tname(t)) + "</a>"; }).join("") + "</div>";
    var groups = (th ? [th] : THEMES).map(function (t) {
      var list = S.filter(function (s) { return s.th === t.id; });
      return '<h3 class="sy-h">' + t.icon + " " + esc(tname(t)) + "</h3>" + list.map(function (s) {
        return '<figure class="saying"><blockquote>' + esc(s.t) + "</blockquote><figcaption>" + (AR ? "المصدر: " : EN ? "Source: " : "Source : ") + esc(s.src) + (s.approx ? (AR ? " — بالمعنى" : "") : "") + "</figcaption></figure>";
      }).join("");
    }).join("");
    app.innerHTML = '<section class="block wrap"><h2>' + L3("Paroles du Prophète ﷺ", "Sayings of the Prophet ﷺ", "أحاديث النبي ﷺ") + "</h2>" +
      '<p class="lead">' + (AR ? S.length + " حديثاً مشهوراً مرتباً حسب الموضوع، من كتب البخاري ومسلم والترمذي. النصوص مأخوذة بحسب ما حفظه المؤلف ويُرجَع إلى كتب الحديث للتحقق من اللفظ والسند؛ وما كُتب «بالمعنى» فهو بمعنى الحديث لا بلفظه." : EN ? S.length + " well-known sayings (hadiths) by theme (category), taken from the collections of Bukhari, Muslim and Tirmidhi. Free translations for learning; the Arabic text and the full chain of narrators are in the collections cited."
        : S.length + " paroles célèbres (hadiths) classées par thème (catégorie), tirées des recueils de Bukhari, de Muslim et de Tirmidhi. Traductions libres à visée pédagogique ; le texte arabe et la chaîne de transmission complète se trouvent dans les recueils cités.") + "</p>" +
      '<p class="sy-cat">' + L3("Choisissez une catégorie :", "Choose a category:", "اختر موضوعاً:") + "</p>" + chips + groups + "</section>";
    document.title = L3("Paroles du Prophète ﷺ", "Sayings of the Prophet ﷺ", "أحاديث النبي ﷺ") + " — " + L3("Le Monde de la Sirah", "The World of the Sirah", "عالم السيرة");
    window.scrollTo(0, 0);
  }
  window.SiraParoles = { view: view, list: S, themes: THEMES };
})();
