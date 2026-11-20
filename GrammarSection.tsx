import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { CEFRLevel, EpisodeData, EpisodeProgress, GrammarExercise } from './types';
import { ClickToTranslate, TranslationToggleButton } from './TranslatableText';
import { shuffleArray } from './storage';

interface GrammarSectionProps {
  episode: EpisodeData;
  progress: EpisodeProgress;
  onRecordExercise: (exerciseId: string, isCorrect: boolean) => void;
  onResetGrammarExercises: () => void;
}

type GrammarFilter = 'all' | 'argentine' | CEFRLevel;

interface ShuffledExercise {
  exercise: GrammarExercise;
  options: GrammarExercise['options'];
}

export const GrammarSection: React.FC<GrammarSectionProps> = ({
  episode,
  progress,
  onRecordExercise,
  onResetGrammarExercises,
}) => {
  const [filter, setFilter] = useState<GrammarFilter>('all');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [openTranslations, setOpenTranslations] = useState<Record<string, boolean>>({});
  const [onlyMistakesMode, setOnlyMistakesMode] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Open first topic by default on episode switch
  useEffect(() => {
    const firstId = episode.grammarTopics[0]?.id;
    setExpandedTopics(firstId ? { [firstId]: true } : {});
    setSelectedAnswers({});
    setOpenTranslations({});
    setOnlyMistakesMode(false);
    setFilter('all');
    setShuffleSeed((s) => s + 1);
  }, [episode.id]);

  // Shuffled options per exercise
  const shuffledExercisesMap = useMemo(() => {
    const map: Record<string, ShuffledExercise> = {};
    episode.grammarTopics.forEach((topic) => {
      topic.exercises.forEach((ex) => {
        map[ex.id] = {
          exercise: ex,
          options: shuffleArray(ex.options),
        };
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id, shuffleSeed]);

  const filteredTopics = useMemo(() => {
    return episode.grammarTopics.filter((topic) => {
      if (onlyMistakesMode) {
        const hasMissed = topic.exercises.some((ex) =>
          progress.missedGrammarExerciseIds.includes(ex.id)
        );
        if (!hasMissed) return false;
      }
      if (filter === 'all') return true;
      if (filter === 'argentine') return !!topic.isArgentine;
      return topic.level === filter;
    });
  }, [episode.grammarTopics, filter, onlyMistakesMode, progress.missedGrammarExerciseIds]);

  const totalExercises = useMemo(
    () => episode.grammarTopics.reduce((sum, t) => sum + t.exercises.length, 0),
    [episode.grammarTopics]
  );

  const completedCount = progress.completedGrammarExerciseIds.length;
  const missedCount = progress.missedGrammarExerciseIds.length;

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTranslation = (key: string) => {
    setOpenTranslations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectOption = (ex: GrammarExercise, optionId: string) => {
    if (selectedAnswers[ex.id]) return;
    setSelectedAnswers((prev) => ({ ...prev, [ex.id]: optionId }));
    onRecordExercise(ex.id, optionId === ex.correctOptionId);
  };

  const handleRestartExercises = () => {
    setSelectedAnswers({});
    setOnlyMistakesMode(false);
    setShuffleSeed((s) => s + 1);
    onResetGrammarExercises();
  };

  const handlePracticeMistakes = () => {
    const nextSelected: Record<string, string> = {};
    Object.entries(selectedAnswers).forEach(([id, val]) => {
      if (!progress.missedGrammarExerciseIds.includes(id)) {
        nextSelected[id] = val;
      }
    });
    setSelectedAnswers(nextSelected);
    setOnlyMistakesMode(true);
    setShuffleSeed((s) => s + 1);
    const expanded: Record<string, boolean> = {};
    episode.grammarTopics.forEach((t) => {
      if (t.exercises.some((ex) => progress.missedGrammarExerciseIds.includes(ex.id))) {
        expanded[t.id] = true;
      }
    });
    setExpandedTopics(expanded);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-lg shadow-[#6B1029]/15 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-[#584449]">
              Capítulo {episode.number} · {episode.grammarTopics.length} temas · Ejercicios completados:{' '}
              <span className="font-mono-tabular font-semibold text-[#6B1029]">
                {completedCount}/{totalExercises}
              </span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#6B1029]">
              Gramática de la serie
            </h2>
            <ClickToTranslate
              es={`Todas las estructuras provienen de diálogos reales del Capítulo ${episode.number}, con foco especial en el voseo argentino.`}
              hy={`Բոլոր քերականական կառուցվածքները վերցված են հենց ${episode.number}-րդ սերիայի իրական երկխոսություններից՝ հատուկ ուշադրությամբ արգենտինական «vos» ձևերին։`}
              esClassName="text-sm sm:text-base text-[#584449] max-w-2xl"
              showHintLabel={false}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {missedCount > 0 && (
              <button
                type="button"
                onClick={handlePracticeMistakes}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#FFF8EE] border border-[#F28C28]/50 text-[#6B1029] text-sm font-semibold hover:bg-[#FFD166]/40 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span>Repetir errores ({missedCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRestartExercises}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#EAE0DC] bg-white text-[#1E1417] text-sm font-semibold hover:bg-[#FFF8EE] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#9F1835] shrink-0" />
              <span>Empezar de nuevo</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F0E7E3]">
          {(
            [
              { id: 'all', label: 'Todos los temas' },
              { id: 'argentine', label: 'Argentino (Voseo)' },
              { id: 'A1', label: 'A1' },
              { id: 'A2', label: 'A2' },
              { id: 'B1', label: 'B1' },
              { id: 'B2', label: 'B2' },
            ] as { id: GrammarFilter; label: string }[]
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                setFilter(btn.id);
                setOnlyMistakesMode(false);
              }}
              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                !onlyMistakesMode && filter === btn.id
                  ? 'bg-[#6B1029] text-white'
                  : 'bg-[#FFF8EE] text-[#584449] hover:bg-[#FFD166]/35 hover:text-[#6B1029]'
              }`}
            >
              {btn.label}
            </button>
          ))}
          {onlyMistakesMode && (
            <button
              type="button"
              onClick={() => setOnlyMistakesMode(false)}
              className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-semibold bg-[#F28C28] text-white cursor-pointer"
            >
              Mostrar todos
            </button>
          )}
        </div>
      </div>

      {/* Grammar Topic Cards */}
      {filteredTopics.length === 0 ? (
        <div className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 rounded-2xl p-8 text-center text-sm text-[#584449]">
          No se encontraron temas con este filtro.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopics.map((topic, index) => {
            const isExpanded = !!expandedTopics[topic.id];
            const isGrammarExplainOpen = !!openTranslations[`topic-hy-${topic.id}`];
            const topicDoneCount = topic.exercises.filter((ex) =>
              progress.completedGrammarExerciseIds.includes(ex.id)
            ).length;

            const visibleExercises = onlyMistakesMode
              ? topic.exercises.filter((ex) => progress.missedGrammarExerciseIds.includes(ex.id))
              : topic.exercises;

            return (
              <article
                key={topic.id}
                className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-md shadow-[#6B1029]/12 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left px-5 sm:px-6 py-5 flex items-start justify-between gap-4 hover:bg-[#FFF8EE]/70 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#584449]">
                      <span className="font-mono-tabular font-semibold text-[#9F1835]">
                        0{index + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#6B1029]">Nivel {topic.level}</span>
                      {topic.isArgentine && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#F28C28] font-semibold">Español argentino</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        Ejercicios: {topicDoneCount}/{topic.exercises.length}
                      </span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#1E1417]">
                      {topic.titleEs}
                    </h3>
                  </div>
                  <span className="p-2 rounded-lg text-[#584449] shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-3 border-t border-[#F0E7E3] space-y-6">
                    {/* Click-to-reveal Armenian grammar explanation & breakdown */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-[#6B1029]">
                          Regla y análisis gramatical
                        </span>
                        <TranslationToggleButton
                          isOpen={isGrammarExplainOpen}
                          onToggle={() => toggleTranslation(`topic-hy-${topic.id}`)}
                          labelClosed="Ver explicación en armenio"
                          labelOpen="Ocultar explicación"
                        />
                      </div>

                      {/* Spanish key verb forms preview */}
                      <div className="flex flex-wrap gap-2">
                        {topic.verbBreakdown.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleTranslation(`topic-hy-${topic.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#FFF8EE] border border-[#F28C28]/35 text-sm font-semibold text-[#6B1029] hover:bg-[#FFD166]/35 transition-colors cursor-pointer"
                          >
                            {item.form}
                          </button>
                        ))}
                      </div>

                      {isGrammarExplainOpen && (
                        <div className="rounded-xl bg-[#FFF8EE] border border-[#F28C28]/40 p-4 sm:p-5 space-y-4">
                          <div className="space-y-1.5">
                            <p className="text-base font-bold text-[#6B1029]">{topic.titleHy}</p>
                            <p className="text-sm sm:text-base text-[#1E1417] leading-relaxed">
                              {topic.explanationHy}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#F28C28]/25">
                            <div className="space-y-2">
                              <h4 className="text-sm font-bold text-[#6B1029]">
                                Բայերի և կառուցվածքի վերլուծություն
                              </h4>
                              <ul className="space-y-1.5 text-sm">
                                {topic.verbBreakdown.map((item, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    <span className="font-semibold text-[#9F1835]">{item.form}</span>
                                    <span className="text-[#584449]"> — {item.analysisHy}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-bold text-[#6B1029]">
                                Ինչո՞ւ է օգտագործվում հենց այս ձևը
                              </h4>
                              <p className="text-sm text-[#1E1417] leading-relaxed">{topic.whyUsedHy}</p>
                            </div>
                          </div>

                          {topic.originalQuote.asrNoteHy && (
                            <p className="text-xs sm:text-sm text-[#584449] pt-2 border-t border-[#F28C28]/25">
                              <span className="font-semibold text-[#9F1835]">
                                Ծանոթագրություն սղագրության վերաբերյալ՝
                              </span>{' '}
                              {topic.originalQuote.asrNoteHy}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Original Quote from Episode */}
                    <div className="rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] p-4 sm:p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#584449]">
                        <span className="font-semibold text-[#6B1029]">
                          Cita original del Capítulo {episode.number}
                        </span>
                        <span className="font-mono-tabular text-[#9F1835]">
                          [{topic.originalQuote.timestamp}]
                        </span>
                      </div>

                      <ClickToTranslate
                        es={`«${topic.originalQuote.es}»`}
                        hy={topic.originalQuote.hy}
                        esClassName="text-lg sm:text-xl font-semibold text-[#1E1417]"
                      />
                    </div>

                    {/* Additional Didactic Examples (Explicitly Labeled) */}
                    <div className="space-y-2.5">
                      <h4 className="text-sm sm:text-base font-bold text-[#1E1417] flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#F28C28]" />
                        <span>Ejemplos didácticos (no son citas)</span>
                      </h4>
                      <div className="divide-y divide-[#F0E7E3] rounded-xl border border-[#EAE0DC] bg-white">
                        {topic.didacticExamples.map((ex, idx) => (
                          <div key={idx} className="p-3.5 sm:p-4">
                            <ClickToTranslate
                              es={ex.es}
                              hy={ex.hy}
                              esClassName="text-base font-medium text-[#1E1417]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Grammar Exercises */}
                    <div className="space-y-4 pt-2 border-t border-[#F0E7E3]">
                      <h4 className="text-base font-bold text-[#6B1029]">
                        Ejercicio interactivo
                      </h4>

                      {visibleExercises.map((ex, exIdx) => {
                        const shuffled = shuffledExercisesMap[ex.id]?.options ?? ex.options;
                        const chosenId = selectedAnswers[ex.id];
                        const isAnswered = Boolean(chosenId);
                        const isCorrect = chosenId === ex.correctOptionId;
                        const promptTransOpen = !!openTranslations[`p-${ex.id}`];
                        const expTransOpen = !!openTranslations[`exp-${ex.id}`];

                        return (
                          <div
                            key={ex.id}
                            className="rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] p-4 sm:p-5 space-y-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-[200px]">
                                <p className="text-xs sm:text-sm text-[#584449]">
                                  Ejercicio {exIdx + 1} · Nivel {ex.level}
                                </p>
                                <p className="text-base sm:text-lg font-semibold text-[#1E1417]">
                                  {ex.promptEs}
                                </p>
                              </div>
                              <TranslationToggleButton
                                compact
                                isOpen={promptTransOpen}
                                onToggle={() => toggleTranslation(`p-${ex.id}`)}
                              />
                            </div>

                            {promptTransOpen && (
                              <div className="rounded-lg bg-[#FFF8EE] border border-[#F28C28]/40 px-3.5 py-2.5 space-y-1 text-sm text-[#6B1029]">
                                <p className="font-medium">{ex.promptHy}</p>
                                <p className="text-xs sm:text-sm opacity-90">{ex.questionHy}</p>
                              </div>
                            )}

                            {/* Options with separate translation toggle */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {shuffled.map((opt, oIdx) => {
                                const letter = String.fromCharCode(65 + oIdx);
                                const isChosen = chosenId === opt.id;
                                const isRightOpt = opt.id === ex.correctOptionId;
                                const optTransOpen = !!openTranslations[`o-${ex.id}-${opt.id}`];

                                let cardStyle =
                                  'bg-white border-[#EAE0DC] hover:border-[#9F1835] text-[#1E1417]';
                                if (isAnswered) {
                                  if (isRightOpt) {
                                    cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950';
                                  } else if (isChosen && !isRightOpt) {
                                    cardStyle = 'bg-rose-50 border-[#DC3545] text-[#6B1029]';
                                  } else {
                                    cardStyle = 'bg-white/70 border-[#EAE0DC] text-[#6A585D]';
                                  }
                                }

                                return (
                                  <div
                                    key={opt.id}
                                    className={`rounded-xl border transition-colors ${cardStyle}`}
                                  >
                                    <div className="flex items-center gap-2 p-2">
                                      <button
                                        type="button"
                                        disabled={isAnswered}
                                        onClick={() => handleSelectOption(ex, opt.id)}
                                        className="flex-1 text-left flex items-center gap-2.5 px-2 py-2 min-h-[44px] cursor-pointer disabled:cursor-default"
                                      >
                                        <span className="font-mono-tabular text-xs font-bold w-6 h-6 rounded-md bg-[#FAF7F5] border border-[#EAE0DC] flex items-center justify-center shrink-0 text-[#6B1029]">
                                          {letter}
                                        </span>
                                        <span className="text-sm sm:text-base font-medium">
                                          {opt.textEs}
                                        </span>
                                      </button>
                                      {opt.textHy && (
                                        <TranslationToggleButton
                                          compact
                                          isOpen={optTransOpen}
                                          onToggle={() => toggleTranslation(`o-${ex.id}-${opt.id}`)}
                                        />
                                      )}
                                    </div>
                                    {optTransOpen && opt.textHy && (
                                      <div className="px-3.5 pb-2.5 text-xs sm:text-sm text-[#6B1029]">
                                        {opt.textHy}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {isAnswered && (
                              <div
                                className={`rounded-xl p-3.5 text-sm space-y-2 border ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                    : 'bg-rose-50/80 border-rose-200 text-[#6B1029]'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 font-semibold">
                                    {isCorrect ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>¡Correcto!</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 text-[#DC3545] shrink-0" />
                                        <span>Incorrecto</span>
                                      </>
                                    )}
                                  </div>
                                  <TranslationToggleButton
                                    compact
                                    isOpen={expTransOpen}
                                    onToggle={() => toggleTranslation(`exp-${ex.id}`)}
                                    labelClosed="Explicación (ARM)"
                                    labelOpen="Ocultar"
                                  />
                                </div>
                                {expTransOpen && (
                                  <p className="leading-relaxed text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-2">
                                    {ex.explanationHy}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
