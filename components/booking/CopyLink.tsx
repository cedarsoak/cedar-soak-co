"use client";

import { useRef, useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select();
    }
  }
  return (
    <div className="bk-copy">
      <input ref={inputRef} readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Your share link" />
      <button type="button" className="bk-apply" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
