"use client";

import { useRef, useState } from "react";
import { Play, Loader2 } from "lucide-react";

export function VideoPlayer({
  slug: _slug,
  videoUrl,
  thumbnail,
  recipientName,
}: {
  slug: string;
  videoUrl?: string;
  thumbnail?: string;
  recipientName: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  if (!videoUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Dein personalisiertes Video wird gerade erstellt...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black">
      <video
        ref={ref}
        src={videoUrl}
        poster={thumbnail}
        controls={started}
        className="h-full w-full"
        onPlay={() => setStarted(true)}
        preload="metadata"
      />
      {!started && (
        <button
          type="button"
          onClick={() => {
            ref.current?.play();
            setStarted(true);
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
          aria-label={`Video fuer ${recipientName} abspielen`}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-105">
            <Play className="ml-1 h-8 w-8 text-primary" />
          </span>
        </button>
      )}
    </div>
  );
}
