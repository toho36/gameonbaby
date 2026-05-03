import Link from "next/link";

// ytclip Supabase project — anon key is safe to expose (public RLS read of gameon clips only)
const YTCLIP_SUPABASE_URL = "https://kscxrmkfjdgnzdtmuvad.supabase.co";
const YTCLIP_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzY3hybWtmamRnbnpkdG11dmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTE1NDEsImV4cCI6MjA5MzAyNzU0MX0.861HgsC2qDeCb-SmILee8QilK6dRi3ZO7rpvUVEl_K4";
const YTCLIP_WEB_URL = "https://ytclip-9ul.pages.dev";

interface Clip {
  id: string;
  video_id: string;
  video_title: string;
  clip_title: string;
  timestamp_seconds: number;
  likes_count: number;
}

async function queryClips(extraParams: Record<string, string>): Promise<Clip[]> {
  try {
    const url =
      `${YTCLIP_SUPABASE_URL}/rest/v1/clips?` +
      new URLSearchParams({
        select:
          "id,video_id,video_title,clip_title,timestamp_seconds,likes_count",
        order: "likes_count.desc,created_at.desc",
        limit: "6",
        ...extraParams,
      });

    const res = await fetch(url, {
      headers: {
        apikey: YTCLIP_ANON_KEY,
        Authorization: `Bearer ${YTCLIP_ANON_KEY}`,
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) return [];
    return (await res.json()) as Clip[];
  } catch {
    return [];
  }
}

async function fetchTopClips(): Promise<Clip[]> {
  // Try popular this week first; fall back to all-time if empty
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekly = await queryClips({ created_at: `gte.${weekAgo}` });
  if (weekly.length > 0) return weekly;
  return queryClips({});
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function youtubeUrl(videoId: string, t: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${t}s`;
}

function thumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export async function HighlightsSection() {
  const clips = await fetchTopClips();

  return (
    <section className="mx-auto mt-12 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Highlights & Moments</h2>
          <p className="mt-1 text-sm text-white/70">
            Share your favourite GameOn moments — clips saved by the community
          </p>
        </div>
        <Link
          href={`${YTCLIP_WEB_URL}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-purple-400/50 bg-purple-800/30 px-4 py-2 text-sm text-white transition-colors hover:bg-purple-700/50"
        >
          View all clips →
        </Link>
      </div>

      {clips.length === 0 ? (
        <div className="rounded-lg border border-white/20 bg-white/10 p-8 text-center">
          <p className="mb-2 text-xl text-white">No clips yet</p>
          <p className="mb-4 text-sm text-white/70">
            Be the first to share a highlight from a GameOn match
          </p>
          <Link
            href={`${YTCLIP_WEB_URL}/create-clips`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-[hsl(280,100%,70%)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get the ytclip extension
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => (
            <a
              key={clip.id}
              href={youtubeUrl(clip.video_id, clip.timestamp_seconds)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-lg border border-white/20 bg-white/10 transition-all hover:border-purple-400 hover:bg-white/15"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(clip.video_id)}
                  alt={clip.video_title}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute right-2 bottom-2 rounded-md bg-black/85 px-2 py-0.5 font-mono text-xs text-white">
                  {formatTimestamp(clip.timestamp_seconds)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-[hsl(280,100%,70%)]/90 p-4">
                    <svg
                      className="size-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 line-clamp-2 font-semibold text-white">
                  {clip.clip_title}
                </h3>
                <p className="line-clamp-1 text-sm text-white/70">
                  {clip.video_title}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-white/60">
                  <span>♥ {clip.likes_count}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
