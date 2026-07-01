# Client Photo Review Gallery

A client gallery for reviewing, selecting, commenting on, and downloading full-quality photos from Google Drive.

## What the client can do

- View the full gallery on desktop or phone.
- Filter the gallery by Google Drive folder.
- Open any image in a large preview.
- Move through the preview with previous and next navigation.
- Select favorites.
- Download selected photos, all photos, or one original photo at a time.
- Export a CSV review summary.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New Project** and import the repository.
3. Use **Other** as the framework preset.
4. Leave build command and output directory blank.
5. Add a Vercel environment variable named `GOOGLE_DRIVE_API_KEY`.
6. Deploy.

The app reads this Google Drive folder by default, including image files inside nested folders:

`https://drive.google.com/drive/folders/1MzdWlTbZZ7OrB0MbTtUsEjNtYr3xYUpz`

Downloads use Google Drive's original file download URL, so clients receive the full-quality files.

## Google Drive setup

1. Make sure the Google Drive folder is shared as **Anyone with the link can view**.
2. Create or use a Google Cloud project.
3. Enable the **Google Drive API**.
4. Create an API key.
5. Add that key to Vercel as `GOOGLE_DRIVE_API_KEY`.

Optional: if you want to use a different folder later, add `GOOGLE_DRIVE_FOLDER_ID` in Vercel.

## Customize

- Change the gallery title in `app.js` by editing `galleryTitle`.
- Replace files in the Google Drive folder to update the live gallery.
- Use folders inside Google Drive to separate albums or sections.
- Keep the local `Photos` folder only as a preview fallback when Drive is not connected.
