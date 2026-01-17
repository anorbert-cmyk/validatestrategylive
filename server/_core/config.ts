import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000").transform(Number),
  VITE_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").optional().or(z.literal("")),
}).refine((data) => {
  // DATABASE_URL is required in production
  if (data.NODE_ENV === "production" && !data.DATABASE_URL) {
    return false;
  }
  return true;
}, {
  message: "DATABASE_URL is required in production",
  path: ["DATABASE_URL"],
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const config = _env.data;
