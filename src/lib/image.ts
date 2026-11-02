/**
 * Shrink a phone photo (often 3–8 MB) to under ~300 KB before upload.
 * Saves the owner's mobile data and keeps the public page fast on 3G/4G.
 * Strategy: cap the longest side, then lower JPEG quality until it fits.
 */
export async function compressImage(
  file: File,
  { maxBytes = 300 * 1024, maxSide = 1000 }: { maxBytes?: number; maxSide?: number } = {},
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let side = maxSide;

  for (let round = 0; round < 4; round++) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.7, 0.58, 0.46]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= maxBytes) {
        bitmap.close();
        return blob;
      }
    }
    side = Math.round(side * 0.75); // still too big: shrink dimensions and try again
  }
  bitmap.close();
  throw new Error("Could not compress image under the size limit");
}
