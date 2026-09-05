export async function copyTextToClipboard(text: string): Promise<boolean> {
  const clipboard =
    typeof navigator === "undefined" ? undefined : navigator.clipboard;
  const secureContext =
    typeof window === "undefined" ? true : window.isSecureContext;
  if (secureContext && clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based copy path below.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const ranges: Range[] = [];
  if (selection) {
    for (let i = 0; i < selection.rangeCount; i += 1) {
      ranges.push(selection.getRangeAt(i));
    }
  }

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied: boolean;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
    if (selection) {
      selection.removeAllRanges();
      for (const range of ranges) {
        selection.addRange(range);
      }
    }
  }

  return copied;
}


/**
 * Copy an image (data URI or remote URL) to the clipboard as an image blob.
 * The async Clipboard API has no legacy fallback for images, so callers must
 * feature-detect and surface a soft error, mirroring copyTextToClipboard.
 */
export async function copyImageToClipboard(image: string): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    throw new Error("Clipboard API is not available in this environment.");
  }
  const dataUriToBlob = (uri: string): Blob => {
    const [meta, base64] = uri.split(",");
    const mime = meta.match(/^data:([^;,]+)/i)?.[1] ?? "image/png";
    const bin = atob(base64 ?? "");
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };
  const blob = /^data:/i.test(image)
    ? dataUriToBlob(image)
    : await fetch(image).then((r) => r.blob());
  const mime = blob.type || image.match(/^data:([^;,]+)/i)?.[1] || "image/png";
  await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
}