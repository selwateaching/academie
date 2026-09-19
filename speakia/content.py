"""
Contenu pédagogique de SpeakIA.

Chaque niveau contient des leçons ; chaque leçon contient des étapes
("steps"). Chaque étape a un type d'exercice (vocab / mcq / listen / fill /
speak / recap) et une liste d'items. Le moteur JS (lesson-engine.js) sait
afficher chacun de ces types de façon interactive, à l'écrit comme à l'oral.

Pédagogie : Néo n'affiche jamais la traduction en premier. Il pose une
question, donne un indice en arabe si l'enfant se trompe, puis félicite en
anglais. L'arabe sert de langue d'appui, l'anglais est toujours la langue
qu'on pratique à voix haute.
"""

LEVELS = [
    {
        "level": 1,
        "title_fr": "Débutant",
        "title_ar": "مبتدئ",
        "subtitle_fr": "Les tout premiers mots d'anglais",
        "color": "#0B7A75",
        "icon": "🌱",
        "lessons": [
            {
                "id": "animals-1",
                "level": 1,
                "order": 1,
                "title_fr": "Les animaux",
                "title_ar": "الحيوانات",
                "icon": "🐱",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "cat", "ar": "قطة", "emoji": "🐱"},
                            {"en": "dog", "ar": "كلب", "emoji": "🐶"},
                            {"en": "bird", "ar": "عصفور", "emoji": "🐦"},
                            {"en": "fish", "ar": "سمكة", "emoji": "🐟"},
                            {"en": "lion", "ar": "أسد", "emoji": "🦁"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "كيف نقول «قطة» بالإنجليزية؟",
                                "options": [
                                    {"label": "dog", "emoji": "🐶"},
                                    {"label": "cat", "emoji": "🐱"},
                                    {"label": "fish", "emoji": "🐟"},
                                ],
                                "answer": "cat",
                                "hint_ar": "فكّر في الحيوان الذي يقول «مياو» وليس الذي ينبح.",
                            },
                            {
                                "question_ar": "أي حيوان هذا؟ 🦁",
                                "options": [
                                    {"label": "lion", "emoji": "🦁"},
                                    {"label": "dog", "emoji": "🐶"},
                                    {"label": "bird", "emoji": "🐦"},
                                ],
                                "answer": "lion",
                                "hint_ar": "إنه ملك الغابة، ويقول Roar!",
                            },
                            {
                                "question_ar": "ما معنى كلمة bird بالعربية؟",
                                "options": [
                                    {"label": "قطة"},
                                    {"label": "عصفور"},
                                    {"label": "سمكة"},
                                ],
                                "answer": "عصفور",
                                "hint_ar": "إنه يطير في السماء ويغرّد.",
                            },
                            {
                                "question_ar": "أي حيوان يعيش في الماء؟",
                                "options": [
                                    {"label": "cat", "emoji": "🐱"},
                                    {"label": "fish", "emoji": "🐟"},
                                    {"label": "dog", "emoji": "🐶"},
                                ],
                                "answer": "fish",
                                "hint_ar": "إنه يسبح ولا يستطيع العيش خارج الماء.",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر الصورة الصحيحة",
                        "items": [
                            {
                                "audio_en": "Point to the cat.",
                                "options": [
                                    {"emoji": "🐱", "label_ar": "قطة"},
                                    {"emoji": "🐶", "label_ar": "كلب"},
                                    {"emoji": "🐦", "label_ar": "عصفور"},
                                ],
                                "answer_emoji": "🐱",
                            },
                            {
                                "audio_en": "Point to the fish.",
                                "options": [
                                    {"emoji": "🐟", "label_ar": "سمكة"},
                                    {"emoji": "🦁", "label_ar": "أسد"},
                                    {"emoji": "🐶", "label_ar": "كلب"},
                                ],
                                "answer_emoji": "🐟",
                            },
                            {
                                "audio_en": "Point to the lion.",
                                "options": [
                                    {"emoji": "🦁", "label_ar": "أسد"},
                                    {"emoji": "🐱", "label_ar": "قطة"},
                                    {"emoji": "🐦", "label_ar": "عصفور"},
                                ],
                                "answer_emoji": "🦁",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "The ___ says Woof!",
                                "options": ["cat", "dog", "bird"],
                                "answer": "dog",
                                "translation_ar": "الكلب يقول واو!",
                            },
                            {
                                "sentence": "The ___ can fly.",
                                "options": ["fish", "bird", "lion"],
                                "answer": "bird",
                                "translation_ar": "العصفور يستطيع الطيران.",
                            },
                            {
                                "sentence": "The ___ is the king of the jungle.",
                                "options": ["cat", "fish", "lion"],
                                "answer": "lion",
                                "translation_ar": "الأسد ملك الغابة.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "I have a cat.", "translation_ar": "لدي قطة."},
                            {"phrase_en": "The lion is big.", "translation_ar": "الأسد كبير."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "أي كلمة تعني «سمكة»؟",
                                "options": [
                                    {"label": "fish", "emoji": "🐟"},
                                    {"label": "cat", "emoji": "🐱"},
                                    {"label": "bird", "emoji": "🐦"},
                                ],
                                "answer": "fish",
                                "hint_ar": "إنها تسبح في الماء.",
                            },
                            {
                                "question_ar": "ما معنى bird؟",
                                "options": [{"label": "كلب"}, {"label": "عصفور"}, {"label": "أسد"}],
                                "answer": "عصفور",
                                "hint_ar": "إنه يطير.",
                            },
                            {
                                "question_ar": "أكمل: The ___ is black.",
                                "options": [
                                    {"label": "cat", "emoji": "🐱"},
                                    {"label": "fish", "emoji": "🐟"},
                                    {"label": "bird", "emoji": "🐦"},
                                ],
                                "answer": "cat",
                                "hint_ar": "حيوان أليف يعيش في البيت.",
                            },
                            {
                                "question_ar": "أي حيوان يسبح؟",
                                "options": [
                                    {"label": "dog", "emoji": "🐶"},
                                    {"label": "fish", "emoji": "🐟"},
                                    {"label": "lion", "emoji": "🦁"},
                                ],
                                "answer": "fish",
                                "hint_ar": "يعيش في البحر أو في حوض الماء.",
                            },
                            {
                                "question_ar": "كيف نقول «أسد»؟",
                                "options": [
                                    {"label": "lion", "emoji": "🦁"},
                                    {"label": "dog", "emoji": "🐶"},
                                    {"label": "cat", "emoji": "🐱"},
                                ],
                                "answer": "lion",
                                "hint_ar": "ملك الغابة.",
                            },
                        ],
                    },
                ],
            },
            {
                "id": "colors-1",
                "level": 1,
                "order": 2,
                "title_fr": "Les couleurs",
                "title_ar": "الألوان",
                "icon": "🎨",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "red", "ar": "أحمر", "emoji": "🔴"},
                            {"en": "blue", "ar": "أزرق", "emoji": "🔵"},
                            {"en": "yellow", "ar": "أصفر", "emoji": "🟡"},
                            {"en": "green", "ar": "أخضر", "emoji": "🟢"},
                            {"en": "black", "ar": "أسود", "emoji": "⚫"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "ما هو لون الموز؟ 🍌",
                                "options": [
                                    {"label": "yellow", "emoji": "🟡"},
                                    {"label": "red", "emoji": "🔴"},
                                    {"label": "blue", "emoji": "🔵"},
                                ],
                                "answer": "yellow",
                                "hint_ar": "إنه لون الشمس أيضاً.",
                            },
                            {
                                "question_ar": "كيف نقول «أحمر»؟",
                                "options": [
                                    {"label": "red", "emoji": "🔴"},
                                    {"label": "blue", "emoji": "🔵"},
                                    {"label": "green", "emoji": "🟢"},
                                ],
                                "answer": "red",
                                "hint_ar": "لون الفراولة والتفاح.",
                            },
                            {
                                "question_ar": "ما معنى green؟",
                                "options": [{"label": "أزرق"}, {"label": "أخضر"}, {"label": "أسود"}],
                                "answer": "أخضر",
                                "hint_ar": "لون أوراق الشجر.",
                            },
                            {
                                "question_ar": "ما هو لون السماء؟ ☁️",
                                "options": [
                                    {"label": "blue", "emoji": "🔵"},
                                    {"label": "black", "emoji": "⚫"},
                                    {"label": "yellow", "emoji": "🟡"},
                                ],
                                "answer": "blue",
                                "hint_ar": "نراها فوقنا في النهار.",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر اللون الصحيح",
                        "items": [
                            {
                                "audio_en": "Point to red.",
                                "options": [
                                    {"emoji": "🔴", "label_ar": "أحمر"},
                                    {"emoji": "🟢", "label_ar": "أخضر"},
                                    {"emoji": "🟡", "label_ar": "أصفر"},
                                ],
                                "answer_emoji": "🔴",
                            },
                            {
                                "audio_en": "Point to green.",
                                "options": [
                                    {"emoji": "🟢", "label_ar": "أخضر"},
                                    {"emoji": "🔵", "label_ar": "أزرق"},
                                    {"emoji": "⚫", "label_ar": "أسود"},
                                ],
                                "answer_emoji": "🟢",
                            },
                            {
                                "audio_en": "Point to black.",
                                "options": [
                                    {"emoji": "⚫", "label_ar": "أسود"},
                                    {"emoji": "🔴", "label_ar": "أحمر"},
                                    {"emoji": "🔵", "label_ar": "أزرق"},
                                ],
                                "answer_emoji": "⚫",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "The sky is ___.",
                                "options": ["blue", "red", "yellow"],
                                "answer": "blue",
                                "translation_ar": "السماء زرقاء.",
                            },
                            {
                                "sentence": "The sun is ___.",
                                "options": ["yellow", "black", "green"],
                                "answer": "yellow",
                                "translation_ar": "الشمس صفراء.",
                            },
                            {
                                "sentence": "My cat is ___.",
                                "options": ["black", "blue", "green"],
                                "answer": "black",
                                "translation_ar": "قطتي سوداء.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "The sky is blue.", "translation_ar": "السماء زرقاء."},
                            {"phrase_en": "I like green.", "translation_ar": "أحب اللون الأخضر."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "أي كلمة تعني «أزرق»؟",
                                "options": [
                                    {"label": "blue", "emoji": "🔵"},
                                    {"label": "red", "emoji": "🔴"},
                                    {"label": "black", "emoji": "⚫"},
                                ],
                                "answer": "blue",
                                "hint_ar": "لون السماء والبحر.",
                            },
                            {
                                "question_ar": "ما معنى yellow؟",
                                "options": [{"label": "أصفر"}, {"label": "أخضر"}, {"label": "أحمر"}],
                                "answer": "أصفر",
                                "hint_ar": "لون الشمس والموز.",
                            },
                            {
                                "question_ar": "أكمل: My shoes are ___.",
                                "options": [
                                    {"label": "black", "emoji": "⚫"},
                                    {"label": "blue", "emoji": "🔵"},
                                    {"label": "red", "emoji": "🔴"},
                                ],
                                "answer": "black",
                                "hint_ar": "اختر أي لون يبدو منطقياً!",
                            },
                            {
                                "question_ar": "كيف نقول «أخضر»؟",
                                "options": [
                                    {"label": "green", "emoji": "🟢"},
                                    {"label": "yellow", "emoji": "🟡"},
                                    {"label": "red", "emoji": "🔴"},
                                ],
                                "answer": "green",
                                "hint_ar": "لون أوراق الشجر والعشب.",
                            },
                            {
                                "question_ar": "ما لون التفاحة الناضجة عادةً؟",
                                "options": [
                                    {"label": "red", "emoji": "🔴"},
                                    {"label": "blue", "emoji": "🔵"},
                                    {"label": "black", "emoji": "⚫"},
                                ],
                                "answer": "red",
                                "hint_ar": "إنه أيضاً لون الفراولة.",
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        "level": 2,
        "title_fr": "Élémentaire",
        "title_ar": "أساسي",
        "subtitle_fr": "Parler de soi et compter",
        "color": "#2BB3A3",
        "icon": "🌿",
        "lessons": [
            {
                "id": "family-1",
                "level": 2,
                "order": 1,
                "title_fr": "Ma famille",
                "title_ar": "عائلتي",
                "icon": "👨‍👩‍👧‍👦",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "mother", "ar": "أم", "emoji": "👩"},
                            {"en": "father", "ar": "أب", "emoji": "👨"},
                            {"en": "sister", "ar": "أخت", "emoji": "👧"},
                            {"en": "brother", "ar": "أخ", "emoji": "👦"},
                            {"en": "baby", "ar": "طفل رضيع", "emoji": "👶"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "كيف نقول «أم» بالإنجليزية؟",
                                "options": [
                                    {"label": "mother", "emoji": "👩"},
                                    {"label": "father", "emoji": "👨"},
                                    {"label": "sister", "emoji": "👧"},
                                ],
                                "answer": "mother",
                                "hint_ar": "هي التي تعتني بك كل يوم.",
                            },
                            {
                                "question_ar": "ما معنى brother؟",
                                "options": [{"label": "أخ"}, {"label": "أخت"}, {"label": "أب"}],
                                "answer": "أخ",
                                "hint_ar": "إنه شقيقك الذكر.",
                            },
                            {
                                "question_ar": "من هو father؟",
                                "options": [
                                    {"label": "👨"},
                                    {"label": "👩"},
                                    {"label": "👧"},
                                ],
                                "answer": "👨",
                                "hint_ar": "هو الرجل في العائلة.",
                            },
                            {
                                "question_ar": "أي كلمة تعني «أخت»؟",
                                "options": [
                                    {"label": "sister", "emoji": "👧"},
                                    {"label": "brother", "emoji": "👦"},
                                    {"label": "baby", "emoji": "👶"},
                                ],
                                "answer": "sister",
                                "hint_ar": "إنها شقيقتك الأنثى.",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر الصورة الصحيحة",
                        "items": [
                            {
                                "audio_en": "Point to the mother.",
                                "options": [
                                    {"emoji": "👩", "label_ar": "أم"},
                                    {"emoji": "👨", "label_ar": "أب"},
                                    {"emoji": "👦", "label_ar": "أخ"},
                                ],
                                "answer_emoji": "👩",
                            },
                            {
                                "audio_en": "Point to the brother.",
                                "options": [
                                    {"emoji": "👦", "label_ar": "أخ"},
                                    {"emoji": "👧", "label_ar": "أخت"},
                                    {"emoji": "👶", "label_ar": "طفل رضيع"},
                                ],
                                "answer_emoji": "👦",
                            },
                            {
                                "audio_en": "Point to the baby.",
                                "options": [
                                    {"emoji": "👶", "label_ar": "طفل رضيع"},
                                    {"emoji": "👨", "label_ar": "أب"},
                                    {"emoji": "👧", "label_ar": "أخت"},
                                ],
                                "answer_emoji": "👶",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "This is my ___. 👩",
                                "options": ["mother", "father", "sister"],
                                "answer": "mother",
                                "translation_ar": "هذه أمي.",
                            },
                            {
                                "sentence": "I love my ___. 👦",
                                "options": ["brother", "sister", "baby"],
                                "answer": "brother",
                                "translation_ar": "أحب أخي.",
                            },
                            {
                                "sentence": "The ___ is sleeping. 👶",
                                "options": ["baby", "father", "mother"],
                                "answer": "baby",
                                "translation_ar": "الطفل الرضيع نائم.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "This is my mother.", "translation_ar": "هذه أمي."},
                            {"phrase_en": "I have one brother.", "translation_ar": "لدي أخ واحد."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "أي كلمة تعني «أب»؟",
                                "options": [
                                    {"label": "father", "emoji": "👨"},
                                    {"label": "mother", "emoji": "👩"},
                                    {"label": "sister", "emoji": "👧"},
                                ],
                                "answer": "father",
                                "hint_ar": "هو والدك.",
                            },
                            {
                                "question_ar": "ما معنى baby؟",
                                "options": [{"label": "طفل رضيع"}, {"label": "أخ"}, {"label": "أم"}],
                                "answer": "طفل رضيع",
                                "hint_ar": "أصغر فرد في العائلة.",
                            },
                            {
                                "question_ar": "أكمل: I love my ___.",
                                "options": [
                                    {"label": "sister", "emoji": "👧"},
                                    {"label": "shoes"},
                                    {"label": "school"},
                                ],
                                "answer": "sister",
                                "hint_ar": "اختر فرداً من العائلة.",
                            },
                            {
                                "question_ar": "كيف نقول «أخ»؟",
                                "options": [
                                    {"label": "brother", "emoji": "👦"},
                                    {"label": "father", "emoji": "👨"},
                                    {"label": "baby", "emoji": "👶"},
                                ],
                                "answer": "brother",
                                "hint_ar": "شقيقك الذكر.",
                            },
                            {
                                "question_ar": "من يعتني بالطفل الرضيع عادةً؟",
                                "options": [
                                    {"label": "mother", "emoji": "👩"},
                                    {"label": "baby", "emoji": "👶"},
                                    {"label": "brother", "emoji": "👦"},
                                ],
                                "answer": "mother",
                                "hint_ar": "غالباً الأم أو الأب.",
                            },
                        ],
                    },
                ],
            },
            {
                "id": "numbers-1",
                "level": 2,
                "order": 2,
                "title_fr": "Les nombres",
                "title_ar": "الأرقام",
                "icon": "🔢",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "one", "ar": "واحد", "emoji": "1️⃣"},
                            {"en": "two", "ar": "اثنان", "emoji": "2️⃣"},
                            {"en": "three", "ar": "ثلاثة", "emoji": "3️⃣"},
                            {"en": "four", "ar": "أربعة", "emoji": "4️⃣"},
                            {"en": "five", "ar": "خمسة", "emoji": "5️⃣"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "كيف نقول «ثلاثة»؟",
                                "options": [
                                    {"label": "three", "emoji": "3️⃣"},
                                    {"label": "two", "emoji": "2️⃣"},
                                    {"label": "five", "emoji": "5️⃣"},
                                ],
                                "answer": "three",
                                "hint_ar": "إنه بعد اثنين مباشرة.",
                            },
                            {
                                "question_ar": "ما معنى four؟",
                                "options": [{"label": "أربعة"}, {"label": "اثنان"}, {"label": "خمسة"}],
                                "answer": "أربعة",
                                "hint_ar": "الرقم بين ثلاثة وخمسة.",
                            },
                            {
                                "question_ar": "two + one = ؟ (بالإنجليزية)",
                                "options": [
                                    {"label": "three", "emoji": "3️⃣"},
                                    {"label": "four", "emoji": "4️⃣"},
                                    {"label": "one", "emoji": "1️⃣"},
                                ],
                                "answer": "three",
                                "hint_ar": "احسب: 2 + 1.",
                            },
                            {
                                "question_ar": "أي رقم هذا؟ 5️⃣",
                                "options": [
                                    {"label": "five", "emoji": "5️⃣"},
                                    {"label": "four", "emoji": "4️⃣"},
                                    {"label": "two", "emoji": "2️⃣"},
                                ],
                                "answer": "five",
                                "hint_ar": "عدد أصابع يد واحدة!",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر الرقم الصحيح",
                        "items": [
                            {
                                "audio_en": "Point to number two.",
                                "options": [
                                    {"emoji": "2️⃣", "label_ar": "اثنان"},
                                    {"emoji": "4️⃣", "label_ar": "أربعة"},
                                    {"emoji": "1️⃣", "label_ar": "واحد"},
                                ],
                                "answer_emoji": "2️⃣",
                            },
                            {
                                "audio_en": "Point to number five.",
                                "options": [
                                    {"emoji": "5️⃣", "label_ar": "خمسة"},
                                    {"emoji": "3️⃣", "label_ar": "ثلاثة"},
                                    {"emoji": "2️⃣", "label_ar": "اثنان"},
                                ],
                                "answer_emoji": "5️⃣",
                            },
                            {
                                "audio_en": "Point to number one.",
                                "options": [
                                    {"emoji": "1️⃣", "label_ar": "واحد"},
                                    {"emoji": "4️⃣", "label_ar": "أربعة"},
                                    {"emoji": "5️⃣", "label_ar": "خمسة"},
                                ],
                                "answer_emoji": "1️⃣",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "I have ___ apples. 🍎🍎",
                                "options": ["two", "three", "one"],
                                "answer": "two",
                                "translation_ar": "لدي تفاحتان.",
                            },
                            {
                                "sentence": "She has ___ cats. 🐱🐱🐱",
                                "options": ["three", "two", "five"],
                                "answer": "three",
                                "translation_ar": "لديها ثلاث قطط.",
                            },
                            {
                                "sentence": "He is ___ years old. 5️⃣",
                                "options": ["five", "four", "one"],
                                "answer": "five",
                                "translation_ar": "عمره خمس سنوات.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "I am five years old.", "translation_ar": "عمري خمس سنوات."},
                            {"phrase_en": "I have two hands.", "translation_ar": "لدي يدان."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "كيف نقول «واحد»؟",
                                "options": [
                                    {"label": "one", "emoji": "1️⃣"},
                                    {"label": "four", "emoji": "4️⃣"},
                                    {"label": "three", "emoji": "3️⃣"},
                                ],
                                "answer": "one",
                                "hint_ar": "أول رقم!",
                            },
                            {
                                "question_ar": "ما معنى two؟",
                                "options": [{"label": "اثنان"}, {"label": "أربعة"}, {"label": "خمسة"}],
                                "answer": "اثنان",
                                "hint_ar": "عدد عينيك!",
                            },
                            {
                                "question_ar": "three + one = ؟",
                                "options": [
                                    {"label": "four", "emoji": "4️⃣"},
                                    {"label": "five", "emoji": "5️⃣"},
                                    {"label": "two", "emoji": "2️⃣"},
                                ],
                                "answer": "four",
                                "hint_ar": "احسب: 3 + 1.",
                            },
                            {
                                "question_ar": "أي رقم هذا؟ 4️⃣",
                                "options": [
                                    {"label": "four", "emoji": "4️⃣"},
                                    {"label": "one", "emoji": "1️⃣"},
                                    {"label": "five", "emoji": "5️⃣"},
                                ],
                                "answer": "four",
                                "hint_ar": "بين ثلاثة وخمسة.",
                            },
                            {
                                "question_ar": "كيف نقول «خمسة»؟",
                                "options": [
                                    {"label": "five", "emoji": "5️⃣"},
                                    {"label": "two", "emoji": "2️⃣"},
                                    {"label": "three", "emoji": "3️⃣"},
                                ],
                                "answer": "five",
                                "hint_ar": "عدد أصابع اليد الواحدة.",
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        "level": 3,
        "title_fr": "Intermédiaire",
        "title_ar": "متوسط",
        "subtitle_fr": "Raconter sa journée",
        "color": "#F0602F",
        "icon": "☀️",
        "lessons": [
            {
                "id": "routine-1",
                "level": 3,
                "order": 1,
                "title_fr": "Ma journée",
                "title_ar": "يومي",
                "icon": "⏰",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "wake up", "ar": "أستيقظ", "emoji": "⏰"},
                            {"en": "eat breakfast", "ar": "أتناول الفطور", "emoji": "🍳"},
                            {"en": "go to school", "ar": "أذهب إلى المدرسة", "emoji": "🎒"},
                            {"en": "play", "ar": "ألعب", "emoji": "⚽"},
                            {"en": "sleep", "ar": "أنام", "emoji": "🌙"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "ماذا تفعل الساعة السابعة صباحاً؟",
                                "options": [
                                    {"label": "wake up", "emoji": "⏰"},
                                    {"label": "sleep", "emoji": "🌙"},
                                    {"label": "play", "emoji": "⚽"},
                                ],
                                "answer": "wake up",
                                "hint_ar": "أول شيء تفعله في الصباح.",
                            },
                            {
                                "question_ar": "ما معنى go to school؟",
                                "options": [
                                    {"label": "ألعب"},
                                    {"label": "أذهب إلى المدرسة"},
                                    {"label": "أنام"},
                                ],
                                "answer": "أذهب إلى المدرسة",
                                "hint_ar": "المكان الذي تتعلم فيه.",
                            },
                            {
                                "question_ar": "متى نقول sleep؟",
                                "options": [
                                    {"label": "في الليل"},
                                    {"label": "في الصباح"},
                                    {"label": "في المدرسة"},
                                ],
                                "answer": "في الليل",
                                "hint_ar": "عندما تشعر بالتعب وتذهب إلى السرير.",
                            },
                            {
                                "question_ar": "أي فعل يدل على الطعام؟",
                                "options": [
                                    {"label": "eat breakfast", "emoji": "🍳"},
                                    {"label": "play", "emoji": "⚽"},
                                    {"label": "sleep", "emoji": "🌙"},
                                ],
                                "answer": "eat breakfast",
                                "hint_ar": "أول وجبة في اليوم.",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر الصورة الصحيحة",
                        "items": [
                            {
                                "audio_en": "I wake up.",
                                "options": [
                                    {"emoji": "⏰", "label_ar": "أستيقظ"},
                                    {"emoji": "🌙", "label_ar": "أنام"},
                                    {"emoji": "⚽", "label_ar": "ألعب"},
                                ],
                                "answer_emoji": "⏰",
                            },
                            {
                                "audio_en": "I go to school.",
                                "options": [
                                    {"emoji": "🎒", "label_ar": "أذهب إلى المدرسة"},
                                    {"emoji": "🍳", "label_ar": "أتناول الفطور"},
                                    {"emoji": "🌙", "label_ar": "أنام"},
                                ],
                                "answer_emoji": "🎒",
                            },
                            {
                                "audio_en": "I play football.",
                                "options": [
                                    {"emoji": "⚽", "label_ar": "ألعب"},
                                    {"emoji": "⏰", "label_ar": "أستيقظ"},
                                    {"emoji": "🍳", "label_ar": "أتناول الفطور"},
                                ],
                                "answer_emoji": "⚽",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "Every morning, I ___.",
                                "options": ["wake up", "sleep", "play"],
                                "answer": "wake up",
                                "translation_ar": "كل صباح، أستيقظ.",
                            },
                            {
                                "sentence": "After school, I ___ with my friends.",
                                "options": ["play", "sleep", "eat breakfast"],
                                "answer": "play",
                                "translation_ar": "بعد المدرسة، ألعب مع أصدقائي.",
                            },
                            {
                                "sentence": "At night, I ___.",
                                "options": ["sleep", "wake up", "go to school"],
                                "answer": "sleep",
                                "translation_ar": "في الليل، أنام.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "I wake up at seven.", "translation_ar": "أستيقظ الساعة السابعة."},
                            {"phrase_en": "I go to school every day.", "translation_ar": "أذهب إلى المدرسة كل يوم."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "كيف نقول «ألعب»؟",
                                "options": [
                                    {"label": "play", "emoji": "⚽"},
                                    {"label": "sleep", "emoji": "🌙"},
                                    {"label": "wake up", "emoji": "⏰"},
                                ],
                                "answer": "play",
                                "hint_ar": "ما تفعله مع الكرة أو الأصدقاء.",
                            },
                            {
                                "question_ar": "ما معنى wake up؟",
                                "options": [{"label": "أستيقظ"}, {"label": "أنام"}, {"label": "ألعب"}],
                                "answer": "أستيقظ",
                                "hint_ar": "عكس sleep.",
                            },
                            {
                                "question_ar": "أكمل: I ___ breakfast every morning.",
                                "options": [
                                    {"label": "eat", "emoji": "🍳"},
                                    {"label": "sleep", "emoji": "🌙"},
                                    {"label": "play", "emoji": "⚽"},
                                ],
                                "answer": "eat",
                                "hint_ar": "ما تفعله بالطعام.",
                            },
                            {
                                "question_ar": "متى تذهب إلى المدرسة؟",
                                "options": [
                                    {"label": "in the morning"},
                                    {"label": "at night"},
                                    {"label": "in the evening"},
                                ],
                                "answer": "in the morning",
                                "hint_ar": "بعد أن تستيقظ وتتناول الفطور.",
                            },
                            {
                                "question_ar": "أي فعل يأتي أخيراً في اليوم؟",
                                "options": [
                                    {"label": "sleep", "emoji": "🌙"},
                                    {"label": "wake up", "emoji": "⏰"},
                                    {"label": "go to school", "emoji": "🎒"},
                                ],
                                "answer": "sleep",
                                "hint_ar": "آخر شيء تفعله قبل يوم جديد.",
                            },
                        ],
                    },
                ],
            },
            {
                "id": "food-1",
                "level": 3,
                "order": 2,
                "title_fr": "La nourriture",
                "title_ar": "الطعام",
                "icon": "🍎",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "apple", "ar": "تفاحة", "emoji": "🍎"},
                            {"en": "bread", "ar": "خبز", "emoji": "🍞"},
                            {"en": "milk", "ar": "حليب", "emoji": "🥛"},
                            {"en": "rice", "ar": "أرز", "emoji": "🍚"},
                            {"en": "water", "ar": "ماء", "emoji": "💧"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "كيف نقول «أنا أحب» بالإنجليزية؟",
                                "options": [
                                    {"label": "I like"},
                                    {"label": "I have"},
                                    {"label": "I go"},
                                ],
                                "answer": "I like",
                                "hint_ar": "نستخدمها للتعبير عمّا يعجبنا.",
                            },
                            {
                                "question_ar": "ما معنى bread؟",
                                "options": [{"label": "خبز"}, {"label": "أرز"}, {"label": "ماء"}],
                                "answer": "خبز",
                                "hint_ar": "نأكله في الفطور غالباً.",
                            },
                            {
                                "question_ar": "أي كلمة تعني «حليب»؟",
                                "options": [
                                    {"label": "milk", "emoji": "🥛"},
                                    {"label": "water", "emoji": "💧"},
                                    {"label": "rice", "emoji": "🍚"},
                                ],
                                "answer": "milk",
                                "hint_ar": "مشروب أبيض من البقرة.",
                            },
                            {
                                "question_ar": "كيف نقول «أنا لا أحب»؟",
                                "options": [
                                    {"label": "I don't like"},
                                    {"label": "I like"},
                                    {"label": "I am"},
                                ],
                                "answer": "I don't like",
                                "hint_ar": "نضيف don't للنفي.",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر الصورة الصحيحة",
                        "items": [
                            {
                                "audio_en": "I like apples.",
                                "options": [
                                    {"emoji": "🍎", "label_ar": "تفاحة"},
                                    {"emoji": "🍚", "label_ar": "أرز"},
                                    {"emoji": "🍞", "label_ar": "خبز"},
                                ],
                                "answer_emoji": "🍎",
                            },
                            {
                                "audio_en": "I drink water.",
                                "options": [
                                    {"emoji": "💧", "label_ar": "ماء"},
                                    {"emoji": "🥛", "label_ar": "حليب"},
                                    {"emoji": "🍎", "label_ar": "تفاحة"},
                                ],
                                "answer_emoji": "💧",
                            },
                            {
                                "audio_en": "I eat rice.",
                                "options": [
                                    {"emoji": "🍚", "label_ar": "أرز"},
                                    {"emoji": "🍞", "label_ar": "خبز"},
                                    {"emoji": "💧", "label_ar": "ماء"},
                                ],
                                "answer_emoji": "🍚",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "I like ___. 🍎",
                                "options": ["apples", "water", "bread"],
                                "answer": "apples",
                                "translation_ar": "أحب التفاح.",
                            },
                            {
                                "sentence": "I drink ___ every morning. 🥛",
                                "options": ["milk", "rice", "bread"],
                                "answer": "milk",
                                "translation_ar": "أشرب الحليب كل صباح.",
                            },
                            {
                                "sentence": "I eat ___ with my family. 🍞",
                                "options": ["bread", "water", "milk"],
                                "answer": "bread",
                                "translation_ar": "آكل الخبز مع عائلتي.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "I like apples.", "translation_ar": "أحب التفاح."},
                            {"phrase_en": "I drink water every day.", "translation_ar": "أشرب الماء كل يوم."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "أي كلمة تعني «ماء»؟",
                                "options": [
                                    {"label": "water", "emoji": "💧"},
                                    {"label": "milk", "emoji": "🥛"},
                                    {"label": "rice", "emoji": "🍚"},
                                ],
                                "answer": "water",
                                "hint_ar": "نشربه ونحتاجه كل يوم.",
                            },
                            {
                                "question_ar": "ما معنى apple؟",
                                "options": [{"label": "تفاحة"}, {"label": "خبز"}, {"label": "أرز"}],
                                "answer": "تفاحة",
                                "hint_ar": "فاكهة حمراء أو خضراء.",
                            },
                            {
                                "question_ar": "أكمل: I ___ rice.",
                                "options": [
                                    {"label": "like"},
                                    {"label": "sleep"},
                                    {"label": "wake up"},
                                ],
                                "answer": "like",
                                "hint_ar": "نعبّر عمّا يعجبنا من الطعام.",
                            },
                            {
                                "question_ar": "كيف نقول «خبز»؟",
                                "options": [
                                    {"label": "bread", "emoji": "🍞"},
                                    {"label": "milk", "emoji": "🥛"},
                                    {"label": "water", "emoji": "💧"},
                                ],
                                "answer": "bread",
                                "hint_ar": "نأكله في الفطور.",
                            },
                            {
                                "question_ar": "ما هو أرز بالإنجليزية؟",
                                "options": [
                                    {"label": "rice", "emoji": "🍚"},
                                    {"label": "apple", "emoji": "🍎"},
                                    {"label": "milk", "emoji": "🥛"},
                                ],
                                "answer": "rice",
                                "hint_ar": "حبوب بيضاء صغيرة نطبخها.",
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        "level": 4,
        "title_fr": "Avancé",
        "title_ar": "متقدم",
        "subtitle_fr": "Exprimer ses émotions et raconter le passé",
        "color": "#CF4318",
        "icon": "🚀",
        "lessons": [
            {
                "id": "feelings-1",
                "level": 4,
                "order": 1,
                "title_fr": "Les émotions",
                "title_ar": "المشاعر",
                "icon": "😊",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "happy", "ar": "سعيد", "emoji": "😊"},
                            {"en": "sad", "ar": "حزين", "emoji": "😢"},
                            {"en": "tired", "ar": "متعب", "emoji": "😴"},
                            {"en": "angry", "ar": "غاضب", "emoji": "😠"},
                            {"en": "scared", "ar": "خائف", "emoji": "😨"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "كيف نقول «سعيد»؟",
                                "options": [
                                    {"label": "happy", "emoji": "😊"},
                                    {"label": "sad", "emoji": "😢"},
                                    {"label": "tired", "emoji": "😴"},
                                ],
                                "answer": "happy",
                                "hint_ar": "ما تشعر به عند اللعب أو الاحتفال.",
                            },
                            {
                                "question_ar": "ما معنى angry؟",
                                "options": [{"label": "حزين"}, {"label": "غاضب"}, {"label": "خائف"}],
                                "answer": "غاضب",
                                "hint_ar": "ما تشعر به عندما يزعجك أحد.",
                            },
                            {
                                "question_ar": "متى نشعر بـ tired؟",
                                "options": [
                                    {"label": "بعد يوم طويل"},
                                    {"label": "بعد الاستيقاظ مباشرة"},
                                    {"label": "عند اللعب"},
                                ],
                                "answer": "بعد يوم طويل",
                                "hint_ar": "عندما نحتاج إلى الراحة أو النوم.",
                            },
                            {
                                "question_ar": "أي كلمة تعني «خائف»؟",
                                "options": [
                                    {"label": "scared", "emoji": "😨"},
                                    {"label": "happy", "emoji": "😊"},
                                    {"label": "sad", "emoji": "😢"},
                                ],
                                "answer": "scared",
                                "hint_ar": "ما تشعر به في فيلم مرعب.",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر الصورة الصحيحة",
                        "items": [
                            {
                                "audio_en": "I feel happy.",
                                "options": [
                                    {"emoji": "😊", "label_ar": "سعيد"},
                                    {"emoji": "😢", "label_ar": "حزين"},
                                    {"emoji": "😠", "label_ar": "غاضب"},
                                ],
                                "answer_emoji": "😊",
                            },
                            {
                                "audio_en": "I feel tired.",
                                "options": [
                                    {"emoji": "😴", "label_ar": "متعب"},
                                    {"emoji": "😨", "label_ar": "خائف"},
                                    {"emoji": "😊", "label_ar": "سعيد"},
                                ],
                                "answer_emoji": "😴",
                            },
                            {
                                "audio_en": "I feel scared.",
                                "options": [
                                    {"emoji": "😨", "label_ar": "خائف"},
                                    {"emoji": "😢", "label_ar": "حزين"},
                                    {"emoji": "😴", "label_ar": "متعب"},
                                ],
                                "answer_emoji": "😨",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "I feel ___ because I got a gift! 🎁",
                                "options": ["happy", "sad", "angry"],
                                "answer": "happy",
                                "translation_ar": "أشعر بالسعادة لأنني حصلت على هدية!",
                            },
                            {
                                "sentence": "I feel ___ because I am sick.",
                                "options": ["sad", "happy", "tired"],
                                "answer": "sad",
                                "translation_ar": "أشعر بالحزن لأنني مريض.",
                            },
                            {
                                "sentence": "I feel ___ after a long day.",
                                "options": ["tired", "happy", "scared"],
                                "answer": "tired",
                                "translation_ar": "أشعر بالتعب بعد يوم طويل.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "I feel happy today.", "translation_ar": "أشعر بالسعادة اليوم."},
                            {"phrase_en": "I am tired.", "translation_ar": "أنا متعب."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "أي كلمة تعني «حزين»؟",
                                "options": [
                                    {"label": "sad", "emoji": "😢"},
                                    {"label": "happy", "emoji": "😊"},
                                    {"label": "angry", "emoji": "😠"},
                                ],
                                "answer": "sad",
                                "hint_ar": "عكس happy.",
                            },
                            {
                                "question_ar": "ما معنى scared؟",
                                "options": [{"label": "خائف"}, {"label": "متعب"}, {"label": "سعيد"}],
                                "answer": "خائف",
                                "hint_ar": "ما تشعر به من شيء مخيف.",
                            },
                            {
                                "question_ar": "أكمل: I feel ___ when someone breaks my toy.",
                                "options": [
                                    {"label": "angry", "emoji": "😠"},
                                    {"label": "happy", "emoji": "😊"},
                                    {"label": "tired", "emoji": "😴"},
                                ],
                                "answer": "angry",
                                "hint_ar": "شعور الانزعاج الشديد.",
                            },
                            {
                                "question_ar": "كيف نقول «متعب»؟",
                                "options": [
                                    {"label": "tired", "emoji": "😴"},
                                    {"label": "scared", "emoji": "😨"},
                                    {"label": "sad", "emoji": "😢"},
                                ],
                                "answer": "tired",
                                "hint_ar": "تشعر به وتحتاج للنوم.",
                            },
                            {
                                "question_ar": "متى نشعر بـ happy عادةً؟",
                                "options": [
                                    {"label": "on a birthday"},
                                    {"label": "when sick"},
                                    {"label": "at night, alone"},
                                ],
                                "answer": "on a birthday",
                                "hint_ar": "يوم مميز ومفرح!",
                            },
                        ],
                    },
                ],
            },
            {
                "id": "past-1",
                "level": 4,
                "order": 2,
                "title_fr": "Hier",
                "title_ar": "الأمس",
                "icon": "🕰️",
                "steps": [
                    {
                        "type": "vocab",
                        "title_ar": "تعلّم الكلمات الجديدة",
                        "items": [
                            {"en": "went", "ar": "ذهبتُ", "emoji": "🚶"},
                            {"en": "played", "ar": "لعبتُ", "emoji": "⚽"},
                            {"en": "ate", "ar": "أكلتُ", "emoji": "🍽️"},
                            {"en": "saw", "ar": "رأيتُ", "emoji": "👀"},
                            {"en": "slept", "ar": "نمتُ", "emoji": "😴"},
                        ],
                    },
                    {
                        "type": "mcq",
                        "title_ar": "اختبر نفسك",
                        "items": [
                            {
                                "question_ar": "ما هو الفعل الماضي لـ go؟",
                                "options": [
                                    {"label": "went", "emoji": "🚶"},
                                    {"label": "go"},
                                    {"label": "going"},
                                ],
                                "answer": "went",
                                "hint_ar": "go فعل شاذ، تتغير كلمته كاملة في الماضي.",
                            },
                            {
                                "question_ar": "ما معنى ate؟",
                                "options": [{"label": "أكلتُ"}, {"label": "لعبتُ"}, {"label": "رأيتُ"}],
                                "answer": "أكلتُ",
                                "hint_ar": "الماضي من eat.",
                            },
                            {
                                "question_ar": "أي كلمة تدل على فعل حدث في الأمس؟",
                                "options": [
                                    {"label": "played", "emoji": "⚽"},
                                    {"label": "play"},
                                    {"label": "playing"},
                                ],
                                "answer": "played",
                                "hint_ar": "نضيف -ed للأفعال المنتظمة في الماضي.",
                            },
                            {
                                "question_ar": "كيف نقول «رأيتُ» بالإنجليزية؟",
                                "options": [
                                    {"label": "saw", "emoji": "👀"},
                                    {"label": "see"},
                                    {"label": "seeing"},
                                ],
                                "answer": "saw",
                                "hint_ar": "الماضي من see.",
                            },
                        ],
                    },
                    {
                        "type": "listen",
                        "title_ar": "استمع واختر الصورة الصحيحة",
                        "items": [
                            {
                                "audio_en": "I went to the park.",
                                "options": [
                                    {"emoji": "🚶", "label_ar": "ذهبتُ"},
                                    {"emoji": "😴", "label_ar": "نمتُ"},
                                    {"emoji": "🍽️", "label_ar": "أكلتُ"},
                                ],
                                "answer_emoji": "🚶",
                            },
                            {
                                "audio_en": "I ate an apple.",
                                "options": [
                                    {"emoji": "🍽️", "label_ar": "أكلتُ"},
                                    {"emoji": "👀", "label_ar": "رأيتُ"},
                                    {"emoji": "⚽", "label_ar": "لعبتُ"},
                                ],
                                "answer_emoji": "🍽️",
                            },
                            {
                                "audio_en": "I played football.",
                                "options": [
                                    {"emoji": "⚽", "label_ar": "لعبتُ"},
                                    {"emoji": "🚶", "label_ar": "ذهبتُ"},
                                    {"emoji": "😴", "label_ar": "نمتُ"},
                                ],
                                "answer_emoji": "⚽",
                            },
                        ],
                    },
                    {
                        "type": "fill",
                        "title_ar": "أكمل الجملة",
                        "items": [
                            {
                                "sentence": "Yesterday, I ___ to the park.",
                                "options": ["went", "go", "going"],
                                "answer": "went",
                                "translation_ar": "بالأمس، ذهبت إلى الحديقة.",
                            },
                            {
                                "sentence": "I ___ a movie last night.",
                                "options": ["saw", "see", "seeing"],
                                "answer": "saw",
                                "translation_ar": "شاهدت فيلماً الليلة الماضية.",
                            },
                            {
                                "sentence": "I ___ well yesterday.",
                                "options": ["slept", "sleep", "sleeping"],
                                "answer": "slept",
                                "translation_ar": "نمت جيداً بالأمس.",
                            },
                        ],
                    },
                    {
                        "type": "speak",
                        "title_ar": "انطق بصوت عالٍ",
                        "items": [
                            {"phrase_en": "I went to school yesterday.", "translation_ar": "ذهبت إلى المدرسة بالأمس."},
                            {"phrase_en": "I played with my friends.", "translation_ar": "لعبت مع أصدقائي."},
                        ],
                    },
                    {
                        "type": "recap",
                        "title_ar": "التحدي النهائي",
                        "items": [
                            {
                                "question_ar": "ما هو ماضي play؟",
                                "options": [
                                    {"label": "played", "emoji": "⚽"},
                                    {"label": "play"},
                                    {"label": "plays"},
                                ],
                                "answer": "played",
                                "hint_ar": "نضيف -ed.",
                            },
                            {
                                "question_ar": "ما معنى went؟",
                                "options": [{"label": "ذهبتُ"}, {"label": "أكلتُ"}, {"label": "نمتُ"}],
                                "answer": "ذهبتُ",
                                "hint_ar": "ماضي go.",
                            },
                            {
                                "question_ar": "أكمل: I ___ my homework yesterday.",
                                "options": [
                                    {"label": "did"},
                                    {"label": "do"},
                                    {"label": "doing"},
                                ],
                                "answer": "did",
                                "hint_ar": "ماضي do.",
                            },
                            {
                                "question_ar": "كيف نقول «نمتُ»؟",
                                "options": [
                                    {"label": "slept", "emoji": "😴"},
                                    {"label": "sleep"},
                                    {"label": "sleeping"},
                                ],
                                "answer": "slept",
                                "hint_ar": "ماضي sleep.",
                            },
                            {
                                "question_ar": "ما هو ماضي see؟",
                                "options": [
                                    {"label": "saw", "emoji": "👀"},
                                    {"label": "see"},
                                    {"label": "seed"},
                                ],
                                "answer": "saw",
                                "hint_ar": "فعل شاذ، تحفّظه كما هو.",
                            },
                        ],
                    },
                ],
            },
        ],
    },
]


def all_lessons():
    """Retourne toutes les leçons, avec leur niveau, dans l'ordre."""
    lessons = []
    for level in LEVELS:
        for lesson in level["lessons"]:
            lessons.append(lesson)
    return lessons


def get_lesson(lesson_id):
    for lesson in all_lessons():
        if lesson["id"] == lesson_id:
            return lesson
    return None


def get_level(level_number):
    for level in LEVELS:
        if level["level"] == level_number:
            return level
    return None


def get_level_for_lesson(lesson_id):
    for level in LEVELS:
        for lesson in level["lessons"]:
            if lesson["id"] == lesson_id:
                return level
    return None


def lesson_max_stars(lesson):
    """Nombre maximum d'items scorés dans une leçon (hors vocab, hors speak)."""
    total = 0
    for step in lesson["steps"]:
        if step["type"] in ("mcq", "listen", "fill", "recap"):
            total += len(step["items"])
    return total


def audio_texts():
    """Tous les textes anglais qu'il faut pouvoir prononcer (mots de
    vocabulaire, consignes d'écoute, phrases à répéter), sans doublons,
    dans un ordre stable."""
    texts = set()
    for lesson in all_lessons():
        for step in lesson["steps"]:
            if step["type"] == "vocab":
                for item in step["items"]:
                    texts.add(item["en"])
            elif step["type"] == "listen":
                for item in step["items"]:
                    texts.add(item["audio_en"])
            elif step["type"] == "speak":
                for item in step["items"]:
                    texts.add(item["phrase_en"])
    return sorted(texts)


def slugify(text):
    """Convertit un texte anglais en nom de fichier stable et lisible,
    ex. 'Point to the cat.' -> 'point_to_the_cat'."""
    import re

    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", "_", text).strip("_")
    return text or "clip"


def audio_slug_map():
    """{ texte anglais: nom de fichier (sans extension) }, avec suffixe
    numérique en cas de collision improbable entre deux textes différents."""
    slugs = {}
    seen = set()
    for text in audio_texts():
        base = slugify(text)
        slug = base
        n = 2
        while slug in seen:
            slug = f"{base}_{n}"
            n += 1
        seen.add(slug)
        slugs[text] = slug
    return slugs
