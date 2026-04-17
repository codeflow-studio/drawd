import http from 'node:http';

const DEFAULT_PORT = 3337;

/**
 * Creates a small HTTP listener that receives selection snapshots from the
 * running Drawd browser app and stores the latest one in memory so the
 * get_current_selection MCP tool can read it.
 *
 * Endpoints:
 *   POST /selection — body: { items, filePath?, at? } → stored as lastSelection
 *   GET  /selection — returns the current lastSelection (debug)
 *
 * The bridge binds to localhost only and never persists data. If the port is
 * already in use we log a warning and return a stub; the MCP stdio server
 * continues to run so offline tooling still works.
 *
 * @param {{ port?: number }} [options]
 * @returns {{ get: () => (null | { payload: any, receivedAt: number }), close: () => void }}
 */
export function createSelectionBridge({ port } = {}) {
  const listenPort = port ?? (Number(process.env.DRAWD_SELECTION_PORT) || DEFAULT_PORT);
  let lastSelection = null;

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${listenPort}`);

    try {
      if (req.method === 'POST' && url.pathname === '/selection') {
        const body = await readBody(req);
        lastSelection = { payload: body, receivedAt: Date.now() };
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'GET' && url.pathname === '/selection') {
        return sendJson(res, 200, lastSelection || { payload: null, receivedAt: null });
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write(
        `Selection bridge: port ${listenPort} in use — tool will report no selection. ` +
        `Set DRAWD_SELECTION_PORT to pick a free port.\n`,
      );
    } else {
      process.stderr.write(`Selection bridge error: ${err.message}\n`);
    }
  });

  server.listen(listenPort, '127.0.0.1', () => {
    process.stderr.write(`Selection bridge listening on http://localhost:${listenPort}\n`);
  });

  return {
    get: () => lastSelection,
    close: () => {
      try { server.close(); } catch { /* ignore */ }
    },
  };
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}
