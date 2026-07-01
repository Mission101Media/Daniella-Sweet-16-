const DEFAULT_FOLDER_ID = "1MzdWlTbZZ7OrB0MbTtUsEjNtYr3xYUpz";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

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
    const files = await listDriveImagesRecursively({ apiKey, folderId });
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

async function listDriveImagesRecursively({ apiKey, folderId }) {
  const visited = new Set();
  const files = await listFolderImages({ apiKey, folderId, folderPath: "", visited });
  return files.sort((a, b) => {
    const folderCompare = a.folderPath.localeCompare(b.folderPath, undefined, { numeric: true });
    if (folderCompare !== 0) return folderCompare;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

async function listFolderImages({ apiKey, folderId, folderPath, visited }) {
  if (visited.has(folderId)) return [];
  visited.add(folderId);

  const images = [];
  const folders = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      key: apiKey,
      q: `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = '${FOLDER_MIME_TYPE}')`,
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

    for (const file of data.files || []) {
      if (file.mimeType === FOLDER_MIME_TYPE) {
        folders.push(file);
      } else {
        images.push({ ...file, folderPath: folderPath || "Main folder" });
      }
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  for (const folder of folders) {
    const nextPath = folderPath ? `${folderPath} / ${folder.name}` : folder.name;
    const nestedImages = await listFolderImages({ apiKey, folderId: folder.id, folderPath: nextPath, visited });
    images.push(...nestedImages);
  }

  return images;
}

function toGalleryPhoto(file, index) {
  const label = String(index + 1).padStart(2, "0");
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(file.id)}`;
  const smallThumbnailUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w600`;
  const mediumThumbnailUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w1000`;
  const previewUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w2200`;

  return {
    id: `drive-${file.id}`,
    title: `Photo ${label}`,
    file: file.name,
    folderPath: file.folderPath,
    displayUrl: smallThumbnailUrl,
    displaySrcSet: `${smallThumbnailUrl} 600w, ${mediumThumbnailUrl} 1000w`,
    previewUrl,
    downloadUrl,
    width: file.imageMediaMetadata?.width || null,
    height: file.imageMediaMetadata?.height || null,
    size: file.size || null,
    source: "google-drive"
  };
}
