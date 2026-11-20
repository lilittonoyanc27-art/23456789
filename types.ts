export type EpisodeId = 'ep16' | 'ep17';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type AppSection = 'video' | 'grammar' | 'vocab' | 'quiz' | 'games';

export interface SubtitleLine {
  id: number;
  timestamp: string; // Exact original format e.g. "0:00"
  seconds: number;
  endSeconds: number; // Smart display end time to avoid leaving stale text during long silent gaps
  es: string; // STRICT verbatim original text from file
  hy: string; // Natural Eastern Armenian translation
}

export interface DidacticExample {
  es: string;
  hy: string;
  note?: string;
}

export interface GrammarExercise {
  id: string;
  promptEs: string;
  promptHy: string;
  questionHy: string;
  options: { id: string; textEs: string; textHy?: string }[];
  correctOptionId: string;
  explanationHy: string;
  level: CEFRLevel;
}

export interface GrammarTopic {
  id: string;
  titleEs: string;
  titleHy: string;
  level: CEFRLevel;
  isArgentine?: boolean;
  explanationHy: string;
  originalQuote: {
    timestamp: string;
    es: string; // Exact verbatim line from subtitle file
    hy: string;
    asrNoteHy?: string; // Separate explicit note if ASR had a typo
  };
  verbBreakdown: {
    form: string;
    analysisHy: string;
  }[];
  whyUsedHy: string;
  didacticExamples: DidacticExample[];
  exercises: GrammarExercise[];
}

export interface VocabItem {
  id: string;
  termEs: string;
  translationHy: string;
  category: 'vocab' | 'expression';
  isArgentine: boolean;
  level: CEFRLevel;
  meaningHy: string;
  grammarNoteHy?: string;
  example?: {
    timestamp: string;
    es: string;
    hy: string;
  };
}

export interface QuizQuestion {
  id: string;
  level: CEFRLevel;
  categoryHy: string;
  questionEs?: string;
  questionHy: string;
  quoteEs?: string;
  quoteHy?: string;
  options: {
    id: string;
    textEs: string;
    textHy: string;
  }[];
  correctOptionId: string;
  explanationHy: string;
  grammarRuleHy?: string;
}

// 12 Interactive Games Types
export interface WhoSaidItem {
  id: string;
  quoteEs: string;
  quoteHy: string;
  timestamp: string;
  options: string[];
  correctAnswer: string;
  explanationHy: string;
  level: CEFRLevel;
}

export interface FillDialogueItem {
  id: string;
  contextHy: string;
  beforeBlankEs: string;
  afterBlankEs: string;
  fullSentenceHy: string;
  options: { id: string; es: string; hy: string }[];
  correctOptionId: string;
  explanationHy: string;
  level: CEFRLevel;
}

export interface OrderWordsItem {
  id: string;
  instructionHy: string;
  words: string[]; // Correct order
  translationHy: string;
  timestamp: string;
  level: CEFRLevel;
}

export interface TrueFalseItem {
  id: string;
  statementEs: string;
  statementHy: string;
  isTrue: boolean;
  explanationHy: string;
  level: CEFRLevel;
}

export interface MemoryPair {
  id: string;
  es: string;
  hy: string;
}

export interface ListenRespondItem {
  id: string;
  startSec: number;
  endSec: number;
  clipLabel: string;
  questionEs: string;
  questionHy: string;
  options: { id: string; es: string; hy: string }[];
  correctOptionId: string;
  transcriptEs: string;
  transcriptHy: string;
  explanationHy: string;
  level: CEFRLevel;
}

export interface WhatMeansItem {
  id: string;
  expressionEs: string;
  contextQuoteEs: string;
  contextQuoteHy: string;
  isArgentine?: boolean;
  options: { id: string; hy: string; esHint?: string }[];
  correctOptionId: string;
  explanationHy: string;
  level: CEFRLevel;
}

export interface TenseChoiceItem {
  id: string;
  quoteEs: string;
  quoteHy: string;
  highlightedVerb: string;
  options: { id: string; labelEs: string; labelHy: string }[];
  correctOptionId: string;
  explanationHy: string;
  level: CEFRLevel;
}

export interface FixErrorItem {
  id: string;
  wrongSentenceEs: string; // Explicitly marked as deliberately modified study sentence
  sentenceHy: string;
  errorHintHy: string;
  options: { id: string; es: string; hy?: string }[];
  correctOptionId: string;
  explanationHy: string;
  level: CEFRLevel;
}

export interface ConversationStep {
  id: string;
  character: string;
  promptEs: string;
  promptHy: string;
  options: {
    id: string;
    replyEs: string;
    replyHy: string;
    isBest: boolean;
    feedbackHy: string;
  }[];
}

export interface StoryOrderItem {
  id: string;
  correctOrder: number;
  eventEs: string;
  eventHy: string;
  timestamp: string;
}

export interface FinalChallengeItem {
  id: string;
  type: 'listening' | 'vocab' | 'grammar' | 'plot';
  typeLabelHy: string;
  level: CEFRLevel;
  clipStartSec?: number;
  clipEndSec?: number;
  promptEs: string;
  promptHy: string;
  options: { id: string; es: string; hy: string }[];
  correctOptionId: string;
  explanationHy: string;
}

export interface EpisodeGamesData {
  whoSaid: WhoSaidItem[];
  fillDialogue: FillDialogueItem[];
  orderWords: OrderWordsItem[];
  trueFalse: TrueFalseItem[];
  memoryPairs: MemoryPair[];
  listenRespond: ListenRespondItem[];
  whatMeans: WhatMeansItem[];
  tenseChoice: TenseChoiceItem[];
  fixError: FixErrorItem[];
  conversation: {
    titleEs: string;
    titleHy: string;
    scenarioHy: string;
    steps: ConversationStep[];
  };
  storyOrder: {
    instructionHy: string;
    events: StoryOrderItem[];
  };
  finalChallenge: FinalChallengeItem[];
}

export interface EpisodeData {
  id: EpisodeId;
  number: number;
  titleEs: string;
  titleRu: string;
  titleHy: string;
  subtitleEs: string;
  subtitleHy: string;
  youtubeId: string;
  youtubeUrl: string;
  subtitleFilePath: string;
  durationLabel: string;
  levelRange: string;
  grammarTopics: GrammarTopic[];
  vocabulary: VocabItem[];
  quiz: QuizQuestion[];
  games: EpisodeGamesData;
}

export interface GameScoreRecord {
  bestCorrect: number;
  total: number;
  completed: boolean;
  missedIds: string[];
  lastPlayedAt: string;
}

export interface QuizProgressRecord {
  bestScore: number;
  total: number;
  attempts: number;
  missedIds: string[];
  lastCompletedAt?: string;
}

export interface EpisodeProgress {
  favoriteVocabIds: string[];
  learnedVocabIds: string[];
  completedGrammarExerciseIds: string[];
  missedGrammarExerciseIds: string[];
  quiz: QuizProgressRecord;
  games: Record<string, GameScoreRecord>;
}

export interface AllProgress {
  ep16: EpisodeProgress;
  ep17: EpisodeProgress;
}
