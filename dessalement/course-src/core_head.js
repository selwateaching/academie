let lang='fr';
const L=o=>o[lang];
const X=(fr,ar)=>lang==='ar'?ar:fr;
const X0=(fr,ar)=>({fr,ar});
const UI={
 brand:X0("Formation dessalement","تكوين في تحلية المياه"),
 progH:X0("Le programme","البرنامج"),
 avail:X0("Disponible","متوفّر"),soon:X0("À venir","قريبًا"),done:X0("Réussie","مُنجَز"),
 phH:X0("L'échelle du pH, avec des objets de la maison","سُلّم الـ pH بأشياء من البيت"),
 phP:X0("Le pH dit si un liquide est <b>acide</b> (en dessous de 7), <b>neutre</b> (7) ou <b>basique</b> (au-dessus de 7). L'eau de mer est <b>légèrement basique</b>.",
      "يُبيّن الـ pH إن كان السائل <b>حمضيًا</b> (أقل من 7)، أو <b>معتدلًا</b> (7)، أو <b>قاعديًا</b> (أكثر من 7). مياه البحر <b>قاعدية قليلًا</b>."),
 readH:X0("Comment lire une formule chimique","كيف نقرأ صيغة كيميائية"),
 prepVid:X0("Avant de commencer","قبل البدء"),prepVidLead:X0("Trois rappels pour bien suivre la vidéo.","ثلاثة تذكيرات لمتابعة الفيديو جيدًا."),
 seeBases:X0("Revoir les 8 bases de la chimie (leçon 0)","مراجعة أساسيات الكيمياء الثمانية (الدرس 0)"),
 stepN:X0("Étape {a}","المرحلة {a}"),
 voice:X0("Voix","الصوت"),subs:X0("Sous-titres","الترجمة النصية"),
 play:X0("Lire","تشغيل"),pause:X0("Pause","إيقاف مؤقت"),again:X0("Revoir","إعادة"),
 prev:X0("Scène précédente","المشهد السابق"),next:X0("Scène suivante","المشهد التالي"),
 where:X0("Scène {a} sur {b}","المشهد {a} من {b}"),goto:X0("Aller à la scène {a}","الذهاب إلى المشهد {a}"),
 big:X0("▶ Lire la leçon","▶ شغّلي الدرس"),
 endT:X0("Fin de la leçon","نهاية الدرس"),toQuiz:X0("Passer au quiz","الانتقال إلى الاختبار"),
 words:X0("Mots de la scène :","كلمات المشهد:"),clair:X0("En clair :","بكلمات بسيطة:"),
 vnote:X0("La voix utilise celle de ton appareil. Sans voix française installée, la vidéo avance avec les sous-titres.","يستعمل الصوتُ صوتَ جهازك. إن لم يكن صوت عربي مثبّتًا، يتقدّم الفيديو مع الترجمة النصية."),
 vnone:X0("Aucune voix française n'est installée sur cet appareil : la vidéo avance avec les sous-titres.","لا يوجد صوت عربي مثبّت على هذا الجهاز: يتقدّم الفيديو مع الترجمة النصية."),
 chapH:X0("Revoir une scène","إعادة مشاهدة مشهد"),
 glossH:X0("Les mots de la leçon","كلمات الدرس"),
 quizH:X0("Quiz","الاختبار"),
 quizLead:X0("Les questions portent uniquement sur la leçon. Tu peux refaire celles que tu as ratées.","الأسئلة تخصّ الدرس فقط. يمكنك إعادة الأسئلة التي أخطأتِ فيها."),
 good:X0("Bonne réponse.","إجابة صحيحة."),bad:X0("Ce n'est pas ça.","ليست هذه الإجابة."),
 score:X0("{a} bonne(s) réponse(s) sur {b}.","{a} إجابات صحيحة من {b}."),
 retry:X0("Refaire les questions ratées","إعادة الأسئلة الخاطئة"),
 quizOk:X0("{a} sur {b} : leçon maîtrisée.","{a} من {b}: الدرس متقَن."),
 sceneN:X0("scène {a}","المشهد {a}"),Q:X0("Q","س"),fr:X0("","بالفرنسية:"),
 nextL:X0("Leçon suivante : {a}","الدرس التالي: {a}"),nextGo:X0("Commencer","ابدئي"),
 lastL:X0("C'est la dernière leçon disponible pour l'instant.","هذا آخر درس متوفّر حاليًا."),srcs:X0("Sources des chiffres :","مصادر الأرقام:"),toProg:X0("Voir le programme","عرض البرنامج")
};
const T=(k,v)=>{let s=UI[k][lang];if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s};
