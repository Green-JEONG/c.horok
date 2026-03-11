import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { findUserByName } from "@/lib/db";
import { normalizeNickname, validateNickname } from "@/lib/nickname";
import { validatePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = normalizeNickname(
      typeof body?.name === "string" ? body.name : "",
    );
    const currentPassword =
      typeof body?.currentPassword === "string" ? body.currentPassword : null;
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : null;

    // 이름만 바꾸는 것도 허용
    if (!name && !newPassword) {
      return NextResponse.json(
        { message: "수정할 값이 없습니다." },
        { status: 400 },
      );
    }

    if (name) {
      const nicknameValidationMessage = validateNickname(name);
      if (nicknameValidationMessage) {
        return NextResponse.json(
          { message: nicknameValidationMessage },
          { status: 400 },
        );
      }

      const duplicateNameUser = await findUserByName(name, session.user.id);
      if (duplicateNameUser) {
        return NextResponse.json(
          { message: "이미 사용 중인 닉네임입니다." },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.user.id) },
      select: {
        id: true,
        password: true,
        provider: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 비번 변경 요청이 있으면 검증
    let passwordToSave: string | null = null;

    if (newPassword) {
      const passwordValidationMessage = validatePassword(newPassword);
      if (passwordValidationMessage) {
        return NextResponse.json(
          { message: passwordValidationMessage },
          { status: 400 },
        );
      }

      // credentials 사용자만 비번 변경 가능 (oauth는 원칙적으로 불가)
      if (user.provider !== "credentials") {
        return NextResponse.json(
          { message: "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다." },
          { status: 400 },
        );
      }
      if (!user.password) {
        return NextResponse.json(
          { message: "비밀번호 정보가 없습니다." },
          { status: 400 },
        );
      }
      if (!currentPassword) {
        return NextResponse.json(
          { message: "현재 비밀번호를 입력해주세요." },
          { status: 400 },
        );
      }

      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) {
        return NextResponse.json(
          { message: "현재 비밀번호가 올바르지 않습니다." },
          { status: 400 },
        );
      }

      if (currentPassword === newPassword) {
        return NextResponse.json(
          { message: "현재 비밀번호와 다른 비밀번호를 입력해 주세요." },
          { status: 400 },
        );
      }

      passwordToSave = await bcrypt.hash(newPassword, 10);
    }

    // 업데이트
    if (passwordToSave && name) {
      await prisma.user.update({
        where: { id: BigInt(session.user.id) },
        data: { name, password: passwordToSave },
      });
    } else if (passwordToSave) {
      await prisma.user.update({
        where: { id: BigInt(session.user.id) },
        data: { password: passwordToSave },
      });
    } else {
      await prisma.user.update({
        where: { id: BigInt(session.user.id) },
        data: { name },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "계정 수정 실패" }, { status: 500 });
  }
}
