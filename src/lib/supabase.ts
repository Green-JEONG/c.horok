import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 값이 하나라도 없으면 에러를 던져서 실행을 막습니다.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL 또는 Anon Key가 환경 변수에 설정되지 않았습니다.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
