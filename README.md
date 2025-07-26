# FLEX Orders Dashboard

A modern, flexible order management system. Track orders from creation to completion with a sleek, easy-to-use interface.

## Image Upload Setup (Cloudinary)

This app uses [Cloudinary](https://cloudinary.com/) for image uploads. To enable uploads:

1. Create a free Cloudinary account at https://cloudinary.com/.
2. Go to your Cloudinary dashboard and note your **Cloud Name**.
3. In the Cloudinary console, create an **unsigned upload preset** (Settings > Upload > Upload presets > Add upload preset). Name it and set it to unsigned.
4. In `src/cloudinary.ts`, replace `YOUR_CLOUD_NAME` and `YOUR_UNSIGNED_UPLOAD_PRESET` with your values.
5. (Optional) Restrict the upload preset for security in production.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

---

This project was rebranded from a previous version. All references to Ryan Center have been removed.
