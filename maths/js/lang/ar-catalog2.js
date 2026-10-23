/* Titres du catalogue en arabe pour le collège (5e à 3e) et le lycée. Complète ar-catalog.js.
 * 5e = 2 متوسط, 4e = 3 متوسط, 3e = 4 متوسط ; 2nde = 1 ثانوي, 1re = 2 ثانوي, Terminale = 3 ثانوي. */
(function (root) {
  Object.assign(root.AR_CATALOG, {
    /* niveaux */
    '5ᵉ': '2 متوسط', '4ᵉ': '3 متوسط', '3ᵉ': '4 متوسط', 'Ter': '3 ثانوي',
    'Cinquième': 'السنة الثانية متوسط', 'Quatrième': 'السنة الثالثة متوسط', 'Troisième': 'السنة الرابعة متوسط',
    'Seconde': 'السنة الأولى ثانوي', 'Première': 'السنة الثانية ثانوي',
    '12-13 ans': '12-13 سنة', '13-14 ans': '13-14 سنة', '14-15 ans': '14-15 سنة', '15-16 ans': '15-16 سنة', '16-17 ans': '16-17 سنة', '17-18 ans': '17-18 سنة',
    /* 5e */
    'Nombres relatifs, fractions, calcul littéral, équations, proportionnalité, angles, aires et volumes.': 'الأعداد النسبية، الكسور، الحساب الحرفي، المعادلات، التناسبية، الزوايا، المساحات والحجوم.',
    'Nombres relatifs': 'الأعداد النسبية', 'Repérer un nombre relatif': 'تعيين عدد نسبي', 'Comparer des nombres relatifs': 'مقارنة أعداد نسبية', 'Additionner des nombres relatifs': 'جمع أعداد نسبية', 'Soustraire des nombres relatifs': 'طرح أعداد نسبية', 'Multiplier des nombres relatifs': 'ضرب أعداد نسبية', 'Diviser des nombres relatifs': 'قسمة أعداد نسبية',
    'Additionner et soustraire des fractions': 'جمع وطرح الكسور', 'Diviser des fractions': 'قسمة الكسور',
    'Calcul littéral': 'الحساب الحرفي', 'Calculer la valeur d’une expression': 'حساب قيمة عبارة', 'Réduire une expression': 'تبسيط عبارة', 'Développer avec une parenthèse': 'النشر بوجود قوسين', 'Une égalité est-elle vraie ?': 'هل المساواة صحيحة ؟',
    'Équations': 'المعادلات', 'Résoudre x + a = b': 'حلّ المعادلة x + a = b', 'Résoudre ax = b': 'حلّ المعادلة ax = b', 'Résoudre ax + b = c': 'حلّ المعادلة ax + b = c',
    'Coefficient de proportionnalité': 'معامل التناسب', 'Pourcentages': 'النسب المئوية', 'Échelles': 'السلالم',
    'Calculer une fréquence': 'حساب تواتر',
    'Aires et volumes': 'المساحات والحجوم', 'Aire d’un parallélogramme': 'مساحة متوازي الأضلاع', 'Volume d’un prisme droit': 'حجم منشور قائم', 'Volume d’un cylindre': 'حجم أسطوانة',
    'Angles complémentaires': 'الزوايا المتتامة', 'Angles supplémentaires': 'الزوايا المتكاملة', 'Triangle isocèle': 'المثلث المتساوي الساقين', 'Angles d’un parallélogramme': 'زوايا متوازي الأضلاع', 'Inégalité triangulaire': 'المتباينة المثلثية',
    'Symétrie centrale': 'التناظر المركزي', 'Symétrique d’un point par rapport à l’origine': 'نظيرة نقطة بالنسبة إلى المبدأ',
  });
}(typeof window !== 'undefined' ? window : globalThis));
