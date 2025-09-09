export class ClipboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClipboardError";
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (!successful) {
      throw new ClipboardError("Failed to copy text using fallback method");
    }
  } catch (error) {
    if (error instanceof ClipboardError) {
      throw error;
    }

    throw new ClipboardError(
      error instanceof Error ? error.message : "Failed to copy to clipboard"
    );
  }
}

export async function readFromClipboard(): Promise<string> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText();
    }

    throw new ClipboardError(
      "Clipboard read not supported in this environment"
    );
  } catch (error) {
    throw new ClipboardError(
      error instanceof Error ? error.message : "Failed to read from clipboard"
    );
  }
}
