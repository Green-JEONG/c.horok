import { NextResponse } from "next/server";
import { findUserByName } from "@/lib/db";
import { normalizeNickname, validateNickname } from "@/lib/nickname";

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = normalizeNickname(searchParams.get("name") ?? "");

  const validationMessage = validateNickname(name);
  if (validationMessage) {
    return NextResponse.json({ message: validationMessage }, { status: 400 });
  }

  const user = await findUserByName(name);
  if (!user) {
    return NextResponse.json(
      { message: "일치하는 회원 정보를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: maskEmail(user.email),
    message: "가입한 아이디를 찾았습니다.",
  });
}
