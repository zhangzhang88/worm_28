import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

const CACHE_ROOT = path.join(process.cwd(), "public", "tts");
const REMOTE_API_URL =
  process.env.NEXT_PUBLIC_TTS_API_URL ||
  process.env.NEXT_PUBLIC_TTS_API_ENDPOINT ||
  "https://edge.ztr8.uk/v1/audio/speech";
const REMOTE_API_KEY =
  process.env.NEXT_PUBLIC_TTS_API_KEY || process.env.TTS_API_KEY;
const REMOTE_MODEL =
  process.env.NEXT_PUBLIC_TTS_MODEL ||
  process.env.NEXT_PUBLIC_TTS_DEFAULT_MODEL ||
  "gpt-4o-mini-tts";

const formatWhitelist = new Set(["mp3", "wav", "ogg"]);

function sanitizeSegment(value: string, fallback: string) {
  const cleaned = value.replace(/[^0-9a-zA-Z_-]/g, "_");
  return cleaned ? cleaned : fallback;
}

async function fetchRemoteAudio(body: {
  text: string;
  voiceId: string;
  model: string;
  responseFormat: "mp3" | "wav" | "ogg";
}) {
  if (!REMOTE_API_URL) {
    throw new Error("TTS 后端地址未配置");
  }
  if (!REMOTE_API_KEY) {
    throw new Error("TTS API 密钥未配置");
  }

  const response = await fetch(REMOTE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      Authorization: `Bearer ${REMOTE_API_KEY}`
    },
    body: JSON.stringify({
      model: body.model,
      voice: body.voiceId,
      input: body.text,
      response_format: body.responseFormat
    })
  });

  if (!response.ok) {
    const errMsg = await response.text().catch(() => "");
    throw new Error(errMsg || `TTS 服务返回 ${response.status}`);
  }

  return response.arrayBuffer();
}

async function getCachedFilePath(params: {
  courseId: string;
  lessonNumber: string;
  voiceId: string;
  text: string;
  responseFormat: "mp3" | "wav" | "ogg";
}) {
  const courseSegment = sanitizeSegment(params.courseId, "course");
  const lessonSegment = sanitizeSegment(`lesson${params.lessonNumber}`, "lesson");
  const voiceSegment = sanitizeSegment(params.voiceId || "voice", "voice");
  const textHash = createHash("sha256").update(params.text).digest("hex").slice(0, 16);
  const dirPath = path.join(CACHE_ROOT, courseSegment, lessonSegment, voiceSegment);
  await fs.promises.mkdir(dirPath, { recursive: true });
  const filename = `${textHash}.${params.responseFormat}`;
  return path.join(dirPath, filename);
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "请求体不能为空" }, { status: 400 });
  }

  const { text, voiceId, model, responseFormat, courseId, lessonNumber } = body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "缺少有效的 text" }, { status: 400 });
  }
  if (!courseId || typeof courseId !== "string") {
    return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
  }
  if (!lessonNumber || (typeof lessonNumber !== "string" && typeof lessonNumber !== "number")) {
    return NextResponse.json({ error: "缺少 lessonNumber" }, { status: 400 });
  }

  const safeLessonNumber = String(lessonNumber);
  const safeResponseFormat =
    (typeof responseFormat === "string" && formatWhitelist.has(responseFormat) ?
      responseFormat :
      "mp3") as "mp3" | "wav" | "ogg";
  const voiceKey = voiceId || "default";
  const resolvedModel = (model && typeof model === "string" ? model : REMOTE_MODEL);

  try {
    const filePath = await getCachedFilePath({
      courseId,
      lessonNumber: safeLessonNumber,
      voiceId: voiceKey,
      text: text.trim(),
      responseFormat: safeResponseFormat
    });

    if (!fs.existsSync(filePath)) {
      const arrayBuffer = await fetchRemoteAudio({
        text: text.trim(),
        voiceId: voiceKey,
        model: resolvedModel,
        responseFormat: safeResponseFormat
      });
      await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));
    }

    const data = await fs.promises.readFile(filePath);
    const headers = {
      "Content-Type": `audio/${safeResponseFormat}`,
      "Cache-Control": "public, max-age=31536000, immutable"
    };
    return new NextResponse(data, { headers });
  } catch (error) {
    console.error("TTS 生成失败：", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS 生成失败" },
      { status: 500 }
    );
  }
}
