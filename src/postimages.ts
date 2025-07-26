// src/postimages.ts
// [DEPRECATED] No longer used. Use src/cloudinary.ts for image uploads.

export async function uploadToPostimages(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_session', ''); // Optional, can be blank
  formData.append('numfiles', '1');
  formData.append('optsize', '0'); // No resize
  formData.append('expire', '0'); // Never expire

  const response = await fetch('https://api.postimages.org/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!data || !data.url) throw new Error('Postimages upload failed');
  // The direct image URL is in data.url
  return data.url;
}
