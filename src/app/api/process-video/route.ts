import { NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { addSignatureToVideo } from '@/lib/videoMetadata';

export const dynamic = 'force-dynamic'; // Ensures the route is server-side only




export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const signature = formData.get('signature') as string;
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {};

    if (!file || !signature) {
      return NextResponse.json(
        { error: 'File and signature are required' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a temporary file path
    const tempFilePath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    try {
      // Process the video
      const resultPath = await addSignatureToVideo(
        tempFilePath,
        signature,
        metadata
      );

      // Read the processed file
      const processedFile = await readFile(resultPath);
      
      // Clean up the temp files
      await unlink(tempFilePath);
      await unlink(resultPath);

      // Return the processed file
      return new NextResponse(processedFile, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="signed-${file.name}"`
        }
      });
    } catch (error) {
      // Clean up in case of error
      try { await unlink(tempFilePath); } catch (e) {}
      console.error('Error processing video:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in video processing API:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}
