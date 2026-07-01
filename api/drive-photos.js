const DEFAULT_FOLDER_ID = "1MzdWlTbZZ7OrB0MbTtUsEjNtYr3xYUpz";
const IMAGE_QUERY = "mimeType contains 'image/' and trashed = false";

module.exports = async function handler(request, response) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;

  if (!apiKey) {
    response.status(500).json({
      error: "Missing GOOGLE_DRIVE_API_KEY",
      message: "Add GOOGLE_DRIVE_API_KEY in Vercel to load photos from Google Drive."
    });
    return;
  }

  try {
    const files = await listDriveImages({ apiKey, folderId });
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    response.status(200).json({
      folderId,
      count: files.length,
      photos: files.map(toGalleryPhoto)
    });
  } catch (error) {
    response.status(502).json({
      error: "Google Drive lookup failed",
      message: error.message
    });
  }
};

async function listDriveImages({ apiKey, folderId }) {
  const files = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      key: apiKey,
      q: `'${folderId}' in parents and ${IMAGE_QUERY}`,
      fields: "nextPageToken,files(id,name,mimeType,size,imageMediaMetadata(width,height))",
      orderBy: "name_natural",
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true"
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    const data = await driveResponse.json();

    if (!driveResponse.ok) {
      throw new Error(data.error?.message || "Unable to read the Google Drive folder.");
    }

    files.push(...(data.files || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return files;
}

function toGalleryPhoto(file, index) {
  const label = String(index + 1).padStart(2, "0");
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(file.id)}`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w1600`;
  const previewUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w2400`;

  return {
    id: `drive-${file.id}`,
    title: `Photo ${label}`,
    file: file.name,
    displayUrl: thumbnailUrl,
    previewUrl,
    downloadUrl,
    width: file.imageMediaMetadata?.width || null,
    height: file.imageMediaMetadata?.height || null,
    size: file.size || null,
    source: "google-drive"
  };
}
