// Update the import at the top of videoMetadata.ts
import { exiftool } from 'exiftool-vendored';
import { writeFile, readFile, unlink, access } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface VideoMetadata {
  signature: string;
  timestamp: string;
  signerAddress?: string;
  [key: string]: any; // Allow for additional metadata fields
}

// Helper function to execute shell commands
async function executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execPromise(command);
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    throw error;
  }
}

/**
 * Adds a signature to a video file's metadata
 * @param videoPath Path to the source video file
 * @param signature The signature to embed
 * @param metadata Additional metadata to include
 * @returns Path to the processed video file (temporary file)
 */
export async function addSignatureToVideo(
  videoPath: string,
  signature: string,
  metadata: Omit<VideoMetadata, 'signature' | 'timestamp'> = {}
): Promise<string> {
  try {
    // Create a temporary output file path
    const tempOutputPath = join(tmpdir(), `signed-${Date.now()}.mp4`);
    console.log('Creating temporary output file:', tempOutputPath);
    // Prepare the metadata to include in the video
    const fullMetadata: VideoMetadata = {
      ...metadata,
      signature,
      timestamp: new Date().toISOString(),
    };

    // Create a temporary file with the metadata
    const tempMetadataPath = join(tmpdir(), `metadata-${Date.now()}.json`);
    await writeFile(tempMetadataPath, JSON.stringify(fullMetadata, null, 2));

    try {
      // Use exiftool to add metadata to the video
      // First, copy the original file to the output path
      await executeCommand(`cp "${videoPath}" "${tempOutputPath}"`);
      
      // Prepare metadata arguments
      const metadataArgs = [
        `-Comment=${JSON.stringify(fullMetadata).replace(/"/g, '\\"')}`,
        `-Title=${fullMetadata.title || 'Signed Video'}`,
        `-Description=${fullMetadata.description || 'Video with digital signature'}`,
        `-Artist=${fullMetadata.signerAddress || ''}`
      ];

      // Define the final output path (in the same directory as temp file but with clean name)
      const finalOutputPath = join(
        tmpdir(),
        `signed-${Date.now()}.mp4`
      );
      
      console.log('Processing video. Temporary path:', tempOutputPath);
      console.log('Will save final video to:', finalOutputPath);
      
      // First, ensure we don't have any existing files with these names
      try { await unlink(finalOutputPath); } catch (e) {}
      try { await unlink(`${finalOutputPath}_original`); } catch (e) {}
      
      // Execute exiftool with the metadata arguments
      try {
        // First, write the metadata to the temp file
        await exiftool.write(tempOutputPath, {}, [
          ...metadataArgs,
          '-overwrite_orig'
        ]);
        
        // Then move the file to the final location
        await executeCommand(`mv "${tempOutputPath}" "${finalOutputPath}"`);
        
        // Ensure all metadata is written
        await exiftool.end();
        
        // Clean up the temporary file
        try { await unlink(tempOutputPath); } catch (e) {}
        
        // Verify the file was created at the final path
        await access(finalOutputPath);
        console.log('Successfully saved video to:', finalOutputPath);
        return finalOutputPath;
        
      } catch (error) {
        console.error('Error during video processing:', error);
        // Clean up any partial files
        try { await unlink(finalOutputPath); } catch (e) {}
        try { await unlink(`${finalOutputPath}_original`); } catch (e) {}
        throw new Error(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
   
    } catch (error) {
      console.error('Error adding metadata to video:', error);
      throw new Error(`Failed to add metadata to video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up the temporary metadata file
      try {
        // await unlink(tempMetadataPath);
      } catch (error) {
        console.error('Error cleaning up temporary metadata file:', error);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error adding signature to video';
    console.error('Error adding signature to video:', errorMessage);
    throw new Error(`Failed to add signature to video: ${errorMessage}`);
  }
}

/**
 * Reads metadata from a video file
 * @param videoPath Path to the video file
 * @returns The extracted metadata or null if not found
 */
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata | null> {
  try {
    // Read metadata using exiftool command line
    const command = `exiftool -j "${videoPath}"`;
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn('ExifTool stderr:', stderr);
    }
    
    let metadata;
    try {
      metadata = JSON.parse(stdout);
    } catch (e) {
      console.error('Failed to parse ExifTool output:', e);
      return null;
    }
    
    if (!metadata || metadata.length === 0) {
      return null;
    }
    
    // Try to parse the Comment field as JSON
    const comment = metadata[0].Comment || metadata[0].comment;
    if (comment) {
      try {
        // Clean up the comment string if needed
        const cleanComment = comment.replace(/^"|"$/g, '').replace(/\\(")/g, '$1');
        const parsed = JSON.parse(cleanComment);
        return {
          ...metadata[0],
          ...parsed
        };
      } catch (e) {
        console.warn('Failed to parse comment as JSON, returning raw metadata', e);
        return metadata[0] as unknown as VideoMetadata;
      }
    }
    
    return metadata[0] as unknown as VideoMetadata;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error reading video metadata';
    console.error('Error reading video metadata:', errorMessage);
    return null;
  }
}

/**
 * Processes a video file with the given signature and metadata
 * @param videoFile The video file to process
 * @param signature The signature to embed
 * @param metadata Additional metadata to include
 * @returns Object containing success status and the path to the processed file
 */
export async function processVideoWithSignature(
  videoFile: { path: string; } | string,
  signature: string,
  metadata: Omit<VideoMetadata, 'signature' | 'timestamp'> = {}
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const inputPath = typeof videoFile === 'string' ? videoFile : videoFile.path;
    
    // Add signature and metadata to the video
    const outputPath = await addSignatureToVideo(
      inputPath,
      signature,
      metadata
    );
    
    return {
      success: true,
      filePath: outputPath
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error processing video';
    console.error('Error processing video:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}
