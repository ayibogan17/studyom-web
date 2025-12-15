export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const bucket = process.env.R2_BUCKET || process.env.S3_BUCKET;
const region = process.env.R2_REGION || process.env.S3_REGION || "auto";
const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || process.env.S3_PUBLIC_BASE_URL;

const s3 =
  bucket && accessKeyId && secretAccessKey
    ? new S3Client({
        region,
        endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey },
      })
    : null;

export async function POST(req: Request) {
  if (!s3 || !bucket) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  let body: { name?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, type } = body || {};
  const contentType = type || "application/octet-stream";
  const ext = name?.split(".").pop() || "bin";
  const key = `uploads/${Date.now()}-${randomUUID()}.${ext}`;

const command = new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  ContentType: contentType,
});

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
  const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : uploadUrl.split("?")[0];

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
