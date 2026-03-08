import { generateInstructionFiles } from "./generateInstructionFiles.js";

/**
 * Legacy single-string instruction generator.
 * Delegates to generateInstructionFiles and concatenates all markdown files.
 */
export function generateInstructions(screens, connections, documents = []) {
  const { files } = generateInstructionFiles(screens, connections, { documents });
  return files.map(f => f.content).join("\n\n---\n\n");
}
