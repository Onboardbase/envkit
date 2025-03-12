import { NextRequest, NextResponse } from 'next/server';
import { updateEnvFile } from '@/lib/envkit/fileUtils';
import { isDevEnvironment } from '@/lib/envkit/envValidator';

export async function POST(request: NextRequest) {
  // Only allow this endpoint in development to prevent security issues in production
  if (!isDevEnvironment()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { envVars, envFile } = await request.json();

    if (!envVars || typeof envVars !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request: envVars must be an object' },
        { status: 400 }
      );
    }

    // Use the specified envFile or default to .env
    const targetEnvFile = envFile || '.env';
    
    const success = updateEnvFile(envVars, { envFilePath: targetEnvFile });

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Environment variables updated successfully in ${targetEnvFile}` 
      });
    } else {
      return NextResponse.json(
        { error: `Failed to update environment variables in ${targetEnvFile}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating environment variables:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
}
