import { useCallback } from 'react';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../utils/constants';

export function useCloudinary() {
  const upload = useCallback((resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
      if (!window.cloudinary || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        reject(new Error('Cloudinary not configured'));
        return;
      }

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          sources: ['local', 'camera'],
          multiple: false,
          maxFileSize: 50000000, // 50MB for videos
          resourceType: resourceType,
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm'],
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          if (result.event === 'success') {
            resolve({
              url: result.info.secure_url,
              type: result.info.resource_type, // 'image' or 'video'
              format: result.info.format,
              thumbnail: result.info.thumbnail_url,
            });
            widget.close();
          }
        }
      );

      widget.open();
    });
  }, []);

  const isConfigured = !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

  return { upload, isConfigured };
}
