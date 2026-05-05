import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import "dotenv/config";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "placeholder_value",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, 
  profilesSampleRate: 1.0,
});

import { logger } from "./utils/logger";
import "./workers/push.worker";
// Import other workers here as they are added

logger.info("Worker process started successfully.");
