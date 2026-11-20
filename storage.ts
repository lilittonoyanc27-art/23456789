import { AllProgress, EpisodeId, EpisodeProgress } from './types';

const STORAGE_KEY = 'muneca_brava_spanish_hy_progress_v1';

export function createEmptyEpisodeProgress(): EpisodeProgress {
  return {
    favoriteVocabIds: [],
    learnedVocabIds: [],
    completedGrammarExerciseIds: [],
    missedGrammarExerciseIds: [],
    quiz: {
      bestScore: 0,
      total: 20,
      attempts: 0,
      missedIds: [],
    },
    games: {},
  };
}

export function createEmptyAllProgress(): AllProgress {
  return {
    ep16: createEmptyEpisodeProgress(),
    ep17: createEmptyEpisodeProgress(),
  };
}

export function loadProgress(): AllProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyAllProgress();
    const parsed = JSON.parse(raw) as Partial<AllProgress>;
    return {
      ep16: {
        ...createEmptyEpisodeProgress(),
        ...(parsed.ep16 ?? {}),
        quiz: {
          ...createEmptyEpisodeProgress().quiz,
          ...(parsed.ep16?.quiz ?? {}),
        },
        games: {
          ...(parsed.ep16?.games ?? {}),
        },
      },
      ep17: {
        ...createEmptyEpisodeProgress(),
        ...(parsed.ep17 ?? {}),
        quiz: {
          ...createEmptyEpisodeProgress().quiz,
          ...(parsed.ep17?.quiz ?? {}),
        },
        games: {
          ...(parsed.ep17?.games ?? {}),
        },
      },
    };
  } catch {
    return createEmptyAllProgress();
  }
}

export function saveProgress(progress: AllProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetEpisodeProgress(current: AllProgress, episodeId: EpisodeId): AllProgress {
  const next: AllProgress = {
    ...current,
    [episodeId]: createEmptyEpisodeProgress(),
  };
  saveProgress(next);
  return next;
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}
