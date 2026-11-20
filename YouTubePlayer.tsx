import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { formatSeconds } from './subtitlesParser';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  destroy: () => void;
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();

  if (!ytApiPromise) {
    ytApiPromise = new Promise<void>((resolve) => {
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        resolve();
      };

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      } else {
        const checkInterval = window.setInterval(() => {
          if (window.YT && window.YT.Player) {
            window.clearInterval(checkInterval);
            resolve();
          }
        }, 120);
      }
    });
  }
  return ytApiPromise;
}

export interface YouTubePlayerHandle {
  seekTo: (seconds: number, autoPlay?: boolean) => void;
  playClip: (startSec: number, endSec: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (seconds: number, isPlaying: boolean) => void;
  onReady?: () => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ videoId, onTimeUpdate, onReady }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const clipEndRef = useRef<number | null>(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onReadyRef = useRef(onReady);
    const [ready, setReady] = useState(false);

    onTimeUpdateRef.current = onTimeUpdate;
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number, autoPlay = true) => {
        clipEndRef.current = null;
        if (!playerRef.current) return;
        playerRef.current.seekTo(Math.max(0, seconds), true);
        if (autoPlay) {
          playerRef.current.playVideo();
        }
        onTimeUpdateRef.current?.(Math.max(0, seconds), autoPlay);
      },
      playClip: (startSec: number, endSec: number) => {
        if (!playerRef.current) return;
        clipEndRef.current = endSec;
        playerRef.current.seekTo(Math.max(0, startSec), true);
        playerRef.current.playVideo();
      },
      play: () => {
        playerRef.current?.playVideo();
      },
      pause: () => {
        playerRef.current?.pauseVideo();
      },
      getCurrentTime: () => {
        try {
          return playerRef.current?.getCurrentTime() ?? 0;
        } catch {
          return 0;
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;
      setReady(false);
      clipEndRef.current = null;

      loadYouTubeIframeAPI().then(() => {
        if (cancelled || !containerRef.current || !window.YT?.Player) return;

        // Clear any previous iframe container cleanly
        containerRef.current.innerHTML = '';
        const mountDiv = document.createElement('div');
        mountDiv.style.width = '100%';
        mountDiv.style.height = '100%';
        containerRef.current.appendChild(mountDiv);

        const player = new window.YT.Player(mountDiv, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            start: 0, // Always start from 00:00 so subtitle timestamps align cleanly
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              playerRef.current = e.target;
              setReady(true);
              onTimeUpdateRef.current?.(0, false);
              onReadyRef.current?.();
            },
            onStateChange: (e) => {
              if (cancelled) return;
              try {
                const t = e.target.getCurrentTime();
                const playing = e.data === 1;
                onTimeUpdateRef.current?.(t, playing);
              } catch {
                // ignore
              }
            },
          },
        });

        playerRef.current = player;
      });

      return () => {
        cancelled = true;
        try {
          playerRef.current?.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      };
    }, [videoId]);

    useEffect(() => {
      if (!ready) return;
      const timer = window.setInterval(() => {
        if (!playerRef.current) return;
        try {
          const t = playerRef.current.getCurrentTime();
          const state = playerRef.current.getPlayerState();
          const playing = state === 1;
          if (clipEndRef.current !== null && playing && t >= clipEndRef.current) {
            playerRef.current.pauseVideo();
            clipEndRef.current = null;
            onTimeUpdateRef.current?.(t, false);
            return;
          }
          onTimeUpdateRef.current?.(t, playing);
        } catch {
          // ignore
        }
      }, 200);

      return () => window.clearInterval(timer);
    }, [ready]);

    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#1E1417] border border-[#EAE0DC]">
        <div ref={containerRef} className="w-full h-full" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1E1417] text-[#FFD166] text-sm">
            Cargando reproductor de YouTube...
          </div>
        )}
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';

interface ClipYouTubePlayerProps {
  videoId: string;
  startSec: number;
  endSec: number;
  label?: string;
}

export const ClipYouTubePlayer: React.FC<ClipYouTubePlayerProps> = ({
  videoId,
  startSec,
  endSec,
  label,
}) => {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const [currentTime, setCurrentTime] = useState(startSec);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClip = () => {
    playerRef.current?.playClip(startSec, endSec);
  };

  const handlePause = () => {
    playerRef.current?.pause();
  };

  const progress = Math.max(
    0,
    Math.min(100, ((currentTime - startSec) / Math.max(1, endSec - startSec)) * 100)
  );

  return (
    <div className="rounded-xl border border-[#EAE0DC] bg-white p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#6A585D]">
        <span className="inline-flex items-center gap-1.5 font-medium text-[#6B1029]">
          <Volume2 className="w-4 h-4 shrink-0 text-[#F28C28]" />
          <span>{label ?? `Fragmento ${formatSeconds(startSec)} – ${formatSeconds(endSec)}`}</span>
        </span>
        <span className="font-mono-tabular text-xs">
          {formatSeconds(Math.max(startSec, Math.min(endSec, currentTime)))} / {formatSeconds(endSec)}
        </span>
      </div>

      <YouTubePlayer
        ref={playerRef}
        videoId={videoId}
        onTimeUpdate={(sec, playing) => {
          setCurrentTime(sec);
          setIsPlaying(playing);
        }}
      />

      <div className="w-full h-1.5 rounded-full bg-[#F3E9E5] overflow-hidden">
        <div
          className="h-full bg-[#F28C28] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePlayClip}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-[#6B1029] text-white text-sm font-medium hover:bg-[#9F1835] transition-colors cursor-pointer"
        >
          <Play className="w-4 h-4 shrink-0" />
          <span>Escuchar fragmento</span>
        </button>

        {isPlaying && (
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-lg border border-[#EAE0DC] bg-white text-[#1E1417] text-sm font-medium hover:bg-[#FAF7F5] transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4 shrink-0" />
            <span>Pausa</span>
          </button>
        )}

        <button
          type="button"
          onClick={handlePlayClip}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg border border-[#F28C28]/40 bg-[#FFF8EE] text-[#6B1029] text-sm font-medium hover:bg-[#FFD166]/35 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Repetir</span>
        </button>
      </div>
    </div>
  );
};
