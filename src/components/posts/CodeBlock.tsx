"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = {
  code: string;
  className?: string;
  children: React.ReactNode;
};

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function CodeBlock({ code, className, children }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await copyToClipboard(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-border bg-muted">
      <div className="absolute top-3 right-3 z-10">
        <button
          type="button"
          onClick={handleCopy}
          className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-accent"
          aria-label="코드 복사"
          title={copied ? "복사됨" : "코드 복사"}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 pr-14">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
