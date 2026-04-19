import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId, buildCanonicalYouTubeUrl } from '@/lib/youtube-url';

export async function GET(request: NextRequest) {
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

    const data = await response.json();

    return NextResponse.json({
      videoId,
      canonicalUrl,
      title: data.title || '',
      channelName: data.author_name || '',
      channelUrl: data.author_url || '',
      thumbnailUrl: data.thumbnail_url || '',
    });
  } catch (error) {
    console.error('oEmbed fetch error:', error);
    return NextResponse.json({ error: 'Could not fetch video info' }, { status: 500 });
  }
}
