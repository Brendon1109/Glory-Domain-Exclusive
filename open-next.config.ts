import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is rendered per request (the member layout is force-dynamic and
// the admin pages read the session), so no incremental cache is configured.
export default defineCloudflareConfig({});
