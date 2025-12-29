import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Cron endpoint for email sequence processing (called by scheduled task)
  app.get("/api/cron/process-emails", async (req, res) => {
    try {
      // Verify cron secret to prevent unauthorized access
      const cronSecret = req.headers["x-cron-secret"] || req.query.secret;
      const expectedSecret = process.env.CRON_SECRET || "manus-email-cron-2024";
      
      if (cronSecret !== expectedSecret) {
        console.log("[Cron] Unauthorized cron request");
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      console.log("[Cron] Processing email sequence...");
      const { runEmailSequenceCron } = await import("../emailCron");
      const result = await runEmailSequenceCron();
      
      console.log(`[Cron] Email sequence completed: ${result.sent} sent, ${result.errors} errors`);
      res.json(result);
    } catch (error) {
      console.error("[Cron] Email sequence error:", error);
      res.status(500).json({ error: "Failed to process email sequence" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
