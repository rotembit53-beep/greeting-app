import { NextResponse } from 'next/server';
import { mediaUrl } from '@/lib/media';
import audioLibrary from '@/lib/audioLibrary.json';

type AudioLibrary = Record<string, { name: string; key: string }[]>;

export async function GET() {
  try {
    const categorized: Record<string, { path: string; name: string }[]> = {};

    for (const [category, files] of Object.entries(audioLibrary as AudioLibrary)) {
      categorized[category] = files.map((f) => ({
        path: mediaUrl(f.key),
        name: f.name,
      }));
    }

    const total = Object.values(categorized).reduce((sum, f) => sum + f.length, 0);

    return NextResponse.json({
      success: true,
      files: total,
      categorized,
    });
  } catch (error) {
    console.error('Audio library error:', error);
    return NextResponse.json(
      { error: 'Failed to load audio library' },
      { status: 500 }
    );
  }
}
