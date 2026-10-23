/* Catalogue du collège (5e à 3e) et du lycée (2nde à Terminale).
 * Même format que catalog.js ; catalog.js les ajoute à la suite des niveaux GS → 6e.
 * Programme français (cycle 4 et lycée général).
 */
(function (root) {
  const EXTRA = [];

  /* ------------------------------------------------------------ 5e */
  EXTRA.push({
    id: '5e', art: 'ma', short: '5ᵉ', name: 'Cinquième', color: '#8cb420', age: '12-13 ans',
    blurb: 'Nombres relatifs, fractions, calcul littéral, équations, proportionnalité, angles, aires et volumes.',
    domains: [
      { name: 'Nombres et calculs', cats: [
        { name: 'Nombres relatifs', skills: [['Repérer un nombre relatif', 'relLine', {}], ['Comparer des nombres relatifs', 'relNum', { kinds: ['cmp'] }], ['Additionner des nombres relatifs', 'relNum', { kinds: ['add'] }], ['Soustraire des nombres relatifs', 'relNum', { kinds: ['sub'] }], ['Multiplier des nombres relatifs', 'relNum', { kinds: ['mul'] }], ['Diviser des nombres relatifs', 'relNum', { kinds: ['div'] }]] },
        { name: 'Fractions', skills: [['Simplifier une fraction', 'fracSimplify', {}], ['Additionner et soustraire des fractions', 'fracAdd', { modes: ['same', 'multiple', 'unlike'] }], ['Multiplier des fractions', 'fracMul', {}], ['Diviser des fractions', 'fracDiv', {}], ['Fraction d’une quantité', 'fracOfQty', {}]] },
        { name: 'Calcul littéral', skills: [['Calculer la valeur d’une expression', 'litEval', {}], ['Réduire une expression', 'litReduce', {}], ['Développer avec une parenthèse', 'litDev', { kinds: ['simple'] }], ['Une égalité est-elle vraie ?', 'eqTest', {}]] },
        { name: 'Équations', skills: [['Résoudre x + a = b', 'eq1', { kinds: ['add'] }], ['Résoudre ax = b', 'eq1', { kinds: ['mul'] }], ['Résoudre ax + b = c', 'eq1', { kinds: ['lin'] }]] },
        { name: 'Proportionnalité', skills: [['Coefficient de proportionnalité', 'propCoef', { kinds: ['coef', 'missing'] }], ['Pourcentages', 'percent', { kinds: ['of', 'inc', 'dec', 'find'] }], ['Échelles', 'scale', { kinds: ['real', 'plan'] }]] },
        { name: 'Statistiques et probabilités', skills: [['Calculer une moyenne', 'stat', { kinds: ['mean'] }], ['Calculer une fréquence', 'freq', {}], ['Calculer une probabilité simple', 'proba', {}]] },
      ] },
      { name: 'Grandeurs et mesures', cats: [
        { name: 'Aires et volumes', skills: [['Aire d’un parallélogramme', 'area2', { kinds: ['para'] }], ['Volume d’un prisme droit', 'vol2', { kinds: ['prism'] }], ['Volume d’un cylindre', 'vol2', { kinds: ['cyl'] }], ['Calculer une durée', 'elapsed', {}]] },
      ] },
      { name: 'Espace et géométrie', cats: [
        { name: 'Angles et triangles', skills: [['Angles complémentaires', 'angleRel', { kinds: ['comp'] }], ['Angles supplémentaires', 'angleRel', { kinds: ['supp'] }], ['Triangle isocèle', 'angleRel', { kinds: ['iso'] }], ['Angles d’un parallélogramme', 'angleRel', { kinds: ['par'] }], ['Inégalité triangulaire', 'triIneq', {}]] },
        { name: 'Symétrie centrale', skills: [['Symétrique d’un point par rapport à l’origine', 'symPt', { kinds: ['O'] }]] },
      ] },
    ],
  });

  /* ------------------------------------------------------------ 4e */
  EXTRA.push({
    id: '4e', art: 'ma', short: '4ᵉ', name: 'Quatrième', color: '#8d8862', age: '13-14 ans',
    blurb: 'Puissances, racines carrées, calcul littéral, équations, Pythagore, Thalès, cosinus et vitesses.',
    domains: [
      { name: 'Nombres et calculs', cats: [
        { name: 'Relatifs et fractions', skills: [['Priorités avec des nombres relatifs', 'relExpr', {}], ['Additionner et soustraire des fractions', 'fracAdd', { modes: ['same', 'multiple', 'unlike'] }], ['Multiplier des fractions', 'fracMul', {}], ['Diviser des fractions', 'fracDiv', {}]] },
        { name: 'Puissances', skills: [['Calculer une puissance', 'powInt', { kinds: ['pow'] }], ['Produit de puissances', 'powInt', { kinds: ['rule'] }], ['Quotient de puissances', 'powInt', { kinds: ['div'] }], ['Puissances de 10 négatives', 'powInt', { kinds: ['neg10'] }], ['Notation scientifique', 'sci', {}]] },
        { name: 'Racines carrées', skills: [['Racine carrée d’un carré parfait', 'sqrtQ', { kinds: ['perfect'] }], ['Encadrer une racine carrée', 'sqrtQ', { kinds: ['between'] }]] },
        { name: 'Calcul littéral', skills: [['Développer k(ax + b)', 'litDev', { kinds: ['lin'] }], ['Développer (x + a)(x + b)', 'litDev', { kinds: ['double'] }], ['Factoriser avec un facteur commun', 'litFact', {}], ['Réduire une expression', 'litReduce', {}]] },
        { name: 'Équations', skills: [['Résoudre ax + b = c', 'eq1', { kinds: ['lin'] }], ['Résoudre ax + b = cx + d', 'eq1', { kinds: ['both'] }], ['Une égalité est-elle vraie ?', 'eqTest', {}]] },
        { name: 'Proportionnalité et pourcentages', skills: [['Pourcentages', 'percent', { kinds: ['of', 'inc', 'dec', 'find'] }], ['Calculer une vitesse', 'speed', { kinds: ['v'] }], ['Distance et durée', 'speed', { kinds: ['d', 't'] }]] },
        { name: 'Statistiques et probabilités', skills: [['Moyenne pondérée', 'wmean', {}], ['Trouver une médiane', 'stat', { kinds: ['median'] }], ['Calculer une probabilité simple', 'proba', {}], ['Événement contraire', 'probaCompl', {}]] },
      ] },
      { name: 'Grandeurs et mesures', cats: [
        { name: 'Volumes', skills: [['Volume d’un cylindre', 'vol2', { kinds: ['cyl'] }], ['Volume d’une pyramide', 'vol2', { kinds: ['pyr'] }], ['Volume d’un cône', 'vol2', { kinds: ['cone'] }]] },
      ] },
      { name: 'Espace et géométrie', cats: [
        { name: 'Théorème de Pythagore', skills: [['Calculer l’hypoténuse', 'pyth', { kinds: ['hyp'] }], ['Calculer un côté de l’angle droit', 'pyth', { kinds: ['side'] }], ['Réciproque de Pythagore', 'pythRecip', {}]] },
        { name: 'Théorème de Thalès', skills: [['Calculer une longueur avec Thalès', 'thales', { kinds: ['ac', 'mn'] }]] },
        { name: 'Cosinus', skills: [['Cosinus d’un angle aigu', 'trigo', { kinds: ['cos'] }], ['Calculer un côté avec le cosinus', 'trigo', { kinds: ['side'] }]] },
      ] },
    ],
  });

  /* ------------------------------------------------------------ 3e */
  EXTRA.push({
    id: '3e', art: 'ma', short: '3ᵉ', name: 'Troisième', color: '#2e6873', age: '14-15 ans',
    blurb: 'PGCD, identités remarquables, équations et systèmes, fonctions, trigonométrie, probabilités : prépare le brevet.',
    domains: [
      { name: 'Nombres et calculs', cats: [
        { name: 'Arithmétique', skills: [['PGCD de deux nombres', 'gcdQ', {}], ['Décomposition en facteurs premiers', 'primeFact', {}], ['Simplifier une fraction', 'fracSimplify', {}]] },
        { name: 'Racines et puissances', skills: [['Simplifier une racine carrée', 'sqrtQ', { kinds: ['simp'] }], ['Puissances de 10 négatives', 'powInt', { kinds: ['neg10'] }], ['Notation scientifique', 'sci', {}]] },
        { name: 'Calcul littéral', skills: [['Développer (x + a)(x + b)', 'litDev', { kinds: ['double'] }], ['Développer avec une identité remarquable', 'idRem', { kinds: ['sq+', 'sq-', 'prod'] }], ['Factoriser avec un facteur commun', 'litFact', {}], ['Factoriser avec une identité remarquable', 'idRem', { kinds: ['fsq', 'fdiff'] }]] },
        { name: 'Équations et inéquations', skills: [['Résoudre ax + b = cx + d', 'eq1', { kinds: ['both'] }], ['Équation produit nul', 'prodNul', {}], ['Résoudre une inéquation', 'ineq', {}], ['Résoudre un système', 'sys2', {}]] },
        { name: 'Fonctions', skills: [['Calculer une image', 'fnImage', { kinds: ['image', 'quad'] }], ['Trouver un antécédent', 'fnImage', { kinds: ['antecedent'] }], ['Coefficient d’une fonction linéaire', 'fnAff', { kinds: ['coef'] }], ['Coefficient directeur d’une droite', 'fnAff', { kinds: ['slope'] }], ['Ordonnée à l’origine', 'fnAff', { kinds: ['interc'] }]] },
        { name: 'Statistiques et probabilités', skills: [['Quartiles', 'quart', { kinds: ['q1', 'q3'] }], ['Deux tirages avec remise', 'probaTwo', {}], ['Événement contraire', 'probaCompl', {}]] },
      ] },
      { name: 'Grandeurs et mesures', cats: [
        { name: 'Solides et transformations', skills: [['Volume d’une boule', 'vol2', { kinds: ['sph'] }], ['Agrandissement et réduction : aires', 'homothety', { kinds: ['area'] }], ['Agrandissement et réduction : volumes', 'homothety', { kinds: ['vol'] }]] },
        { name: 'Vitesses', skills: [['Vitesse, distance, durée', 'speed', { kinds: ['v', 'd', 't'] }]] },
      ] },
      { name: 'Espace et géométrie', cats: [
        { name: 'Pythagore et Thalès', skills: [['Calculer un côté avec Pythagore', 'pyth', { kinds: ['hyp', 'side'] }], ['Réciproque de Pythagore', 'pythRecip', {}], ['Calculer une longueur avec Thalès', 'thales', { kinds: ['ac', 'mn'] }]] },
        { name: 'Trigonométrie', skills: [['Cosinus, sinus et tangente', 'trigo', { kinds: ['cos', 'sin', 'tan'] }], ['Calculer un côté avec la trigonométrie', 'trigo', { kinds: ['side'] }], ['Calculer un angle', 'trigo', { kinds: ['angle'] }]] },
        { name: 'Polygones réguliers', skills: [['Angle au centre', 'polyAngle', { kinds: ['central'] }], ['Angle d’un polygone régulier', 'polyAngle', { kinds: ['inner'] }]] },
      ] },
    ],
  });

  /* ------------------------------------------------------------ 2nde */
  EXTRA.push({
    id: '2nde', art: 'ma', short: '2nde', name: 'Seconde', color: '#5e2050', age: '15-16 ans',
    blurb: 'Intervalles, valeur absolue, suites, fonctions affines, repère, vecteurs et probabilités.',
    domains: [
      { name: 'Nombres et calculs', cats: [
        { name: 'Intervalles et valeur absolue', skills: [['Écrire un intervalle', 'interval', { kinds: ['write'] }], ['Appartenance à un intervalle', 'interval', { kinds: ['in'] }], ['Valeur absolue', 'absVal', { kinds: ['val'] }], ['Équation avec valeur absolue', 'absVal', { kinds: ['eq'] }]] },
        { name: 'Calcul algébrique', skills: [['Développer avec une identité remarquable', 'idRem', { kinds: ['sq+', 'sq-', 'prod'] }], ['Factoriser avec une identité remarquable', 'idRem', { kinds: ['fsq', 'fdiff'] }], ['Factoriser avec un facteur commun', 'litFact', {}], ['Développer (x + a)(x + b)', 'litDev', { kinds: ['double'] }]] },
        { name: 'Équations et inéquations', skills: [['Résoudre ax + b = cx + d', 'eq1', { kinds: ['both'] }], ['Résoudre une inéquation', 'ineq', {}], ['Équation produit nul', 'prodNul', {}], ['Résoudre x² = a', 'sqEq', {}], ['Résoudre un système', 'sys2', {}]] },
        { name: 'Pourcentages et suites', skills: [['Évolutions successives', 'pcSucc', {}], ['Terme d’une suite (formule)', 'seqTerm', { kinds: ['explicit'] }], ['Terme d’une suite (récurrence)', 'seqTerm', { kinds: ['rec'] }]] },
      ] },
      { name: 'Fonctions', cats: [
        { name: 'Fonctions affines', skills: [['Calculer une image', 'fnImage', { kinds: ['image', 'quad'] }], ['Trouver un antécédent', 'fnImage', { kinds: ['antecedent'] }], ['Sens de variation', 'affSens', {}], ['Coefficient directeur d’une droite', 'fnAff', { kinds: ['slope'] }], ['Ordonnée à l’origine', 'fnAff', { kinds: ['interc'] }], ['Équation réduite d’une droite', 'lineEq', {}]] },
      ] },
      { name: 'Géométrie dans le repère', cats: [
        { name: 'Points et distances', skills: [['Abscisse d’un milieu', 'midpoint', { kinds: ['x'] }], ['Ordonnée d’un milieu', 'midpoint', { kinds: ['y'] }], ['Distance entre deux points', 'dist', {}], ['Symétrique par rapport à un axe', 'symPt', { kinds: ['x', 'y'] }]] },
        { name: 'Vecteurs', skills: [['Coordonnées d’un vecteur', 'vecCoord', {}], ['Norme d’un vecteur', 'vecNorm', {}], ['Vecteurs colinéaires', 'collinear', {}], ['Parallélogramme et quatrième sommet', 'parallelogram', {}]] },
      ] },
      { name: 'Statistiques et probabilités', cats: [
        { name: 'Statistiques', skills: [['Moyenne pondérée', 'wmean', {}], ['Quartiles', 'quart', { kinds: ['q1', 'q3'] }]] },
        { name: 'Probabilités', skills: [['Événement contraire', 'probaCompl', {}], ['Probabilité d’une réunion', 'probaUnion', {}], ['Deux tirages avec remise', 'probaTwo', {}]] },
      ] },
    ],
  });

  /* ------------------------------------------------------------ 1re */
  EXTRA.push({
    id: '1re', art: 'ma', short: '1ʳᵉ', name: 'Première', color: '#c4451c', age: '16-17 ans',
    blurb: 'Second degré, dérivation, suites, trigonométrie, produit scalaire, probabilités conditionnelles et exponentielle.',
    domains: [
      { name: 'Algèbre et analyse', cats: [
        { name: 'Second degré', skills: [['Calculer le discriminant', 'quad', { kinds: ['disc'] }], ['Résoudre une équation du second degré', 'quad', { kinds: ['roots'] }], ['Sommet d’une parabole', 'quad', { kinds: ['vertex'] }], ['Développer avec une identité remarquable', 'idRem', { kinds: ['sq+', 'sq-', 'prod'] }]] },
        { name: 'Dérivation', skills: [['Dériver un polynôme', 'deriv', { kinds: ['poly'] }], ['Nombre dérivé', 'deriv', { kinds: ['at'] }], ['Équation d’une tangente', 'deriv', { kinds: ['tan'] }], ['Quand la dérivée s’annule', 'derivZero', {}], ['Variations d’une fonction', 'derivZero', { sens: true }]] },
        { name: 'Suites', skills: [['Suite arithmétique : un terme', 'seqSpec', { kinds: ['arith'] }], ['Suite arithmétique : la raison', 'seqSpec', { kinds: ['raison'] }], ['Somme de termes d’une suite arithmétique', 'seqSpec', { kinds: ['sum'] }], ['Suite géométrique : un terme', 'seqSpec', { kinds: ['geo'] }], ['Terme d’une suite (récurrence)', 'seqTerm', { kinds: ['rec'] }]] },
        { name: 'Exponentielle', skills: [['Règles de calcul avec exp', 'expPow', { kinds: ['prod', 'quot', 'pow'] }]] },
      ] },
      { name: 'Trigonométrie et géométrie', cats: [
        { name: 'Radians', skills: [['Degrés vers radians', 'radDeg', { kinds: ['toRad'] }], ['Radians vers degrés', 'radDeg', { kinds: ['toDeg'] }], ['Cosinus d’un angle remarquable', 'trigVal', { kinds: ['cos'] }], ['Sinus d’un angle remarquable', 'trigVal', { kinds: ['sin'] }]] },
        { name: 'Produit scalaire', skills: [['Calculer un produit scalaire', 'dot', { kinds: ['prod'] }], ['Vecteurs orthogonaux', 'dot', { kinds: ['ortho'] }], ['Norme d’un vecteur', 'vecNorm', {}]] },
      ] },
      { name: 'Probabilités', cats: [
        { name: 'Probabilités', skills: [['Probabilité conditionnelle', 'condProba', { kinds: ['cond'] }], ['Probabilités totales', 'condProba', { kinds: ['total'] }], ['Espérance d’une variable aléatoire', 'expect', {}], ['Probabilité d’une réunion', 'probaUnion', {}]] },
      ] },
    ],
  });

  /* ------------------------------------------------------------ Terminale */
  EXTRA.push({
    id: 'term', art: 'ma', short: 'Ter', name: 'Terminale', color: '#404889', age: '17-18 ans',
    blurb: 'Limites, dérivation, logarithme et exponentielle, intégrales, dénombrement, loi binomiale et géométrie dans l’espace.',
    domains: [
      { name: 'Analyse', cats: [
        { name: 'Suites et limites', skills: [['Limite d’une suite géométrique', 'limit', { kinds: ['geo'] }], ['Limite d’un polynôme', 'limit', { kinds: ['poly'] }], ['Limite d’un quotient de polynômes', 'limit', { kinds: ['rat'] }], ['Suite géométrique : un terme', 'seqSpec', { kinds: ['geo'] }], ['Somme de termes d’une suite arithmétique', 'seqSpec', { kinds: ['sum'] }]] },
        { name: 'Dérivation', skills: [['Dériver un polynôme', 'deriv', { kinds: ['poly'] }], ['Dériver (ax + b) puissance n', 'deriv2', { kinds: ['pow'] }], ['Dériver une exponentielle', 'deriv2', { kinds: ['exp'] }], ['Dériver un logarithme', 'deriv2', { kinds: ['ln'] }], ['Équation d’une tangente', 'deriv', { kinds: ['tan'] }]] },
        { name: 'Logarithme et exponentielle', skills: [['Règles du logarithme', 'lnRule', { kinds: ['sum', 'diff', 'pow'] }], ['Logarithme d’une exponentielle', 'lnRule', { kinds: ['exp'] }], ['Équation avec exp', 'expEq', { kinds: ['exp'] }], ['Équation avec ln', 'expEq', { kinds: ['ln'] }], ['Règles de calcul avec exp', 'expPow', { kinds: ['prod', 'quot', 'pow'] }]] },
        { name: 'Primitives et intégrales', skills: [['Trouver une primitive', 'primit', {}], ['Calculer une intégrale', 'primit', { integral: true }]] },
      ] },
      { name: 'Probabilités et dénombrement', cats: [
        { name: 'Dénombrement', skills: [['Rangements et factorielle', 'comb', { kinds: ['fact'] }], ['Choix ordonnés', 'comb', { kinds: ['arr'] }], ['Choix sans ordre', 'comb', { kinds: ['binom'] }], ['Listes avec répétition', 'comb', { kinds: ['list'] }]] },
        { name: 'Probabilités', skills: [['Loi binomiale : une probabilité', 'binomLaw', { kinds: ['p'] }], ['Loi binomiale : l’espérance', 'binomLaw', { kinds: ['e'] }], ['Probabilité conditionnelle', 'condProba', { kinds: ['cond'] }], ['Probabilités totales', 'condProba', { kinds: ['total'] }], ['Espérance d’une variable aléatoire', 'expect', {}]] },
      ] },
      { name: 'Géométrie dans l’espace', cats: [
        { name: 'Vecteurs de l’espace', skills: [['Produit scalaire dans l’espace', 'space', { kinds: ['dot'] }], ['Norme d’un vecteur de l’espace', 'space', { kinds: ['norm'] }]] },
      ] },
    ],
  });

  root.CATALOG_EXTRA = EXTRA;
}(typeof window !== 'undefined' ? window : globalThis));
