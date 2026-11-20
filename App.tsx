import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ClipboardCheck,
  Film,
  Gamepad2,
  Languages,
  RotateCcw,
  Tv,
  X,
} from 'lucide-react';
import {
  AllProgress,
  AppSection,
  EpisodeData,
  EpisodeId,
  SubtitleLine,
} from './types';
import { EPISODE_16_DATA } from './episode16Games';
import { EPISODE_17_DATA } from './episode17Games';
import {
  loadProgress,
  resetEpisodeProgress,
  saveProgress,
} from './storage';
import { loadEpisodeSubtitles } from './subtitlesParser';
import { SubtitlesSection } from './SubtitlesSection';
import { GrammarSection } from './GrammarSection';
import { VocabSection } from './VocabSection';
import { QuizSection } from './QuizSection';
import { GamesSection } from './GamesSection';
import { ClickToTranslate } from './TranslatableText';

const EPISODES: Record<EpisodeId, EpisodeData> = {
  ep16: EPISODE_16_DATA,
  ep17: EPISODE_17_DATA,
};

const NAV_ITEMS: {
  id: AppSection;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'video', label: 'Video', icon: Film },
  { id: 'grammar', label: 'Gramática', icon: BookOpen },
  { id: 'vocab', label: 'Vocabulario', icon: Languages },
  { id: 'quiz', label: 'Cuestionario', icon: ClipboardCheck },
  { id: 'games', label: 'Juegos', icon: Gamepad2 },
];

