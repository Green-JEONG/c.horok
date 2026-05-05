export type HorokCoteProblem = {
  number: number;
  slug: string;
  title: string;
  level: string;
  category: string;
  duration: string;
  acceptanceRate: string;
  summary: string;
  prompt: string;
  constraints: string[];
  inputDescription: string[];
  outputDescription: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  starterCodes: {
    python: string;
    java: string;
    cpp: string;
  };
  testCases: Array<{
    name: string;
    status: "passed" | "pending";
    input: string;
    expected: string;
  }>;
  tags: string[];
};

export const HOROK_COTE_LEVELS = [
  "Lv.0",
  "Lv.1",
  "Lv.2",
  "Lv.3",
  "Lv.4",
  "Lv.5",
] as const;

export const horokCoteProblems: HorokCoteProblem[] = [
  {
    number: 0,
    slug: "print-hello-horok",
    title: "화면에 문장 출력하기",
    level: "Lv.0",
    category: "출력",
    duration: "3분",
    acceptanceRate: "98%",
    summary: "정해진 문장을 그대로 한 줄 출력하는 가장 기본적인 문제입니다.",
    prompt: "`Hello, Horok!`를 한 줄 그대로 출력하세요.",
    constraints: ["입력은 없습니다.", "공백과 문장부호까지 정확히 출력합니다."],
    inputDescription: ["이 문제는 입력이 없습니다."],
    outputDescription: ["`Hello, Horok!`를 한 줄 출력합니다."],
    examples: [
      {
        input: "(입력 없음)",
        output: "Hello, Horok!",
        explanation: "문자열을 바꾸지 않고 그대로 출력하면 됩니다.",
      },
    ],
    starterCodes: {
      python: `print("Hello, Horok!")
`,
      java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Horok!");
    }
}
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Horok!" << '\\n';
    return 0;
}
`,
    },
    testCases: [
      {
        name: "기본 출력",
        status: "passed",
        input: "(입력 없음)",
        expected: "Hello, Horok!",
      },
      {
        name: "대소문자 확인",
        status: "pending",
        input: "(입력 없음)",
        expected: "Hello, Horok!",
      },
    ],
    tags: ["입문", "print", "출력"],
  },
];

export function getHorokCoteProblemByNumber(number: number) {
  return horokCoteProblems.find((problem) => problem.number === number);
}

export function getHorokCoteProblem(problemId: string) {
  const problemNumber = Number(problemId);

  if (!Number.isNaN(problemNumber)) {
    return getHorokCoteProblemByNumber(problemNumber);
  }

  return horokCoteProblems.find((problem) => problem.slug === problemId);
}
