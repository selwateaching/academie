(function () {
  "use strict";

  var CONFIG = window.SPEAKIA_CONFIG || {};
  var LESSON = JSON.parse(document.getElementById("sp-lesson-data").textContent);

  var area = document.getElementById("sp-exercise-area");
  var neoBubble = document.getElementById("sp-neo-bubble");
  var continueBtn = document.getElementById("sp-continue-btn");
  var progressFill = document.getElementById("sp-progress-fill");
  var scoreLive = document.getElementById("sp-score-live");

  var SCORED_TYPES = ["mcq", "listen", "fill", "recap"];

  // ---------------------------------------------------------------------
  // Utilitaires
  // ---------------------------------------------------------------------
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  function setNeo(text) {
    neoBubble.setAttribute("dir", "auto");
    neoBubble.textContent = text;
  }

  function speak(text, lang) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US";
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* synthèse vocale indisponible : on continue sans bloquer */
    }
  }

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z\s']/g, "")
      .trim();
  }

  function isCloseMatch(target, said) {
    var t = normalize(target);
    var s = normalize(said);
    if (!s) return false;
    if (s === t) return true;
    if (s.indexOf(t) !== -1 || t.indexOf(s) !== -1) return true;
    var tWords = t.split(/\s+/).filter(Boolean);
    var sWords = s.split(/\s+/).filter(Boolean);
    if (!tWords.length) return false;
    var hits = tWords.filter(function (w) {
      return sWords.indexOf(w) !== -1;
    }).length;
    return hits / tWords.length >= 0.6;
  }

  function speechRecognitionSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function startRecognition(onResult, onError) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      onError("unsupported");
      return null;
    }
    try {
      var rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      rec.onresult = function (e) {
        var alts = [];
        for (var i = 0; i < e.results[0].length; i++) {
          alts.push(e.results[0][i].transcript);
        }
        onResult(alts);
      };
      rec.onerror = function (e) {
        onError(e.error);
      };
      rec.start();
      return rec;
    } catch (e) {
      onError("start-failed");
      return null;
    }
  }

  // ---------------------------------------------------------------------
  // Construction de la file d'écrans à partir de la leçon
  // ---------------------------------------------------------------------
  function buildScreens(lesson) {
    var screens = [];
    lesson.steps.forEach(function (step) {
      if (step.type === "vocab") {
        screens.push({ type: "vocab", items: step.items });
      } else {
        step.items.forEach(function (item) {
          screens.push({ type: step.type, item: item });
        });
      }
    });
    return screens;
  }

  var SCREENS = buildScreens(LESSON);

  var state = {
    idx: 0,
    vocabIdx: 0,
    correct: 0,
    total: SCREENS.filter(function (s) {
      return SCORED_TYPES.indexOf(s.type) !== -1;
    }).length,
    answered: false,
    firstAttempt: true,
  };

  // ---------------------------------------------------------------------
  // Rendus par type d'exercice
  // ---------------------------------------------------------------------
  function renderVocab(screen) {
    var items = screen.items;
    var i = state.vocabIdx;
    var it = items[i];
    setNeo("كلمة جديدة! استمع وكرّرها بصوت عالٍ 🔊");

    var dots = items
      .map(function (_, idx) {
        return '<span class="' + (idx === i ? "on" : "") + '"></span>';
      })
      .join("");

    area.innerHTML =
      '<div class="sp-vocab-card">' +
      '<div class="sp-vocab-emoji">' + it.emoji + "</div>" +
      '<div class="sp-vocab-en">' + escapeHtml(it.en) + "</div>" +
      '<div class="sp-vocab-ar" lang="ar" dir="rtl">' + escapeHtml(it.ar) + "</div>" +
      '<div class="sp-vocab-actions">' +
      '<button type="button" class="sp-icon-btn" id="sp-vocab-listen">🔊 Écouter</button>' +
      '<button type="button" class="sp-icon-btn" id="sp-vocab-mic">🎤 Répéter</button>' +
      "</div>" +
      '<div class="sp-vocab-dots">' + dots + "</div>" +
      "</div>";

    document.getElementById("sp-vocab-listen").addEventListener("click", function () {
      speak(it.en, "en-US");
    });

    var micBtn = document.getElementById("sp-vocab-mic");
    if (!speechRecognitionSupported()) micBtn.title = "Micro non disponible sur ce navigateur";
    micBtn.addEventListener("click", function () {
      micBtn.classList.add("sp-mic-active");
      startRecognition(
        function (alts) {
          micBtn.classList.remove("sp-mic-active");
          var ok = alts.some(function (a) {
            return isCloseMatch(it.en, a);
          });
          setNeo(ok ? "رائع! نطق ممتاز 🎉" : "حاول مرة أخرى، استمع جيداً ثم كرّر 🔁");
        },
        function () {
          micBtn.classList.remove("sp-mic-active");
          setNeo("استمع ثم كرّر بصوتك — هذا المتصفح لا يدعم التعرف الصوتي.");
        }
      );
    });

    speak(it.en, "en-US");
    continueBtn.disabled = false;
    continueBtn.textContent = i < items.length - 1 ? "Suivant" : "Continuer";
  }

  function renderMcq(screen, boss) {
    var it = screen.item;
    state.answered = false;
    state.firstAttempt = true;
    setNeo(it.question_ar);

    var optsHtml = it.options
      .map(function (o) {
        return (
          '<button type="button" class="sp-mcq-option" data-label="' + escapeAttr(o.label) + '">' +
          (o.emoji ? '<span class="emoji">' + o.emoji + "</span>" : "") +
          "<span>" + escapeHtml(o.label) + "</span></button>"
        );
      })
      .join("");

    area.innerHTML =
      (boss ? '<div style="text-align:center;font-size:1.7rem;margin-bottom:4px;">👑</div>' : "") +
      '<div class="sp-mcq-question" lang="ar" dir="rtl">' + escapeHtml(it.question_ar) + "</div>" +
      '<div class="sp-mcq-options">' + optsHtml + "</div>" +
      '<div class="sp-hint-box" id="sp-hint-box" hidden></div>';

    continueBtn.disabled = true;
    continueBtn.textContent = "Continuer";

    Array.prototype.forEach.call(area.querySelectorAll(".sp-mcq-option"), function (btn) {
      btn.addEventListener("click", function () {
        if (state.answered) return;
        var label = btn.getAttribute("data-label");
        var isCorrect = label === it.answer;
        if (isCorrect) {
          btn.classList.add("correct");
          state.answered = true;
          if (state.firstAttempt) state.correct++;
          setNeo("Great job! 🎉 أحسنت!");
          scoreLive.textContent = state.correct;
          continueBtn.disabled = false;
        } else {
          btn.classList.add("incorrect");
          btn.disabled = true;
          state.firstAttempt = false;
          if (it.hint_ar) {
            var hintBox = document.getElementById("sp-hint-box");
            hintBox.hidden = false;
            hintBox.setAttribute("lang", "ar");
            hintBox.setAttribute("dir", "rtl");
            hintBox.textContent = "💡 " + it.hint_ar;
          }
          setNeo("ليست هذه، حاول مرة أخرى 🤔");
        }
      });
    });
  }

  function renderListen(screen) {
    var it = screen.item;
    state.answered = false;
    state.firstAttempt = true;
    setNeo("استمع جيداً، ثم اختر الصورة الصحيحة 👂");

    var optsHtml = it.options
      .map(function (o) {
        return (
          '<button type="button" class="sp-listen-option" data-emoji="' + escapeAttr(o.emoji) + '">' +
          '<span class="emoji">' + o.emoji + "</span>" +
          '<span class="ar" lang="ar" dir="rtl">' + escapeHtml(o.label_ar) + "</span></button>"
        );
      })
      .join("");

    area.innerHTML =
      '<div class="sp-listen-card">' +
      '<button type="button" class="sp-listen-play" id="sp-listen-play" aria-label="Écouter">🔊</button>' +
      '<div class="sp-listen-options">' + optsHtml + "</div>" +
      "</div>";

    document.getElementById("sp-listen-play").addEventListener("click", function () {
      speak(it.audio_en, "en-US");
    });
    speak(it.audio_en, "en-US");

    continueBtn.disabled = true;

    Array.prototype.forEach.call(area.querySelectorAll(".sp-listen-option"), function (btn) {
      btn.addEventListener("click", function () {
        if (state.answered) return;
        var isCorrect = btn.getAttribute("data-emoji") === it.answer_emoji;
        if (isCorrect) {
          btn.classList.add("correct");
          state.answered = true;
          if (state.firstAttempt) state.correct++;
          setNeo("Perfect! 🎉");
          scoreLive.textContent = state.correct;
          continueBtn.disabled = false;
        } else {
          btn.classList.add("incorrect");
          btn.disabled = true;
          state.firstAttempt = false;
          setNeo("استمع مرة أخرى وحاول 🔁");
        }
      });
    });
  }

  function renderFill(screen) {
    var it = screen.item;
    state.answered = false;
    state.firstAttempt = true;
    setNeo("أكمل الجملة بالكلمة الصحيحة ✏️");

    var parts = it.sentence.split("___");
    var optsHtml = it.options
      .map(function (o) {
        return '<button type="button" class="sp-fill-option" data-opt="' + escapeAttr(o) + '">' + escapeHtml(o) + "</button>";
      })
      .join("");

    area.innerHTML =
      '<div class="sp-fill-sentence">' +
      escapeHtml(parts[0]) +
      '<span class="sp-fill-blank" id="sp-fill-blank">_____</span>' +
      escapeHtml(parts[1] || "") +
      "</div>" +
      '<div class="sp-fill-options">' + optsHtml + "</div>" +
      '<div class="sp-fill-translation" id="sp-fill-translation" lang="ar" dir="rtl" style="visibility:hidden;">' +
      escapeHtml(it.translation_ar) +
      "</div>";

    continueBtn.disabled = true;

    Array.prototype.forEach.call(area.querySelectorAll(".sp-fill-option"), function (btn) {
      btn.addEventListener("click", function () {
        if (state.answered) return;
        var isCorrect = btn.getAttribute("data-opt") === it.answer;
        if (isCorrect) {
          btn.classList.add("correct");
          document.getElementById("sp-fill-blank").textContent = it.answer;
          document.getElementById("sp-fill-translation").style.visibility = "visible";
          state.answered = true;
          if (state.firstAttempt) state.correct++;
          setNeo("Excellent! 🎉");
          scoreLive.textContent = state.correct;
          continueBtn.disabled = false;
        } else {
          btn.classList.add("incorrect");
          btn.disabled = true;
          state.firstAttempt = false;
          setNeo("ليست هذه الكلمة، حاول مرة أخرى 🤔");
        }
      });
    });
  }

  function renderSpeak(screen) {
    var it = screen.item;
    setNeo("استمع للجملة، ثم انطقها بصوت عالٍ 🎤");
    var srSupported = speechRecognitionSupported();

    area.innerHTML =
      '<div class="sp-speak-card">' +
      '<div class="sp-speak-phrase">' + escapeHtml(it.phrase_en) + "</div>" +
      '<div class="sp-speak-translation" lang="ar" dir="rtl">' + escapeHtml(it.translation_ar) + "</div>" +
      '<button type="button" class="sp-icon-btn" id="sp-speak-listen" style="margin-bottom:20px;">🔊 Écouter Néo</button>' +
      '<div><button type="button" class="sp-mic-btn" id="sp-speak-mic"' + (srSupported ? "" : " disabled") + '>🎤</button></div>' +
      '<div class="sp-speak-feedback" id="sp-speak-feedback"></div>' +
      (srSupported
        ? ""
        : '<div class="sp-speak-fallback">🎙️ Micro non disponible sur ce navigateur — écoute Néo puis répète à voix haute.</div>') +
      "</div>";

    document.getElementById("sp-speak-listen").addEventListener("click", function () {
      speak(it.phrase_en, "en-US");
    });
    speak(it.phrase_en, "en-US");

    var micBtn = document.getElementById("sp-speak-mic");
    var feedback = document.getElementById("sp-speak-feedback");

    if (srSupported) {
      micBtn.addEventListener("click", function () {
        micBtn.classList.add("listening");
        feedback.className = "sp-speak-feedback";
        feedback.textContent = "…";
        startRecognition(
          function (alts) {
            micBtn.classList.remove("listening");
            var ok = alts.some(function (a) {
              return isCloseMatch(it.phrase_en, a);
            });
            if (ok) {
              feedback.textContent = "🎉 Great pronunciation!";
              feedback.className = "sp-speak-feedback ok";
            } else {
              feedback.textContent = "🔁 حاول مرة أخرى، استمع جيداً!";
              feedback.className = "sp-speak-feedback retry";
            }
          },
          function () {
            micBtn.classList.remove("listening");
            feedback.textContent = "";
          }
        );
      });
    }

    continueBtn.disabled = false;
    continueBtn.textContent = "Continuer";
  }

  // ---------------------------------------------------------------------
  // Moteur principal
  // ---------------------------------------------------------------------
  function currentScreen() {
    return SCREENS[state.idx];
  }

  function updateProgress() {
    var pct = Math.round((state.idx / SCREENS.length) * 100);
    progressFill.style.width = pct + "%";
    scoreLive.textContent = state.correct;
  }

  function render() {
    var screen = currentScreen();
    if (!screen) {
      finishLesson();
      return;
    }
    updateProgress();
    switch (screen.type) {
      case "vocab":
        renderVocab(screen);
        break;
      case "mcq":
        renderMcq(screen, false);
        break;
      case "listen":
        renderListen(screen);
        break;
      case "fill":
        renderFill(screen);
        break;
      case "speak":
        renderSpeak(screen);
        break;
      case "recap":
        renderMcq(screen, true);
        break;
    }
  }

  continueBtn.addEventListener("click", function () {
    var screen = currentScreen();
    if (screen && screen.type === "vocab") {
      if (state.vocabIdx < screen.items.length - 1) {
        state.vocabIdx++;
        render();
        return;
      }
      state.vocabIdx = 0;
    }
    state.idx++;
    render();
  });

  function finishLesson() {
    progressFill.style.width = "100%";
    fetch(CONFIG.completeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correct: state.correct, total: state.total }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(showComplete)
      .catch(function () {
        var pct = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 100;
        showComplete({ stars: 1, score_pct: pct, total_stars: 0, level_unlocked: false });
      });
  }

  function showComplete(data) {
    document.getElementById("sp-lesson-stage").style.display = "none";
    var overlay = document.getElementById("sp-lesson-complete");
    overlay.hidden = false;

    var starsHtml = "";
    for (var i = 0; i < 3; i++) {
      starsHtml += '<span class="' + (i < data.stars ? "on" : "") + '">★</span>';
    }
    document.getElementById("sp-complete-stars").innerHTML = starsHtml;

    var title = data.stars >= 3 ? "Parfait ! 🏆" : data.stars === 2 ? "Très bien ! 🎉" : "Bien joué ! 👍";
    document.getElementById("sp-complete-title").textContent = title;

    var sub = "Score : " + data.score_pct + "% · ⭐ " + data.total_stars + " étoiles au total";
    if (data.level_unlocked) sub += " · 🎉 Nouveau niveau débloqué !";
    document.getElementById("sp-complete-sub").textContent = sub;
  }

  document.getElementById("sp-retry-btn").addEventListener("click", function () {
    window.location.reload();
  });

  render();
})();
