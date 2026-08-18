import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/ids';
import { putObject, deleteObject, mediaUrl } from '@/lib/media';

// Only ever lets clients delete their own uploaded media — never the shared
// audio library (audio/...) or anything outside this exact key shape.
const UPLOAD_KEY_PATTERN =
  /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f-]+\.[a-zA-Z0-9]+$/i;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
// Kept in sync with the extensions HeroCarousel's isVideoFile() recognizes —
// otherwise a format that plays fine (e.g. iPhone .mov) gets rejected here,
// forcing users to re-export through a lossy converter just to upload it.
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-m4v', // .m4v
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const greetingId = formData.get('greetingId') as string;

    if (!file || !greetingId) {
      return NextResponse.json(
        { error: 'Missing file or greeting ID' },
        { status: 400 }
      );
    }

    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }

    // Sanitize greeting ID (UUID validation)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(greetingId)) {
      return NextResponse.json(
        { error: 'Invalid greeting ID' },
        { status: 400 }
      );
    }

    // Generate filename
    const ext = file.name.split('.').pop();
    const filename = `${generateId()}.${ext}`;
    const key = `uploads/${greetingId}/${filename}`;

    // Save file to R2
    const buffer = await file.arrayBuffer();
    await putObject(key, buffer, file.type);

    return NextResponse.json({
      success: true,
      path: mediaUrl(key),
      filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { key } = (await req.json()) as { key?: unknown };

    if (typeof key !== 'string' || !UPLOAD_KEY_PATTERN.test(key)) {
      return NextResponse.json({ error: 'Invalid media key' }, { status: 400 });
    }

    await deleteObject(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
