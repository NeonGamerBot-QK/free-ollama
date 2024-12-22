import "dotenv/config";
import "./override-stdout";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
//@ts-ignore
import morgan from "morgan";
Sentry.init({
  dsn: process.env.SENTRY_DSN!,
  integrations: [nodeProfilingIntegration()],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
import express from "express";
//@ts-ignore
import cors from "cors";
const app = express();
import bcrypt from "bcrypt";
import { createProxyMiddleware } from "http-proxy-middleware";

setInterval(() => {
  if (process.env.UPTIME_URL) {
    fetch(process.env.UPTIME_URL);
  }
}, 60_000);
app.use(cors({ origin: "*" }));
app.use(morgan("combined"));
app.get("/", (req, res) => {
  res.send(`up`);
});
// no creation, modification, installtion, deletion of models
const blocked_routes = [
  `/api/create`,
  `/api/copy`,
  `/api/delete`,
  `/api/pull`,
  `/api/push`,
];
app.use(async (req, res, next) => {
  console.debug(`#middleware`);
  if (req.headers.authorization) {
    const key = req.headers.authorization;
    const master_key = process.env.MASTER_KEY!;
    const keys = await fetch("https://slack.mybot.saahild.com/api/keys", {
      headers: {
        Authorization: master_key,
      },
    }).then((res) => res.json());
    if (key === master_key) {
      // @ts-ignore
      req.is_master = true;
      return next();
    }
    if (!keys.some((hash: string) => bcrypt.compareSync(key, hash))) {
      res.status(403).send(`Forbidden`);
      return;
    }
    return next();
  } else {
    res.status(401).send(`Unauthorized`);
  }
});
for (const route of blocked_routes) {
  app.all(route, (req, res) => {
    res.status(403).send(`Fordbidden`);
  });
}

app.use(
  createProxyMiddleware({
    target: `http://localhost:11434/`,
  }),
);

Sentry.setupExpressErrorHandler(app);
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server started`);
});
process.on("unhandledRejection", (reason, promise) => {
  Sentry.captureException(reason);
});
process.on("uncaughtException", function (err) {
  console.error(err);
  Sentry.captureException(err);
});
