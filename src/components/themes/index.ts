import type { Theme } from "@/lib/schema";
import { bright } from "./bright";
import { classic } from "./classic";
import { minimal } from "./minimal";
import type { ThemeClasses } from "./types";

export const themes: Record<Theme, ThemeClasses> = { classic, bright, minimal };
export type { ThemeClasses };
