import { NextRequest, NextResponse } from 'next/server';
import { isDevEnvironment } from '@/lib/envkit/envValidator';
import { updateEnvFile, parseEnvFile } from '@/lib/envkit/fileUtils';

export async function POST(request: NextRequest) {
  // Only allow this endpoint in development to prevent security issues in production
  if (!isDevEnvironment()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('envFile') as File | null;
    const targetEnvFile = formData.get('targetEnvFile') as string || '.env';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the file content
    const fileContent = await file.text();
    
    // Parse the .env file content
    const envVars = parseEnvFile(fileContent);
    
    // Update the .env file using the specified target
    const success = updateEnvFile(envVars, { envFilePath: targetEnvFile });

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Environment variables uploaded successfully to ${targetEnvFile}` 
      });
    } else {
      return NextResponse.json(
        { error: `Failed to upload environment variables to ${targetEnvFile}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading environment file:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
}
