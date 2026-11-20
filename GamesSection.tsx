import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Gamepad2,
  Headphones,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { CEFRLevel, EpisodeData, EpisodeProgress } from './types';
import { ClickToTranslate, TranslationToggleButton } from './TranslatableText';
import { ClipYouTubePlayer } from './YouTubePlayer';
import { shuffleArray } from './storage';
import {
  ConversationGame,
  MemoryGame,
  OrderWordsGame,
  StoryOrderGame,
} from './GamesSpecialModes';

export type GameId =
  | 'whoSaid'
  | 'fillDialogue'
  | 'orderWords'
  | 'trueFalse'
  | 'memory'
  | 'listenRespond'
  | 'whatMeans'
  | 'tenseChoice'
  | 'fixError'
  | 'conversation'
  | 'storyOrder'
  | 'finalChallenge';

interface GameMeta {
  id: GameId;
  index: number;
  titleEs: string;
  descEs: string;
  titleHy: string;
  descHy: string;
  levelLabel: string;
}

const GAMES_META: GameMeta[] = [
  {
    id: 'whoSaid',
    index: 1,
    titleEs: '¿Quién lo dijo?',
    descEs: 'Identifica al personaje según una frase real del capítulo.',
    titleHy: 'Ո՞վ է ասել այս արտահայտությունը',
    descHy: 'Ճանաչեք կերպարին՝ ըստ սերիայի իրական խոսքի։',
    levelLabel: 'A1–B1',
  },
  {
    id: 'fillDialogue',
    index: 2,
    titleEs: 'Completa el diálogo',
    descEs: 'Elige la palabra o forma verbal que falta en la frase.',
    titleHy: 'Լրացրեք երկխոսությունը',
    descHy: 'Տեղադրեք բաց թողնված բառը կամ բայի ձևը։',
    levelLabel: 'A2–B1',
  },
  {
    id: 'orderWords',
    index: 3,
    titleEs: 'Ordena las palabras',
    descEs: 'Arma la frase en español tocando las palabras en orden.',
    titleHy: 'Դասավորեք բառերը ճիշտ կարգով',
    descHy: 'Հավաքեք իսպաներեն արտահայտությունը խառնված բառերից։',
    levelLabel: 'A1–B1',
  },
  {
    id: 'trueFalse',
    index: 4,
    titleEs: 'Verdadero o falso',
    descEs: 'Comprueba tu comprensión de la trama y los diálogos.',
    titleHy: 'Ճի՞շտ է, թե՞ սխալ',
    descHy: 'Ստուգեք սերիայի սյուժեի և երկխոսությունների ըմբռնումը։',
    levelLabel: 'A1–A2',
  },
  {
    id: 'memory',
    index: 5,
    titleEs: 'Memory',
    descEs: 'Encuentra todas las parejas entre español y armenio.',
    titleHy: 'Հիշողության քարտեր',
    descHy: 'Գտեք իսպաներեն և հայերեն բոլոր համապատասխան զույգերը։',
    levelLabel: 'A1–B1',
  },
  {
    id: 'listenRespond',
    index: 6,
    titleEs: 'Escucha y responde',
    descEs: 'Escucha un fragmento real de YouTube y responde la pregunta.',
    titleHy: 'Լսեք հատվածը և պատասխանեք',
    descHy: 'Դիտեք իրական YouTube հատվածը և պատասխանեք հարցին։',
    levelLabel: 'A2–B2',
  },
  {
    id: 'whatMeans',
    index: 7,
    titleEs: '¿Qué significa?',
    descEs: 'Descubre el sentido de expresiones argentinas y coloquiales.',
    titleHy: 'Ի՞նչ է նշանակում արտահայտությունը',
    descHy: 'Արգենտինական և խոսակցական արտահայտությունների իմաստը։',
    levelLabel: 'A2–B2',
  },
  {
    id: 'tenseChoice',
    index: 8,
    titleEs: 'Elige el tiempo verbal',
    descEs: 'Reconoce el voseo, los pasados y los modos verbales.',
    titleHy: 'Ընտրեք բայի ժամանակաձևը',
    descHy: 'Տարբերեք voseo-ն, անցյալ ժամանակները և եղանակները։',
    levelLabel: 'A2–B2',
  },
  {
    id: 'fixError',
    index: 9,
    titleEs: 'Corrige el error',
    descEs: 'Detecta y corrige el error en una oración de práctica.',
    titleHy: 'Ուղղեք ուսումնական սխալը',
    descHy: 'Գտեք և ուղղեք դիտավորյալ փոփոխված ուսումնական նախադասությունը։',
    levelLabel: 'A2–B1',
  },
  {
    id: 'conversation',
    index: 10,
    titleEs: 'Conversación interactiva',
    descEs: 'Responde a los personajes con la réplica más natural.',
    titleHy: 'Ինտերակտիվ երկխոսություն',
    descHy: 'Պատասխանեք կերպարներին՝ ընտրելով ամենաբնական արձագանքը։',
    levelLabel: 'A2–B1',
  },
  {
    id: 'storyOrder',
    index: 11,
    titleEs: 'Completa la historia',
    descEs: 'Ordena los momentos clave según la cronología del capítulo.',
    titleHy: 'Վերականգնեք սերիայի հերթականությունը',
    descHy: 'Դասավորեք իրադարձությունները սերիայի ժամանակագրական կարգով։',
    levelLabel: 'A2–B1',
  },
  {
    id: 'finalChallenge',
    index: 12,
    titleEs: 'Desafío final',
    descEs: 'Reto combinado de audio, vocabulario, gramática y trama.',
    titleHy: 'Եզրափակիչ մարտահրավեր',
    descHy: 'Լսողական, բառապաշարի, քերականության և սյուժեի համալիր ստուգում։',
    levelLabel: 'A2–B2',
  },
];

