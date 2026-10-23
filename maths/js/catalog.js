/* Catalogue des compétences, de la GS à la 6e.
 * Un niveau → des domaines → des catégories → des compétences.
 * Une compétence = [titre, générateur, paramètres] ; sans générateur,
 * elle est affichée « bientôt ». Les codes (A.1, B.2…) sont attribués
 * automatiquement dans l'ordre, catégorie par catégorie, comme dans un manuel.
 * Contenu original : titres et exercices rédigés pour ce site.
 */
(function (root) {
  const ar = (op, a, b, x = {}) => ['arith', { op, a, b, ...x }];
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
  const ADD = (title, hi, x = {}) => [title, ...ar('+', [0, hi], [0, hi], { max: hi, ...x })];
  const SUB = (title, hi, x = {}) => [title, ...ar('-', [0, hi], [0, hi], x)];
  const TABLE = (k) => [`Table de ${k}`, ...ar('*', [], [0, 10], { tab: [k] })];
  const DTABLE = (k) => [`Divisions par ${k}`, ...ar('/', [], [], { tab: [k], q: [1, 10] })];

  const LEVELS = [
    /* ------------------------------------------------------------ GS */
    {
      id: 'gs', art: 'ma', short: 'GS', name: 'Grande section', color: '#14b8c4', age: '5-6 ans',
      blurb: 'Compter, comparer, premières additions et soustractions, reconnaître les formes.',
      domains: [
        { name: 'Nombres et calculs', cats: [
          { name: 'Compter jusqu’à 5', skills: [['Découvrir les nombres jusqu’à 3', 'count', { max: 3 }], ['Compter jusqu’à 5', 'count', { min: 2, max: 5 }], ['Ranger 5 jetons dans des boîtes de 10']] },
          { name: 'Compter jusqu’à 10', skills: [['Compter jusqu’à 10', 'count', { min: 4, max: 10 }], ['Le nombre qui vient avant ou après (jusqu’à 10)', 'seq', { nb: 1, min: 2, max: 9 }], ['Compter jusqu’à 10 sur une droite graduée', 'line', { steps: [1], starts: [0] }]] },
          { name: 'Compter jusqu’à 20', skills: [['Compter jusqu’à 20', 'count', { min: 11, max: 20 }], ['Le nombre qui vient avant ou après (jusqu’à 20)', 'seq', { nb: 1, min: 2, max: 19 }], ['Compléter une suite jusqu’à 20', 'seq', { steps: [1], min: 1, max: 14 }], ['Compter à rebours depuis 20', 'seq', { steps: [1], min: 1, max: 14, dir: 'down' }], ['Décomposer les nombres jusqu’à 10', ...ar('+', [0, 10], [0, 10], { target: 10 })]] },
          { name: 'Compter de 2 en 2 et de 10 en 10', skills: [['Compter de 2 en 2', 'seq', { steps: [2], min: 0, max: 8 }], ['Compter de 10 en 10', 'seq', { steps: [10], min: 0, max: 40 }]] },
          { name: 'Comparer des quantités', skills: [['Plus ou moins d’objets (jusqu’à 5)', 'compareGroups', { max: 5 }], ['Plus ou moins d’objets (jusqu’à 10)', 'compareGroups', { max: 10 }], ['Comparer deux nombres jusqu’à 10', 'compare', { max: 10 }], ['Comparer deux nombres jusqu’à 20', 'compare', { max: 20 }], ['Le plus grand et le plus petit nombre (jusqu’à 10)', 'order', { max: 10 }]] },
          { name: 'Additions jusqu’à 5', skills: [ADD('Additionner jusqu’à 5', 5), ['Additions à trou jusqu’à 5', ...ar('+', [0, 5], [0, 5], { target: 5 })]] },
          { name: 'Additions jusqu’à 10', skills: [ADD('Additionner jusqu’à 10', 10), ['Additions à trou jusqu’à 10', ...ar('+', [0, 10], [0, 10], { target: 10 })]] },
          { name: 'Soustractions jusqu’à 5', skills: [SUB('Soustraire jusqu’à 5', 5), ['Soustractions à trou jusqu’à 5', ...ar('-', [0, 5], [0, 5], { miss: true })]] },
          { name: 'Soustractions jusqu’à 10', skills: [SUB('Soustraire jusqu’à 10', 10), ['Soustractions à trou jusqu’à 10', ...ar('-', [0, 10], [0, 10], { miss: true })]] },
        ] },
        { name: 'Grandeurs et mesures', cats: [
          { name: 'Longueurs', skills: [['Mesurer avec une règle', 'ruler', { max: 8 }], ['Comparer des longueurs']] },
          { name: 'Argent', skills: [['Compter des pièces d’euros', 'money', { max: 10, pieces: 3 }]] },
          { name: 'Durées', skills: [['Les jours de la semaine']] },
        ] },
        { name: 'Espace et géométrie', cats: [
          { name: 'Formes', skills: [['Reconnaître les formes simples', 'shapes', { set: ['circle', 'square', 'tri', 'rect'] }], ['Continuer une suite de motifs', 'patternNext', {}]] },
          { name: 'Se repérer', skills: [['Dessus, dessous, devant, derrière']] },
        ] },
      ],
    },
    /* ------------------------------------------------------------ CP */
    {
      id: 'cp', art: 'mon', short: 'CP', name: 'Cours préparatoire', color: '#d6409f', age: '6-7 ans',
      blurb: 'Les nombres jusqu’à 100, additions et soustractions, premières mesures et figures.',
      domains: [
        { name: 'Nombres et calculs', cats: [
          { name: 'Nombres et compter', skills: [['Compter jusqu’à 20', 'count', { min: 11, max: 20 }], ['Le nombre qui vient avant ou après (jusqu’à 100)', 'seq', { nb: 1, min: 2, max: 99 }], ['Lire une droite graduée', 'line', { steps: [1, 2, 5, 10], starts: [0, 10, 20] }], ['Compter dans l’ordre croissant jusqu’à 100', 'seq', { steps: [1], min: 1, max: 90 }], ['Compter dans l’ordre décroissant depuis 100', 'seq', { steps: [1], min: 1, max: 90, dir: 'down' }], ['Arrondir à la dizaine la plus proche', 'round', { to: [10], min: 11, max: 99 }], ['Nombres pairs et impairs', 'numprop', { kinds: ['parity'], max: 100 }]] },
          { name: 'Décomposer des nombres', skills: [['Dizaines et unités (jusqu’à 99)', 'decomp', { modes: ['tu'], maxT: 9 }], ['Combien de dizaines dans un nombre ?', 'decomp', { modes: ['tuRev'], max: 99 }], ['Décomposer un nombre (40 + 7)', 'decomp', { modes: ['expand'], max: 99 }]] },
          { name: 'Comparer et ranger', skills: [['Comparer des nombres jusqu’à 10', 'compare', { max: 10 }], ['Comparer des nombres jusqu’à 100', 'compare', { max: 100 }], ['Ranger des nombres jusqu’à 100', 'order', { max: 100 }]] },
          { name: 'Compter de 2 en 2, de 5 en 5 et de 10 en 10', skills: [['Compter de 2 en 2', 'seq', { steps: [2], min: 0, max: 40 }], ['Compter de 5 en 5', 'seq', { steps: [5], min: 0, max: 50 }], ['Compter de 10 en 10', 'seq', { steps: [10], min: 0, max: 60 }]] },
          { name: 'Suites de nombres', skills: [['Compléter une suite croissante', 'seq', { steps: [1, 2, 3, 5, 10], min: 0, max: 40 }], ['Compléter une suite décroissante', 'seq', { steps: [1, 2, 3, 5, 10], min: 0, max: 40, dir: 'down' }]] },
          { name: 'Addition', skills: [ADD('Additionner jusqu’à 10', 10), ['Les compléments à 10', ...ar('+', [0, 10], [0, 10], { target: 10 })], ADD('Additionner jusqu’à 20', 20), ['Additions à trou jusqu’à 20', ...ar('+', [0, 20], [0, 20], { target: 20 })]] },
          { name: 'Les tables d’addition', skills: rep(9, (k) => [`Ajouter ${k}`, ...ar('+', [0, 10], [k, k])]) },
          { name: 'Astuces pour additionner', skills: [['Le double d’un nombre', ...ar('*', [], [1, 10], { tab: [2] })], ['Additionner des dizaines entières', ...ar('+', [1, 5], [1, 4], { scale: 10, max: 9 })], ['Estimer le résultat d’une addition']] },
          { name: 'Additions posées', skills: [['Additions posées sans retenue', ...ar('+', [10, 79], [10, 79], { max: 99, carry: false })], ['Additions posées avec retenue', ...ar('+', [10, 79], [10, 79], { max: 99, carry: true })]] },
          { name: 'Soustraction', skills: [SUB('Soustraire jusqu’à 10', 10), ['Soustractions à trou jusqu’à 10', ...ar('-', [0, 10], [0, 10], { miss: true })], SUB('Soustraire jusqu’à 20', 20), ['Soustractions à trou jusqu’à 20', ...ar('-', [0, 20], [0, 20], { miss: true })]] },
          { name: 'Les tables de soustraction', skills: rep(9, (k) => [`Soustraire ${k}`, ...ar('-', [k, 18], [k, k])]) },
          { name: 'Astuces pour soustraire', skills: [['La moitié d’un nombre pair', ...ar('/', [], [], { tab: [2], q: [1, 10] })], ['Soustraire des dizaines entières', ...ar('-', [1, 9], [1, 9], { scale: 10 })], ['Estimer le résultat d’une soustraction']] },
          { name: 'Soustractions posées', skills: [['Soustractions posées sans retenue', ...ar('-', [10, 99], [10, 99], { carry: false })], ['Soustractions posées avec retenue', ...ar('-', [10, 99], [10, 99], { carry: true })]] },
          { name: 'Additions et soustractions', skills: [['Problèmes : ajouter ou retirer', 'wordprob', { kinds: ['add', 'sub'], r: [2, 15] }], ['Calculs mélangés jusqu’à 20', 'arith', { ops: ['+', '-'], a: [0, 20], b: [0, 20], max: 20 }], ['Additionner ou soustraire 10', ...ar('+', [0, 90], [10, 10], { max: 100 })]] },
          { name: 'Approche de la multiplication', skills: [['L’addition réitérée'], ['Comprendre la multiplication'], ['Table de 2', ...ar('*', [], [0, 10], { tab: [2] })], ['Table de 10', ...ar('*', [], [0, 10], { tab: [10] })]] },
        ] },
        { name: 'Grandeurs et mesures', cats: [
          { name: 'Longueurs', skills: [['Mesurer avec une règle', 'ruler', { max: 12 }], ['Comparer des longueurs']] },
          { name: 'Heures et durées', skills: [['Lire l’heure juste', 'clock', { mins: [0] }], ['Relier des unités de temps']] },
          { name: 'Argent', skills: [['Compter des pièces et des billets', 'money', { max: 20, pieces: 4 }]] },
          { name: 'Température', skills: [['Lire un thermomètre', 'thermo', {}]] },
        ] },
        { name: 'Espace et géométrie', cats: [
          { name: 'Se repérer', skills: [['Se repérer sur un quadrillage', 'gridPos', {}], ['Situer un objet dans l’espace']] },
          { name: 'Suites de dessins', skills: [['Compléter une suite de dessins', 'patternNext', {}], ['Créer une suite de dessins']] },
          { name: 'Figures planes', skills: [['Compter les côtés d’une figure', 'sides', { set: ['tri', 'square', 'rect', 'penta'] }], ['Reconnaître les figures planes', 'shapes', { set: ['circle', 'square', 'tri', 'rect'] }]] },
          { name: 'Solides', skills: [['Reconnaître les solides', 'solids', { set: ['cube', 'pave', 'cylinder', 'sphere'] }], ['Objets du quotidien et solides']] },
          { name: 'Symétrie', skills: [['Reconnaître un axe de symétrie']] },
        ] },
      ],
    },
    /* ------------------------------------------------------------ CE1 */
    {
      id: 'ce1', art: 'mon', short: 'CE1', name: 'Cours élémentaire 1', color: '#8cc21f', age: '7-8 ans',
      blurb: 'Les nombres jusqu’à 1 000, additions posées, tables de multiplication, heures et mesures.',
      domains: [
        { name: 'Nombres et calculs', cats: [
          { name: 'Nombres jusqu’à 1 000', skills: [['Centaines, dizaines et unités', 'decomp', { modes: ['hdu'] }], ['Le chiffre d’une position', 'place', { d: [3, 3] }], ['Compter de 10 en 10, de 100 en 100', 'seq', { steps: [10, 100], min: 0, max: 600 }], ['Droites graduées jusqu’à 1 000', 'line', { steps: [10, 50, 100], starts: [0, 100, 500] }], ['Arrondir à la dizaine ou à la centaine', 'round', { to: [10, 100], min: 11, max: 999 }]] },
          { name: 'Comparer et ranger', skills: [['Comparer des nombres jusqu’à 1 000', 'compare', { max: 1000 }], ['Le plus grand ou le plus petit nombre', 'order', { max: 1000 }], ['Nombres pairs et impairs', 'numprop', { kinds: ['parity'], max: 1000 }]] },
          { name: 'Additions', skills: [['Additions jusqu’à 20', ...ar('+', [0, 20], [0, 20], { max: 20 })], ['Additionner des dizaines entières', ...ar('+', [1, 9], [1, 9], { scale: 10, max: 9 })], ['Additions posées sans retenue', ...ar('+', [10, 79], [10, 79], { max: 99, carry: false })], ['Additions posées avec retenue', ...ar('+', [10, 79], [10, 79], { max: 99, carry: true })], ['Additions de nombres à trois chiffres', ...ar('+', [100, 599], [100, 399], { max: 999 })]] },
          { name: 'Soustractions', skills: [['Soustractions jusqu’à 20', ...ar('-', [0, 20], [0, 20])], ['Soustractions posées sans retenue', ...ar('-', [10, 99], [10, 99], { carry: false })], ['Soustractions posées avec retenue', ...ar('-', [10, 99], [10, 99], { carry: true })], ['Soustractions à trou', ...ar('-', [10, 99], [10, 99], { miss: true })]] },
          { name: 'Doubles et moitiés', skills: [['Le double d’un nombre', ...ar('*', [], [1, 20], { tab: [2] })], ['La moitié d’un nombre', ...ar('/', [], [], { tab: [2], q: [1, 25] })]] },
          { name: 'Multiplication', skills: [TABLE(2), TABLE(3), TABLE(4), TABLE(5), TABLE(10), ['Multiplications à trou', ...ar('*', [], [1, 10], { tab: [2, 3, 4, 5, 10], miss: true })]] },
          { name: 'Problèmes', skills: [['Problèmes d’addition', 'wordprob', { kinds: ['add'], r: [10, 60] }], ['Problèmes de soustraction', 'wordprob', { kinds: ['sub'], r: [10, 60] }], ['Problèmes de multiplication', 'wordprob', { kinds: ['mul'] }], ['Problèmes de partage', 'wordprob', { kinds: ['div'] }]] },
        ] },
        { name: 'Grandeurs et mesures', cats: [
          { name: 'Longueurs', skills: [['Mesurer avec une règle', 'ruler', { max: 15 }], ['Convertir des mètres et des centimètres', 'unit', { sets: ['len'] }]] },
          { name: 'Heures et durées', skills: [['Lire l’heure (heures et demi-heures)', 'clock', { mins: [0, 30] }], ['Lire l’heure au quart d’heure', 'clock', { mins: [0, 15, 30, 45] }], ['Relier des unités de temps', 'unit', { sets: ['time'] }]] },
          { name: 'Argent', skills: [['Calculer une somme d’argent', 'money', { max: 50, pieces: 5 }], ['Rendre la monnaie', 'wordprob', { kinds: ['buy'] }]] },
          { name: 'Périmètres', skills: [['Périmètre d’un rectangle', 'measure', { kinds: ['rectP'], r: [2, 9] }], ['Périmètre d’un carré', 'measure', { kinds: ['sqP'], r: [2, 9] }]] },
        ] },
        { name: 'Espace et géométrie', cats: [
          { name: 'Se repérer', skills: [['Se repérer sur un quadrillage', 'gridPos', {}]] },
          { name: 'Figures planes', skills: [['Compter les côtés d’une figure', 'sides', { set: ['tri', 'square', 'rect', 'penta', 'hexa'] }], ['Reconnaître les figures planes', 'shapes', { set: ['circle', 'square', 'rect', 'tri', 'penta', 'hexa'] }], ['Reconnaître un angle droit', 'angleType', {}]] },
          { name: 'Solides', skills: [['Reconnaître les solides', 'solids', { set: ['cube', 'pave', 'cylinder', 'sphere', 'cone', 'pyramid'] }], ['Faces, arêtes et sommets', 'solidFaces', {}]] },
          { name: 'Symétrie', skills: [['Compter les axes de symétrie', 'symmetry', {}]] },
        ] },
      ],
    },
    /* ------------------------------------------------------------ CE2 */
    {
      id: 'ce2', art: 'mon', short: 'CE2', name: 'Cours élémentaire 2', color: '#f0452a', age: '8-9 ans',
      blurb: 'Nombres jusqu’à 10 000, multiplications et divisions, premières fractions, aires et périmètres.',
      domains: [
        { name: 'Nombres et calculs', cats: [
          { name: 'Nombres jusqu’à 10 000', skills: [['Lire la valeur d’un chiffre', 'place', { d: [4, 4] }], ['Compter de 100 en 100, de 1 000 en 1 000', 'seq', { steps: [100, 1000], min: 0, max: 5000 }], ['Arrondir à la dizaine, à la centaine, au millier', 'round', { to: [10, 100, 1000], min: 11, max: 9999 }], ['Comparer des grands nombres', 'compare', { max: 10000 }], ['Ranger des grands nombres', 'order', { max: 10000 }]] },
          { name: 'Additions et soustractions', skills: [['Additions posées de nombres à trois chiffres', ...ar('+', [100, 599], [100, 399], { max: 999, big: true })], ['Additions avec retenue', ...ar('+', [100, 899], [100, 899], { max: 9999, big: true, carry: true })], ['Soustractions posées de nombres à trois chiffres', ...ar('-', [100, 999], [100, 999], { big: true })], ['Soustractions avec retenue', ...ar('-', [100, 999], [100, 999], { carry: true })], ['Calculer avec des dizaines et des centaines entières', ...ar('+', [1, 9], [1, 9], { scale: 100, max: 9, big: true })]] },
          { name: 'Tables de multiplication', skills: [...rep(8, (i) => TABLE(i + 2)), ['Multiplications à trou', ...ar('*', [], [1, 10], { tab: [2, 3, 4, 5, 6, 7, 8, 9], miss: true })]] },
          { name: 'Multiplication posée', skills: [['Multiplier un nombre à deux chiffres par un chiffre', ...ar('*', [12, 49], [2, 9], { big: true })], ['Multiplier par 10, 100', ...ar('*', [2, 99], [10, 10])]] },
          { name: 'Division', skills: [...rep(8, (i) => DTABLE(i + 2)), ['Divisions à trou', ...ar('/', [], [], { tab: [2, 3, 4, 5], q: [1, 10], miss: true })]] },
          { name: 'Fractions', skills: [['Lire une fraction sur une bande', 'fracRead', { d: [2, 4], shape: 'bar' }], ['Lire une fraction sur un disque', 'fracRead', { d: [2, 4], shape: 'pie' }], ['Fractions sur une droite graduée', 'fracLine', { d: [2, 4] }]] },
          { name: 'Pair, impair, multiples', skills: [['Nombres pairs et impairs', 'numprop', { kinds: ['parity'], max: 10000 }], ['Reconnaître un multiple', 'numprop', { kinds: ['mult'] }]] },
          { name: 'Problèmes', skills: [['Problèmes à une étape', 'wordprob', { kinds: ['add', 'sub', 'mul', 'div'], r: [20, 200] }], ['Problèmes avec de la monnaie', 'wordprob', { kinds: ['buy'] }]] },
        ] },
        { name: 'Grandeurs et mesures', cats: [
          { name: 'Longueurs, masses, contenances', skills: [['Convertir des unités de longueur', 'unit', { sets: ['len'] }], ['Convertir des unités de masse', 'unit', { sets: ['mass'] }], ['Convertir des unités de contenance', 'unit', { sets: ['cap'] }]] },
          { name: 'Heures et durées', skills: [['Lire l’heure à 5 minutes près', 'clock', { mins: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] }], ['Calculer une durée', 'elapsed', {}], ['Convertir des heures et des minutes', 'unit', { sets: ['time'] }]] },
          { name: 'Périmètres et aires', skills: [['Périmètre d’un rectangle', 'measure', { kinds: ['rectP'], r: [2, 15] }], ['Périmètre d’un carré', 'measure', { kinds: ['sqP'], r: [2, 15] }], ['Aire d’un rectangle', 'measure', { kinds: ['rectA'], r: [2, 12] }], ['Aire d’un carré', 'measure', { kinds: ['sqA'], r: [2, 12] }]] },
          { name: 'Argent', skills: [['Calculer une somme d’argent', 'money', { max: 100, pieces: 6 }]] },
        ] },
        { name: 'Espace et géométrie', cats: [
          { name: 'Angles', skills: [['Reconnaître les angles', 'angleType', {}]] },
          { name: 'Figures planes', skills: [['Côtés des polygones', 'sides', { set: ['tri', 'square', 'rect', 'penta', 'hexa', 'octa'] }], ['Reconnaître les polygones', 'shapes', { set: ['square', 'rect', 'tri', 'penta', 'hexa', 'octa'] }]] },
          { name: 'Solides', skills: [['Reconnaître les solides', 'solids', { set: ['cube', 'pave', 'cylinder', 'sphere', 'cone', 'pyramid'] }], ['Faces, arêtes et sommets', 'solidFaces', {}]] },
          { name: 'Symétrie', skills: [['Axes de symétrie d’une figure', 'symmetry', {}]] },
          { name: 'Se repérer', skills: [['Se repérer sur un quadrillage', 'gridPos', {}]] },
        ] },
      ],
    },
    /* ------------------------------------------------------------ CM1 */
    {
      id: 'cm1', art: 'mon', short: 'CM1', name: 'Cours moyen 1', color: '#0ea5e9', age: '9-10 ans',
      blurb: 'Grands nombres, fractions, premiers décimaux, multiplications et divisions, aires et angles.',
      domains: [
        { name: 'Nombres et calculs', cats: [
          { name: 'Grands nombres', skills: [['Lire la valeur d’un chiffre (jusqu’à 999 999)', 'place', { d: [5, 6] }], ['Comparer des grands nombres', 'compare', { max: 999999 }], ['Ranger des grands nombres', 'order', { max: 999999 }], ['Compter de 1 000 en 1 000, de 10 000 en 10 000', 'seq', { steps: [1000, 10000], min: 0, max: 400000 }], ['Arrondir un grand nombre', 'round', { to: [10, 100, 1000, 10000], min: 1000, max: 999999 }]] },
          { name: 'Fractions : comprendre', skills: [['Lire une fraction sur une bande', 'fracRead', { d: [2, 10], shape: 'bar' }], ['Lire une fraction sur un disque', 'fracRead', { d: [2, 10], shape: 'pie' }], ['Compter les parts colorées', 'fracRead', { d: [2, 12], num: true }], ['Placer une fraction sur une droite graduée', 'fracLine', { d: [2, 10] }], ['Combien d’unités entières dans une fraction ?', 'fracWhole', {}]] },
          { name: 'Fractions égales', skills: [['Trouver des fractions égales à l’aide de schémas', 'fracEq', { modes: ['A', 'B', 'C', 'D'] }], ['Compléter une fraction égale (numérateur)', 'fracEq', { modes: ['N'] }], ['Compléter une fraction égale (dénominateur)', 'fracEq', { modes: ['N2'] }], ['Simplifier une fraction', 'fracEq', { modes: ['S'] }]] },
          { name: 'Comparer et calculer avec des fractions', skills: [['Comparer des fractions de même dénominateur', 'fracCompare', { modes: ['sameDen'] }], ['Comparer des fractions de même numérateur', 'fracCompare', { modes: ['sameNum'] }], ['Additionner des fractions de même dénominateur', 'fracAdd', { modes: ['same'] }], ['Soustraire des fractions de même dénominateur', 'fracAdd', { modes: ['same'], sub: true }], ['Écrire une fraction décimale en nombre décimal', 'fracDec', { dens: [10, 100] }]] },
          { name: 'Nombres décimaux', skills: [['Dixièmes et centièmes', 'decExpand', {}], ['Lire le chiffre d’un décimal', 'place', { d: [1, 3], dec: 2 }], ['Comparer des nombres décimaux', 'compare', { max: 20, dec: true }], ['Ranger des nombres décimaux', 'order', { max: 20, dec: true }], ['Lire un décimal sur une droite graduée', 'line', { steps: [0.1, 0.5, 1], starts: [0, 1, 2] }], ['Arrondir un décimal à l’unité', 'round', { dec: true }]] },
          { name: 'Additions et soustractions', skills: [['Additions posées', ...ar('+', [1000, 49999], [1000, 49999], { big: true })], ['Soustractions posées', ...ar('-', [1000, 99999], [1000, 99999], { big: true })], ['Additionner des décimaux', 'decAdd', { ops: ['+'] }], ['Soustraire des décimaux', 'decAdd', { ops: ['-'] }]] },
          { name: 'Multiplications', skills: [['Tables de multiplication à trou', ...ar('*', [], [1, 10], { tab: [2, 3, 4, 5, 6, 7, 8, 9], miss: true })], ['Multiplier par 10, 100, 1 000', 'decMul', { modes: ['pow10'] }], ['Multiplier un nombre à deux chiffres par un chiffre', ...ar('*', [12, 99], [2, 9], { big: true })], ['Multiplier un nombre à trois chiffres par un chiffre', ...ar('*', [100, 999], [2, 9], { big: true })], ['Multiplier deux nombres à deux chiffres', ...ar('*', [11, 49], [11, 29], { big: true })]] },
          { name: 'Divisions', skills: [['Divisions par un chiffre (sans reste)', ...ar('/', [], [], { tab: [2, 3, 4, 5, 6, 7, 8, 9], q: [11, 99], big: true })], ['Division euclidienne : quotient et reste', 'remDiv', { b: [2, 9], q: [10, 99] }]] },
          { name: 'Multiples et diviseurs', skills: [['Nombres pairs et impairs', 'numprop', { kinds: ['parity'], max: 100000 }], ['Reconnaître un multiple', 'numprop', { kinds: ['mult'] }], ['Trouver un diviseur', 'numprop', { kinds: ['div'] }]] },
          { name: 'Problèmes', skills: [['Problèmes à une étape', 'wordprob', { kinds: ['add', 'sub', 'mul', 'div'], r: [100, 900], big: true }], ['Problèmes de monnaie', 'wordprob', { kinds: ['buy'] }], ['Problèmes de proportionnalité', 'propor', {}]] },
        ] },
        { name: 'Grandeurs et mesures', cats: [
          { name: 'Longueurs, masses, contenances', skills: [['Convertir des longueurs', 'unit', { sets: ['len'] }], ['Convertir des masses', 'unit', { sets: ['mass'] }], ['Convertir des contenances', 'unit', { sets: ['cap'] }]] },
          { name: 'Durées', skills: [['Lire l’heure', 'clock', { mins: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] }], ['Calculer une durée', 'elapsed', {}], ['Convertir des durées', 'unit', { sets: ['time'] }]] },
          { name: 'Périmètres et aires', skills: [['Périmètre d’un rectangle', 'measure', { kinds: ['rectP'], r: [3, 30] }], ['Périmètre d’un carré', 'measure', { kinds: ['sqP'], r: [3, 30] }], ['Aire d’un rectangle', 'measure', { kinds: ['rectA'], r: [3, 20] }], ['Aire d’un carré', 'measure', { kinds: ['sqA'], r: [3, 15] }], ['Aire d’un triangle', 'measure', { kinds: ['triA'], r: [2, 14] }]] },
          { name: 'Angles', skills: [['Reconnaître les angles', 'angleType', {}]] },
        ] },
        { name: 'Espace et géométrie', cats: [
          { name: 'Polygones et solides', skills: [['Côtés des polygones', 'sides', { set: ['tri', 'square', 'rect', 'penta', 'hexa', 'octa'] }], ['Reconnaître les polygones', 'shapes', { set: ['square', 'rect', 'tri', 'penta', 'hexa', 'octa'] }], ['Reconnaître les solides', 'solids', { set: ['cube', 'pave', 'cylinder', 'sphere', 'cone', 'pyramid'] }], ['Faces, arêtes et sommets', 'solidFaces', {}]] },
          { name: 'Symétrie et repérage', skills: [['Axes de symétrie', 'symmetry', {}], ['Se repérer sur un quadrillage', 'gridPos', {}]] },
        ] },
      ],
    },
    /* ------------------------------------------------------------ CM2 */
    {
      id: 'cm2', art: 'mon', short: 'CM2', name: 'Cours moyen 2', color: '#f58a1f', age: '10-11 ans',
      blurb: 'Nombres jusqu’au milliard, décimaux, fractions, proportionnalité, aires et volumes.',
      domains: [
        { name: 'Nombres et calculs', cats: [
          { name: 'Très grands nombres', skills: [['Valeur d’un chiffre (jusqu’aux milliards)', 'place', { d: [7, 10] }], ['Comparer de très grands nombres', 'compare', { max: 999999999 }], ['Ranger de très grands nombres', 'order', { max: 999999999 }], ['Arrondir un grand nombre', 'round', { to: [100, 1000, 10000], min: 10000, max: 9999999 }]] },
          { name: 'Fractions', skills: [['Lire une fraction', 'fracRead', { d: [2, 12] }], ['Fractions égales avec des schémas', 'fracEq', { modes: ['A', 'B', 'C', 'D'] }], ['Fractions égales : compléter', 'fracEq', { modes: ['N', 'N2'] }], ['Simplifier une fraction', 'fracSimplify', {}], ['Comparer des fractions', 'fracCompare', { modes: ['sameDen', 'sameNum', 'mixed'] }], ['Additionner des fractions de même dénominateur', 'fracAdd', { modes: ['same'] }], ['Additionner des fractions (un dénominateur multiple de l’autre)', 'fracAdd', { modes: ['multiple'] }], ['Soustraire des fractions', 'fracAdd', { modes: ['same', 'multiple'], sub: true }], ['Calculer une fraction d’une quantité', 'fracOfQty', {}], ['Écrire une fraction en nombre décimal', 'fracDec', { dens: [2, 4, 5, 10, 100] }]] },
          { name: 'Nombres décimaux', skills: [['Dixièmes, centièmes, millièmes', 'place', { d: [1, 3], dec: 3 }], ['Décomposer un nombre décimal', 'decExpand', {}], ['Comparer des décimaux', 'compare', { max: 100, dec: true }], ['Ranger des décimaux', 'order', { max: 100, dec: true }], ['Lire un décimal sur une droite graduée', 'line', { steps: [0.1, 0.01, 0.5], starts: [0, 1, 2.5] }], ['Arrondir à l’unité', 'round', { dec: true }]] },
          { name: 'Calcul avec des décimaux', skills: [['Additionner des décimaux', 'decAdd', { ops: ['+'] }], ['Soustraire des décimaux', 'decAdd', { ops: ['-'] }], ['Multiplier un décimal par 10, 100, 1 000', 'decMul', { modes: ['pow10'] }], ['Multiplier un décimal par un entier', 'decMul', { modes: ['int'] }], ['Multiplier deux décimaux', 'decMul', { modes: ['dec'] }]] },
          { name: 'Calcul avec des entiers', skills: [['Multiplier deux nombres à deux chiffres', ...ar('*', [11, 99], [11, 99], { big: true })], ['Multiplier par un nombre à trois chiffres', ...ar('*', [100, 999], [11, 49], { big: true })], ['Division euclidienne', 'remDiv', { b: [11, 49], q: [10, 99] }], ['Priorités des opérations', 'priority', {}]] },
          { name: 'Multiples et diviseurs', skills: [['Reconnaître un multiple', 'numprop', { kinds: ['mult'] }], ['Trouver un diviseur', 'numprop', { kinds: ['div'] }], ['Reconnaître un nombre premier', 'numprop', { kinds: ['prime'] }]] },
          { name: 'Proportionnalité et pourcentages', skills: [['Problèmes de proportionnalité', 'propor', {}], ['Pourcentages simples d’une quantité', 'percent', { kinds: ['of'] }], ['Augmentation et réduction', 'percent', { kinds: ['inc', 'dec'] }]] },
          { name: 'Problèmes', skills: [['Problèmes à une étape', 'wordprob', { kinds: ['add', 'sub', 'mul', 'div'], r: [100, 900], big: true }], ['Problèmes avec de la monnaie', 'wordprob', { kinds: ['buy'] }]] },
        ] },
        { name: 'Grandeurs et mesures', cats: [
          { name: 'Conversions', skills: [['Longueurs', 'unit', { sets: ['len'] }], ['Masses', 'unit', { sets: ['mass'] }], ['Contenances', 'unit', { sets: ['cap'] }], ['Durées', 'unit', { sets: ['time'] }], ['Aires', 'unit', { sets: ['area'] }]] },
          { name: 'Durées', skills: [['Calculer une durée', 'elapsed', {}]] },
          { name: 'Périmètres, aires, volumes', skills: [['Périmètre d’un rectangle', 'measure', { kinds: ['rectP'], r: [3, 50] }], ['Aire d’un rectangle', 'measure', { kinds: ['rectA'], r: [3, 25] }], ['Aire d’un triangle', 'measure', { kinds: ['triA'], r: [2, 20] }], ['Périmètre d’un cercle', 'measure', { kinds: ['circC'] }], ['Aire d’un disque', 'measure', { kinds: ['circA'] }], ['Volume d’un pavé droit', 'measure', { kinds: ['vol'] }]] },
          { name: 'Statistiques', skills: [['Calculer une moyenne', 'stat', { kinds: ['mean'] }]] },
        ] },
        { name: 'Espace et géométrie', cats: [
          { name: 'Angles et triangles', skills: [['Reconnaître les angles', 'angleType', {}], ['Calculer un angle d’un triangle', 'triAngle', {}]] },
          { name: 'Figures et solides', skills: [['Côtés des polygones', 'sides', { set: ['tri', 'square', 'rect', 'penta', 'hexa', 'octa'] }], ['Faces, arêtes et sommets', 'solidFaces', {}], ['Axes de symétrie', 'symmetry', {}]] },
        ] },
      ],
    },
    /* ------------------------------------------------------------ 6e */
    {
      id: '6e', art: 'ma', short: '6ᵉ', name: 'Sixième', color: '#12a182', age: '11-12 ans',
      blurb: 'Multiples et diviseurs, fractions, décimaux, proportionnalité, angles, aires et probabilités.',
      domains: [
        { name: 'Nombres et calculs', cats: [
          { name: 'Multiples et diviseurs', skills: [['Reconnaître un multiple', 'numprop', { kinds: ['mult'] }], ['Trouver un diviseur', 'numprop', { kinds: ['div'] }], ['Reconnaître un nombre premier', 'numprop', { kinds: ['prime'] }], ['Nombres pairs et impairs', 'numprop', { kinds: ['parity'], max: 1000 }]] },
          { name: 'Puissances', skills: [['Carrés parfaits', 'power', { kinds: ['sq'] }], ['Puissances de 10', 'power', { kinds: ['p10'] }], ['Produit de puissances', 'power', { kinds: ['rule'] }]] },
          { name: 'Nombres décimaux', skills: [['Valeur d’un chiffre dans un décimal', 'place', { d: [2, 5], dec: 3 }], ['Comparer des décimaux', 'compare', { max: 100, dec: true }], ['Ranger des décimaux', 'order', { max: 100, dec: true }], ['Arrondir un décimal', 'round', { dec: true }], ['Additionner et soustraire des décimaux', 'decAdd', { ops: ['+', '-'] }], ['Multiplier des décimaux', 'decMul', { modes: ['pow10', 'int', 'dec'] }]] },
          { name: 'Fractions', skills: [['Fractions égales avec des schémas', 'fracEq', { modes: ['A', 'B', 'C', 'D'] }], ['Simplifier une fraction', 'fracSimplify', {}], ['Comparer des fractions', 'fracCompare', { modes: ['sameDen', 'sameNum', 'mixed'] }], ['Additionner des fractions', 'fracAdd', { modes: ['same', 'multiple', 'unlike'] }], ['Soustraire des fractions', 'fracAdd', { modes: ['same', 'multiple', 'unlike'], sub: true }], ['Multiplier des fractions', 'fracMul', {}], ['Fraction d’une quantité', 'fracOfQty', {}], ['Fractions et nombres décimaux', 'fracDec', { dens: [2, 4, 5, 10, 100] }]] },
          { name: 'Calcul', skills: [['Priorités des opérations', 'priority', {}], ['Division euclidienne', 'remDiv', { b: [11, 49], q: [10, 99] }], ['Problèmes à plusieurs étapes', 'wordprob', { kinds: ['buy', 'mul', 'div'], big: true }]] },
          { name: 'Proportionnalité', skills: [['Problèmes de proportionnalité', 'propor', {}], ['Calculer un pourcentage d’une quantité', 'percent', { kinds: ['of'] }], ['Augmentation et réduction', 'percent', { kinds: ['inc', 'dec'] }], ['Quel pourcentage ?', 'percent', { kinds: ['find'] }]] },
          { name: 'Statistiques et probabilités', skills: [['Calculer une moyenne', 'stat', { kinds: ['mean'] }], ['Trouver une médiane', 'stat', { kinds: ['median'] }], ['Calculer une étendue', 'stat', { kinds: ['range'] }], ['Calculer une probabilité simple', 'proba', {}]] },
        ] },
        { name: 'Grandeurs et mesures', cats: [
          { name: 'Conversions', skills: [['Longueurs', 'unit', { sets: ['len'] }], ['Masses', 'unit', { sets: ['mass'] }], ['Contenances', 'unit', { sets: ['cap'] }], ['Aires', 'unit', { sets: ['area'] }], ['Durées', 'unit', { sets: ['time'] }]] },
          { name: 'Périmètres, aires, volumes', skills: [['Périmètre d’un rectangle', 'measure', { kinds: ['rectP'], r: [3, 50] }], ['Aire d’un carré ou d’un rectangle', 'measure', { kinds: ['rectA', 'sqA'], r: [3, 25] }], ['Aire d’un triangle', 'measure', { kinds: ['triA'], r: [2, 20] }], ['Périmètre d’un cercle', 'measure', { kinds: ['circC'] }], ['Aire d’un disque', 'measure', { kinds: ['circA'] }], ['Volume d’un pavé droit', 'measure', { kinds: ['vol'] }]] },
          { name: 'Durées', skills: [['Calculer une durée', 'elapsed', {}]] },
        ] },
        { name: 'Espace et géométrie', cats: [
          { name: 'Angles et triangles', skills: [['Reconnaître les angles', 'angleType', {}], ['Somme des angles d’un triangle', 'triAngle', {}]] },
          { name: 'Figures et symétrie', skills: [['Axes de symétrie', 'symmetry', {}], ['Côtés des polygones', 'sides', { set: ['tri', 'square', 'rect', 'penta', 'hexa', 'octa'] }]] },
          { name: 'Solides', skills: [['Reconnaître les solides', 'solids', { set: ['cube', 'pave', 'cylinder', 'sphere', 'cone', 'pyramid'] }], ['Faces, arêtes et sommets', 'solidFaces', {}]] },
        ] },
      ],
    },
  ];

  (root.CATALOG_EXTRA || []).forEach((l) => LEVELS.push(l));

  /* Codes A.1, B.2… : lettre = catégorie (dans tout le niveau), numéro = compétence. */
  const letter = (i) => { let s = ''; i += 1; while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
  LEVELS.forEach((lv) => {
    let ci = 0; lv.skillList = []; lv.catList = [];
    lv.domains.forEach((d, di) => d.cats.forEach((c) => {
      c.letter = letter(ci++); c.domain = di; c.level = lv.id; lv.catList.push(c);
      c.skills = c.skills.map((s, si) => {
        const sk = { id: `${lv.id}-${c.letter}${si + 1}`, code: `${c.letter}.${si + 1}`, title: s[0], gen: s[1] || null, params: s[2] || {}, level: lv.id, cat: c };
        lv.skillList.push(sk); return sk;
      });
    }));
  });

  root.CATALOG = { LEVELS, byId: Object.fromEntries(LEVELS.flatMap((l) => l.skillList).map((s) => [s.id, s])) };
}(typeof window !== 'undefined' ? window : globalThis));
