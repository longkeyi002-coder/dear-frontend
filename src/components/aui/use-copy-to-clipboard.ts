"use client";
import { copyTextToClipboard } from "@/lib/clipboard";

import { useState } from "react";

export type UseCopyToClipboardOptions = {
  copiedDuration?: number;
};

export const useCopyToClipboard = ({
  copiedDuration = 3000,
}: UseCopyToClipboardOptions = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) {
      return;
    }

    copyTextToClipboard(value).then(
      (ok) => {
        if (ok) {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), copiedDuration);
        }
      },
      () => {},
    );
  };

  return { isCopied, copyToClipboard };
};
