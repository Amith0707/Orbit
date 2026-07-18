import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { isAiConfigured } from "./config/env.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`Calfus Orbit API listening on http://localhost:${config.port}`);
  if (!isAiConfigured()) {
    console.warn(
      "OPENAI_API_KEY is not set — AI features will return a clear configuration error until it is provided in .env"
    );
  }
});
