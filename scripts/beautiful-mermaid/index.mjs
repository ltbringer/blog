import { run } from "@mermaid-js/mermaid-cli";
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function renderMermaidSVG(source) {
  const dir = mkdtempSync(join(tmpdir(), "mermaid-"));
  const input = join(dir, "input.mmd");
  const output = join(dir, "output.svg");

  try {
    writeFileSync(input, source);
    await run(input, output, {
      quiet: true,
      puppeteerConfig: { args: ["--no-sandbox"] },
    });
    return readFileSync(output, "utf-8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
