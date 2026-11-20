import { EpisodeId, SubtitleLine } from './types';
import { TRANSLATIONS_EP16 } from './translations16';
import { TRANSLATIONS_EP17 } from './translations17';

const SUBTITLE_PATHS: Record<EpisodeId, string> = {
  ep16: '/assets/aistudio/Mun_eca_Brava_Cap_16__get-save.com_.timed_7768e955.txt',
  ep17: '/assets/aistudio/Mun_eca_Brava_Cap_17__get-save.com_.timed_92bc93d6.txt',
};

const cache: Partial<Record<EpisodeId, SubtitleLine[]>> = {};

export function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(':').map((p) => Number(p));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function formatSeconds(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimedSubtitles(rawText: string, translations: string[]): SubtitleLine[] {
  const rawLines = rawText.replace(/\r\n/g, '\n').split('\n');
  const parsed: { timestamp: string; seconds: number; es: string }[] = [];

  for (const rawLine of rawLines) {
    if (rawLine.trim().length === 0) continue;
    const match = rawLine.match(/^\[(\d+:\d{2})\] ?(.*)$/);
    if (match) {
      const timestamp = match[1];
      const es = match[2]; // Strict verbatim preservation — zero edits to original text
      parsed.push({
        timestamp,
        seconds: parseTimestampToSeconds(timestamp),
        es,
      });
    }
  }

  return parsed.map((item, idx) => {
    // Find the next line that starts strictly later in time
    let nextLaterSec: number | undefined;
    for (let j = idx + 1; j < parsed.length; j += 1) {
      if (parsed[j].seconds > item.seconds) {
        nextLaterSec = parsed[j].seconds;
        break;
      }
    }

    // Natural display duration so subtitles disappear during long silent/music intervals
    const naturalDuration = Math.max(3.8, Math.min(8.5, item.es.length * 0.085 + 2.8));
    const endSeconds =
      nextLaterSec !== undefined
        ? Math.min(nextLaterSec, item.seconds + naturalDuration)
        : item.seconds + naturalDuration;

    return {
      id: idx,
      timestamp: item.timestamp,
      seconds: item.seconds,
      endSeconds,
      es: item.es,
      hy: translations[idx] ?? 'Թարգմանությունը պատրաստ է դիտման համար',
    };
  });
}

export async function loadEpisodeSubtitles(episodeId: EpisodeId): Promise<SubtitleLine[]> {
  if (cache[episodeId]) {
    return cache[episodeId]!;
  }
  const response = await fetch(SUBTITLE_PATHS[episodeId]);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл субтитров (${response.status})`);
  }
  const rawText = await response.text();
  const translations = episodeId === 'ep16' ? TRANSLATIONS_EP16 : TRANSLATIONS_EP17;
  const lines = parseTimedSubtitles(rawText, translations);
  cache[episodeId] = lines;
  return lines;
}

export function getActiveSubtitles(lines: SubtitleLine[], currentTime: number): SubtitleLine[] {
  if (lines.length === 0 || currentTime < 0) return [];
  const active: SubtitleLine[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (currentTime >= line.seconds && currentTime < line.endSeconds) {
      active.push(line);
    }
  }
  return active;
}

export function getNextUpcomingSubtitle(lines: SubtitleLine[], currentTime: number): SubtitleLine | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].seconds > currentTime) {
      return lines[i];
    }
  }
  return null;
}
