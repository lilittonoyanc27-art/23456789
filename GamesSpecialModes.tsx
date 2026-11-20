import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  CheckCircle2,
  Eraser,
  MessageCircle,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  EpisodeGamesData,
  MemoryPair,
  OrderWordsItem,
  StoryOrderItem,
} from './types';
import { ClickToTranslate, TranslationToggleButton } from './TranslatableText';
import { shuffleArray } from './storage';

/* -------------------------------------------------------------------------- */
/* Game 3: Ordena las palabras                                                */
/* -------------------------------------------------------------------------- */

interface OrderWordsGameProps {
  items: OrderWordsItem[];
  onFinish: (correct: number, total: number, missedIds: string[]) => void;
}

interface WordToken {
  uid: string;
  word: string;
}

function buildScrambledTokens(words: string[]): WordToken[] {
  const tokens: WordToken[] = words.map((word, idx) => ({
    uid: `${idx}-${word}`,
    word,
  }));
  if (tokens.length <= 1) return tokens;
  let shuffled = shuffleArray(tokens);
  let tries = 0;
  while (
    tries < 6 &&
    shuffled.every((t, i) => t.word === words[i])
  ) {
    shuffled = shuffleArray(tokens);
    tries += 1;
  }
  return shuffled;
}

export const OrderWordsGame: React.FC<OrderWordsGameProps> = ({ items, onFinish }) => {
  const [mode, setMode] = useState<'all' | 'mistakes'>('all');
  const [mistakeIds, setMistakeIds] = useState<string[]>([]);
  const [seed, setSeed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [placed, setPlaced] = useState<WordToken[]>([]);
  const [checked, setChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [openTr, setOpenTr] = useState<boolean>(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  const activeItems = useMemo(() => {
    return mode === 'mistakes' && mistakeIds.length > 0
      ? items.filter((it) => mistakeIds.includes(it.id))
      : items;
  }, [items, mode, mistakeIds]);

  const currentItem = activeItems[currentIdx];

  const scrambledPool = useMemo(() => {
    if (!currentItem) return [];
    return buildScrambledTokens(currentItem.words);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id, seed]);

  useEffect(() => {
    setPlaced([]);
    setChecked(false);
    setIsCorrect(false);
    setOpenTr(false);
  }, [currentIdx, seed, mode]);

  const placedIds = new Set(placed.map((p) => p.uid));
  const availableTokens = scrambledPool.filter((t) => !placedIds.has(t.uid));

  const handlePlace = (token: WordToken) => {
    if (checked) return;
    setPlaced((prev) => [...prev, token]);
  };

  const handleRemove = (uid: string) => {
    if (checked) return;
    setPlaced((prev) => prev.filter((t) => t.uid !== uid));
  };

  const handleCheck = () => {
    if (!currentItem || checked || placed.length === 0) return;
    const ok =
      placed.length === currentItem.words.length &&
      placed.every((t, i) => t.word === currentItem.words[i]);
    setChecked(true);
    setIsCorrect(ok);
    setResults((prev) => ({ ...prev, [currentItem.id]: ok }));
  };

  const handleNext = () => {
    if (currentIdx < activeItems.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      const missed = activeItems.filter((it) => results[it.id] === false).map((it) => it.id);
      const correctCount = activeItems.filter((it) => results[it.id] === true).length;
      setMistakeIds(missed);
      setFinished(true);
      onFinish(correctCount, activeItems.length, missed);
    }
  };

  const restart = (nextMode: 'all' | 'mistakes') => {
    setMode(nextMode);
    setCurrentIdx(0);
    setResults({});
    setFinished(false);
    setSeed((s) => s + 1);
  };

  if (finished) {
    const correctCount = activeItems.filter((it) => results[it.id] === true).length;
    const missedItems = activeItems.filter((it) => results[it.id] === false);
    const pct = Math.round((correctCount / Math.max(1, activeItems.length)) * 100);

    return (
      <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE0DC] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9F1835]">
              <Award className="w-4 h-4 text-[#F28C28]" />
              <span>Juego completado</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#1E1417]">
              Ordena las palabras — {correctCount} / {activeItems.length} ({pct}%)
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missedItems.length > 0 && (
              <button
                type="button"
                onClick={() => restart('mistakes')}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#F28C28] text-white text-sm font-semibold hover:bg-[#d97719] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Repetir errores ({missedItems.length})</span>
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

        {missedItems.length > 0 ? (
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-[#9F1835]">
              Repaso de errores:
            </h4>
            {missedItems.map((it) => (
              <div
                key={it.id}
                className="rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] p-3.5"
              >
                <ClickToTranslate
                  es={it.words.join(' ')}
                  hy={it.translationHy}
                  esClassName="text-sm sm:text-base font-semibold text-[#1E1417]"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm sm:text-base text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-4 font-medium">
            ¡Excelente! Ordenaste todas las frases correctamente.
          </p>
        )}
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#584449]">
        <span className="font-mono-tabular font-semibold text-[#6B1029]">
          {currentIdx + 1} / {activeItems.length} · Nivel {currentItem.level} · [{currentItem.timestamp}]
        </span>
        <TranslationToggleButton
          isOpen={openTr}
          onToggle={() => setOpenTr((v) => !v)}
          compact
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm sm:text-base font-semibold text-[#1E1417]">
          Ordena las palabras para formar la frase del capítulo:
        </p>
        {openTr && (
          <div className="rounded-xl bg-[#FFF8EE] border border-[#F28C28]/35 px-3.5 py-2.5 space-y-1 text-sm text-[#6B1029]">
            <p className="font-medium">{currentItem.translationHy}</p>
            <p className="text-xs opacity-85">{currentItem.instructionHy}</p>
          </div>
        )}
      </div>

      {/* Answer tray */}
      <div className="min-h-[80px] rounded-xl border-2 border-dashed border-[#EAE0DC] bg-[#FAF7F5] p-3 flex flex-wrap gap-2 items-center">
        {placed.length === 0 ? (
          <span className="text-xs sm:text-sm text-[#6A585D]">
            Toca las palabras de abajo para armar la frase en el orden correcto.
          </span>
        ) : (
          placed.map((token) => (
            <button
              key={token.uid}
              type="button"
              disabled={checked}
              onClick={() => handleRemove(token.uid)}
              className={`px-3.5 py-2 min-h-[42px] rounded-lg text-sm sm:text-base font-medium border transition-colors ${
                checked
                  ? isCorrect
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : 'bg-rose-50 border-rose-400 text-rose-900'
                  : 'bg-[#6B1029] text-white border-[#6B1029] hover:bg-[#9F1835] cursor-pointer'
              }`}
            >
              {token.word}
            </button>
          ))
        )}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {availableTokens.map((token) => (
          <button
            key={token.uid}
            type="button"
            disabled={checked}
            onClick={() => handlePlace(token)}
            className="px-3.5 py-2 min-h-[44px] rounded-lg border border-[#EAE0DC] bg-white text-[#1E1417] text-sm sm:text-base font-medium hover:border-[#F28C28] hover:bg-[#FFF8EE] transition-colors cursor-pointer disabled:opacity-50"
          >
            {token.word}
          </button>
        ))}
      </div>

      {checked && (
        <div
          className={`rounded-xl p-4 border space-y-2 ${
            isCorrect
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/80 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>¡Correcto!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-[#DC3545] shrink-0" />
                <span>Orden correcto:</span>
              </>
            )}
          </div>
          <ClickToTranslate
            es={currentItem.words.join(' ')}
            hy={currentItem.translationHy}
            esClassName="text-sm sm:text-base font-semibold text-[#1E1417]"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAE0DC]">
        {!checked ? (
          <>
            <button
              type="button"
              onClick={() => setPlaced([])}
              disabled={placed.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#EAE0DC] text-sm text-[#584449] hover:bg-[#FAF7F5] disabled:opacity-40 cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
            <button
              type="button"
              onClick={handleCheck}
              disabled={placed.length !== currentItem.words.length}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span>Comprobar</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] transition-colors cursor-pointer"
          >
            <span>
              {currentIdx < activeItems.length - 1 ? 'Siguiente' : 'Finalizar'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Game 5: Memory (Spanish ↔ Eastern Armenian pairs)                          */
/* -------------------------------------------------------------------------- */

interface MemoryCard {
  uid: string;
  pairId: string;
  lang: 'es' | 'hy';
  text: string;
}

interface MemoryGameProps {
  pairs: MemoryPair[];
  onFinish: (correct: number, total: number, missedIds: string[]) => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ pairs, onFinish }) => {
  const [seed, setSeed] = useState(0);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const cards = useMemo<MemoryCard[]>(() => {
    const raw: MemoryCard[] = [];
    pairs.forEach((p) => {
      raw.push({ uid: `${p.id}-es`, pairId: p.id, lang: 'es', text: p.es });
      raw.push({ uid: `${p.id}-hy`, pairId: p.id, lang: 'hy', text: p.hy });
    });
    return shuffleArray(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs, seed]);

  const handleRestart = () => {
    setFlippedUids([]);
    setMatchedPairIds([]);
    setMoves(0);
    setLocked(false);
    setSeed((s) => s + 1);
  };

  const handleCardClick = (card: MemoryCard) => {
    if (locked) return;
    if (matchedPairIds.includes(card.pairId)) return;
    if (flippedUids.includes(card.uid)) return;

    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const firstCard = cards.find((c) => c.uid === nextFlipped[0]);
      const secondCard = cards.find((c) => c.uid === nextFlipped[1]);
      if (
        firstCard &&
        secondCard &&
        firstCard.pairId === secondCard.pairId &&
        firstCard.lang !== secondCard.lang
      ) {
        const nextMatched = [...matchedPairIds, firstCard.pairId];
        setMatchedPairIds(nextMatched);
        setFlippedUids([]);
        if (nextMatched.length === pairs.length) {
          onFinish(pairs.length, pairs.length, []);
        }
      } else {
        setLocked(true);
        window.setTimeout(() => {
          setFlippedUids([]);
          setLocked(false);
        }, 850);
      }
    }
  };

  const allMatched = matchedPairIds.length === pairs.length && pairs.length > 0;

  return (
    <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-[#584449] font-mono-tabular">
          Parejas:{' '}
          <strong className="text-[#6B1029]">
            {matchedPairIds.length} / {pairs.length}
          </strong>{' '}
          · Movimientos: <strong className="text-[#1E1417]">{moves}</strong>
        </div>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-[#F28C28]/40 bg-[#FFF8EE] text-xs sm:text-sm font-semibold text-[#6B1029] hover:bg-[#FFD166]/35 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Mezclar de nuevo</span>
        </button>
      </div>

      {allMatched && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <Sparkles className="w-5 h-5 text-[#F28C28] shrink-0" />
            <span className="text-sm sm:text-base font-semibold">
              ¡Encontraste las {pairs.length} parejas en {moves} movimientos!
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-2 min-h-[40px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] cursor-pointer"
          >
            Jugar de nuevo
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {cards.map((card) => {
          const isMatched = matchedPairIds.includes(card.pairId);
          const isFlipped = isMatched || flippedUids.includes(card.uid);

          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleCardClick(card)}
              disabled={isMatched}
              className={`min-h-[96px] sm:min-h-[108px] rounded-xl p-3 border text-center flex flex-col items-center justify-center transition-all duration-150 ${
                isMatched
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : isFlipped
                  ? card.lang === 'es'
                    ? 'bg-[#FFF8EE] border-[#F28C28] text-[#1E1417]'
                    : 'bg-[#6B1029]/5 border-[#6B1029] text-[#6B1029]'
                  : 'bg-[#6B1029] border-[#6B1029] text-[#FFD166] hover:bg-[#9F1835] cursor-pointer'
              }`}
            >
              {isFlipped ? (
                <>
                  <span className="text-[10px] uppercase tracking-wider font-mono-tabular opacity-70 mb-1">
                    {card.lang === 'es' ? 'ES' : 'ARM'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold leading-snug break-words">
                    {card.text}
                  </span>
                </>
              ) : (
                <span className="font-display text-lg font-bold tracking-wide">MB</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Game 10: Conversación interactiva                                          */
/* -------------------------------------------------------------------------- */

interface ConversationGameProps {
  conversation: EpisodeGamesData['conversation'];
  onFinish: (correct: number, total: number, missedIds: string[]) => void;
}

interface HistoryEntry {
  stepId: string;
  character: string;
  promptEs: string;
  replyEs: string;
  isBest: boolean;
  feedbackHy: string;
}

export const ConversationGame: React.FC<ConversationGameProps> = ({
  conversation,
  onFinish,
}) => {
  const [seed, setSeed] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openTr, setOpenTr] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [finished, setFinished] = useState(false);

  const stepsWithShuffled = useMemo(() => {
    return conversation.steps.map((step) => ({
      step,
      options: shuffleArray(step.options),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, seed]);

  const current = stepsWithShuffled[stepIdx];
  const chosenOption = current?.options.find((o) => o.id === selectedId);

  const toggleTr = (key: string) => {
    setOpenTr((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChoose = (optId: string) => {
    if (selectedId || !current) return;
    setSelectedId(optId);
  };

  const handleNext = () => {
    if (!current || !chosenOption) return;
    const nextHistory: HistoryEntry[] = [
      ...history,
      {
        stepId: current.step.id,
        character: current.step.character,
        promptEs: current.step.promptEs,
        replyEs: chosenOption.replyEs,
        isBest: chosenOption.isBest,
        feedbackHy: chosenOption.feedbackHy,
      },
    ];
    setHistory(nextHistory);
    setSelectedId(null);
    setOpenTr({});

    if (stepIdx < stepsWithShuffled.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      const correctCount = nextHistory.filter((h) => h.isBest).length;
      const missed = nextHistory.filter((h) => !h.isBest).map((h) => h.stepId);
      setFinished(true);
      onFinish(correctCount, nextHistory.length, missed);
    }
  };

  const restart = () => {
    setStepIdx(0);
    setSelectedId(null);
    setOpenTr({});
    setHistory([]);
    setFinished(false);
    setSeed((s) => s + 1);
  };

  if (finished) {
    const bestCount = history.filter((h) => h.isBest).length;
    return (
      <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE0DC] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9F1835]">
              Diálogo completado
            </p>
            <h3 className="font-display text-2xl font-bold text-[#1E1417]">
              {conversation.titleEs} — {bestCount} / {history.length}
            </h3>
          </div>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Empezar de nuevo</span>
          </button>
        </div>

        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.stepId}
              className="rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] p-3.5 space-y-2"
            >
              <p className="text-sm text-[#1E1417]">
                <strong className="text-[#6B1029]">{h.character}:</strong> {h.promptEs}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#1E1417]">
                  <strong className={h.isBest ? 'text-emerald-700' : 'text-[#DC3545]'}>
                    Tú:
                  </strong>{' '}
                  {h.replyEs}
                </p>
                <TranslationToggleButton
                  compact
                  isOpen={Boolean(openTr[`hist-${h.stepId}`])}
                  onToggle={() => toggleTr(`hist-${h.stepId}`)}
                  labelClosed="Comentario (ARM)"
                  labelOpen="Ocultar"
                />
              </div>
              {openTr[`hist-${h.stepId}`] && (
                <p className="text-xs sm:text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-2">
                  {h.feedbackHy}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EAE0DC] pb-3">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <ClickToTranslate
            es={conversation.titleEs}
            hy={`${conversation.titleHy} — ${conversation.scenarioHy}`}
            esClassName="font-display text-lg sm:text-xl font-bold text-[#1E1417]"
          />
        </div>
        <span className="font-mono-tabular text-xs sm:text-sm font-semibold text-[#6B1029]">
          Paso {stepIdx + 1} / {stepsWithShuffled.length}
        </span>
      </div>

      {/* Previous turns */}
      {history.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto mb-scroll pr-1">
          {history.map((h) => (
            <div key={h.stepId} className="text-xs sm:text-sm bg-[#FAF7F5] rounded-lg px-3 py-2 space-y-1">
              <p className="text-[#584449]">
                <strong className="text-[#6B1029]">{h.character}:</strong> {h.promptEs}
              </p>
              <p className="text-[#1E1417] font-medium">→ {h.replyEs}</p>
            </div>
          ))}
        </div>
      )}

      {/* Current character prompt */}
      <div className="rounded-xl border border-[#F28C28]/40 bg-[#FFF8EE] p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6B1029]">
            <MessageCircle className="w-4 h-4 text-[#F28C28]" />
            <span>{current.step.character}</span>
          </span>
          <TranslationToggleButton
            isOpen={Boolean(openTr['prompt'])}
            onToggle={() => toggleTr('prompt')}
            compact
          />
        </div>
        <p className="text-base sm:text-lg font-semibold text-[#1E1417]">
          «{current.step.promptEs}»
        </p>
        {openTr['prompt'] && (
          <p className="text-sm text-[#6B1029] border-t border-[#F28C28]/25 pt-2">
            {current.step.promptHy}
          </p>
        )}
      </div>

      {/* Reply choices — separate translation button so translating never selects the answer */}
      <div className="space-y-2.5">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#584449]">
          Elige la respuesta más natural
        </p>
        {current.options.map((opt) => {
          const isPicked = selectedId === opt.id;
          let stateClasses = 'border-[#EAE0DC] bg-white hover:border-[#F28C28]';
          if (selectedId) {
            if (opt.isBest) {
              stateClasses = 'border-emerald-400 bg-emerald-50/70';
            } else if (isPicked && !opt.isBest) {
              stateClasses = 'border-[#DC3545] bg-rose-50/70';
            } else {
              stateClasses = 'border-[#EAE0DC] bg-[#FAF7F5] opacity-65';
            }
          }

          return (
            <div
              key={opt.id}
              className={`rounded-xl border p-3 sm:p-3.5 transition-colors ${stateClasses}`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <button
                  type="button"
                  disabled={Boolean(selectedId)}
                  onClick={() => handleChoose(opt.id)}
                  className="flex-1 text-left min-h-[40px] flex items-center text-sm sm:text-base font-medium text-[#1E1417] cursor-pointer disabled:cursor-default"
                >
                  {opt.replyEs}
                </button>
                <TranslationToggleButton
                  isOpen={Boolean(openTr[opt.id])}
                  onToggle={() => toggleTr(opt.id)}
                  compact
                />
              </div>
              {openTr[opt.id] && (
                <p className="mt-2 pt-2 border-t border-[#EAE0DC] text-xs sm:text-sm text-[#6B1029]">
                  {opt.replyHy}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {chosenOption && (
        <div
          className={`rounded-xl border p-4 space-y-2.5 ${
            chosenOption.isBest
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-amber-50/80 border-[#F28C28]/50'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm sm:text-base font-semibold text-[#1E1417]">
              {chosenOption.isBest
                ? '¡Excelente respuesta!'
                : 'Hay una respuesta más natural para este momento'}
            </p>
            <TranslationToggleButton
              compact
              isOpen={Boolean(openTr['conv-fb'])}
              onToggle={() => toggleTr('conv-fb')}
              labelClosed="Explicación (ARM)"
              labelOpen="Ocultar"
            />
          </div>
          {openTr['conv-fb'] && (
            <p className="text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-2">
              {chosenOption.feedbackHy}
            </p>
          )}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] cursor-pointer"
            >
              <span>
                {stepIdx < stepsWithShuffled.length - 1
                  ? 'Continuar'
                  : 'Finalizar diálogo'}
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
/* Game 11: Completa la historia (Chronological episode ordering)             */
/* -------------------------------------------------------------------------- */

interface StoryOrderGameProps {
  storyOrder: EpisodeGamesData['storyOrder'];
  onFinish: (correct: number, total: number, missedIds: string[]) => void;
}

function buildShuffledStory(events: StoryOrderItem[]): StoryOrderItem[] {
  if (events.length <= 1) return [...events];
  let shuffled = shuffleArray(events);
  let tries = 0;
  while (
    tries < 6 &&
    shuffled.every((ev, idx) => ev.correctOrder === idx + 1)
  ) {
    shuffled = shuffleArray(events);
    tries += 1;
  }
  return shuffled;
}

export const StoryOrderGame: React.FC<StoryOrderGameProps> = ({
  storyOrder,
  onFinish,
}) => {
  const [ordered, setOrdered] = useState<StoryOrderItem[]>(() =>
    buildShuffledStory(storyOrder.events)
  );
  const [checked, setChecked] = useState(false);
  const [openTr, setOpenTr] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOrdered(buildShuffledStory(storyOrder.events));
    setChecked(false);
    setOpenTr({});
  }, [storyOrder]);

  const moveItem = (index: number, delta: -1 | 1) => {
    if (checked) return;
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const copy = [...ordered];
    const tmp = copy[index];
    copy[index] = copy[target];
    copy[target] = tmp;
    setOrdered(copy);
  };

  const handleCheck = () => {
    setChecked(true);
    const correctCount = ordered.filter(
      (ev, idx) => ev.correctOrder === idx + 1
    ).length;
    const missedIds = ordered
      .filter((ev, idx) => ev.correctOrder !== idx + 1)
      .map((ev) => ev.id);
    onFinish(correctCount, ordered.length, missedIds);
  };

  const handleRestart = () => {
    setOrdered(buildShuffledStory(storyOrder.events));
    setChecked(false);
    setOpenTr({});
  };

  const correctCount = ordered.filter(
    (ev, idx) => ev.correctOrder === idx + 1
  ).length;

  return (
    <div className="rounded-2xl border border-[#FFD166]/65 bg-[#FFFDF9]/96 shadow-lg shadow-[#6B1029]/15 p-5 sm:p-6 space-y-5">
      <div className="space-y-1">
        <ClickToTranslate
          es="Usa las flechas para ordenar los hechos según la cronología del capítulo."
          hy={storyOrder.instructionHy}
          esClassName="text-sm sm:text-base font-semibold text-[#1E1417]"
        />
      </div>

      <div className="space-y-2.5">
        {ordered.map((ev, idx) => {
          const isRightPos = checked && ev.correctOrder === idx + 1;
          const isWrongPos = checked && ev.correctOrder !== idx + 1;
          return (
            <div
              key={ev.id}
              className={`rounded-xl border p-3.5 transition-colors ${
                isRightPos
                  ? 'border-emerald-400 bg-emerald-50/70'
                  : isWrongPos
                  ? 'border-[#DC3545] bg-rose-50/70'
                  : 'border-[#EAE0DC] bg-[#FAF7F5]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={checked || idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    aria-label="Subir"
                    className="w-10 h-10 rounded-lg border border-[#EAE0DC] bg-white flex items-center justify-center text-[#6B1029] hover:bg-[#FFF8EE] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={checked || idx === ordered.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    aria-label="Bajar"
                    className="w-10 h-10 rounded-lg border border-[#EAE0DC] bg-white flex items-center justify-center text-[#6B1029] hover:bg-[#FFF8EE] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono-tabular text-xs sm:text-sm font-bold text-[#6B1029]">
                      #{idx + 1}
                      {checked && (
                        <span className="ml-2 font-normal text-[#584449]">
                          (Posición correcta: #{ev.correctOrder} · [{ev.timestamp}])
                        </span>
                      )}
                    </span>
                    <TranslationToggleButton
                      isOpen={Boolean(openTr[ev.id])}
                      onToggle={() =>
                        setOpenTr((prev) => ({ ...prev, [ev.id]: !prev[ev.id] }))
                      }
                      compact
                    />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-[#1E1417]">
                    {ev.eventEs}
                  </p>
                  {openTr[ev.id] && (
                    <p className="text-xs sm:text-sm text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/30 rounded-lg px-3 py-2">
                      {ev.eventHy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {checked && (
        <div className="rounded-xl border border-[#EAE0DC] bg-[#FFF8EE] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm sm:text-base font-semibold text-[#1E1417]">
            Resultado:{' '}
            <span className="text-[#6B1029]">
              {correctCount} / {ordered.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Intentar de nuevo</span>
          </button>
        </div>
      )}

      {!checked && (
        <div className="flex justify-end pt-2 border-t border-[#EAE0DC]">
          <button
            type="button"
            onClick={handleCheck}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm font-semibold hover:bg-[#9F1835] cursor-pointer"
          >
            <span>Comprobar orden</span>
          </button>
        </div>
      )}
    </div>
  );
};
