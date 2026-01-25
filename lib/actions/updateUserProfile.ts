'use server';

import { snag } from '@/lib/snag';

interface UpdateProfileParams {
  userId: string;
  websiteId: string;
  organizationId: string;
  displayName?: string;
  location?: string;
  portfolioUrl?: string;
  about?: string;
  photoFile?: {
    base64: string;
    name: string;
    size: number;
  };
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'avif': 'image/avif',
    'svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Upload image to SNAG assets and return the asset URL
 */
async function uploadProfilePhoto(
  photoFile: {
    base64: string;
    name: string;
    size: number;
  },
  organizationId: string,
  userId: string,
  websiteId: string
): Promise<string> {
  try {
    // Create asset entry
    const assetResponse = await snag.assets.createAsset({
      fileName: photoFile.name,
      fileSize: photoFile.size,
      filePath: 'profiles',
      organizationId,
      userId,
      websiteId,
    });

    // Convert base64 to buffer
    const base64Data = photoFile.base64.split(',')[1] || photoFile.base64;
    const buffer = Buffer.from(base64Data, 'base64');

    // Get correct MIME type for the file
    const contentType = getMimeType(photoFile.name);

    console.log(`Uploading profile photo: ${photoFile.name} (${buffer.length} bytes, type: ${contentType})`);

    // Upload to signed URL
    const uploadResponse = await fetch(assetResponse.signedUrl, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`Upload failed (${uploadResponse.status}):`, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('Profile photo uploaded successfully:', assetResponse.url);

    // Return the public URL
    return assetResponse.url;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw new Error(`Failed to upload profile photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateUserProfile(params: UpdateProfileParams) {
  try {
    const {
      userId,
      websiteId,
      organizationId,
      displayName,
      location,
      portfolioUrl,
      about,
      photoFile,
    } = params;

    // Validate required parameters
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!websiteId) {
      throw new Error('Website ID is required');
    }
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    // Upload photo if provided
    let logoUrl = '';
    if (photoFile) {
      logoUrl = await uploadProfilePhoto(
        photoFile,
        organizationId,
        userId,
        websiteId
      );
    }

    // Build metadata object with available fields
    const metadataPayload: Record<string, any> = {
      userId,
      websiteId,
      organizationId,
    };

    // Add optional fields only if provided
    if (displayName) metadataPayload.displayName = displayName;
    if (location) metadataPayload.location = location;
    if (portfolioUrl) metadataPayload.portfolioUrl = portfolioUrl;
    if (logoUrl) metadataPayload.logoUrl = logoUrl; // Use uploaded asset URL

    // Add about to bio field
    if (about) metadataPayload.bio = about;

    console.log('Updating user metadata with:', metadataPayload);

    // Create/update user metadata
    const response = await snag.users.metadatas.create(metadataPayload);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Fetch user profile metadata
 */
export async function getUserProfileMetadata(
  userId: string,
  websiteId: string
) {
  try {
    const response = await snag.users.metadatas.list({
      userId,
      websiteId,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error fetching user profile metadata:', error);
    throw error;
  }
}
