/** Shows a description, turning lines that start with "-" into bullet points. */
export function Description({ text }: { text: string }) {
  const blocks: ({ type: "p"; text: string } | { type: "ul"; items: string[] })[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-•]\s?(.*)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else if (line.trim()) {
      blocks.push({ type: "p", text: line });
    }
  }

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-slate-600">
      {blocks.map((block, i) =>
        block.type === "p" ? (
          <p key={i} className="whitespace-pre-wrap break-words">
            {block.text}
          </p>
        ) : (
          <ul key={i} className="list-disc space-y-0.5 pl-5 marker:text-primary">
            {block.items.map((item, j) => (
              <li key={j} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
