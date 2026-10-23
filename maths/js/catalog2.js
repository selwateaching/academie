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

  root.CATALOG_EXTRA = EXTRA;
}(typeof window !== 'undefined' ? window : globalThis));
