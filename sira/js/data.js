/* La Sirah du Prophète ﷺ Mouhammed ﷺ — récit en 25 chapitres.
   Sources principales : Ibn Ishaq / Ibn Hisham, Ibn Sa'd, at-Tabari, recueils de hadiths.
   Les dates avant l'Hégire sont approximatives. */
window.PERIODS = [
  { id: "avant", label: "Avant la révélation", icon: "🌙" },
  { id: "mecque", label: "La période mecquoise", icon: "🕋" },
  { id: "medine", label: "La période médinoise", icon: "🕌" }
];

window.CHAPTERS = [
  {
    id: 1, period: "avant", title: "L'Arabie avant l'islam", sub: "Une terre de caravanes et de tribus", date: "avant 570",
    paras: [
      "Au VIe siècle, la péninsule Arabique est un vaste espace de déserts et d'oasis, peuplé de tribus attachées à leur honneur, à leur généalogie et à la poésie. Il n'existe pas d'État central : la loi du clan et la solidarité du sang règlent la vie, et les vengeances se transmettent parfois sur plusieurs générations.",
      "Au cœur du Hedjaz se trouve La Mecque, dans une vallée aride. Sa renommée vient de la Kaaba, le sanctuaire bâti selon la tradition par Ibrahim et son fils Ismaïl. Chaque année, des pèlerins affluent, et les mois sacrés imposent une trêve qui favorise les foires et le commerce.",
      "La tribu de Quraysh, gardienne du sanctuaire, domine la ville. Ses caravanes relient le Yémen, au sud, à la Syrie, au nord : le « voyage d'hiver et d'été » évoqué par le Coran. Autour de la Kaaba, les Arabes ont pourtant placé des centaines d'idoles, tandis que quelques hommes, les hanifs, cherchent encore la religion pure d'Ibrahim.",
      "Aux frontières, deux empires rivaux, Byzance et la Perse, se disputent l'influence. C'est dans ce monde fragmenté, riche en parole mais pauvre en justice pour les faibles, que va naître celui dont le message changera l'histoire."
    ]
  },
  {
    id: 2, period: "avant", title: "Naissance et enfance", sub: "Un orphelin au cœur de La Mecque", date: "vers 570",
    paras: [
      "Mouhammed ﷺ naît à La Mecque, vers 570, l'année dite « de l'Éléphant », où le gouverneur abyssin Abraha marche sur la Kaaba avec une armée et des éléphants, sans parvenir à la détruire. Son père, Abdallah, fils d'Abd al-Muttalib, est mort quelques mois avant sa naissance, au retour d'un voyage en Syrie.",
      "Selon l'usage des familles nobles de La Mecque, l'enfant est confié à une nourrice bédouine, Halima as-Sa'diyya, de la tribu des Banu Sa'd. Il passe ainsi ses premières années dans le désert, à l'air pur, et y apprend la langue arabe la plus claire.",
      "À six ans, il perd sa mère Amina, qui meurt à Abwa, sur le chemin du retour de Médine. Son grand-père Abd al-Muttalib, chef respecté de Quraysh, le recueille avec tendresse, mais meurt à son tour deux ans plus tard.",
      "C'est son oncle Abu Talib qui devient son tuteur. Cet homme généreux, chargé de famille et peu fortuné, l'aime comme son propre fils et le protégera jusqu'à la fin de sa vie. Très tôt, l'orphelin connaît la peine, mais aussi la bonté des siens."
    ]
  },
  {
    id: 3, period: "avant", title: "La jeunesse et Khadija", sub: "« Al-Amin », l'homme digne de confiance", date: "vers 583 – 610",
    paras: [
      "Dès l'enfance, Mouhammed ﷺ garde les troupeaux de Quraysh. Vers douze ans, il accompagne son oncle Abu Talib dans une caravane vers la Syrie. À Bosra, le moine Bahira, selon la tradition, remarque en lui des signes annonçant un avenir exceptionnel et met l'oncle en garde.",
      "Devenu adulte, il se fait connaître par son honnêteté. Ses concitoyens l'appellent « al-Amin », le digne de confiance, et lui confient leurs dépôts. Il participe aussi au « pacte des Fudul », par lequel des Mecquois s'engagent à défendre les opprimés, qu'ils soient de la ville ou étrangers.",
      "Khadija bint Khuwaylid, riche commerçante réputée pour sa droiture, l'engage pour conduire une caravane en Syrie. Impressionnée par sa probité et par le récit de son serviteur Maysara, elle lui propose le mariage. Il a vingt-cinq ans, elle environ quarante. Leur union sera douce et profondément unie ; elle lui donnera plusieurs enfants, dont Fatima.",
      "À trente-cinq ans, il arbitre un conflit célèbre : les clans se disputent l'honneur de replacer la Pierre noire lors de la reconstruction de la Kaaba. Il étend son manteau, y pose la pierre et fait soulever les coins par les chefs de chaque clan, puis la place lui-même. La guerre est évitée."
    ]
  },
  {
    id: 4, period: "mecque", title: "La première révélation", sub: "La grotte de Hira et l'ordre « Lis ! »", date: "vers 610",
    paras: [
      "Mouhammed ﷺ aime la solitude. Chaque année, il se retire dans la grotte de Hira, sur le mont de la Lumière, pour méditer loin de l'idolâtrie de son peuple. Il a quarante ans lorsque, pendant le mois de Ramadan, l'ange Jibril lui apparaît et lui dit : « Lis ! ».",
      "« Je ne sais pas lire », répond-il. L'ange le serre fortement à trois reprises, puis lui transmet les premiers versets : « Lis, au nom de ton Seigneur qui a créé, qui a créé l'homme d'une adhérence. Lis ! Ton Seigneur est le Très Généreux, qui a enseigné par la plume. »",
      "Bouleversé, tremblant, il rentre auprès de Khadija : « Enveloppez-moi ! ». Elle le rassure par ces mots restés célèbres : Dieu ne te couvrira jamais de honte, car tu entretiens les liens de parenté, tu soutiens le faible, tu accueilles l'hôte et tu aides dans les épreuves.",
      "Khadija le conduit chez son cousin Waraqa ibn Nawfal, savant chrétien, qui reconnaît la même source que celle de Musa et annonce que son peuple le rejettera. Après un temps de pause dans la révélation, elle reprend, et la mission du Prophète ﷺ commence."
    ]
  },
  {
    id: 5, period: "mecque", title: "Les premiers croyants", sub: "Un message murmuré dans le secret", date: "610 – 613",
    paras: [
      "Pendant trois ans, l'appel reste discret. Le message est simple : adorer le Dieu unique, renoncer aux idoles, être juste, se souvenir du Jour du jugement. Khadija est la première à croire en lui.",
      "Suivent Ali, son jeune cousin élevé dans sa maison, puis Zayd ibn Haritha, son affranchi et fils adoptif, et Abu Bakr as-Siddiq, ami proche et commerçant respecté, dont l'adhésion attire plusieurs notables comme Uthman, az-Zubayr, Abd ar-Rahman ibn Awf, Sa'd ibn Abi Waqqas et Talha.",
      "Les croyants se retrouvent discrètement, notamment dans la maison d'al-Arqam, près du mont Safa, où le Prophète ﷺ les instruit, leur transmet les versets et les forme à la prière. Ce petit cercle réunit des hommes et des femmes, des riches et des pauvres, des libres et des esclaves.",
      "Cette égalité des croyants devant Dieu est déjà une révolution : à La Mecque, on est jugé selon son clan et sa fortune. Ici, la seule distinction est la piété."
    ]
  },
  {
    id: 6, period: "mecque", title: "L'appel public", sub: "Du mont Safa à la colère de Quraysh", date: "vers 613",
    paras: [
      "L'ordre divin arrive : « Avertis les gens de ta tribu les plus proches. » Le Prophète ﷺ monte sur le mont Safa et appelle les clans de Quraysh. Quand ils sont rassemblés, il leur demande : « Si je vous disais qu'une cavalerie se prépare derrière cette colline, me croiriez-vous ? » Ils répondent : « Nous ne t'avons jamais connu menteur. »",
      "Il leur annonce alors qu'il est un avertisseur devant un châtiment terrible, et les invite à adorer Dieu seul. Son oncle Abu Lahab lui lance : « Périsse-tu ! Est-ce pour cela que tu nous as réunis ? »",
      "Dans les semaines qui suivent, il invite aussi les pèlerins et les marchands venus à La Mecque. Au début, Quraysh se moque, puis s'inquiète : ce message remet en cause les idoles, source de prestige et de revenus, et l'ordre social fondé sur la naissance.",
      "Les notables viennent trouver Abu Talib pour lui demander de faire taire son neveu. Celui-ci refuse de livrer Mouhammed ﷺ, mais le Prophète ﷺ déclare qu'on mettrait le soleil dans sa main droite et la lune dans sa gauche qu'il ne renoncerait pas à sa mission."
    ]
  },
  {
    id: 7, period: "mecque", title: "L'épreuve de la persécution", sub: "Bilal, Sumayya, Yasir et la patience", date: "614 – 615",
    paras: [
      "Faute de pouvoir atteindre le Prophète ﷺ, protégé par son clan, Quraysh s'en prend aux musulmans sans protecteur : esclaves, affranchis et étrangers. Ils sont battus, privés d'eau, exposés au soleil brûlant sur des pierres chauffées.",
      "Bilal, esclave abyssin d'Umayya ibn Khalaf, est étendu sur le sable ardent, une lourde pierre sur la poitrine. Il ne répète qu'un mot : « Ahad, Ahad » (Unique, Unique). Abu Bakr l'achète et l'affranchit. Bilal deviendra le premier muezzin de l'islam.",
      "Yasir et son épouse Sumayya, ainsi que leur fils Ammar, sont torturés. Sumayya, interpellée par Abu Jahl, refuse de renier sa foi et meurt : elle est considérée comme la première martyre de l'islam. Khabbab, forgeron, subit lui aussi des brûlures cruelles.",
      "Le Prophète ﷺ demande à ses compagnons d'être patients : « Patience, famille de Yasir, car votre rendez-vous est le Paradis. » Dans le même temps, il cherche une issue pour ceux qui ne peuvent plus supporter l'oppression."
    ]
  },
  {
    id: 8, period: "mecque", title: "L'émigration en Abyssinie", sub: "Le roi juste, le Négus", date: "615",
    paras: [
      "Au bout de cinq ans de mission, la situation devient intenable pour les plus faibles. Le Prophète ﷺ conseille à un groupe de croyants de gagner l'Abyssinie, royaume chrétien : « Là-bas règne un roi chez qui nul n'est opprimé. »",
      "Un premier groupe d'une dizaine d'hommes et de femmes, dont Uthman et son épouse Ruqayya, la fille du Prophète ﷺ, traverse la mer Rouge. D'autres les rejoignent, jusqu'à plus de quatre-vingts personnes, sous la conduite de Ja'far ibn Abi Talib.",
      "Quraysh envoie deux émissaires, Amr ibn al-As et Abdallah ibn Abi Rabi'a, avec des cadeaux pour la cour, afin d'obtenir l'extradition des réfugiés. Le Négus veut entendre les musulmans eux-mêmes.",
      "Ja'far prend la parole : il décrit l'ignorance d'autrefois, l'arrivée du Prophète ﷺ, l'appel à la vérité, à la fidélité et à la compassion. Puis il récite le début de la sourate Maryam. Le roi, ému jusqu'aux larmes, refuse de les livrer. Les musulmans vivront en sécurité jusqu'à leur retour."
    ]
  },
  {
    id: 9, period: "mecque", title: "Hamza et Omar", sub: "Deux conversions qui changent le rapport de force", date: "615 – 616",
    paras: [
      "Un jour, Abu Jahl insulte gravement le Prophète ﷺ près de la Kaaba. Hamza ibn Abd al-Muttalib, son oncle et frère de lait, chasseur réputé et homme redouté, l'apprend à son retour. Furieux, il frappe Abu Jahl avec son arc, puis déclare qu'il suit la religion de Mouhammed ﷺ. Sa foi devient sincère peu après.",
      "Omar ibn al-Khattab est alors l'un des adversaires les plus durs de l'islam. Un jour, l'épée à la main, il se met en route pour en finir avec le Prophète ﷺ. En chemin, on lui dit de s'occuper d'abord de sa propre sœur, Fatima, et de son mari, déjà convertis.",
      "Il les trouve en train de lire des versets de la sourate Ta-Ha. Il frappe sa sœur, puis, devant son sang et sa fermeté, honteux, il demande à lire la feuille. Après l'avoir lue, il est profondément touché et se rend chez le Prophète ﷺ pour déclarer sa foi.",
      "Avec Hamza et Omar, les musulmans peuvent désormais prier ouvertement près de la Kaaba. La communauté, longtemps contrainte de se cacher, ose enfin se montrer."
    ]
  },
  {
    id: 10, period: "mecque", title: "Le boycott des Banu Hashim", sub: "Trois années dans le ravin d'Abu Talib", date: "616 – 619",
    paras: [
      "Quraysh décide de rompre toute relation avec les Banu Hashim et les Banu al-Muttalib, clans du Prophète ﷺ : plus de mariage, plus de commerce, plus de ventes. L'engagement est consigné par écrit et accroché dans la Kaaba.",
      "Les deux clans, y compris ceux qui ne sont pas musulmans, se retirent dans le ravin d'Abu Talib. Pendant trois ans, la faim les ronge : on mange des feuilles et du cuir, et l'on entend pleurer les enfants à travers la nuit. Seules quelques bonnes volontés font passer discrètement des vivres.",
      "Certains Mecquois, honteux de cette cruauté envers des parents, se mobilisent en secret, parmi eux Hisham ibn Amr et Zuhayr ibn Abi Umayya. Selon la tradition, on découvre alors que les termes de la charte ont été rongés par des termites, à l'exception du nom de Dieu.",
      "Le boycott est levé. Les clans quittent le ravin, éprouvés mais soudés. Cette épreuve prépare toutefois une période plus sombre encore."
    ]
  },
  {
    id: 11, period: "mecque", title: "L'année de la tristesse", sub: "La perte d'Abu Talib et de Khadija, puis Taïf", date: "619",
    paras: [
      "Peu après la fin du boycott, Abu Talib tombe malade et meurt. Quelques semaines plus tard, c'est Khadija qui s'éteint, après vingt-cinq années de soutien, d'amour et de confiance. Cette année est restée dans la mémoire des musulmans comme celle de la tristesse.",
      "Sans la protection de son oncle, le Prophète ﷺ subit des attaques plus brutales : on lui jette de la terre sur la tête, on le ridiculise en public. Il se tourne alors vers Taïf, ville fraîche et prospère, à plusieurs dizaines de kilomètres, espérant y trouver un appui.",
      "Les chefs de Taïf le rejettent avec mépris et lancent contre lui les enfants et les esclaves, qui le poursuivent à coups de pierres jusqu'à un verger. Il s'y réfugie, les pieds en sang, et formule une supplication demeurée célèbre : « Si Tu n'es pas courroucé contre moi, peu m'importe. »",
      "Selon un hadith, l'ange des montagnes lui propose d'écraser la ville entre deux monts. Le Prophète ﷺ refuse : il espère que de leurs descendants naîtront des croyants. Telle est sa miséricorde."
    ]
  },
  {
    id: 12, period: "mecque", title: "Le voyage nocturne et l'Ascension", sub: "Al-Isra' wal-Mi'raj", date: "vers 621",
    paras: [
      "Après les épreuves de Taïf, Dieu console Son Prophète ﷺ par un voyage extraordinaire. Une nuit, il est transporté de la Mosquée sacrée de La Mecque à la Mosquée al-Aqsa à Jérusalem : c'est l'Isra'.",
      "À Jérusalem, il dirige en prière les prophètes venus avant lui. Puis il s'élève à travers les cieux : c'est le Mi'raj. Il y rencontre notamment Adam, Yahya, Isa, Yusuf, Idris, Harun, Musa et Ibrahim, qui l'accueillent comme un frère.",
      "Au terme de l'ascension, près du Lotus de la limite, la prière lui est prescrite, d'abord à raison de cinquante prières par jour. Sur le conseil de Musa, il demande plusieurs fois un allègement, jusqu'à cinq prières, qui ont la valeur de cinquante.",
      "Le lendemain, Quraysh se moque. Certains croyants vacillent, mais Abu Bakr déclare : « S'il l'a dit, c'est vrai. » Il reçoit le surnom de « as-Siddiq », le véridique. La prière devient dès lors le lien quotidien des croyants avec leur Seigneur."
    ]
  },
  {
    id: 13, period: "mecque", title: "Les pactes d'Aqaba", sub: "Médine ouvre ses portes", date: "620 – 622",
    paras: [
      "Chaque saison de pèlerinage, le Prophète ﷺ se présente aux tribus venues à La Mecque. En l'an 620, il rencontre à Aqaba, près de Mina, six hommes de la tribu des Khazraj, de Yathrib (Médine). Ils connaissent l'attente d'un prophète, par leurs voisins juifs, et acceptent l'islam.",
      "L'année suivante, ils sont douze et prêtent un premier serment : ne rien associer à Dieu, ne pas voler, ne pas commettre l'adultère, ne pas tuer leurs enfants, ne pas calomnier, et obéir au bien. Le Prophète ﷺ leur envoie Mus'ab ibn Umayr, qui enseigne le Coran et attire de nombreux habitants.",
      "En l'an 622, plus de soixante-dix hommes et deux femmes de Médine viennent à leur tour. Ils jurent de protéger le Prophète ﷺ comme ils protègent leurs propres familles, malgré les risques d'une guerre contre toute l'Arabie. Douze chefs sont désignés comme garants de la communauté.",
      "Quraysh apprend cette alliance. Le Prophète ﷺ demande alors à ses compagnons de partir vers Médine, par petits groupes. Le temps de l'émigration est venu."
    ]
  },
  {
    id: 14, period: "medine", title: "L'Hégire", sub: "La nuit du départ, la grotte de Thawr", date: "622",
    paras: [
      "Les chefs de Quraysh, craignant de voir le Prophète ﷺ rejoindre ses alliés, décident de l'éliminer : un jeune homme de chaque clan frappera ensemble, afin que sa famille ne puisse venger qu'un meurtre collectif. L'ange Jibril avertit le Prophète ﷺ.",
      "Dans la nuit, il quitte sa maison en laissant Ali dans son lit, enveloppé dans son manteau, avec pour mission de rendre les dépôts confiés. Il rejoint Abu Bakr et ils se cachent trois jours dans la grotte de Thawr, au sud de La Mecque, pendant que Quraysh les recherche partout.",
      "Quand les poursuivants arrivent à l'entrée, Abu Bakr s'inquiète : « S'ils regardaient à leurs pieds, ils nous verraient. » Le Prophète ﷺ répond : « Ne t'afflige pas, Dieu est avec nous. » Un guide, Abdallah ibn Uraiqit, les conduit ensuite par une route inhabituelle ; Suraqa ibn Malik les rejoint, mais son cheval s'enfonce dans le sol et il renonce.",
      "À Quba, ils sont accueillis avec joie, et la première mosquée de l'islam y est fondée. L'arrivée à Médine, accueillie par des chants, marque le début du calendrier musulman : l'année de l'Hégire."
    ]
  },
  {
    id: 15, period: "medine", title: "La fondation de Médine", sub: "La mosquée, la fraternité et la Charte", date: "622 – 623",
    paras: [
      "À Médine, la chamelle du Prophète ﷺ s'arrête à un terrain où il fait bâtir sa mosquée, simple bâtiment de briques crues et de troncs de palmier. À côté, ses logements. La mosquée est à la fois lieu de prière, école, tribunal et centre d'accueil pour les plus pauvres.",
      "Les Mecquois émigrés, les Muhajirun, arrivent sans biens. Le Prophète ﷺ instaure la fraternité entre eux et les Ansar, les habitants de Médine. Beaucoup partagent leurs maisons, leurs jardins et leurs richesses ; Sa'd ibn ar-Rabi' propose même la moitié de sa fortune à Abd ar-Rahman ibn Awf, qui préfère qu'on lui indique le marché.",
      "Le Prophète ﷺ conclut aussi un accord entre toutes les composantes de la ville, que l'on appelle la « Charte de Médine » : musulmans, juifs et tribus alliées forment une communauté politique, garantissent leur sécurité, s'engagent à défendre la cité si elle est attaquée et respectent la liberté de culte.",
      "C'est une première : une société organisée autour de la justice, de l'entraide et de l'arbitrage, au lieu des anciennes querelles tribales. Bilal appelle à la prière du haut des toits, et l'appel à la prière devient la voix de la cité."
    ]
  },
  {
    id: 16, period: "medine", title: "La bataille de Badr", sub: "La première grande victoire", date: "Ramadan, an 2 (624)",
    paras: [
      "Les émigrés ont laissé leurs biens à La Mecque, où Quraysh les a confisqués. Apprenant qu'une riche caravane de Quraysh, conduite par Abu Sufyan, revient de Syrie, le Prophète ﷺ sort avec environ trois cent treize hommes pour l'intercepter. Abu Sufyan dévie sa route et demande des renforts : près de mille hommes quittent La Mecque.",
      "Les deux armées se font face à Badr. Le Prophète ﷺ consulte ses compagnons, et les Ansar affirment qu'ils iront jusqu'au bout avec lui. Sur le conseil d'al-Hubab ibn al-Mundhir, l'armée prend position près des puits. Pendant la nuit, le Prophète ﷺ prie longuement : « Mon Dieu, si ce petit groupe périt, Tu ne seras plus adoré. »",
      "Le combat s'engage, d'abord par des duels : Hamza, Ali et Ubayda affrontent trois champions mecquois. Puis la mêlée générale tourne en faveur des musulmans. Abu Jahl est tué. Environ soixante-dix hommes de Quraysh périssent et autant sont faits prisonniers.",
      "Les captifs sont bien traités : ceux qui savent lire peuvent être libérés en apprenant à dix enfants de Médine à lire et à écrire. Badr, que le Coran nomme « le jour du discernement », rétablit le crédit de la jeune communauté."
    ]
  },
  {
    id: 17, period: "medine", title: "La bataille d'Uhud", sub: "Une leçon d'obéissance et de persévérance", date: "Chawwal, an 3 (625)",
    paras: [
      "Pour venger Badr, Quraysh lève environ trois mille hommes et marche sur Médine. Le Prophète ﷺ, pensant d'abord rester dans la ville, suit finalement l'avis de ceux qui veulent sortir : environ sept cents hommes prennent position au pied du mont Uhud, après le retrait d'un groupe d'hypocrites mené par Abdallah ibn Ubayy.",
      "Il poste cinquante archers sur une colline, avec l'ordre ferme de ne pas quitter leur place, quoi qu'il arrive. Le combat est d'abord favorable aux musulmans, et l'ennemi reflue. Mais voyant la victoire, la plupart des archers abandonnent leur poste pour partager le butin.",
      "Khalid ibn al-Walid, alors dans le camp ennemi, contourne la colline et prend les musulmans à revers. Dans la confusion, Hamza, « le lion de Dieu », est tué par Wahshi. Le Prophète ﷺ est blessé au visage, une dent brisée, et la rumeur de sa mort se répand ; des compagnons comme Talha et Abu Dujana font un rempart de leurs corps.",
      "Quraysh finit par se retirer sans achever son avantage. Le Prophète ﷺ enterre ses morts, soixante-dix compagnons, et la communauté reçoit une leçon : la victoire dépend de la discipline, de l'obéissance et de la sincérité, non du nombre."
    ]
  },
  {
    id: 18, period: "medine", title: "Le siège de la Tranchée", sub: "Médine encerclée par les coalisés", date: "Chawwal, an 5 (627)",
    paras: [
      "Deux ans après Uhud, une vaste coalition (Quraysh, les Ghatafan et d'autres tribus) réunit environ dix mille hommes et marche sur Médine. La ville ne peut aligner qu'environ trois mille combattants.",
      "Sur la proposition de Salman al-Farisi, d'origine persane, on creuse une profonde tranchée sur le côté nord, le seul accessible aux cavaliers. Le Prophète ﷺ participe au travail, creusant avec ses compagnons malgré le froid et la faim, et l'on raconte qu'il noue une pierre sur son ventre pour apaiser la faim.",
      "Les assiégeants, surpris par cet obstacle inconnu des Arabes, restent bloqués des semaines. Le siège devient plus dangereux quand les Banu Qurayza, tribu juive de Médine, sont soupçonnés de trahir leur accord. L'inquiétude grandit, et le Coran évoque des « cœurs qui montent à la gorge ».",
      "Une tempête glaciale, le découragement, la discorde semée entre les coalisés finissent par les faire lever le camp. Le Prophète ﷺ dit alors : « Désormais, ce sont nous qui marcherons contre eux, et ils ne marcheront plus contre nous. »"
    ]
  },
  {
    id: 19, period: "medine", title: "Le traité de Hudaybiyya", sub: "Une trêve qui ressemble à une défaite, et prépare la victoire", date: "Dhou al-Qa'da, an 6 (628)",
    paras: [
      "Le Prophète ﷺ rêve d'accomplir la 'umra à La Mecque. Il part avec environ mille quatre cents compagnons, sans armes de guerre. Quraysh, craignant un coup de force, leur barre la route à Hudaybiyya, aux portes du territoire sacré.",
      "Quand une rumeur annonce la mort d'Uthman, envoyé en négociateur, les compagnons prêtent serment sous un arbre : c'est le « serment de la satisfaction » (Bay'at ar-Ridwan). Puis des émissaires négocient, dont Suhayl ibn Amr.",
      "Les termes semblent défavorables : les musulmans rentreront cette année sans accomplir le pèlerinage, ils reviendront l'an suivant, et ceux qui fuient La Mecque pour Médine seront renvoyés, alors que l'inverse n'est pas vrai. La trêve est de dix ans. Même le titre « Messager de Dieu » est retiré du texte à la demande de Suhayl.",
      "Plusieurs compagnons, dont Omar, sont troublés, mais le Prophète ﷺ accepte, par sagesse. Le Coran appelle cet épisode une « victoire éclatante ». La paix permet à l'islam de se répandre : en deux ans, il gagne davantage d'adeptes qu'en dix-neuf ans de lutte."
    ]
  },
  {
    id: 20, period: "medine", title: "Khaybar et les lettres aux souverains", sub: "Un message qui dépasse l'Arabie", date: "an 7 (628 – 629)",
    paras: [
      "Au début de l'an 7, le Prophète ﷺ marche sur Khaybar, oasis fortifiée au nord de Médine, où des tribus hostiles préparaient de nouvelles coalitions. Après un siège de plusieurs semaines, les forteresses tombent l'une après l'autre. Les habitants gardent leurs terres, contre la moitié des récoltes.",
      "Les musulmans émigrés en Abyssinie, conduits par Ja'far, reviennent à cette époque, et le Prophète ﷺ les accueille avec joie : « Je ne sais pas ce qui me réjouit le plus, la victoire de Khaybar ou le retour de Ja'far. »",
      "Profitant de la trêve, le Prophète ﷺ fait envoyer des lettres aux grands de son temps : l'empereur byzantin Héraclius, l'empereur de Perse Khosro, le Négus, le gouverneur d'Égypte (le Muqawqis) et d'autres chefs, les invitant à l'islam. Les réponses varient : courtoisie de certains, colère et déchirement de la lettre chez Khosro.",
      "Pour la première fois, la voix de Médine est entendue au-delà de l'Arabie. Peu après, en 629, le Prophète ﷺ accomplit enfin la 'umra de compensation, en entrant à La Mecque en paix, comme prévu."
    ]
  },
  {
    id: 21, period: "medine", title: "La conquête de La Mecque", sub: "« Allez, vous êtes libres »", date: "Ramadan, an 8 (630)",
    paras: [
      "Quraysh viole la trêve en soutenant une tribu alliée contre les Khuza'a, protégés du Prophète ﷺ. Abu Sufyan vient à Médine tenter de réparer, sans succès. Le Prophète ﷺ prépare en secret une expédition.",
      "Il marche avec environ dix mille hommes. Près de La Mecque, il ordonne d'allumer de nombreux feux, pour impressionner sans combattre. Abu Sufyan, interrogé à son tour, est conquis par l'étendue de cette armée et se convertit ; le Prophète ﷺ déclare que celui qui entrera dans sa maison sera en sécurité.",
      "La ville est prise presque sans combat. Le Prophète ﷺ entre humblement sur sa monture, la tête baissée en signe de reconnaissance. Devant la Kaaba, il fait détruire les idoles en récitant : « La vérité est venue et l'erreur a disparu. »",
      "Face à ceux qui l'ont persécuté pendant vingt ans, il demande : « Que pensez-vous que je vais faire de vous ? » Ils répondent : « Du bien, noble frère, fils de noble frère. » Il dit alors : « Allez, vous êtes libres. » Cette amnistie générale conquiert les cœurs plus sûrement que les armes. Bilal appelle à la prière depuis le toit de la Kaaba."
    ]
  },
  {
    id: 22, period: "medine", title: "Hunayn et le siège de Taïf", sub: "L'épreuve de la prospérité", date: "Chawwal, an 8 (630)",
    paras: [
      "Les tribus de Hawazin et de Thaqif, voisines de La Mecque, réunissent des forces importantes pour attaquer les musulmans. Le Prophète ﷺ sort à leur rencontre avec environ douze mille hommes, la plus grande armée qu'il ait menée.",
      "Dans la vallée de Hunayn, les archers ennemis, postés dans les gorges, attaquent par surprise à l'aube. Les premiers rangs prennent la fuite. Le Prophète ﷺ reste ferme, appelle ses compagnons, et son oncle al-Abbas les rassemble à pleine voix. Le combat reprend, et la victoire est acquise.",
      "Le Coran rappelle cette leçon : « Votre nombre vous avait séduits, mais il ne vous a servi à rien. » Les musulmans assiègent ensuite Taïf quelques semaines, sans succès. Le Prophète ﷺ choisit de lever le siège et prie : « Mon Dieu, guide Thaqif et fais-les venir à nous. » Peu après, la ville se rallie.",
      "À propos du butin, le Prophète ﷺ se montre très généreux envers de nouveaux convertis, ce qui fait murmurer certains Ansar. Il les réunit et leur dit qu'ils reviendront avec le Messager de Dieu, tandis que d'autres repartent avec des chameaux. Ils pleurent, et sont apaisés."
    ]
  },
  {
    id: 23, period: "medine", title: "L'année des délégations", sub: "De Tabuk à l'unité de l'Arabie", date: "an 9 (630 – 631)",
    paras: [
      "Après la prise de La Mecque et Hunayn, l'Arabie se rallie. Les tribus envoient des délégations à Médine, d'où le nom d'« année des délégations ». Le Prophète ﷺ les reçoit avec égards, envoie des enseignants et des gouverneurs, et règle les affaires par la persuasion.",
      "Cette année-là, des rumeurs annoncent que Byzance masse des troupes au nord. En plein été, sous une chaleur écrasante et durant une année de disette, le Prophète ﷺ lance la mobilisation générale. C'est l'« armée de la difficulté » : environ trente mille hommes marchent vers Tabuk.",
      "Plusieurs compagnons font de grandes donations. Uthman équipe à lui seul une partie de l'armée. Quelques hommes restent à Médine sans excuse, et trois d'entre eux, Ka'b ibn Malik et ses compagnons, sont mis à l'écart pendant cinquante jours, avant que Dieu n'accepte leur repentir.",
      "À Tabuk, l'armée byzantine n'apparaît pas. Le Prophète ﷺ conclut des accords avec des chefs locaux et rentre. L'unité de l'Arabie est désormais acquise, et les dernières idoles sont renversées dans la péninsule."
    ]
  },
  {
    id: 24, period: "medine", title: "Le pèlerinage d'adieu", sub: "Le sermon du mont Arafat", date: "Dhou al-Hijja, an 10 (632)",
    paras: [
      "Au cours de l'an 10, le Prophète ﷺ annonce qu'il accomplira le pèlerinage. Plus de cent mille personnes, selon les récits, se joignent à lui. Il leur enseigne les rites, tels qu'ils sont encore pratiqués aujourd'hui.",
      "Le jour d'Arafat, depuis la plaine, monté sur sa chamelle, il prononce un grand sermon. Il rappelle que le sang et les biens de chacun sont sacrés, comme ce jour, ce mois et cette ville ; il abolit les vengeances et l'usure de l'époque préislamique.",
      "Il recommande de bien traiter les femmes, rappelle qu'aucun Arabe n'est supérieur à un non-Arabe, ni un blanc à un noir, sinon par la piété, et laisse deux guides : « le Livre de Dieu et ma Sunna ». Il demande : « Ai-je transmis ? » La foule répond : « Oui ! » Il dit : « Ô Dieu, sois-en témoin. »",
      "Un verset est alors révélé : « Aujourd'hui, J'ai parachevé pour vous votre religion, accompli sur vous Mon bienfait et agréé l'islam comme religion pour vous. »"
    ]
  },
  {
    id: 25, period: "medine", title: "La mort du Prophète ﷺ", sub: "« Dieu est vivant et ne meurt pas »", date: "Rabi' al-awwal, an 11 (632)",
    paras: [
      "Peu après son retour à Médine, le Prophète ﷺ tombe malade. Il fait ses adieux aux martyrs d'Uhud, demande pardon à ses compagnons de ce qu'il aurait pu leur faire, et choisit de passer ses derniers jours dans la maison d'Aïcha, avec l'accord de ses épouses.",
      "Trop faible pour diriger la prière, il demande qu'Abu Bakr la dirige. Un matin, en voyant les fidèles en rangs, il sourit de bonheur. Il meurt un lundi du mois de Rabi' al-awwal de l'an 11, la tête sur Aïcha, à l'âge de soixante-trois ans. Ses derniers mots rapportés : « Plutôt la Compagnie suprême. »",
      "Médine est plongée dans la stupeur. Omar refuse d'y croire. Abu Bakr arrive, embrasse le visage du Prophète ﷺ, puis s'adresse à la foule : « Que ceux qui adoraient Mouhammed ﷺ sachent que Mouhammed ﷺ est mort. Et que ceux qui adorent Dieu sachent que Dieu est vivant et ne meurt pas. » Il récite le verset : « Mouhammed ﷺ n'est qu'un messager... »",
      "Le Prophète ﷺ est enterré dans la chambre où il est mort, à l'emplacement de l'actuelle Mosquée du Prophète ﷺ. Vingt-trois ans de mission ont transformé une société tribale en une communauté fondée sur la foi, la justice et la miséricorde. Son message lui survit, et la Sirah reste, pour des millions de croyants, un exemple de patience, de droiture et de compassion."
    ]
  }
];
