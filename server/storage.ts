import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from './_core/env';

// Initialize S3 Client for Cloudflare R2
const getS3Client = () => {
  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    console.warn("R2 credentials not configured");
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
};

const client = getS3Client();

export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!client || !ENV.r2BucketName) {
    throw new Error("R2 storage not configured");
  }

  const normalizedKey = key.replace(/^\/+/, "");

  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.r2BucketName,
      Key: normalizedKey,
      Body: body,
      ContentType: contentType,
    })
  );

  // If public URL is configured, return it
  if (ENV.r2PublicUrl) {
    const publicUrl = `${ENV.r2PublicUrl}/${normalizedKey}`;
    return { key: normalizedKey, url: publicUrl };
  }

  // Otherwise return R2 dev URL (or signed URL could be better)
  // For now, return a signed URL valid for 1 hour
  const command = new GetObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: normalizedKey,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { key: normalizedKey, url };
}

export async function storageGet(key: string): Promise<{ key: string; url: string }> {
  if (!client || !ENV.r2BucketName) {
    throw new Error("R2 storage not configured");
  }

  const normalizedKey = key.replace(/^\/+/, "");

  if (ENV.r2PublicUrl) {
    return {
      key: normalizedKey,
      url: `${ENV.r2PublicUrl}/${normalizedKey}`,
    };
  }

  const command = new GetObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: normalizedKey,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { key: normalizedKey, url };
}
