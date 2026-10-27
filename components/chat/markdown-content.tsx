"use client";

import React, { useMemo } from "react";
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockContent,
} from "@/components/ui/code-block";

interface MarkdownContentProps {
  content: string;
}

interface BlockChunk {
  type: "code" | "text";
  language?: string;
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Parse code blocks and normal text blocks
  const blocks = useMemo(() => {
    const result: BlockChunk[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)(?:```|$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }
      result.push({
        type: "code",
        language: match[1]?.trim() || "text",
        content: match[2] || "",
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      result.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return result;
  }, [content]);

  return (
    <div className="space-y-3 leading-relaxed text-sm">
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <CodeBlock key={index} className="my-2.5 overflow-hidden shadow-xs border-border/80">
              <CodeBlockHeader className="bg-muted/40 border-b border-border/50 py-1.5 px-3">
                <CodeBlockTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-semibold">
                  {block.language}
                </CodeBlockTitle>
                <CodeBlockActions>
                  <CodeBlockCopyButton value={block.content.trimEnd()} />
                </CodeBlockActions>
              </CodeBlockHeader>
              <CodeBlockContent wrap className="p-3 text-xs leading-5 font-mono">
                {block.content.trimEnd()}
              </CodeBlockContent>
            </CodeBlock>
          );
        }

        return <TextBlock key={index} text={block.content} />;
      })}
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  // Split into paragraphs / lines
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-2">
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={pIdx} className="font-semibold text-base tracking-tight text-foreground mt-2">
              <InlineText text={trimmed.slice(4)} />
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={pIdx} className="font-semibold text-lg tracking-tight text-foreground mt-3">
              <InlineText text={trimmed.slice(3)} />
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={pIdx} className="font-bold text-xl tracking-tight text-foreground mt-4">
              <InlineText text={trimmed.slice(2)} />
            </h2>
          );
        }

        // List items
        const lines = trimmed.split("\n");
        const isList = lines.every((line) => /^\s*([*-]|\d+\.)\s/.test(line));

        if (isList) {
          const isOrdered = /^\s*\d+\./.test(lines[0]);
          const ListTag = isOrdered ? "ol" : "ul";
          return (
            <ListTag
              key={pIdx}
              className={`my-1.5 space-y-1 ps-5 ${isOrdered ? "list-decimal" : "list-disc"} text-foreground/90`}
            >
              {lines.map((line, lIdx) => {
                const itemContent = line.replace(/^\s*([*-]|\d+\.)\s+/, "");
                return (
                  <li key={lIdx} className="text-sm">
                    <InlineText text={itemContent} />
                  </li>
                );
              })}
            </ListTag>
          );
        }

        // Regular paragraph with single newline support
        return (
          <p key={pIdx} className="text-foreground/90">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                <InlineText text={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function InlineText({ text }: { text: string }) {
  // Simple regex parser for inline code `code`, bold **bold**, and italic *italic*
  const tokens = useMemo(() => {
    const parts: React.ReactNode[] = [];
    // Match inline code `...`, bold **...**, italic *...*
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) {
        parts.push(text.slice(last, m.index));
      }
      const matchText = m[0];
      if (matchText.startsWith("`") && matchText.endsWith("`")) {
        parts.push(
          <code
            key={m.index}
            className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[13px] text-primary font-medium border border-border/40"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push(
          <strong key={m.index} className="font-semibold text-foreground">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        parts.push(
          <em key={m.index} className="italic text-foreground">
            {matchText.slice(1, -1)}
          </em>
        );
      }
      last = m.index + matchText.length;
    }

    if (last < text.length) {
      parts.push(text.slice(last));
    }

    return parts;
  }, [text]);

  return <>{tokens}</>;
}
