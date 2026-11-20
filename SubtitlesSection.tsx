import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  FileText,
  Languages,
  Pause,
  Play,
  RotateCcw,
  Search,
  Subtitles,
  X,
} from 'lucide-react';
import { EpisodeData, SubtitleLine } from './types';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import {
  formatSeconds,
  getActiveSubtitles,
  getNextUpcomingSubtitle,
} from './subtitlesParser';
import { ClickToTranslate } from './TranslatableText';

interface SubtitlesSectionProps {
  episode: EpisodeData;
  subtitles: SubtitleLine[];
  loading: boolean;
  error: string | null;
}

type ReaderMode = 'synced' | 'transcript';

export const SubtitlesSection: React.FC<SubtitlesSectionProps> = ({
  episode,
  subtitles,
  loading,
  error,
}) => {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const [mode, setMode] = useState<ReaderMode>('synced');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Separate open-translation states for Mode 1 and Mode 2
  const [syncedOpenIds, setSyncedOpenIds] = useState<Record<number, boolean>>({});
  const [transcriptOpenIds, setTranscriptOpenIds] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reset state cleanly when switching episodes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setSyncedOpenIds({});
    setTranscriptOpenIds({});
    setSearchQuery('');
  }, [episode.id]);

  const activeLines = useMemo(
    () => getActiveSubtitles(subtitles, currentTime),
    [subtitles, currentTime]
  );

  const nextLine = useMemo(
    () => getNextUpcomingSubtitle(subtitles, currentTime),
    [subtitles, currentTime]
  );

  // Surrounding context lines for synced mode (previous 1 and next 1 for orientation, never blocking active)
  const surroundingSynced = useMemo(() => {
    if (subtitles.length === 0) return { prev: null as SubtitleLine | null, next: nextLine };
    if (activeLines.length > 0) {
      const firstIdx = activeLines[0].id;
      const lastIdx = activeLines[activeLines.length - 1].id;
      return {
        prev: firstIdx > 0 ? subtitles[firstIdx - 1] : null,
        next: lastIdx + 1 < subtitles.length ? subtitles[lastIdx + 1] : null,
      };
    }
    return { prev: null, next: nextLine };
  }, [subtitles, activeLines, nextLine]);

  const filteredTranscript = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subtitles;
    return subtitles.filter((line) => line.es.toLowerCase().includes(q));
  }, [subtitles, searchQuery]);

  const openTranscriptCount = useMemo(
    () => Object.values(transcriptOpenIds).filter(Boolean).length,
    [transcriptOpenIds]
  );

  const toggleSyncedTranslation = (id: number) => {
    setSyncedOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTranscriptTranslation = (id: number) => {
    setTranscriptOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const highlightSpanish = (text: string, query: string): React.ReactNode => {
    const q = query.trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-[#FFD166] text-[#1E1417] rounded px-0.5">
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-6 items-start">
      {/* Video Player Card — sticky on desktop so video stays visible beside subtitles/transcript */}
      <div className="xl:col-span-7 xl:sticky xl:top-20 bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-lg shadow-[#6B1029]/15 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs sm:text-sm text-[#584449] font-medium">
              Muñeca Brava · Capítulo {episode.number} · {episode.durationLabel} · {subtitles.length} líneas
            </p>
            <ClickToTranslate
              key={`vid-title-${episode.id}`}
              es={episode.titleEs}
              hy={episode.titleHy}
              esClassName="font-display text-xl sm:text-2xl lg:text-[26px] font-bold text-[#6B1029]"
              showHintLabel={false}
            />
            <ClickToTranslate
              key={`vid-sub-${episode.id}`}
              es={episode.subtitleEs}
              hy={episode.subtitleHy}
              esClassName="text-sm sm:text-base text-[#584449] leading-relaxed"
              showHintLabel={false}
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-mono-tabular font-semibold text-[#6B1029] shrink-0">
            <Clock className="w-4 h-4 text-[#F28C28] shrink-0" />
            <span>{formatSeconds(currentTime)}</span>
          </div>
        </div>

        <YouTubePlayer
          ref={playerRef}
          videoId={episode.youtubeId}
          onTimeUpdate={(sec, playing) => {
            setCurrentTime(sec);
            setIsPlaying(playing);
          }}
        />

        {/* Quick Player Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (isPlaying ? playerRef.current?.pause() : playerRef.current?.play())}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6B1029] text-white text-sm sm:text-[15px] font-semibold hover:bg-[#9F1835] transition-colors cursor-pointer whitespace-nowrap"
            >
              {isPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
              <span>{isPlaying ? 'Pausa' : 'Reproducir'}</span>
            </button>

            <button
              type="button"
              onClick={() => playerRef.current?.seekTo(Math.max(0, currentTime - 5), true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#F28C28]/35 bg-[#FFF8EE] text-[#1E1417] text-sm sm:text-[15px] font-medium hover:bg-[#FFD166]/35 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 shrink-0 text-[#9F1835]" />
              <span>-5 s</span>
            </button>

            <button
              type="button"
              onClick={() => playerRef.current?.seekTo(0, true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#EAE0DC] bg-white text-[#584449] text-sm sm:text-[15px] font-medium hover:text-[#1E1417] hover:bg-[#FFF8EE] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Inicio (0:00)</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-[#584449]">
            Toca cualquier línea en español para ver su traducción al armenio
          </p>
        </div>
      </div>

      {/* Mode Switcher — Strictly Separate Modes */}
      <div className="xl:col-span-5 bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-lg shadow-[#6B1029]/15 rounded-2xl p-4 sm:p-6">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#FFF3DF] border border-[#F28C28]/25"
          role="tablist"
          aria-label="Режимы субтитров"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'synced'}
            onClick={() => setMode('synced')}
            className={`flex items-center justify-center gap-2.5 px-4 py-3 min-h-[48px] rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              mode === 'synced'
                ? 'bg-[#6B1029] text-white shadow-sm'
                : 'text-[#6B1029] hover:bg-white/70'
            }`}
          >
            <Subtitles className="w-4 h-4 shrink-0" />
            <span className="truncate">1. Subtítulos sincronizados</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'transcript'}
            onClick={() => setMode('transcript')}
            className={`flex items-center justify-center gap-2.5 px-4 py-3 min-h-[48px] rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              mode === 'transcript'
                ? 'bg-[#6B1029] text-white shadow-sm'
                : 'text-[#6B1029] hover:bg-white/70'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">2. Transcripción completa</span>
          </button>
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-[#6A585D]">
            Cargando subtítulos...
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl border border-[#DC3545]/30 bg-[#FFF5F5] text-sm text-[#9F1835]">
            {error}
          </div>
        )}

        {/* MODE 1: SYNCHRONIZED SUBTITLES */}
        {!loading && !error && mode === 'synced' && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAE0DC]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E1417]">
                  Subtítulos sincronizados
                </h3>
                <p className="text-xs sm:text-sm text-[#6A585D] mt-0.5">
                  Siguen el video automáticamente. Al pausar, la línea queda visible en pantalla.
                </p>
              </div>
              <span className="font-mono-tabular text-xs sm:text-sm text-[#6A585D]">
                {formatSeconds(currentTime)}
              </span>
            </div>

            {/* Active Synced Display Box */}
            <div className="rounded-2xl border border-[#EAE0DC] bg-[#FAF7F5] p-5 sm:p-8 min-h-[176px] flex flex-col justify-center">
              {activeLines.length > 0 ? (
                <div className="space-y-4">
                  {activeLines.map((line) => {
                    const isOpen = !!syncedOpenIds[line.id];
                    return (
                      <div key={line.id} className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSyncedTranslation(line.id)}
                          aria-expanded={isOpen}
                          className="w-full text-left group rounded-xl p-3 -m-3 hover:bg-white/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono-tabular text-xs font-medium text-[#9F1835]">
                              [{line.timestamp}]
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-[#6A585D] group-hover:text-[#6B1029]">
                              <Languages className="w-3.5 h-3.5 shrink-0" />
                              <span>{isOpen ? 'Ocultar traducción' : 'Traducir al armenio'}</span>
                            </span>
                          </div>
                          <p className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#1E1417] leading-snug">
                            {line.es}
                          </p>
                        </button>

                        {isOpen && (
                          <div className="rounded-xl bg-[#FFF8EE] border border-[#F28C28]/45 px-4 py-3.5 text-base sm:text-lg font-medium text-[#6B1029] leading-relaxed">
                            {line.hy}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-base sm:text-lg font-medium text-[#6A585D]">
                    Sin diálogo en este momento (pausa musical o silencio)
                  </p>
                  <p className="text-xs sm:text-sm text-[#6A585D]">
                    Las líneas anteriores se ocultan automáticamente durante las pausas largas.
                  </p>
                  {nextLine && (
                    <button
                      type="button"
                      onClick={() => playerRef.current?.seekTo(nextLine.seconds, true)}
                      className="inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-lg bg-[#FFF8EE] border border-[#F28C28]/40 text-[#6B1029] text-sm font-medium hover:bg-[#FFD166]/40 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 shrink-0" />
                      <span>Ir a la siguiente frase [{nextLine.timestamp}]</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Subtle Prev / Next Context Navigation for Synced Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[#EAE0DC] bg-white p-3.5">
                <p className="text-xs text-[#6A585D] mb-1">Frase anterior</p>
                {surroundingSynced.prev ? (
                  <button
                    type="button"
                    onClick={() => playerRef.current?.seekTo(surroundingSynced.prev!.seconds, true)}
                    className="text-left w-full hover:text-[#6B1029] transition-colors cursor-pointer"
                  >
                    <span className="font-mono-tabular text-xs text-[#9F1835] mr-2">
                      [{surroundingSynced.prev.timestamp}]
                    </span>
                    <span className="text-[#1E1417]">{surroundingSynced.prev.es}</span>
                  </button>
                ) : (
                  <p className="text-xs text-[#6A585D]">—</p>
                )}
              </div>

              <div className="rounded-xl border border-[#EAE0DC] bg-white p-3.5">
                <p className="text-xs text-[#6A585D] mb-1">Frase siguiente</p>
                {surroundingSynced.next ? (
                  <button
                    type="button"
                    onClick={() => playerRef.current?.seekTo(surroundingSynced.next!.seconds, true)}
                    className="text-left w-full hover:text-[#6B1029] transition-colors cursor-pointer"
                  >
                    <span className="font-mono-tabular text-xs text-[#9F1835] mr-2">
                      [{surroundingSynced.next.timestamp}]
                    </span>
                    <span className="text-[#1E1417]">{surroundingSynced.next.es}</span>
                  </button>
                ) : (
                  <p className="text-xs text-[#6A585D]">Fin del capítulo</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: COMPLETELY INDEPENDENT FULL TRANSCRIPT */}
        {!loading && !error && mode === 'transcript' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#EAE0DC]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E1417]">
                  Transcripción completa
                </h3>
                <p className="text-xs sm:text-sm text-[#6A585D] mt-0.5">
                  Texto independiente del video. Toca cualquier línea para ver su traducción al armenio (puedes abrir varias a la vez).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#6A585D]">
                <span className="font-mono-tabular">
                  {filteredTranscript.length} / {subtitles.length} líneas
                </span>
                {openTranscriptCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setTranscriptOpenIds({})}
                    className="text-[#9F1835] hover:underline font-medium cursor-pointer"
                  >
                    Ocultar abiertas ({openTranscriptCount})
                  </button>
                )}
              </div>
            </div>

            {/* Search Input for Spanish Words & Phrases */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#6A585D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar palabra o frase en español... (ej.: novia, joda, gimnasio, vos)"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] text-sm sm:text-base text-[#1E1417] placeholder:text-[#6A585D]/70 focus:outline-none focus:bg-white focus:border-[#9F1835] focus:ring-2 focus:ring-[#F28C28]/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#6A585D] hover:text-[#1E1417] hover:bg-[#EAE0DC]/50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Independent Scrollable Transcript List — NEVER controlled by video */}
            <div className="max-h-[620px] overflow-y-auto mb-scroll rounded-xl border border-[#EAE0DC] divide-y divide-[#F0E7E3] bg-white">
              {filteredTranscript.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#6A585D]">
                  No se encontraron líneas con «{searchQuery}».
                </div>
              ) : (
                filteredTranscript.map((line) => {
                  const isOpen = !!transcriptOpenIds[line.id];
                  return (
                    <div
                      key={line.id}
                      className={`px-4 py-3.5 transition-colors ${
                        isOpen ? 'bg-[#FFFDF9]' : 'hover:bg-[#FAF7F5]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTranscriptTranslation(line.id)}
                        aria-expanded={isOpen}
                        className="w-full text-left flex items-start gap-3 sm:gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded-md"
                      >
                        <span className="font-mono-tabular text-xs sm:text-sm font-semibold text-[#9F1835] pt-1 shrink-0 w-14">
                          [{line.timestamp}]
                        </span>
                        <span className="flex-1 text-base sm:text-[18px] font-medium text-[#1E1417] leading-relaxed">
                          {highlightSpanish(line.es, searchQuery)}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-semibold pt-1 shrink-0 ${
                            isOpen ? 'text-[#6B1029]' : 'text-[#584449]'
                          }`}
                        >
                          {isOpen ? 'Ocultar' : 'Traducir'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="mt-2.5 ml-0 sm:ml-16 rounded-lg bg-[#FFF8EE] border border-[#F28C28]/40 px-4 py-3 text-[15px] sm:text-base font-medium text-[#6B1029] leading-relaxed">
                          {line.hy}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
