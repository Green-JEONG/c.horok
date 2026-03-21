import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const result = await streamText({
      model: google("gemini-2.5-flash"),
      system: [
        "너는 호록(Horok) 서비스의 공식 AI 챗봇이다.",
        "답변은 항상 한국어로 작성한다.",
        "친절하고 간결하게 답하되, 필요한 경우에는 핵심을 짧게 정리한다.",
      ].join(" "),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("/api/chat error", error);

    return Response.json(
      { error: "챗봇 응답을 생성하지 못했습니다." },
      { status: 500 },
    );
  }
}
