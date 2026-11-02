import { revalidateTag } from "next/cache";
import { assertSameOrigin, errorResponse, HttpError, readJson } from "@/lib/http";
import { z } from "zod";
import { DraftProfileSchema, ShopProfileSchema } from "@/lib/schema";
import { pickSlug, slugify, withSuffix } from "@/lib/slug";
import { IMAGES_BUCKET, SHOPS_TABLE, shopTag } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * The owner's own shop.
 *  GET → { shop: { slug, profile, published } | null }
 *  PUT { profile, publish } → save (and optionally publish). Runs as the logged-in
 *      user, so Row Level Security — not this code — is what stops editing others' shops.
 */

async function requireUser() {
  const supabase = await getServerSupabase();
  if (!supabase)
    return { error: Response.json({ error: "Database not configured." }, { status: 503 }) };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Please log in." }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { data, error } = await ctx.supabase
    .from(SHOPS_TABLE)
    .select("slug, profile, published")
    .eq("owner_id", ctx.user.id)
    .maybeSingle();
  if (error) return Response.json({ error: "Could not load your shop." }, { status: 500 });
  return Response.json({ shop: data });
}

const BodySchema = z.object({ profile: DraftProfileSchema, publish: z.boolean() });

export async function PUT(request: Request) {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;

  let raw: unknown;
  try {
    assertSameOrigin(request);
    raw = await readJson(request);
  } catch (e) {
    if (e instanceof HttpError) return errorResponse(e);
    throw e;
  }
  const body = BodySchema.safeParse(raw);
  if (!body.success) return Response.json({ error: "Invalid shop data." }, { status: 400 });
  const { profile, publish } = body.data;

  const { data: existing } = await supabase
    .from(SHOPS_TABLE)
    .select("slug")
    .eq("owner_id", user.id)
    .maybeSingle<{ slug: string }>();

  const desired =
    slugify(profile.slug) || pickSlug([profile.name]) || existing?.slug || withSuffix("shop");
  // Keep the owner's current slug if they didn't change it — printed QR codes depend on it.
  const preferred = existing && slugify(profile.slug) === existing.slug ? existing.slug : desired;

  // Publishing needs a complete profile; drafts can be partial.
  const toSave = { ...profile, slug: preferred };
  if (publish) {
    const strict = ShopProfileSchema.safeParse(toSave);
    if (!strict.success) {
      const fields = [...new Set(strict.error.issues.map((i) => String(i.path[0])))];
      return Response.json(
        { error: "Please complete these before publishing.", fields },
        { status: 400 },
      );
    }
  }

  // Try the preferred slug, then a few suffixed variants if another shop has it.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? preferred : withSuffix(desired);
    if (slug !== existing?.slug) {
      const { data: available, error } = await supabase.rpc("is_slug_available", { p_slug: slug });
      if (error) return Response.json({ error: "Could not check shop link." }, { status: 500 });
      if (!available) continue;
    }

    const { error } = await supabase
      .from(SHOPS_TABLE)
      .upsert(
        { owner_id: user.id, slug, profile: { ...toSave, slug }, published: publish },
        { onConflict: "owner_id" },
      );
    // 23505 = unique violation: someone took this slug between our check and insert.
    if (error?.code === "23505") continue;
    if (error) {
      console.error("save shop failed", error.message);
      return Response.json({ error: "Could not save your shop." }, { status: 500 });
    }

    // Expire cached public pages immediately so customers see the update.
    revalidateTag(shopTag(slug), { expire: 0 });
    if (existing && existing.slug !== slug) revalidateTag(shopTag(existing.slug), { expire: 0 });
    return Response.json({ slug, published: publish, profile: { ...toSave, slug } });
  }

  return Response.json(
    { error: "Could not find a free shop link. Try another name." },
    { status: 409 },
  );
}

/**
 * DELETE → permanently remove the owner's shop and their product photos.
 * Owners must be able to take their data down (DPDP Act); RLS limits this to their own rows/files.
 */
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (e) {
    if (e instanceof HttpError) return errorResponse(e);
    throw e;
  }
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const { data: shop } = await supabase
    .from(SHOPS_TABLE)
    .select("slug")
    .eq("owner_id", user.id)
    .maybeSingle<{ slug: string }>();

  // Photos live under product-images/<user id>/.
  const { data: files } = await supabase.storage.from(IMAGES_BUCKET).list(user.id, { limit: 1000 });
  if (files?.length) {
    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .remove(files.map((f) => `${user.id}/${f.name}`));
    if (error) console.error("delete photos failed", error.message);
  }

  const { error } = await supabase.from(SHOPS_TABLE).delete().eq("owner_id", user.id);
  if (error) {
    console.error("delete shop failed", error.message);
    return Response.json({ error: "Could not delete your shop." }, { status: 500 });
  }
  if (shop) revalidateTag(shopTag(shop.slug), { expire: 0 });
  return Response.json({ deleted: true });
}
