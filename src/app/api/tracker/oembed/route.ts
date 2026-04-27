import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId, buildCanonicalYouTubeUrl } from '@/lib/youtube-url';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const RATE_LIMIT = 100;
const RATE_WINDOW_SECONDS = 60 * 60;

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const identifier = (user.email || user.id).toLowerCase();
  const rl = await rateLimit(`rl:oembed:${identifier}`, RATE_LIMIT, RATE_WINDOW_SECONDS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Hourly oEmbed limit reached.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      },
    );
  }

  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return NextResponse.json({ error: 'Not a recognized YouTube URL' }, { status: 400 });
  }

  const canonicalUrl = buildCanonicalYouTubeUrl(videoId);
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

  try {
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BUB-YouTube-Writer/1.0)',
      },
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Video not found. It may be private or deleted.' },
        { status: 404 },
      );
    }

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Video is private or embedding is disabled.' },
        { status: 401 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Could not fetch video info' },
        { status: response.status },
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== 'object' ||
      typeof (data as { title?: unknown }).title !== 'string' ||
      typeof (data as { author_name?: unknown }).author_name !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Unexpected oEmbed response shape' },
        { status: 502 },
      );
    }

    const oembed = data as {
      title: string;
      author_name: string;
      author_url?: string;
      thumbnail_url?: string;
    };

    return NextResponse.json({
      videoId,
      canonicalUrl,
      title: oembed.title,
      channelName: oembed.author_name,
      channelUrl: typeof oembed.author_url === 'string' ? oembed.author_url : '',
      thumbnailUrl: typeof oembed.thumbnail_url === 'string' ? oembed.thumbnail_url : '',
    });
  } catch (error) {
    console.error('oEmbed fetch error:', error);
    return NextResponse.json({ error: 'Could not fetch video info' }, { status: 500 });
  }
}
