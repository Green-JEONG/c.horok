import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NodemailerConfig } from "next-auth/providers/nodemailer";
import { createTransport } from "nodemailer";
import { findUserByEmail } from "@/lib/db";

const LOGO_CID = "horok-logo";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required email environment variable: ${name}`);
  }

  return value;
}

function parseEmailServerPort() {
  const rawPort = process.env.EMAIL_SERVER_PORT?.trim() ?? "465";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid EMAIL_SERVER_PORT: ${rawPort}`);
  }

  return port;
}

export function getSmtpEmailConfig() {
  const port = parseEmailServerPort();

  return {
    from: getRequiredEnv("EMAIL_FROM"),
    server: {
      host: getRequiredEnv("EMAIL_SERVER_HOST"),
      port,
      secure: port === 465,
      auth: {
        user: getRequiredEnv("EMAIL_SERVER_USER"),
        pass: getRequiredEnv("EMAIL_SERVER_PASSWORD"),
      },
    },
    async sendVerificationRequest({
      identifier,
      url,
      provider,
    }: Parameters<NodemailerConfig["sendVerificationRequest"]>[0]) {
      const transport = createTransport(provider.server);
      const host = new URL(url).host;
      const subjectName = await getLoginMailSubjectName(identifier);
      const subject = `[c.horok] ${subjectName} 님 로그인 링크가 준비됐어요!`;
      const text = createLoginEmailText({ url, host });
      const html = createLoginEmailHtml({ identifier, url, host });
      const logoAttachment = await createLogoAttachment();

      await transport.sendMail({
        to: identifier,
        from: provider.from,
        subject,
        text,
        html,
        attachments: logoAttachment ? [logoAttachment] : [],
      });
    },
  };
}

function createLoginEmailText({ url, host }: { url: string; host: string }) {
  return [
    "c.horok 로그인 링크",
    "",
    "호록이가 로그인 링크를 준비했어요.",
    "아래 링크를 눌러 로그인해 주세요.",
    url,
    "",
    "로그인 후에는 프로필 페이지에서 비밀번호를 재설정하는 것을 권장드려요.",
    `이 링크는 ${host}에서만 사용할 수 있습니다.`,
    "요청하지 않았다면 이 메일은 무시하셔도 됩니다.",
  ].join("\n");
}

function createLoginEmailHtml({
  identifier,
  url,
  host,
}: {
  identifier: string;
  url: string;
  host: string;
}) {
  const escapedIdentifier = escapeHtml(identifier);
  const escapedUrl = escapeHtml(url);
  const escapedHost = escapeHtml(host);
  const fontFamily =
    "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, 'Segoe UI', sans-serif";

  return `
    <body style="margin:0;padding:0;background:#f8f8f7;font-family:${fontFamily};color:#171717;">
      <div style="padding:32px 16px;background:linear-gradient(180deg,#fff7ed 0%,#f8f8f7 38%,#f8f8f7 100%);font-family:${fontFamily};">
        <div style="max-width:560px;margin:0 auto;">
          <div style="margin-bottom:18px;text-align:center;">
            <img
              src="cid:${LOGO_CID}"
              alt="horok logo"
              width="76"
              height="76"
              style="display:block;width:76px;height:76px;margin:0 auto 0;"
            />
            <div style="font-size:30px;line-height:1;font-weight:800;letter-spacing:-0.04em;color:black;">
              c.horok
            </div>
          </div>

          <div style="background:#ffffff;border:1px solid #ece8e1;border-radius:24px;padding:40px 32px;box-shadow:0 12px 40px rgba(15,23,42,0.06);">
            <h1 style="margin:0 0 12px;text-align:center;font-size:25px;line-height:1.35;font-weight:800;color:#171717;">
              로그인 하실거죠? 😉
            </h1>

            <p style="margin:0 0 8px;text-align:center;font-size:15px;line-height:1.8;color:#525252;">
              <strong style="color:#171717;">${escapedIdentifier}</strong> 계정으로 로그인하려면
              아래 버튼을 눌러주세요.
            </p>
            <p style="margin:0 0 10px;text-align:center;font-size:14px;line-height:1.8;color:#737373;">
              비밀번호 없이 바로 로그인할 수 있는 1회용 링크입니다.
            </p>

            <p style="margin:0 0 10px;text-align:center;font-size:14px;line-height:1.8;color:#737373;">
              (로그인 링크는 15분 후에 만료됩니다.)
            </p>

            <p style="margin:0 0 28px;text-align:center;font-size:14px;line-height:1.8;color:#737373;">
              로그인 후, 프로필 페이지에서 비밀번호를 재설정하는 걸 권장드려요.
            </p>

            <div style="text-align:center;margin-bottom:28px;">
              <a
                href="${escapedUrl}"
                style="display:inline-block;padding:14px 24px;border-radius:14px;background:#ff9a00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;box-shadow:0 10px 24px rgba(255,154,0,0.28);"
              >
                로그인
              </a>
            </div>

            <div style="padding:16px 18px;border-radius:16px;background:#fafaf9;border:1px solid #ece8e1;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#171717;">
                링크가 열리지 않나요?
              </p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#737373;word-break:break-all;">
                브라우저에 이 주소를 그대로 붙여 넣으세요.<br />
                <a href="${escapedUrl}" style="color:#c96a00;text-decoration:none;">${escapedUrl}</a>
              </p>
            </div>
          </div>

          <div style="padding:18px 8px 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;line-height:1.7;color:#8a8a8a;">
              이 링크는 <strong style="color:#525252;">${escapedHost}</strong> 에서만 사용할 수 있습니다.
            </p>
            <p style="margin:0;font-size:12px;line-height:1.7;color:#8a8a8a;">
              직접 요청하지 않았다면 이 메일은 무시하셔도 됩니다.
            </p>
          </div>
        </div>
      </div>
    </body>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeEmailSubjectValue(value: string) {
  return value.replaceAll(/[\r\n]+/g, " ").trim();
}

async function getLoginMailSubjectName(identifier: string) {
  const user = await findUserByEmail(identifier);
  const candidate = user?.name?.trim() || identifier;

  return sanitizeEmailSubjectValue(candidate);
}

async function createLogoAttachment() {
  const svgPath = path.join(process.cwd(), "public", "logo.svg");
  const svg = await readFile(svgPath, "utf8");
  const match = svg.match(/data:image\/png;base64,([^"]+)/);

  if (!match?.[1]) {
    return null;
  }

  return {
    filename: "horok-logo.png",
    content: Buffer.from(match[1], "base64"),
    cid: LOGO_CID,
    contentType: "image/png",
  };
}