const FINAL_TYPE_ES: Record<'listening' | 'vocab' | 'grammar' | 'plot', string> = {
  listening: 'Comprensión auditiva',
  vocab: 'Vocabulario',
  grammar: 'Gramática',
  plot: 'Trama',
};

interface NormalizedOption {
  id: string;
  primaryText: string;
  secondaryHy?: string;
  hasSeparateTranslation?: boolean;
}

interface NormalizedQuestion {
  id: string;
  level: CEFRLevel;
  metaLabel?: string;
  badgeText?: string;
  isStudyErrorNotice?: boolean;
  clip?: { startSec: number; endSec: number; label: string };
  contextHy?: string;
  promptEs: string;
  promptHy?: string;
  extraQuoteEs?: string;
  extraQuoteHy?: string;
  highlightedToken?: string;
  transcriptAfterAnswer?: { es: string; hy: string };
  options: NormalizedOption[];
  correctOptionId: string;
  explanationHy: string;
}

function buildNormalizedQuestions(
  gameId: GameId,
  episode: EpisodeData
): NormalizedQuestion[] {
  const g = episode.games;

  switch (gameId) {
    case 'whoSaid':
      return g.whoSaid.map((it) => ({
        id: it.id,
        level: it.level,
        metaLabel: `[${it.timestamp}]`,
        promptEs: `«${it.quoteEs}»`,
        promptHy: it.quoteHy,
        options: it.options.map((name, idx) => ({
          id: `${it.id}-opt-${idx}`,
          primaryText: name,
        })),
        correctOptionId: `${it.id}-opt-${it.options.indexOf(it.correctAnswer)}`,
        explanationHy: it.explanationHy,
      }));

    case 'fillDialogue':
      return g.fillDialogue.map((it) => ({
        id: it.id,
        level: it.level,
        contextHy: it.contextHy,
        promptEs: `${it.beforeBlankEs} _____ ${it.afterBlankEs}`,
        promptHy: it.fullSentenceHy,
        options: it.options.map((o) => ({
          id: o.id,
          primaryText: o.es,
          secondaryHy: o.hy,
          hasSeparateTranslation: true,
        })),
        correctOptionId: it.correctOptionId,
        explanationHy: it.explanationHy,
      }));

    case 'trueFalse':
      return g.trueFalse.map((it) => ({
        id: it.id,
        level: it.level,
        promptEs: it.statementEs,
        promptHy: it.statementHy,
        options: [
          { id: 'true', primaryText: 'Verdadero' },
          { id: 'false', primaryText: 'Falso' },
        ],
        correctOptionId: it.isTrue ? 'true' : 'false',
        explanationHy: it.explanationHy,
      }));

    case 'listenRespond':
      return g.listenRespond.map((it) => ({
        id: it.id,
        level: it.level,
        clip: {
          startSec: it.startSec,
          endSec: it.endSec,
          label: `Fragmento ${it.clipLabel}`,
        },
        promptEs: it.questionEs,
        promptHy: it.questionHy,
        transcriptAfterAnswer: {
          es: it.transcriptEs,
          hy: it.transcriptHy,
        },
        options: it.options.map((o) => ({
          id: o.id,
          primaryText: o.es,
          secondaryHy: o.hy,
          hasSeparateTranslation: true,
        })),
        correctOptionId: it.correctOptionId,
        explanationHy: it.explanationHy,
      }));

    case 'whatMeans':
      return g.whatMeans.map((it) => ({
        id: it.id,
        level: it.level,
        badgeText: it.isArgentine ? 'Expresión argentina' : undefined,
        promptEs: it.expressionEs,
        extraQuoteEs: it.contextQuoteEs,
        extraQuoteHy: it.contextQuoteHy,
        options: it.options.map((o) => ({
          id: o.id,
          primaryText: o.hy,
        })),
        correctOptionId: it.correctOptionId,
        explanationHy: it.explanationHy,
      }));

    case 'tenseChoice':
      return g.tenseChoice.map((it) => ({
        id: it.id,
        level: it.level,
        promptEs: `«${it.quoteEs}»`,
        promptHy: it.quoteHy,
        highlightedToken: it.highlightedVerb,
        options: it.options.map((o) => ({
          id: o.id,
          primaryText: o.labelEs,
          secondaryHy: o.labelHy,
          hasSeparateTranslation: true,
        })),
        correctOptionId: it.correctOptionId,
        explanationHy: it.explanationHy,
      }));

    case 'fixError':
      return g.fixError.map((it) => ({
        id: it.id,
        level: it.level,
        isStudyErrorNotice: true,
        contextHy: it.errorHintHy,
        promptEs: it.wrongSentenceEs,
        promptHy: it.sentenceHy,
        options: it.options.map((o) => ({
          id: o.id,
          primaryText: o.es,
          secondaryHy: o.hy,
          hasSeparateTranslation: Boolean(o.hy),
        })),
        correctOptionId: it.correctOptionId,
        explanationHy: it.explanationHy,
      }));

    case 'finalChallenge':
      return g.finalChallenge.map((it) => ({
        id: it.id,
        level: it.level,
        badgeText: FINAL_TYPE_ES[it.type],
        clip:
          it.clipStartSec !== undefined && it.clipEndSec !== undefined
            ? {
                startSec: it.clipStartSec,
                endSec: it.clipEndSec,
                label: 'Fragmento de YouTube',
              }
            : undefined,
        promptEs: it.promptEs,
        promptHy: it.promptHy,
        options: it.options.map((o) => ({
          id: o.id,
          primaryText: o.es,
          secondaryHy: o.hy,
          hasSeparateTranslation: true,
        })),
        correctOptionId: it.correctOptionId,
        explanationHy: it.explanationHy,
      }));

    default:
      return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Unified Choice Game Runner (with Fisher-Yates option shuffling)            */
/* -------------------------------------------------------------------------- */

interface ChoiceGameRunnerProps {
  gameTitleEs: string;
  youtubeId: string;
  questions: NormalizedQuestion[];
  shuffleOptions: boolean;
  onFinish: (correct: number, total: number, missedIds: string[]) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const ChoiceGameRunner: React.FC<ChoiceGameRunnerProps> = ({
  gameTitleEs,
  youtubeId,
  questions,
  shuffleOptions,
  onFinish,
}) => {
  const [mode, setMode] = useState<'all' | 'mistakes'>('all');
  const [mistakeIds, setMistakeIds] = useState<string[]>([]);
  const [seed, setSeed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openTr, setOpenTr] = useState<Record<string, boolean>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [finished, setFinished] = useState(false);

  const activeList = useMemo(() => {
    const subset =
      mode === 'mistakes' && mistakeIds.length > 0
        ? questions.filter((q) => mistakeIds.includes(q.id))
        : questions;
    return subset.map((q) => ({
      question: q,
      options: shuffleOptions ? shuffleArray(q.options) : q.options,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, mode, mistakeIds, seed, shuffleOptions]);

  useEffect(() => {
    setShowTranscript(false);
  }, [currentIdx, seed, mode]);

  const currentItem = activeList[currentIdx];
  const currentQ = currentItem?.question;
  const selectedOptId = currentQ ? answers[currentQ.id] : undefined;
  const isAnswered = Boolean(selectedOptId);

  const toggleTr = (key: string) => {
    setOpenTr((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (optId: string) => {
    if (!currentQ || isAnswered) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optId }));
  };

  const handleNext = () => {
    if (currentIdx < activeList.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      const correctCount = activeList.filter(
        ({ question }) => answers[question.id] === question.correctOptionId
      ).length;
      const missed = activeList
        .filter(({ question }) => answers[question.id] !== question.correctOptionId)
        .map(({ question }) => question.id);
      setMistakeIds(missed);
      setFinished(true);
      onFinish(correctCount, activeList.length, missed);
    }
  };

  const restart = (nextMode: 'all' | 'mistakes') => {
    setMode(nextMode);
    setCurrentIdx(0);
    setAnswers({});
    setOpenTr({});
    setShowTranscript(false);
    setFinished(false);
    setSeed((s) => s + 1);
  };

  const renderHighlightedPrompt = (text: string, token?: string) => {
    if (!token) return text;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === token.toLowerCase() ? (
        <mark
          key={idx}
          className="bg-[#FFD166] text-[#6B1029] font-bold px-1.5 py-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
  };

  if (finished) {
    const correctCount = activeList.filter(
      ({ question }) => answers[question.id] === question.correctOptionId
    ).length;
    const missedEntries = activeList.filter(
      ({ question }) => answers[question.id] !== question.correctOptionId
    );
    const pct = Math.round((correctCount / Math.max(1, activeList.length)) * 100);

    return (
      <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE0DC] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9F1835]">
              <Award className="w-4 h-4 text-[#F28C28]" />
              <span>Resultado del juego</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#1E1417]">
              {gameTitleEs} — {correctCount} / {activeList.length} ({pct}%)
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missedEntries.length > 0 && (
              <button
                type="button"
                onClick={() => restart('mistakes')}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#F28C28] text-white text-sm font-semibold hover:bg-[#d97719] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Repetir errores ({missedEntries.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => restart('all')}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Empezar de nuevo</span>
            </button>
          </div>
        </div>

        {missedEntries.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#9F1835]">
              Repaso de errores:
            </h4>
            {missedEntries.map(({ question }) => {
              const rightOpt = question.options.find(
                (o) => o.id === question.correctOptionId
              );
              const expOpen = Boolean(openTr[`missed-exp-${question.id}`]);
              return (
                <div
                  key={question.id}
                  className="rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm sm:text-base font-semibold text-[#1E1417] flex-1">
                      {question.promptEs}
                    </p>
                    <TranslationToggleButton
                      compact
                      isOpen={expOpen}
                      onToggle={() => toggleTr(`missed-exp-${question.id}`)}
                      labelClosed="Explicación (ARM)"
                      labelOpen="Ocultar"
                    />
                  </div>
                  {rightOpt && (
                    <p className="text-sm font-medium text-emerald-800">
                      Correcto: {rightOpt.primaryText}
                    </p>
                  )}
                  {expOpen && (
                    <p className="text-xs sm:text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-2">
                      {question.explanationHy}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm sm:text-base text-emerald-900 font-medium">
            ¡Excelente! Todas tus respuestas fueron correctas.
          </div>
        )}
      </div>
    );
  }

  if (!currentItem || !currentQ) return null;

  const isCorrect = selectedOptId === currentQ.correctOptionId;
  const expOpen = Boolean(openTr[`exp-${currentQ.id}`]);

  return (
    <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#584449]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-tabular font-semibold text-[#6B1029]">
            {currentIdx + 1} / {activeList.length}
          </span>
          <span>·</span>
          <span className="font-semibold text-[#9F1835]">Nivel {currentQ.level}</span>
          {currentQ.metaLabel && (
            <>
              <span>·</span>
              <span className="font-mono-tabular">{currentQ.metaLabel}</span>
            </>
          )}
          {currentQ.badgeText && (
            <>
              <span>·</span>
              <span className="text-[#6B1029] font-medium">{currentQ.badgeText}</span>
            </>
          )}
        </div>
        {(currentQ.promptHy || currentQ.contextHy) && (
          <TranslationToggleButton
            isOpen={Boolean(openTr[`prompt-${currentQ.id}`])}
            onToggle={() => toggleTr(`prompt-${currentQ.id}`)}
            compact
          />
        )}
      </div>

      {/* Explicit study-error notice for Game 9 (Corrige el error) */}
      {currentQ.isStudyErrorNotice && (
        <div className="rounded-xl border border-[#F28C28]/50 bg-[#FFF8EE] px-3.5 py-2.5 flex items-start gap-2.5 text-xs sm:text-sm text-[#6B1029]">
          <AlertTriangle className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
          <ClickToTranslate
            es="Oración didáctica con un error intencional (no es un subtítulo original del capítulo)."
            hy="Ուսումնական նախադասություն՝ դիտավորյալ սխալով (սերիայի բնօրինակ ենթագիր չէ)։"
            esClassName="text-xs sm:text-sm font-medium text-[#6B1029]"
            showHintLabel={false}
          />
        </div>
      )}

      {/* Optional YouTube clip player for Listening & Final Challenge */}
      {currentQ.clip && (
        <ClipYouTubePlayer
          key={`${youtubeId}-${currentQ.id}`}
          videoId={youtubeId}
          startSec={currentQ.clip.startSec}
          endSec={currentQ.clip.endSec}
          label={currentQ.clip.label}
        />
      )}

      {/* Main prompt */}
      <div className="rounded-xl bg-[#FAF7F5] border border-[#EAE0DC] p-4 space-y-2.5">
        <p className="text-base sm:text-lg font-semibold text-[#1E1417] leading-relaxed">
          {renderHighlightedPrompt(currentQ.promptEs, currentQ.highlightedToken)}
        </p>
        {openTr[`prompt-${currentQ.id}`] && (currentQ.promptHy || currentQ.contextHy) && (
          <div className="text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3.5 py-2 space-y-1">
            {currentQ.promptHy && <p className="font-medium">{currentQ.promptHy}</p>}
            {currentQ.contextHy && <p className="text-xs sm:text-sm opacity-90">{currentQ.contextHy}</p>}
          </div>
        )}

        {/* Secondary context quote (e.g. Game 7 ¿Qué significa?) */}
        {currentQ.extraQuoteEs && (
          <div className="pt-2 border-t border-[#EAE0DC] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm sm:text-base italic text-[#584449]">
                «{currentQ.extraQuoteEs}»
              </p>
              {currentQ.extraQuoteHy && (
                <TranslationToggleButton
                  isOpen={Boolean(openTr[`quote-${currentQ.id}`])}
                  onToggle={() => toggleTr(`quote-${currentQ.id}`)}
                  compact
                />
              )}
            </div>
            {openTr[`quote-${currentQ.id}`] && currentQ.extraQuoteHy && (
              <p className="text-xs sm:text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-2">
                {currentQ.extraQuoteHy}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Answer Options (separate translation toggle on every option with Armenian translation) */}
      <div className="grid grid-cols-1 gap-2.5">
        {currentItem.options.map((opt, idx) => {
          const isPicked = selectedOptId === opt.id;
          const isRight = opt.id === currentQ.correctOptionId;

          let cardClasses = 'border-[#EAE0DC] bg-white hover:border-[#F28C28]';
          if (isAnswered) {
            if (isRight) {
              cardClasses = 'border-emerald-400 bg-emerald-50/75';
            } else if (isPicked && !isRight) {
              cardClasses = 'border-[#DC3545] bg-rose-50/75';
            } else {
              cardClasses = 'border-[#EAE0DC] bg-[#FAF7F5] opacity-60';
            }
          }

          return (
            <div
              key={opt.id}
              className={`rounded-xl border p-3 sm:p-3.5 transition-colors ${cardClasses}`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelect(opt.id)}
                  className="flex-1 flex items-center gap-3 text-left min-h-[42px] cursor-pointer disabled:cursor-default"
                >
                  <span
                    className={`w-7 h-7 rounded-lg font-mono-tabular text-xs font-bold flex items-center justify-center shrink-0 ${
                      isAnswered && isRight
                        ? 'bg-emerald-600 text-white'
                        : isAnswered && isPicked && !isRight
                        ? 'bg-[#DC3545] text-white'
                        : 'bg-[#F3E9E5] text-[#6B1029]'
                    }`}
                  >
                    {OPTION_LETTERS[idx] ?? idx + 1}
                  </span>
                  <span className="text-sm sm:text-base font-medium text-[#1E1417]">
                    {opt.primaryText}
                  </span>
                </button>

                {opt.hasSeparateTranslation && opt.secondaryHy && (
                  <TranslationToggleButton
                    isOpen={Boolean(openTr[`opt-${currentQ.id}-${opt.id}`])}
                    onToggle={() => toggleTr(`opt-${currentQ.id}-${opt.id}`)}
                    compact
                  />
                )}
              </div>

              {opt.hasSeparateTranslation &&
                opt.secondaryHy &&
                openTr[`opt-${currentQ.id}-${opt.id}`] && (
                  <p className="mt-2 ml-10 text-xs sm:text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-1.5">
                    {opt.secondaryHy}
                  </p>
                )}
            </div>
          );
        })}
      </div>

      {/* Feedback & explanation after answering */}
      {isAnswered && (
        <div
          className={`rounded-xl border p-4 space-y-2.5 ${
            isCorrect
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-rose-50/80 border-rose-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-900">¡Correcto!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-[#DC3545] shrink-0" />
                  <span className="text-rose-900">Incorrecto</span>
                </>
              )}
            </div>
            <TranslationToggleButton
              compact
              isOpen={expOpen}
              onToggle={() => toggleTr(`exp-${currentQ.id}`)}
              labelClosed="Explicación (ARM)"
              labelOpen="Ocultar"
            />
          </div>

          {expOpen && (
            <p className="text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3.5 py-2.5 leading-relaxed">
              {currentQ.explanationHy}
            </p>
          )}

          {currentQ.transcriptAfterAnswer && (
            <div className="pt-2 border-t border-black/10 space-y-1.5">
              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                className="text-xs sm:text-sm font-semibold text-[#6B1029] underline underline-offset-2 cursor-pointer"
              >
                {showTranscript
                  ? 'Ocultar texto del fragmento'
                  : 'Mostrar texto del fragmento'}
              </button>
              {showTranscript && (
                <div className="rounded-lg bg-white/95 border border-[#EAE0DC] p-3">
                  <ClickToTranslate
                    es={`«${currentQ.transcriptAfterAnswer.es}»`}
                    hy={currentQ.transcriptAfterAnswer.hy}
                    esClassName="text-sm sm:text-base font-medium text-[#1E1417]"
                  />
                </div>
              )}
            </div>
          )}

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] transition-colors cursor-pointer"
            >
              <span>
                {currentIdx < activeList.length - 1 ? 'Siguiente' : 'Finalizar juego'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Games Hub & Active Game Container                                     */
/* -------------------------------------------------------------------------- */

interface GamesSectionProps {
  episode: EpisodeData;
  progress: EpisodeProgress;
  onSaveGameScore: (
    gameId: string,
    correct: number,
    total: number,
    missedIds: string[]
  ) => void;
}

export const GamesSection: React.FC<GamesSectionProps> = ({
  episode,
  progress,
  onSaveGameScore,
}) => {
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [openMetaTr, setOpenMetaTr] = useState<Record<string, boolean>>({});

  // Reset selected game when switching between Episode 16 and Episode 17
  useEffect(() => {
    setActiveGameId(null);
    setOpenMetaTr({});
  }, [episode.id]);

  const completedGamesCount = useMemo(() => {
    return GAMES_META.filter((m) => progress.games[m.id]?.completed).length;
  }, [progress.games]);

  const activeMeta = GAMES_META.find((m) => m.id === activeGameId) ?? null;

  const normalizedQuestions = useMemo(() => {
    if (!activeGameId) return [];
    return buildNormalizedQuestions(activeGameId, episode);
  }, [activeGameId, episode]);

  if (activeGameId && activeMeta) {
    const handleFinish = (correct: number, total: number, missedIds: string[]) => {
      onSaveGameScore(activeGameId, correct, total, missedIds);
    };

    return (
      <section className="space-y-4">
        <div className="rounded-2xl bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-md shadow-[#6B1029]/15 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveGameId(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-[#F28C28]/40 bg-[#FFF8EE] text-sm sm:text-[15px] font-semibold text-[#6B1029] hover:bg-[#FFD166]/35 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Todos los 12 juegos</span>
          </button>

          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm font-mono-tabular text-[#584449]">
              Juego #{activeMeta.index} / 12 · {activeMeta.levelLabel} · Capítulo {episode.number}
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#6B1029]">
              {activeMeta.titleEs}
            </h2>
          </div>
        </div>

        {activeGameId === 'orderWords' ? (
          <OrderWordsGame
            key={`${episode.id}-orderWords`}
            items={episode.games.orderWords}
            onFinish={handleFinish}
          />
        ) : activeGameId === 'memory' ? (
          <MemoryGame
            key={`${episode.id}-memory`}
            pairs={episode.games.memoryPairs}
            onFinish={handleFinish}
          />
        ) : activeGameId === 'conversation' ? (
          <ConversationGame
            key={`${episode.id}-conversation`}
            conversation={episode.games.conversation}
            onFinish={handleFinish}
          />
        ) : activeGameId === 'storyOrder' ? (
          <StoryOrderGame
            key={`${episode.id}-storyOrder`}
            storyOrder={episode.games.storyOrder}
            onFinish={handleFinish}
          />
        ) : (
          <ChoiceGameRunner
            key={`${episode.id}-${activeGameId}`}
            gameTitleEs={activeMeta.titleEs}
            youtubeId={episode.youtubeId}
            questions={normalizedQuestions}
            shuffleOptions={activeGameId !== 'trueFalse'}
            onFinish={handleFinish}
          />
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-[240px]">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#9F1835]">
            <Gamepad2 className="w-4 h-4 text-[#F28C28]" />
            <span>Juegos interactivos · 12 actividades</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#6B1029]">
            Capítulo {episode.number} — Juegos
          </h2>
          <ClickToTranslate
            es="Cada juego está basado exclusivamente en los diálogos, el vocabulario y la trama de este capítulo."
            hy="Յուրաքանչյուր խաղ կառուցված է միայն այս սերիայի երկխոսությունների, բառապաշարի և սյուժեի հիման վրա։"
            esClassName="text-sm sm:text-base text-[#584449]"
            showHintLabel={false}
          />
        </div>

        <div className="rounded-xl border border-[#F28C28]/45 bg-[#FFF8EE] px-4 py-3 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#F28C28] shrink-0" />
          <div className="text-xs sm:text-sm">
            <div className="text-[#584449]">Completados</div>
            <div className="font-mono-tabular text-lg font-bold text-[#6B1029]">
              {completedGamesCount} / 12
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {GAMES_META.map((game) => {
          const rec = progress.games[game.id];
          const isDone = Boolean(rec?.completed);
          const isAudioGame = game.id === 'listenRespond' || game.id === 'finalChallenge';
          const isTrOpen = Boolean(openMetaTr[game.id]);

          return (
            <div
              key={game.id}
              className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-md shadow-[#6B1029]/12 p-5 hover:border-[#F28C28] hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-mono-tabular text-[#584449]">
                  <span className="font-bold text-[#6B1029]">
                    #{game.index.toString().padStart(2, '0')} · {game.levelLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isAudioGame && <Headphones className="w-4 h-4 text-[#F28C28]" />}
                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    <TranslationToggleButton
                      compact
                      isOpen={isTrOpen}
                      onToggle={() =>
                        setOpenMetaTr((prev) => ({ ...prev, [game.id]: !prev[game.id] }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#1E1417]">
                    {game.titleEs}
                  </h3>
                  <p className="text-sm text-[#584449] leading-relaxed mt-1">
                    {game.descEs}
                  </p>
                </div>

                {isTrOpen && (
                  <div className="rounded-lg bg-[#FFF8EE] border border-[#F28C28]/35 px-3 py-2 space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-[#6B1029]">
                      {game.titleHy}
                    </p>
                    <p className="text-xs text-[#584449]">{game.descHy}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#F28C28]/20 flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold">
                {rec ? (
                  <span className="font-mono-tabular text-[#6B1029]">
                    Mejor: {rec.bestCorrect} / {rec.total}
                  </span>
                ) : (
                  <span className="text-[#584449]">Sin jugar</span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveGameId(game.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#6B1029] text-white hover:bg-[#9F1835] transition-colors cursor-pointer"
                >
                  {game.id === 'finalChallenge' ? (
                    <Sparkles className="w-4 h-4 text-[#FFD166]" />
                  ) : null}
                  <span>Jugar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
