export default function PostContent() {
  return (
    <section className="prose prose-neutral dark:prose-invert max-w-none">
      <p>
        Next.js App Router 환경에서 인증을 구성하다 보면
        <strong> client / server 경계</strong>에서 헷갈리는 경우가 많습니다.
      </p>

      <h2>문제 상황</h2>
      <p>
        NextAuth v5(beta)를 사용하면서 기존 <code>getServerSession</code>이
        동작하지 않는 문제가 발생했습니다.
      </p>

      <pre>
        <code>{`// ❌ 동작하지 않음
import { getServerSession } from "next-auth";`}</code>
      </pre>

      <h2>해결 방법</h2>
      <p>
        App Router에서는 <code>auth()</code> 헬퍼를 직접 호출해야 합니다.
      </p>

      <pre>
        <code>{`// 올바른 방식
import { auth } from "@/app/api/auth/[...nextauth]/route";

const session = await auth();`}</code>
      </pre>

      <p>
        이 방식으로 서버 컴포넌트와 API Route 모두에서 세션을 안전하게 사용할 수
        있습니다.
      </p>
    </section>
  );
}
