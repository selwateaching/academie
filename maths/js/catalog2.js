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

  root.CATALOG_EXTRA = EXTRA;
}(typeof window !== 'undefined' ? window : globalThis));
