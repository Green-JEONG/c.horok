import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = performance.now();

  try {
    const post = await prisma.post.findFirst();
    const end = performance.now();
    const timeTaken = end - start;

    return NextResponse.json({
      message: "DB 테스트 완료 🐯",
      timeTaken: `${timeTaken.toFixed(2)} ms (밀리초)`,
      data: post ? "데이터 있음" : "데이터 없음",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";

    return NextResponse.json(
      {
        error: "DB 연결 실패",
        details: message,
      },
      { status: 500 },
    );
  }
}
