// src/cloudinary.ts
// Helper for uploading images to Cloudinary
// See README for setup instructions

const CLOUDINARY_UPLOAD_PRESET = 'FFLEX669';
const CLOUDINARY_CLOUD_NAME = 'dkqidn0wm';

export async function uploadToCloudinary(file: File): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!data.secure_url) throw new Error('Cloudinary upload failed');
  return data.secure_url;
}
