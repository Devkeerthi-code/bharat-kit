function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Index where a line's // comment starts, ignoring // inside quotes (e.g. URLs). */
function commentStart(line: string): number {
  let quote = "";
  for (let i = 0; i < line.length; i++) {
    const c = line.charAt(i);
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") {
      quote = c;
    } else if (c === "/" && line.charAt(i + 1) === "/") {
      return i;
    }
  }
  return -1;
}

function highlightLine(line: string): string {
  const at = commentStart(line);
  const code = at === -1 ? line : line.slice(0, at);
  const comment = at === -1 ? "" : line.slice(at);
  const strings = escape(code).replace(/("|'|`)(?:(?!\1).)*\1/g, (m) => `<span class="tok-s">${m}</span>`);
  return comment ? `${strings}<span class="tok-c">${escape(comment)}</span>` : strings;
}

/** The smallest highlighter that suits a monochrome page: strings and comments only. */
export function highlight(code: string): string {
  return code.split("\n").map(highlightLine).join("\n");
}
