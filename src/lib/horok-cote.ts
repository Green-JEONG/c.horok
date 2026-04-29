export type HorokCoteProblem = {
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
  };
  testCases: Array<{
    name: string;
    status: "passed" | "pending";
    input: string;
    expected: string;
  }>;
  tags: string[];
};

export const horokCoteProblems: HorokCoteProblem[] = [
  {
    slug: "print-hello-horok",
    title: "화면에 문장 출력하기",
    level: "Lv.0",
    category: "출력",
    duration: "3분",
    acceptanceRate: "98%",
    summary:
      "가장 기초적인 출력 문제로, 정해진 문장을 그대로 화면에 출력하면 됩니다.",
    prompt:
      "프로그램을 실행했을 때 `Hello, Horok!` 문장을 정확히 한 줄 출력하세요. 공백, 쉼표, 느낌표까지 모두 같아야 합니다.",
    constraints: [
      "입력은 주어지지 않습니다.",
      "출력은 대소문자와 문장부호까지 정확해야 합니다.",
    ],
    inputDescription: ["이 문제는 입력이 없습니다."],
    outputDescription: ["`Hello, Horok!` 를 한 줄 출력합니다."],
    examples: [
      {
        input: "(입력 없음)",
        output: "Hello, Horok!",
        explanation: "정해진 문자열을 그대로 한 줄 출력하면 정답입니다.",
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

export function getHorokCoteProblem(slug: string) {
  return horokCoteProblems.find((problem) => problem.slug === slug);
}
