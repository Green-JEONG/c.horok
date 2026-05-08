import Image from "next/image";
import type { ReactNode } from "react";
import GoBackButton from "@/components/common/GoBackButton";
import { cn } from "@/lib/utils";

type Props = {
  code: number;
  message: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function ErrorState({
  code,
  message,
  action,
  className,
  contentClassName,
}: Props) {
  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-col items-center justify-center text-center",
        className,
      )}
    >
      <div className={cn("w-full max-w-[1400px] space-y-5", contentClassName)}>
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
    </div>
  );
}
