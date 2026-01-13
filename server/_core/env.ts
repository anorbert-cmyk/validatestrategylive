export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  appUrl: process.env.VITE_APP_URL ?? "https://validatestrategy.com",
  cookieSecret: process.env.JWT_SECRET ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // R2 Storage
  r2AccountId: process.env.R2_ACCOUNT_ID || "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  r2BucketName: process.env.R2_BUCKET_NAME || "",
  r2PublicUrl: process.env.R2_PUBLIC_URL || "", // Optional, for public access
  adminWalletAddress: process.env.ADMIN_WALLET_ADDRESS || "", // Primary admin wallet
};

// Check for required R2 checks if configured (optional for dev/migrating)
if (ENV.r2BucketName && (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey)) {
  console.warn("R2 is partially configured. Missing credentials.");
}
