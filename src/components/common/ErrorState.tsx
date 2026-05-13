import Image from "next/image";
import type { ReactNode } from "react";
import GoBackButton from "@/components/common/GoBackButton";
import RetryButton from "@/components/common/RetryButton";
import { cn } from "@/lib/utils";

type Props = {
  code: number;
  message: string;
  action?: ReactNode;
  retryAction?: ReactNode;
  retryClassName?: string;
  className?: string;
  contentClassName?: string;
  codeClassName?: string;
  hideDefaultAction?: boolean;
};

export default function ErrorState({
  code,
  message,
  action,
  retryAction,
  retryClassName,
  className,
  contentClassName,
  codeClassName,
  hideDefaultAction = false,
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
          <p
            className={cn(
              "text-center text-5xl font-extrabold tracking-tight text-primary sm:text-6xl",
              codeClassName,
            )}
          >
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

        {!hideDefaultAction || action || retryAction ? (
          <div className="flex items-center justify-center gap-3">
            {!hideDefaultAction
              ? (retryAction ?? <RetryButton className={retryClassName} />)
              : null}
            {action}
            {!hideDefaultAction ? <GoBackButton /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
