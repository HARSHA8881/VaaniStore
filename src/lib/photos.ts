"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "./image";
import { IMAGES_BUCKET } from "./supabase/config";

/** Unique storage path per upload, so a new photo never shows a cached old one. */
function photoPath(userId: string, productId: string) {
  return `${userId}/${productId}-${Date.now()}.jpg`;
}

/**
 * Compress a phone photo to < 300 KB and upload it to the owner's folder in
 * Supabase Storage. Returns the public URL to store on the product.
 */
export async function uploadProductPhoto(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  file: File,
): Promise<string> {
  const blob = await compressImage(file);
  const path = photoPath(userId, productId);
  const { error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}