export default function App() {
  const [episodeId, setEpisodeId] = useState<EpisodeId>('ep16');
  const [section, setSection] = useState<AppSection>('video');
  const [progress, setProgress] = useState<AllProgress>(() => loadProgress());

  const [subtitlesMap, setSubtitlesMap] = useState<Partial<Record<EpisodeId, SubtitleLine[]>>>({});
  const [subtitlesLoading, setSubtitlesLoading] = useState<boolean>(false);
  const [subtitlesError, setSubtitlesError] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  const episode = EPISODES[episodeId];
  const epProgress = progress[episodeId];

  // Load verbatim subtitles for the active episode (never mixing ep16 & ep17)
  useEffect(() => {
    if (subtitlesMap[episodeId]) {
      setSubtitlesLoading(false);
      setSubtitlesError(null);
      return;
    }

    let cancelled = false;
    setSubtitlesLoading(true);
    setSubtitlesError(null);

    loadEpisodeSubtitles(episodeId)
      .then((lines) => {
        if (cancelled) return;
        setSubtitlesMap((prev) => ({ ...prev, [episodeId]: lines }));
        setSubtitlesLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Error al cargar los subtítulos';
        setSubtitlesError(msg);
        setSubtitlesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [episodeId, subtitlesMap]);

  // Persist progress changes
  const updateEpisodeProgress = (
    updater: (prev: AllProgress[EpisodeId]) => AllProgress[EpisodeId]
  ) => {
    setProgress((prev) => {
      const next: AllProgress = {
        ...prev,
        [episodeId]: updater(prev[episodeId]),
      };
      saveProgress(next);
      return next;
    });
  };

  const handleToggleFavorite = (vocabId: string) => {
    updateEpisodeProgress((ep) => {
      const exists = ep.favoriteVocabIds.includes(vocabId);
      return {
        ...ep,
        favoriteVocabIds: exists
          ? ep.favoriteVocabIds.filter((id) => id !== vocabId)
          : [...ep.favoriteVocabIds, vocabId],
      };
    });
  };

  const handleToggleLearned = (vocabId: string) => {
    updateEpisodeProgress((ep) => {
      const exists = ep.learnedVocabIds.includes(vocabId);
      return {
        ...ep,
        learnedVocabIds: exists
          ? ep.learnedVocabIds.filter((id) => id !== vocabId)
          : [...ep.learnedVocabIds, vocabId],
      };
    });
  };

  const handleRecordExercise = (exerciseId: string, isCorrect: boolean) => {
    updateEpisodeProgress((ep) => {
      const completed = new Set(ep.completedGrammarExerciseIds);
      const missed = new Set(ep.missedGrammarExerciseIds);
      if (isCorrect) {
        completed.add(exerciseId);
        missed.delete(exerciseId);
      } else {
        missed.add(exerciseId);
      }
      return {
        ...ep,
        completedGrammarExerciseIds: Array.from(completed),
        missedGrammarExerciseIds: Array.from(missed),
      };
    });
  };

  const handleResetGrammarExercises = () => {
    updateEpisodeProgress((ep) => ({
      ...ep,
      completedGrammarExerciseIds: [],
      missedGrammarExerciseIds: [],
    }));
  };

  const handleCompleteQuiz = (score: number, total: number, missedIds: string[]) => {
    updateEpisodeProgress((ep) => ({
      ...ep,
      quiz: {
        bestScore: Math.max(ep.quiz.bestScore, score),
        total,
        attempts: ep.quiz.attempts + 1,
        missedIds,
        lastCompletedAt: new Date().toISOString(),
      },
    }));
  };

  const handleSaveGameScore = (
    gameId: string,
    correct: number,
    total: number,
    missedIds: string[]
  ) => {
    updateEpisodeProgress((ep) => {
      const prevRec = ep.games[gameId];
      return {
        ...ep,
        games: {
          ...ep.games,
          [gameId]: {
            bestCorrect: Math.max(prevRec?.bestCorrect ?? 0, correct),
            total,
            completed: true,
            missedIds,
            lastPlayedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const handleConfirmReset = () => {
    setProgress((prev) => resetEpisodeProgress(prev, episodeId));
    setConfirmResetOpen(false);
  };

  // Compute overall episode completion metrics
  const stats = useMemo(() => {
    const totalVocab = episode.vocabulary.length;
    const learnedVocab = epProgress.learnedVocabIds.length;

    const totalGrammarEx = episode.grammarTopics.reduce(
      (sum, t) => sum + t.exercises.length,
      0
    );
    const doneGrammarEx = epProgress.completedGrammarExerciseIds.length;

    const quizBest = epProgress.quiz.bestScore;
    const quizTotal = episode.quiz.length;

    const gamesDone = Object.values(epProgress.games).filter((g) => g.completed).length;
    const totalGames = 12;

    const vocabRatio = totalVocab > 0 ? learnedVocab / totalVocab : 0;
    const grammarRatio = totalGrammarEx > 0 ? doneGrammarEx / totalGrammarEx : 0;
    const quizRatio = quizTotal > 0 ? quizBest / quizTotal : 0;
    const gamesRatio = gamesDone / totalGames;

    const overallPct = Math.round(
      ((vocabRatio + grammarRatio + quizRatio + gamesRatio) / 4) * 100
    );

    return {
      totalVocab,
      learnedVocab,
      totalGrammarEx,
      doneGrammarEx,
      quizBest,
      quizTotal,
      gamesDone,
      totalGames,
      overallPct,
    };
  }, [episode, epProgress]);

  const activeSubtitles = subtitlesMap[episodeId] ?? [];

  return (
    <div className="min-h-screen text-[#1E1417] flex flex-col">
      {/* Clean 3-Zone Top Bar (single row, crisp contrast across phone/tablet/desktop) */}
      <header className="sticky top-0 z-30 h-16 bg-gradient-to-r from-[#580C21] via-[#6B1029] to-[#9F1835] text-white border-b-2 border-[#FFAC33]/75 shadow-md shadow-[#580C21]/30">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 xl:px-8 flex items-center justify-between gap-3">
          {/* Zone 1: Brand wordmark */}
          <button
            type="button"
            onClick={() => setSection('video')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD166] rounded"
          >
            <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD166] shrink-0" />
            <span className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-white">
              Muñeca Brava
            </span>
          </button>

          {/* Zone 2: Tablet & Desktop Navigation (5 concise single-line items) */}
          <nav
            aria-label="Secciones principales"
            className="hidden md:flex items-center gap-1 lg:gap-1.5"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-[15px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FFD166] text-[#6B1029] shadow-xs'
                      : 'text-white/95 hover:text-[#FFD166] hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single utility action */}
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 bg-[#F28C28] text-white hover:bg-[#FFAC33] hover:text-[#580C21] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Reiniciar</span>
          </button>
        </div>
      </header>

      {/* Inline non-blocking reset confirmation bar (never window.confirm) */}
      {confirmResetOpen && (
        <div className="bg-[#FFF8EE]/98 border-b-2 border-[#F28C28] shadow-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 xl:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <ClickToTranslate
              es={`¿Reiniciar todo el progreso guardado del Capítulo ${episode.number}?`}
              hy={`Ջնջե՞լ ${episode.number}-րդ սերիայի բոլոր պահպանված արդյունքները։`}
              esClassName="text-sm sm:text-base font-semibold text-[#6B1029]"
              showHintLabel={false}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-[#DC3545] text-white text-sm font-semibold hover:bg-[#b82534] cursor-pointer"
              >
                Sí, reiniciar
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-xl border border-[#EAE0DC] bg-white text-sm font-medium text-[#1E1417] hover:bg-[#FAF7F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Episode Switcher + Learning Context Floating Card */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 xl:px-8 pt-4 sm:pt-5">
        <div className="rounded-2xl bg-[#FFFDF9]/95 backdrop-blur-sm border border-[#FFD166]/70 shadow-lg shadow-[#6B1029]/20 p-4 sm:p-5 lg:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
            {/* Episode Switcher — 100% Spanish */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5">
              {(['ep16', 'ep17'] as EpisodeId[]).map((id) => {
                const ep = EPISODES[id];
                const isSelected = episodeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setEpisodeId(id);
                      setConfirmResetOpen(false);
                    }}
                    className={`px-4 py-3 min-h-[48px] rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#6B1029] to-[#9F1835] text-white border-[#F28C28] shadow-sm'
                        : 'bg-[#FFF8EE] text-[#1E1417] border-[#F28C28]/35 hover:border-[#F28C28] hover:bg-[#FFD166]/30'
                    }`}
                  >
                    <span
                      className={`font-display text-base sm:text-lg font-bold ${
                        isSelected ? 'text-[#FFD166]' : 'text-[#6B1029]'
                      }`}
                    >
                      {ep.titleEs}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quiet Unboxed Progress Summary in Spanish */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-[#584449] font-mono-tabular">
              <span>
                Cap. <strong className="text-[#6B1029]">{episode.number}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Palabras <strong className="text-[#1E1417]">{stats.learnedVocab}/{stats.totalVocab}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Gramática <strong className="text-[#1E1417]">{stats.doneGrammarEx}/{stats.totalGrammarEx}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Quiz <strong className="text-[#1E1417]">{stats.quizBest}/{stats.quizTotal}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Juegos <strong className="text-[#1E1417]">{stats.gamesDone}/{stats.totalGames}</strong>
              </span>
            </div>
          </div>

          {/* Episode Title + Summary (Spanish by default — click to open Armenian translation!) */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2 border-t border-[#F28C28]/20">
            <div className="min-w-0 flex-1 space-y-2">
              <ClickToTranslate
                key={`title-${episode.id}`}
                es={episode.titleEs}
                hy={episode.titleHy}
                esClassName="font-display text-2xl sm:text-[26px] lg:text-3xl font-bold text-[#6B1029] leading-snug"
                showHintLabel={false}
              />
              <ClickToTranslate
                key={`summary-${episode.id}`}
                es={episode.subtitleEs}
                hy={episode.subtitleHy}
                esClassName="text-sm sm:text-base text-[#1E1417] leading-relaxed"
              />
            </div>

            <div className="md:w-64 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono-tabular text-[#584449]">
                <span>Progreso · {episode.levelRange}</span>
                <span className="font-bold text-[#6B1029]">{stats.overallPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F5E4D3] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#9F1835] via-[#F28C28] to-[#FFD166] transition-all duration-300"
                  style={{ width: `${stats.overallPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Phone Section Navigation (clean readable 5-item bar on small screens) */}
          <nav
            aria-label="Secciones del capítulo"
            className="md:hidden grid grid-cols-5 gap-1.5 pt-3 border-t border-[#F28C28]/20"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 min-h-[54px] rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#6B1029] text-[#FFD166] shadow-xs'
                      : 'bg-[#FFF8EE] text-[#6B1029] hover:bg-[#FFD166]/35'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-full">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Workspace — Scales cleanly from 360px phone to 1440px+ desktop */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 xl:px-8 py-5 sm:py-6 lg:py-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${episodeId}-${section}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {section === 'video' && (
              <SubtitlesSection
                episode={episode}
                subtitles={activeSubtitles}
                loading={subtitlesLoading}
                error={subtitlesError}
              />
            )}

            {section === 'grammar' && (
              <GrammarSection
                episode={episode}
                progress={epProgress}
                onRecordExercise={handleRecordExercise}
                onResetGrammarExercises={handleResetGrammarExercises}
              />
            )}

            {section === 'vocab' && (
              <VocabSection
                episode={episode}
                progress={epProgress}
                onToggleFavorite={handleToggleFavorite}
                onToggleLearned={handleToggleLearned}
              />
            )}

            {section === 'quiz' && (
              <QuizSection
                episode={episode}
                progress={epProgress}
                onCompleteQuiz={handleCompleteQuiz}
              />
            )}

            {section === 'games' && (
              <GamesSection
                episode={episode}
                progress={epProgress}
                onSaveGameScore={handleSaveGameScore}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Warm Burgundy Footer — Spanish by default */}
      <footer className="bg-[#580C21]/92 text-[#FFF8EE] border-t-2 border-[#FFAC33]/50 py-5 px-3 sm:px-6 xl:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <span>
            <strong className="text-[#FFD166]">Muñeca Brava</strong> · Español argentino · Capítulos 16 y 17
          </span>
          <span className="text-white/85">
            Toca cualquier frase en español para ver su traducción al armenio
          </span>
        </div>
      </footer>
    </div>
  );
}
