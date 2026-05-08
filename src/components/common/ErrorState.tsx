import Image from "next/image";
import type { ReactNode } from "react";
import GoBackButton from "@/components/common/GoBackButton";

type Props = {
  code: number;
  message: string;
  action?: ReactNode;
};

export default function ErrorState({ code, message, action }: Props) {
  return (
    <main className="flex min-h-[calc(100dvh-8rem)] w-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-full max-w-[1400px] space-y-5">
        <div className="space-y-3">
          <p className="text-center text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
            {code}
          </p>
          <div className="relative mx-auto w-full max-w-[400px]">
            <Image
              src="/error.png"
              alt={`${code} 에러 이미지`}
              width={716}
              height={420}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground sm:text-base">{message}</p>

        <div className="flex items-center justify-center gap-3">
          {action}
          <GoBackButton />
        </div>
      </div>
    </main>
  );
}
