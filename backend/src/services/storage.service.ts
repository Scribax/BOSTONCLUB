import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
export const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export const uploadToR2 = async (
  buffer: Buffer,
  filename: string,
  mimetype: string,
  folder: string = ""
): Promise<string> => {
  if (!bucketName || !accountId) {
    throw new Error("R2 credentials are not fully configured in environment variables.");
  }

  const fileKey = folder ? `${folder}/${filename}` : filename;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  // Return the public URL for the file
  return `${publicUrl}/${fileKey}`;
};
