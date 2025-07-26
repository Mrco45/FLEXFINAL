// src/imgur.ts
// [DEPRECATED] No longer used. Use src/cloudinary.ts for image uploads.

const IMGUR_CLIENT_ID = 'YOUR_IMGUR_CLIENT_ID'; // <-- Replace with your Imgur Client ID

export async function uploadToImgur(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!data.success) throw new Error('Imgur upload failed');
  return data.data.link; // Direct image URL
}
