import type { Theme } from "@/lib/schema";
import { dark } from "./dark";
import { light } from "./light";
import type { ThemeClasses } from "./types";

export const themes: Record<Theme, ThemeClasses> = { light, dark };
export type { ThemeClasses };
