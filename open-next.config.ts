import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Toutes les pages du groupe (dashboard) sont force-dynamic (§6) — pas d'ISR, pas de cache
// incrémental à configurer (pas de bucket R2 nécessaire).
export default defineCloudflareConfig();
