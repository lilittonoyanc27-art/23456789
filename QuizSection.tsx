import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { EpisodeData, EpisodeProgress, QuizQuestion } from './types';
import { ClickToTranslate, TranslationToggleButton } from './TranslatableText';
import { shuffleArray } from './storage';

const CATEGORY_ES_MAP: Record<string, string> = {
  'Սյուժե': 'Trama',
  'Արգենտինական voseo': 'Voseo argentino',
  'Քերականություն (Voseo)': 'Gramática (Voseo)',
  'Բառապաշար': 'Vocabulario',
  'Արգենտինական ժարգոն': 'Jerga argentina',
  'Քերականություն': 'Gramática',
  'Արգենտինական արտահայտություն': 'Expresión argentina',
};

interface QuizSectionProps {
  episode: EpisodeData;
  progress: EpisodeProgress;
  onCompleteQuiz: (score: number, total: number, missedIds: string[]) => void;
}

interface ShuffledQuizItem {
  question: QuizQuestion;
  options: QuizQuestion['options'];
}

export const QuizSection: React.FC<QuizSectionProps> = ({
  episode,
  progress,
  onCompleteQuiz,
}) => {
  const [mode, setMode] = useState<'full' | 'mistakes'>('full');
  const [runSeed, setRunSeed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openTranslations, setOpenTranslations] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  // Reset on episode change
  useEffect(() => {
    setMode('full');
    setRunSeed((s) => s + 1);
    setCurrentIdx(0);
    setAnswers({});
    setOpenTranslations({});
    setFinished(false);
  }, [episode.id]);

  // Build randomized option order on every new run
  const activeQuestions: ShuffledQuizItem[] = useMemo(() => {
    const source =
      mode === 'mistakes' && progress.quiz.missedIds.length > 0
        ? episode.quiz.filter((q) => progress.quiz.missedIds.includes(q.id))
        : episode.quiz;

    return source.map((q) => ({
      question: q,
      options: shuffleArray(q.options),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id, mode, runSeed]);

  const currentItem = activeQuestions[currentIdx];
  const currentQuestion = currentItem?.question;
  const chosenOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isAnswered = Boolean(chosenOptionId);
  const isCorrect = currentQuestion ? chosenOptionId === currentQuestion.correctOptionId : false;

  const toggleTranslation = (key: string) => {
    setOpenTranslations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion || isAnswered) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleNext = () => {
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx((i) => i + 1);
      setOpenTranslations({});
    } else {
      const correctCount = activeQuestions.filter(
        (item) => answers[item.question.id] === item.question.correctOptionId
      ).length;
      const missedIds = activeQuestions
        .filter((item) => answers[item.question.id] !== item.question.correctOptionId)
        .map((item) => item.question.id);

      setFinished(true);
      if (mode === 'full') {
        onCompleteQuiz(correctCount, activeQuestions.length, missedIds);
      } else {
        // Update remaining missed list after mistake retry
        const stillMissed = progress.quiz.missedIds.filter((id) => missedIds.includes(id));
        onCompleteQuiz(
          Math.max(progress.quiz.bestScore, episode.quiz.length - stillMissed.length),
          episode.quiz.length,
          stillMissed
        );
      }
    }
  };

  const handleRestartFull = () => {
    setMode('full');
    setRunSeed((s) => s + 1);
    setCurrentIdx(0);
    setAnswers({});
    setOpenTranslations({});
    setFinished(false);
  };

  const handleRetryMistakes = (missedList: string[]) => {
    if (missedList.length === 0) return;
    setMode('mistakes');
    setRunSeed((s) => s + 1);
    setCurrentIdx(0);
    setAnswers({});
    setOpenTranslations({});
    setFinished(false);
  };

  const summary = useMemo(() => {
    const correctCount = activeQuestions.filter(
      (item) => answers[item.question.id] === item.question.correctOptionId
    ).length;
    const missedItems = activeQuestions.filter(
      (item) => answers[item.question.id] !== item.question.correctOptionId
    );
    const pct =
      activeQuestions.length > 0 ? Math.round((correctCount / activeQuestions.length) * 100) : 0;
    return { correctCount, missedItems, pct };
  }, [activeQuestions, answers]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-lg shadow-[#6B1029]/15 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-[#584449]">
            Capítulo {episode.number} · {episode.quiz.length} preguntas · Mejor resultado:{' '}
            <span className="font-mono-tabular font-semibold text-[#6B1029]">
              {progress.quiz.bestScore}/{progress.quiz.total}
            </span>
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#6B1029]">
            Cuestionario ({mode === 'mistakes' ? 'Repaso de errores' : '20 preguntas'})
          </h2>
          <ClickToTranslate
            es="Las opciones A, B, C y D se mezclan al azar en cada intento. El botón Traducir está separado de la respuesta."
            hy="Ամեն նոր անցման ժամանակ A, B, C, D տարբերակները պատահական կարգով խառնվում են։ Թարգմանության կոճակն առանձին է պատասխանի ընտրությունից։"
            esClassName="text-sm sm:text-base text-[#584449]"
            showHintLabel={false}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {progress.quiz.missedIds.length > 0 && mode === 'full' && (
            <button
              type="button"
              onClick={() => handleRetryMistakes(progress.quiz.missedIds)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#FFF8EE] border border-[#F28C28]/50 text-[#6B1029] text-sm font-semibold hover:bg-[#FFD166]/40 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-[#F28C28] shrink-0" />
              <span>Repetir errores ({progress.quiz.missedIds.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRestartFull}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#EAE0DC] bg-white text-[#1E1417] text-sm font-semibold hover:bg-[#FFF8EE] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#9F1835] shrink-0" />
            <span>Empezar de nuevo</span>
          </button>
        </div>
      </div>

      {/* Finished Summary Screen */}
      {finished ? (
        <div className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-lg shadow-[#6B1029]/15 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#F0E7E3]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF8EE] border border-[#F28C28]/40 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-[#9F1835]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-[#584449]">
                  Resultado del cuestionario · Capítulo {episode.number}
                </p>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1417]">
                  <span className="font-mono-tabular">{summary.correctCount}</span> /{' '}
                  <span className="font-mono-tabular">{activeQuestions.length}</span> correctas ({summary.pct}%)
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {summary.missedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    handleRetryMistakes(summary.missedItems.map((m) => m.question.id))
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#F28C28] text-white text-sm font-semibold hover:bg-[#dc7a1b] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Repetir solo errores ({summary.missedItems.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRestartFull}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] transition-colors cursor-pointer"
              >
                <span>Empezar de nuevo</span>
              </button>
            </div>
          </div>

          {summary.missedItems.length === 0 ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-950 text-sm sm:text-base font-medium">
              ¡Excelente resultado! Respondiste todas las preguntas correctamente.
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-[#6B1029]">
                Lista de errores para repasar ({summary.missedItems.length})
              </h4>
              <div className="space-y-3">
                {summary.missedItems.map(({ question }) => {
                  const correctOpt = question.options.find(
                    (o) => o.id === question.correctOptionId
                  );
                  const chosenOpt = question.options.find((o) => o.id === answers[question.id]);
                  const showErrHy = !!openTranslations[`err-${question.id}`];

                  return (
                    <div
                      key={question.id}
                      className="rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] p-4 space-y-2 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-[#1E1417] flex-1">
                          {question.questionEs ?? question.questionHy}
                        </p>
                        <TranslationToggleButton
                          compact
                          isOpen={showErrHy}
                          onToggle={() => toggleTranslation(`err-${question.id}`)}
                          labelClosed="Explicación (ARM)"
                          labelOpen="Ocultar"
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                        <span className="text-[#DC3545]">
                          Tu respuesta: {chosenOpt?.textEs ?? '—'}
                        </span>
                        <span className="text-emerald-700 font-semibold">
                          Respuesta correcta: {correctOpt?.textEs}
                        </span>
                      </div>
                      {showErrHy && (
                        <div className="rounded-lg bg-[#FFF8EE] border border-[#F28C28]/35 p-3 space-y-1 text-[#6B1029]">
                          <p className="font-medium">{question.questionHy}</p>
                          {correctOpt?.textHy && (
                            <p className="text-xs sm:text-sm font-semibold">
                              Ճիշտ պատասխանը՝ {correctOpt.textHy}
                            </p>
                          )}
                          <p className="text-[#1E1417] leading-relaxed">{question.explanationHy}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        currentQuestion && (
          <div className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-lg shadow-[#6B1029]/15 rounded-2xl p-5 sm:p-7 space-y-6">
            {/* Progress Row */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#584449]">
                <span>
                  Pregunta{' '}
                  <span className="font-mono-tabular font-bold text-[#6B1029]">
                    {currentIdx + 1} / {activeQuestions.length}
                  </span>{' '}
                  · {CATEGORY_ES_MAP[currentQuestion.categoryHy] ?? 'Español'} · Nivel{' '}
                  {currentQuestion.level}
                </span>
                <span className="font-mono-tabular">
                  {Math.round(((currentIdx + (isAnswered ? 1 : 0)) / activeQuestions.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F5E4D3] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9F1835] to-[#F28C28] transition-all duration-300"
                  style={{
                    width: `${
                      ((currentIdx + (isAnswered ? 1 : 0)) / activeQuestions.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Question Block with Separate Translation Button */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[220px] space-y-1.5">
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1E1417] leading-snug">
                    {currentQuestion.questionEs ?? currentQuestion.questionHy}
                  </h3>
                </div>

                {currentQuestion.questionEs && (
                  <TranslationToggleButton
                    isOpen={!!openTranslations['q-main']}
                    onToggle={() => toggleTranslation('q-main')}
                  />
                )}
              </div>

              {currentQuestion.questionEs && openTranslations['q-main'] && (
                <div className="rounded-xl bg-[#FFF8EE] border border-[#F28C28]/40 px-4 py-3 text-sm sm:text-base text-[#6B1029]">
                  {currentQuestion.questionHy}
                </div>
              )}

              {/* Optional Quote Block */}
              {currentQuestion.quoteEs && (
                <div className="rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] p-4 space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-base sm:text-lg font-medium text-[#1E1417] italic flex-1">
                      «{currentQuestion.quoteEs}»
                    </p>
                    {currentQuestion.quoteHy && (
                      <TranslationToggleButton
                        compact
                        isOpen={!!openTranslations['q-quote']}
                        onToggle={() => toggleTranslation('q-quote')}
                      />
                    )}
                  </div>
                  {openTranslations['q-quote'] && currentQuestion.quoteHy && (
                    <p className="text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-2">
                      {currentQuestion.quoteHy}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 4 Shuffled Options A, B, C, D — Separate Area for Answer vs Translation */}
            <div className="space-y-3">
              {currentItem.options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx] ?? String(idx + 1);
                const isChosen = chosenOptionId === opt.id;
                const isRight = opt.id === currentQuestion.correctOptionId;
                const optTransOpen = !!openTranslations[`opt-${opt.id}`];

                let wrapperClass =
                  'border-[#EAE0DC] bg-white hover:border-[#9F1835] text-[#1E1417]';
                if (isAnswered) {
                  if (isRight) {
                    wrapperClass = 'border-emerald-500 bg-emerald-50 text-emerald-950';
                  } else if (isChosen && !isRight) {
                    wrapperClass = 'border-[#DC3545] bg-rose-50 text-[#6B1029]';
                  } else {
                    wrapperClass = 'border-[#EAE0DC] bg-[#FAF7F5]/60 text-[#6A585D]';
                  }
                }

                return (
                  <div key={opt.id} className={`rounded-xl border transition-colors ${wrapperClass}`}>
                    <div className="flex items-center gap-2 p-2 sm:p-2.5">
                      <button
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(opt.id)}
                        className="flex-1 text-left flex items-center gap-3 px-2 py-2 min-h-[48px] cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded-lg"
                      >
                        <span
                          className={`font-mono-tabular text-xs sm:text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isAnswered && isRight
                              ? 'bg-emerald-600 text-white'
                              : isAnswered && isChosen && !isRight
                              ? 'bg-[#DC3545] text-white'
                              : 'bg-[#FAF7F5] border border-[#EAE0DC] text-[#6B1029]'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base font-medium leading-snug">
                          {opt.textEs}
                        </span>
                      </button>

                      {/* Dedicated non-selecting translation button */}
                      <TranslationToggleButton
                        compact
                        isOpen={optTransOpen}
                        onToggle={() => toggleTranslation(`opt-${opt.id}`)}
                      />
                    </div>

                    {optTransOpen && (
                      <div className="px-4 pb-3 pt-0.5 text-sm text-[#6B1029]">
                        {opt.textHy}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Post-Answer Feedback & Next Button */}
            {isAnswered && (
              <div className="space-y-4 pt-2 border-t border-[#F0E7E3]">
                <div
                  className={`rounded-xl border p-4 sm:p-5 space-y-2.5 text-sm sm:text-base ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-[#6B1029]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>¡Respuesta correcta!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-[#DC3545] shrink-0" />
                          <span>Respuesta incorrecta</span>
                        </>
                      )}
                    </div>
                    <TranslationToggleButton
                      compact
                      isOpen={!!openTranslations['q-exp']}
                      onToggle={() => toggleTranslation('q-exp')}
                      labelClosed="Explicación (ARM)"
                      labelOpen="Ocultar"
                    />
                  </div>

                  {openTranslations['q-exp'] && (
                    <div className="rounded-lg bg-[#FFF8EE] border border-[#F28C28]/35 p-3.5 space-y-1.5 text-sm text-[#1E1417]">
                      <p className="leading-relaxed">{currentQuestion.explanationHy}</p>
                      {currentQuestion.grammarRuleHy && (
                        <p className="text-xs sm:text-sm font-medium text-[#6B1029] pt-1">
                          Քերականական կանոն՝ {currentQuestion.grammarRuleHy}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-[#584449] pt-1">
                        Հարցի թարգմանությունը՝ {currentQuestion.questionHy}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#6B1029] text-white text-sm sm:text-base font-semibold hover:bg-[#9F1835] transition-colors cursor-pointer"
                  >
                    <span>
                      {currentIdx + 1 < activeQuestions.length
                        ? 'Siguiente pregunta'
                        : 'Ver resultados'}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
