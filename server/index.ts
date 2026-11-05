import { createApp } from "./app";
import { RecordStore } from "./db";
import { hasLiveCredentials, loadEnv, modelName } from "./env";
import { resetDemo } from "./seed";

loadEnv();

const port = Number(process.env.API_PORT ?? 8787);
const store = new RecordStore(process.env.DB_FILE ?? "data/demo.db");

// First run: load the synthetic demo records.
if (!store.getMeta("last_reset")) resetDemo(store);

const production = process.env.NODE_ENV === "production";
const app = createApp({ store, serveStatic: production });

app.listen(port, "127.0.0.1", () => {
  console.log(`API ready on http://localhost:${port}`);
  console.log(
    hasLiveCredentials()
      ? `Live Claude extraction: available (model ${modelName()})`
      : "Live Claude extraction: not configured (no ANTHROPIC_API_KEY). Offline demo mode only.",
  );
  if (production) console.log(`App: http://localhost:${port}`);
});
