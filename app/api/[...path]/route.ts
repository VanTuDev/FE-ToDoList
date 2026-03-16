/**
 * Proxy API: chuyển tiếp mọi /api/* tới backend thật (NestJS).
 * Dùng khi deploy FE lên Vercel: set BACKEND_URL trong Environment Variables (server-side).
 * FE gọi cùng origin (NEXT_PUBLIC_API_URL="") → request tới đây → proxy tới BACKEND_URL.
 * Không cần "IP Vercel" – backend vẫn deploy riêng (Railway, Render...); URL backend chỉ cấu hình 1 lần trên Vercel.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "") ?? "";

function getBackendUrl(pathSegments: string[]): string {
  const path = pathSegments.join("/");
  return `${BACKEND_URL}/api/${path}`;
}

async function proxy(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL chưa cấu hình trên server (Vercel Environment Variables)." },
      { status: 500 }
    );
  }

  const url = getBackendUrl(pathSegments);
  const method = request.method;
  const headers = new Headers();

  // Forward headers cần thiết (không forward host, origin để backend không bị lệch)
  const forwardHeaders = ["authorization", "content-type", "accept"];
  request.headers.forEach((value, key) => {
    if (forwardHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ?? undefined,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return new NextResponse(null, { status: 204 });
    }

    if (isJson) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy lỗi kết nối backend.";
    return NextResponse.json(
      { error: msg },
      { status: 502 }
    );
  }
}

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path);
}
