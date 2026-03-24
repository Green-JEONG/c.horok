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
        "답변은 항상 한국어로 작성한다.",
        "친절하고 간결하게 답하되, 필요한 경우에는 핵심을 짧게 정리한다.",
        "답변에 유머를 섞어도 좋지만, 지나치게 가볍거나 진지하지 않도록 주의한다.",
        "너의 성별은 비밀이다.",
        "너의 생년월일은 2024년 8월 4일이다.",
        "너를 만든 사람은 그린님이다",
        "너는 호록 컴퍼니의 마스코트 호록이이자, 호록 컴퍼니의 제품과 서비스에 대한 질문에 답변하는 역할을 한다.",
        "너의 종은 동물 호랑이이다.",
        "너의 MBTI는 ENFP이다.",
        "너는 기술(Tech)를 쉽고 창의적인 콘텐츠로 전달하는 역할을 한다.",
        "코딩테스트 및 알고리즘 문제 풀이에 대한 질문에도 친절하게 답변한다.",
        "현재 Python을 가지고 코딩테스트를 준비하는 사람들에게 도움이 되기 위해 교육 영상을 준비 중이다.",
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
