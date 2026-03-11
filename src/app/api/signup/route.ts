import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createUser, findUserByEmail, findUserByName } from "@/lib/db";
import { normalizeNickname, validateNickname } from "@/lib/nickname";
import { validatePassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const name = normalizeNickname(
      typeof body?.name === "string" ? body.name : "",
    );
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !name || !password) {
      return NextResponse.json(
        { message: "필수 값이 누락되었습니다." },
        { status: 400 },
      );
    }

    const nicknameValidationMessage = validateNickname(name);
    if (nicknameValidationMessage) {
      return NextResponse.json(
        { message: nicknameValidationMessage },
        { status: 400 },
      );
    }

    const passwordValidationMessage = validatePassword(password);
    if (passwordValidationMessage) {
      return NextResponse.json(
        { message: passwordValidationMessage },
        { status: 400 },
      );
    }

    // 이미 존재하는 이메일인지 확인
    const exists = await findUserByEmail(email);
    if (exists) {
      return NextResponse.json(
        { message: "이미 사용 중인 이메일입니다." },
        { status: 409 },
      );
    }

    const duplicateNameUser = await findUserByName(name);
    if (duplicateNameUser) {
      return NextResponse.json(
        { message: "이미 사용 중인 닉네임입니다." },
        { status: 409 },
      );
    }

    // 비밀번호 해시
    const hashed = await bcrypt.hash(password, 10);

    await createUser({
      email,
      name,
      passwordHash: hashed,
      role: "USER",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    return NextResponse.json({ message: "회원가입 실패" }, { status: 500 });
  }
}
