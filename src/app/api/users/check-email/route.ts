import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  if (!email) {
    return "이메일을 입력해주세요.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "올바른 이메일 형식을 입력해주세요.";
  }

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = normalizeEmail(searchParams.get("email") ?? "");

  const validationMessage = validateEmail(email);
  if (validationMessage) {
    return NextResponse.json(
      { available: false, message: validationMessage },
      { status: 400 },
    );
  }

  const user = await findUserByEmail(email);

  if (user) {
    return NextResponse.json(
      { available: false, message: "이미 사용 중인 이메일입니다." },
      { status: 200 },
    );
  }

  return NextResponse.json({
    available: true,
    message: "사용 가능한 이메일입니다.",
  });
}
