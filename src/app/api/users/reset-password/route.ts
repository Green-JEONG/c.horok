import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { findUserByEmailAndName, updateUserPasswordById } from "@/lib/db";
import { normalizeNickname, validateNickname } from "@/lib/nickname";
import { validatePassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      newPassword?: string;
    };

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = normalizeNickname(
      typeof body.name === "string" ? body.name : "",
    );
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!email || !name || !newPassword) {
      return NextResponse.json(
        { message: "필수 값을 모두 입력해주세요." },
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

    const passwordValidationMessage = validatePassword(newPassword);
    if (passwordValidationMessage) {
      return NextResponse.json(
        { message: passwordValidationMessage },
        { status: 400 },
      );
    }

    const user = await findUserByEmailAndName(email, name);
    if (!user) {
      return NextResponse.json(
        { message: "입력한 정보와 일치하는 회원을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { message: "현재 비밀번호와 다른 비밀번호를 입력해 주세요." },
          { status: 400 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordById(user.id, passwordHash);

    return NextResponse.json({
      ok: true,
      message: "비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "비밀번호 재설정에 실패했습니다." },
      { status: 500 },
    );
  }
}
