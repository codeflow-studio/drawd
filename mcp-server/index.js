import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FlowState } from "./src/state.js";
import { SatoriRenderer } from "./src/renderer/satori-renderer.js";
import { createServer } from "./src/server.js";
import { createSelectionBridge } from "./src/selection-bridge.js";

async function main() {
  const state = new FlowState();
  const renderer = new SatoriRenderer();

  // Auto-open a file if --file argument is provided
  const fileArgIdx = process.argv.indexOf("--file");
  if (fileArgIdx !== -1 && process.argv[fileArgIdx + 1]) {
    const filePath = process.argv[fileArgIdx + 1];
    try {
      state.load(filePath);
      process.stderr.write(`Loaded flow: ${filePath} (${state.screens.length} screens)\n`);
    } catch (err) {
      process.stderr.write(`Warning: Could not load ${filePath}: ${err.message}\n`);
    }
  }

  // Initialize Satori renderer
  try {
    await renderer.init();
    process.stderr.write("Satori renderer ready\n");
  } catch (err) {
    process.stderr.write(`Warning: Satori renderer unavailable: ${err.message}\n`);
    process.stderr.write("Screen creation from HTML will not work.\n");
  }

  const bridge = createSelectionBridge();

  const server = createServer(state, renderer, bridge);
  const transport = new StdioServerTransport();

  // Graceful shutdown
  process.on("SIGINT", async () => {
    bridge.close();
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    bridge.close();
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  process.stderr.write("Drawd MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
